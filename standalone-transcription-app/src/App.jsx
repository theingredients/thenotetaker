import { useMemo, useState } from 'react'
import Button from './components/Button'
import SpeechTranscriber from './components/SpeechTranscriber'
import TranscribeLater from './components/TranscribeLater'
import { getBrowserName, getSupportMessage, isSpeechRecognitionSupported } from './utils/deviceDetection'

const App = () => {
  const [mode, setMode] = useState('realtime')
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [audioFile, setAudioFile] = useState(null)
  const [audioSession, setAudioSession] = useState(0)

  const supportMessage = useMemo(() => getSupportMessage(), [])
  const browserName = useMemo(() => getBrowserName(), [])

  const toggleRecording = () => {
    if (!isSpeechRecognitionSupported()) return
    if (isRecording) {
      setIsRecording(false)
      setIsPaused(false)
    } else {
      setTranscript('')
      setIsRecording(true)
      setIsPaused(false)
    }
  }

  const togglePause = () => {
    if (!isRecording) return
    setIsPaused((prev) => !prev)
  }

  const handleModeChange = (nextMode) => {
    setMode(nextMode)
    setIsRecording(false)
    setIsPaused(false)
  }

  const handleFileChange = (event) => {
    const file = event.target.files?.[0]
    if (file) {
      setAudioFile(file)
      setAudioSession((prev) => prev + 1)
      setTranscript('')
    }
  }

  return (
    <main className="app">
      <header className="app__header">
        <div>
          <p className="app__eyebrow">Standalone transcription</p>
          <h1>Live & on-demand transcription</h1>
          <p>Browser-native speech recognition powered by the Web Speech API.</p>
        </div>
        <div className="app__support">
          <p>Detected browser: {browserName}</p>
          {supportMessage ? <p className="app__support-warning">{supportMessage}</p> : null}
        </div>
      </header>

      <div className="app__mode-selector">
        <Button variant={mode === 'realtime' ? 'primary' : 'secondary'} onClick={() => handleModeChange('realtime')}>
          Real-time transcription
        </Button>
        <Button variant={mode === 'later' ? 'primary' : 'secondary'} onClick={() => handleModeChange('later')}>
          Transcribe audio file
        </Button>
      </div>

      {mode === 'realtime' ? (
        <section className="app__panel">
          <div className="app__controls">
            <Button variant="primary" onClick={toggleRecording}>
              {isRecording ? 'Stop recording' : 'Start recording'}
            </Button>
            <Button variant="secondary" onClick={togglePause} disabled={!isRecording}>
              {isPaused ? 'Resume' : 'Pause'}
            </Button>
          </div>

          <SpeechTranscriber
            isRecording={isRecording}
            isPaused={isPaused}
            onTranscriptUpdate={setTranscript}
          />
        </section>
      ) : (
        <section className="app__panel">
          <div className="app__controls app__controls--stacked">
            <label className="file-input">
              <span>Upload audio</span>
              <input type="file" accept="audio/*" onChange={handleFileChange} />
            </label>
            {audioFile ? <p className="file-input__hint">Selected: {audioFile.name}</p> : null}
          </div>

          <TranscribeLater key={audioSession} audioFile={audioFile} onComplete={setTranscript} />
        </section>
      )}

      {transcript ? (
        <section className="app__transcript">
          <header>
            <h2>Combined transcript</h2>
            <span>{transcript.length} chars</span>
          </header>
          <pre>{transcript}</pre>
        </section>
      ) : null}
    </main>
  )
}

export default App
