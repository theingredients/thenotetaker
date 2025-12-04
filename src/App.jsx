import { useMemo, useState, useEffect } from 'react'
import Button from './components/Button'
import SpeechTranscriber from './components/SpeechTranscriber'
import TranscribeLater from './components/TranscribeLater'
import ConsentModal from './components/ConsentModal'
import { getBrowserName, getSupportMessage, isSpeechRecognitionSupported } from './utils/deviceDetection'

const App = () => {
  const [consentAccepted, setConsentAccepted] = useState(false)
  const [mode, setMode] = useState('realtime')
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [audioFile, setAudioFile] = useState(null)
  const [audioSession, setAudioSession] = useState(0)

  const supportMessage = useMemo(() => getSupportMessage(), [])
  const browserName = useMemo(() => getBrowserName(), [])

  // Check if consent was already accepted in this session
  useEffect(() => {
    const consent = sessionStorage.getItem('consent_accepted')
    if (consent === 'true') {
      setConsentAccepted(true)
    }
  }, [])

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
      // File size limit: 100 MB
      const MAX_FILE_SIZE = 100 * 1024 * 1024 // 100 MB in bytes
      if (file.size > MAX_FILE_SIZE) {
        alert(`File size exceeds the 100 MB limit. Please select a smaller file.`)
        event.target.value = '' // Clear the input
        return
      }
      
      // Validate file type
      if (!file.type.startsWith('audio/')) {
        alert('Please select a valid audio file.')
        event.target.value = '' // Clear the input
        return
      }

      setAudioFile(file)
      setAudioSession((prev) => prev + 1)
      setTranscript('')
    }
  }

  const handleConsentAccept = () => {
    setConsentAccepted(true)
  }

  // Show consent modal if not accepted
  if (!consentAccepted) {
    return <ConsentModal onAccept={handleConsentAccept} />
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

      <footer className="app__footer">
        <nav className="app__footer-nav" aria-label="Legal">
          <a href="/privacy-policy.html" className="app__footer-link">
            Privacy Policy
          </a>
          <span className="app__footer-separator" aria-hidden="true">
            •
          </span>
          <a href="/terms-of-service.html" className="app__footer-link">
            Terms of Service
          </a>
          <span className="app__footer-separator" aria-hidden="true">
            •
          </span>
          <a href="https://theingredients.io" target="_blank" rel="noopener noreferrer" className="app__footer-link">
            The Ingredients
          </a>
        </nav>
      </footer>
    </main>
  )
}

export default App
