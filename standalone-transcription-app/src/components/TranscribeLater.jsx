import { useEffect, useRef, useState } from 'react'
import Button from './Button'
import { DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES } from '../utils/languageOptions'
import {
  getSpeechRecognitionClass,
  getSupportMessage,
  isSpeechRecognitionSupported,
} from '../utils/deviceDetection'
import '../styles/components/TranscribeLater.css'

const audioBufferToWav = (audioBuffer) => {
  const numOfChan = audioBuffer.numberOfChannels
  const { length, sampleRate } = audioBuffer
  const bytesPerSample = 2
  const blockAlign = numOfChan * bytesPerSample
  const buffer = new ArrayBuffer(44 + length * numOfChan * bytesPerSample)
  const view = new DataView(buffer)

  let offset = 0
  const writeString = (str) => {
    for (let i = 0; i < str.length; i += 1) {
      view.setUint8(offset + i, str.charCodeAt(i))
    }
    offset += str.length
  }

  const writeUint32 = (data) => {
    view.setUint32(offset, data, true)
    offset += 4
  }

  const writeUint16 = (data) => {
    view.setUint16(offset, data, true)
    offset += 2
  }

  writeString('RIFF')
  writeUint32(36 + length * numOfChan * bytesPerSample)
  writeString('WAVE')
  writeString('fmt ')
  writeUint32(16)
  writeUint16(1)
  writeUint16(numOfChan)
  writeUint32(sampleRate)
  writeUint32(sampleRate * blockAlign)
  writeUint16(blockAlign)
  writeUint16(16)
  writeString('data')
  writeUint32(length * numOfChan * bytesPerSample)

  const channelData = []
  for (let i = 0; i < numOfChan; i += 1) {
    channelData.push(audioBuffer.getChannelData(i))
  }

  let sampleOffset = offset
  for (let i = 0; i < length; i += 1) {
    for (let chan = 0; chan < numOfChan; chan += 1) {
      const sample = Math.max(-1, Math.min(1, channelData[chan][i]))
      view.setInt16(
        sampleOffset,
        sample < 0 ? sample * 0x8000 : sample * 0x7fff,
        true,
      )
      sampleOffset += bytesPerSample
    }
  }

  return buffer
}

const buildAudioSource = (audioFile) => {
  if (!audioFile) {
    return { url: '', cleanup: null, error: '' }
  }

  const revokeLater = (url) => () => URL.revokeObjectURL(url)

  if (typeof AudioBuffer !== 'undefined' && audioFile instanceof AudioBuffer) {
    const wavArrayBuffer = audioBufferToWav(audioFile)
    const blob = new Blob([wavArrayBuffer], { type: 'audio/wav' })
    const url = URL.createObjectURL(blob)
    return { url, cleanup: revokeLater(url), error: '' }
  }

  if (audioFile instanceof Blob) {
    const url = URL.createObjectURL(audioFile)
    return { url, cleanup: revokeLater(url), error: '' }
  }

  if (audioFile instanceof ArrayBuffer) {
    const blob = new Blob([audioFile], { type: 'audio/wav' })
    const url = URL.createObjectURL(blob)
    return { url, cleanup: revokeLater(url), error: '' }
  }

  if (typeof audioFile === 'string') {
    return { url: audioFile, cleanup: null, error: '' }
  }

  return {
    url: '',
    cleanup: null,
    error: 'Unsupported audio source. Provide a File, Blob, ArrayBuffer, or AudioBuffer.',
  }
}

const TranscribeLater = ({ audioFile, onComplete }) => {
  const [{ url: initialUrl, cleanup: cleanupFn, error: initialSourceError }] = useState(() =>
    buildAudioSource(audioFile),
  )
  const [audioUrl] = useState(initialUrl)
  const [language, setLanguage] = useState(DEFAULT_LANGUAGE)
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState(initialUrl ? 'Ready' : 'Idle')
  const [transcript, setTranscript] = useState('')
  const [error, setError] = useState(initialSourceError)
  const [isWorking, setIsWorking] = useState(false)

  const audioRef = useRef(null)
  const recognitionRef = useRef(null)
  const transcriptRef = useRef('')
  const sourceCleanupRef = useRef(cleanupFn)

  useEffect(() => {
    transcriptRef.current = transcript
  }, [transcript])

  useEffect(() => {
    sourceCleanupRef.current = cleanupFn
  }, [cleanupFn])

  useEffect(() => {
    if (!audioUrl) return undefined

    const audio = new Audio(audioUrl)
    audioRef.current = audio

    const handleTimeUpdate = () => {
      if (!audio.duration) return
      setProgress(Math.min(100, (audio.currentTime / audio.duration) * 100))
    }

    const handleEnded = () => {
      setProgress(100)
      setStatus('Playback finished')
    }

    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('ended', handleEnded)

    return () => {
      audio.pause()
      audio.currentTime = 0
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('ended', handleEnded)
      audioRef.current = null
    }
  }, [audioUrl])

  useEffect(
    () => () => {
      sourceCleanupRef.current?.()
      recognitionRef.current?.stop()
    },
    [],
  )

  const stopPlaybackAndRecognition = () => {
    audioRef.current?.pause()
    if (audioRef.current) {
      audioRef.current.currentTime = 0
    }
    recognitionRef.current?.stop()
    setIsWorking(false)
  }

  const handlePreview = () => {
    if (!audioRef.current) return
    stopPlaybackAndRecognition()
    audioRef.current.currentTime = 0
    audioRef.current.play().catch((previewError) => setError(`Playback failed: ${previewError.message}`))
    setStatus('Listening to audio')
  }

  const handleTranscribe = async () => {
    if (!audioRef.current || !audioFile) return

    if (!isSpeechRecognitionSupported()) {
      setError(getSupportMessage())
      return
    }

    stopPlaybackAndRecognition()
    transcriptRef.current = ''
    setStatus('Preparing transcription')
    setProgress(0)
    setTranscript('')
    setError('')

    const SpeechRecognition = getSpeechRecognitionClass()
    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = language

    recognition.onresult = (event) => {
      let chunk = ''
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        if (event.results[i].isFinal) {
          chunk += `${event.results[i][0].transcript.trim()} `
        }
      }

      if (chunk) {
        setTranscript((prev) => {
          const nextValue = `${prev}${chunk}`.trimStart()
          transcriptRef.current = nextValue
          return nextValue
        })
      }
    }

    recognition.onerror = (event) => {
      if (event.error === 'no-speech') return
      setError(`Transcription error: ${event.error}`)
    }

    recognition.onend = () => {
      setIsWorking(false)
      setStatus('Completed')
      onComplete?.(transcriptRef.current.trim())
    }

    recognitionRef.current = recognition

    try {
      recognition.start()
      await audioRef.current.play()
      setIsWorking(true)
      setStatus('Transcribing (play audio near mic)')
    } catch (startError) {
      setError(`Unable to start transcription: ${startError.message}`)
      recognition.stop()
    }
  }

  const handleStop = () => {
    stopPlaybackAndRecognition()
    setStatus('Stopped')
  }

  return (
    <section className="transcribe-later">
      <header className="transcribe-later__header">
        <div>
          <p className="transcribe-later__label">Language</p>
          <select
            value={language}
            onChange={(event) => setLanguage(event.target.value)}
            className="transcribe-later__select"
            disabled={isWorking}
          >
            {SUPPORTED_LANGUAGES.map((lang) => (
              <option key={lang.value} value={lang.value}>
                {lang.label}
              </option>
            ))}
          </select>
        </div>

        <div className="transcribe-later__status">
          <span className={`badge badge--${isWorking ? 'active' : 'idle'}`}>{status}</span>
          <p className="transcribe-later__hint">
            Browser speech recognition listens to the microphone. Play the audio on the same device at a
            comfortable volume.
          </p>
        </div>
      </header>

      <div className="transcribe-later__progress">
        <div className="transcribe-later__progress-bar" style={{ width: `${progress}%` }} />
      </div>

      <div className="transcribe-later__controls">
        <Button variant="secondary" onClick={handlePreview} disabled={!audioFile || isWorking}>
          Preview Audio
        </Button>
        <Button variant="primary" onClick={handleTranscribe} disabled={!audioFile || isWorking}>
          {isWorking ? 'Transcribing...' : 'Transcribe'}
        </Button>
        <Button variant="ghost" onClick={handleStop} disabled={!isWorking}>
          Stop
        </Button>
      </div>

      <div className="transcribe-later__transcript">
        <p className="transcribe-later__label">Transcript</p>
        <p className="transcribe-later__text">{transcript || 'Transcript will appear here.'}</p>
      </div>

      {error ? <p className="transcribe-later__error">{error}</p> : null}
    </section>
  )
}

export default TranscribeLater
