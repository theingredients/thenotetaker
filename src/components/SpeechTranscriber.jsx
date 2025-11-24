import { useEffect, useMemo, useRef, useState } from 'react'
import Button from './Button'
import DataUsageTracker from './DataUsageTracker'
import { DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES } from '../utils/languageOptions'
import {
  getSpeechRecognitionClass,
  getSupportMessage,
  isSpeechRecognitionSupported,
} from '../utils/deviceDetection'
import {
  DEFAULT_TRANSLATION_TARGET,
  SUPPORTED_TRANSLATION_LANGUAGES,
  TRANSLATION_NOTICE,
  translateText,
} from '../utils/translation'
import '../styles/components/SpeechTranscriber.css'

const SpeechTranscriber = ({ isRecording, isPaused, onTranscriptUpdate }) => {
  const [language, setLanguage] = useState(DEFAULT_LANGUAGE)
  const [finalTranscript, setFinalTranscript] = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')
  const [statusMessage, setStatusMessage] = useState('Idle')
  const [error, setError] = useState(getSupportMessage())
  const [isCopying, setIsCopying] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [isTranslating, setIsTranslating] = useState(false)
  const [targetLanguage, setTargetLanguage] = useState(DEFAULT_TRANSLATION_TARGET)
  const [translatedText, setTranslatedText] = useState('')

  const recognitionRef = useRef(null)
  const isRecordingRef = useRef(isRecording)
  const isPausedRef = useRef(isPaused)

  useEffect(() => {
    isRecordingRef.current = isRecording
  }, [isRecording])

  useEffect(() => {
    isPausedRef.current = isPaused
  }, [isPaused])

  useEffect(() => {
    if (!isSpeechRecognitionSupported()) {
      setError(getSupportMessage())
      return undefined
    }

    const SpeechRecognition = getSpeechRecognitionClass()
    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = DEFAULT_LANGUAGE

    recognition.onresult = (event) => {
      let interim = ''
      let finalChunk = ''

      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const transcriptPiece = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          finalChunk += `${transcriptPiece.trim()} `
        } else {
          interim += transcriptPiece
        }
      }

      if (finalChunk) {
        setFinalTranscript((prev) => `${prev}${finalChunk}`.trimStart())
        setInterimTranscript('')
      } else {
        setInterimTranscript(interim)
      }
    }

    recognition.onerror = (event) => {
      if (event.error === 'no-speech') return

      setError(
        event.error === 'not-allowed'
          ? 'Microphone permissions are required to transcribe audio.'
          : `Recognition error: ${event.error}`,
      )
    }

    recognition.onend = () => {
      if (isRecordingRef.current && !isPausedRef.current) {
        try {
          recognition.start()
        } catch (err) {
          console.error(err)
          setError('Auto-restart failed. Please stop and start again.')
        }
      }
    }

    recognitionRef.current = recognition

    return () => {
      recognition.onresult = null
      recognition.onerror = null
      recognition.onend = null
      recognition.stop()
      recognitionRef.current = null
    }
  }, [])

  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = language
    }
  }, [language])

  useEffect(() => {
    const recognition = recognitionRef.current
    if (!recognition) return

    if (!isRecording) {
      recognition.stop()
      setStatusMessage('Idle')
      return
    }

    if (isPaused) {
      recognition.stop()
      setStatusMessage('Paused')
      return
    }

    try {
      recognition.start()
      setStatusMessage('Listening...')
      setError('')
    } catch (err) {
      if (!err.message?.includes('start')) {
        setError('Unable to start recognition. Is another tab using the mic?')
      }
    }
  }, [isRecording, isPaused])

  useEffect(() => {
    const combinedTranscript = `${finalTranscript} ${interimTranscript}`.trim()
    if (combinedTranscript && typeof onTranscriptUpdate === 'function') {
      onTranscriptUpdate(combinedTranscript)
    }
    if (!combinedTranscript) {
      onTranscriptUpdate?.('')
    }
  }, [finalTranscript, interimTranscript, onTranscriptUpdate])

  const handleCopy = async () => {
    const transcript = `${finalTranscript} ${interimTranscript}`.trim()
    if (!transcript) return

    try {
      setIsCopying(true)
      await navigator.clipboard.writeText(transcript)
      setStatusMessage('Transcript copied to clipboard.')
    } catch (copyError) {
      setError(`Copy failed: ${copyError.message}`)
    } finally {
      setIsCopying(false)
    }
  }

  const handleDownload = () => {
    const transcript = `${finalTranscript} ${interimTranscript}`.trim()
    if (!transcript) return

    try {
      setIsDownloading(true)
      const blob = new Blob([transcript], { type: 'text/plain;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `transcript-${new Date().toISOString()}.txt`
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
      setStatusMessage('Transcript downloaded.')
    } finally {
      setIsDownloading(false)
    }
  }

  const handleClear = () => {
    setFinalTranscript('')
    setInterimTranscript('')
    setTranslatedText('')
    setStatusMessage('Transcript cleared.')
  }

  const handleTranslate = async () => {
    const transcript = `${finalTranscript}`.trim()
    if (!transcript) return
    try {
      setIsTranslating(true)
      const translated = await translateText(transcript, targetLanguage)
      setTranslatedText(translated)
    } catch (translateError) {
      setError(`Translation failed: ${translateError.message}`)
    } finally {
      setIsTranslating(false)
    }
  }

  const transcriptLength = useMemo(
    () => `${finalTranscript} ${interimTranscript}`.trim().length,
    [finalTranscript, interimTranscript],
  )

  return (
    <section className="speech-transcriber">
      <header className="speech-transcriber__header">
        <div>
          <p className="speech-transcriber__label">Recognition language</p>
          <select
            value={language}
            onChange={(event) => setLanguage(event.target.value)}
            className="speech-transcriber__select"
            disabled={isRecording}
          >
            {SUPPORTED_LANGUAGES.map((lang) => (
              <option key={lang.value} value={lang.value}>
                {lang.label}
              </option>
            ))}
          </select>
        </div>
        <div className="speech-transcriber__status">
          <span className={`badge badge--${isRecording ? 'active' : 'idle'}`}>
            {isRecording ? 'Recording' : 'Stopped'}
          </span>
          {isRecording && (
            <span className={`badge badge--${isPaused ? 'warning' : 'success'}`}>
              {isPaused ? 'Paused' : 'Listening'}
            </span>
          )}
        </div>
      </header>

      {isRecording ? (
        <DataUsageTracker key="recording" isActive isPaused={isPaused} />
      ) : (
        <DataUsageTracker key="idle" isActive={false} isPaused={false} />
      )}

      <div className="speech-transcriber__transcript">
        <div className="speech-transcriber__counts">
          <span>{transcriptLength} chars</span>
          {statusMessage ? <span>{statusMessage}</span> : null}
        </div>
        <p className="speech-transcriber__final">{finalTranscript || 'Waiting for speech...'}</p>
        {interimTranscript ? (
          <p className="speech-transcriber__interim">{interimTranscript}</p>
        ) : null}
      </div>

      <div className="speech-transcriber__actions">
        <Button variant="secondary" onClick={handleCopy} disabled={!transcriptLength || isCopying}>
          {isCopying ? 'Copying...' : 'Copy'}
        </Button>
        <Button
          variant="secondary"
          onClick={handleDownload}
          disabled={!transcriptLength || isDownloading}
        >
          {isDownloading ? 'Downloading...' : 'Download'}
        </Button>
        <Button variant="ghost" onClick={handleClear} disabled={!transcriptLength}>
          Clear
        </Button>
      </div>

      <div className="speech-transcriber__translation">
        <div className="speech-transcriber__translation-controls">
          <label htmlFor="translationLanguage">Translate to</label>
          <select
            id="translationLanguage"
            value={targetLanguage}
            onChange={(event) => setTargetLanguage(event.target.value)}
            className="speech-transcriber__select"
          >
            {SUPPORTED_TRANSLATION_LANGUAGES.map((lang) => (
              <option key={lang.value} value={lang.value}>
                {lang.label}
              </option>
            ))}
          </select>
          <Button
            variant="primary"
            onClick={handleTranslate}
            disabled={!finalTranscript || isTranslating}
          >
            {isTranslating ? 'Translating...' : 'Translate'}
          </Button>
        </div>
        {translatedText ? (
          <div className="speech-transcriber__translated">
            <p className="speech-transcriber__label">Translated transcript</p>
            <p>{translatedText}</p>
            <p className="speech-transcriber__notice">{TRANSLATION_NOTICE}</p>
          </div>
        ) : (
          <p className="speech-transcriber__notice">{TRANSLATION_NOTICE}</p>
        )}
      </div>

      {error ? <p className="speech-transcriber__error">{error}</p> : null}
    </section>
  )
}

export default SpeechTranscriber
