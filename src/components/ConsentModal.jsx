import { useState, useEffect } from 'react'
import Button from './Button'
import '../styles/components/ConsentModal.css'

const ConsentModal = ({ onAccept }) => {
  const [privacyAccepted, setPrivacyAccepted] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [micPermission, setMicPermission] = useState(null) // null = checking, true = granted, false = denied
  const [audioPermission, setAudioPermission] = useState(null)
  const [isCheckingPermissions, setIsCheckingPermissions] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    checkPermissions()
  }, [])

  const checkPermissions = async () => {
    setIsCheckingPermissions(true)
    setError('')

    // Check microphone permission
    try {
      if (navigator.permissions && navigator.permissions.query) {
        const micStatus = await navigator.permissions.query({ name: 'microphone' })
        setMicPermission(micStatus.state === 'granted')
        
        // Listen for permission changes
        micStatus.onchange = () => {
          setMicPermission(micStatus.state === 'granted')
        }
      } else {
        // Fallback: try to request permission directly
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
          setMicPermission(true)
          stream.getTracks().forEach(track => track.stop()) // Stop the stream immediately
        } catch (err) {
          setMicPermission(false)
        }
      }
    } catch (err) {
      setMicPermission(false)
    }

    // Check audio playback capability (usually always available, but we'll test it)
    try {
      const audio = new Audio()
      audio.volume = 0 // Silent test
      const playPromise = audio.play()
      if (playPromise !== undefined) {
        await playPromise
        audio.pause()
        setAudioPermission(true)
      } else {
        setAudioPermission(true)
      }
    } catch (err) {
      // Audio playback might be blocked, but it's usually available
      setAudioPermission(true) // Assume available unless proven otherwise
    }

    setIsCheckingPermissions(false)
  }

  const requestMicrophonePermission = async () => {
    try {
      setError('')
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      setMicPermission(true)
      stream.getTracks().forEach(track => track.stop()) // Stop the stream immediately
    } catch (err) {
      setMicPermission(false)
      if (err.name === 'NotAllowedError') {
        setError('Microphone permission was denied. Please enable microphone access in your browser settings to use this application.')
      } else if (err.name === 'NotFoundError') {
        setError('No microphone found. Please connect a microphone and try again.')
      } else {
        setError(`Unable to access microphone: ${err.message}`)
      }
    }
  }

  const handleAccept = () => {
    if (!privacyAccepted || !termsAccepted) {
      setError('Please accept both the Privacy Policy and Terms of Service to continue.')
      return
    }

    if (micPermission === false) {
      setError('Microphone access is required to use this application. Please grant microphone permission.')
      return
    }

    // Store consent in sessionStorage (session-only, not persistent)
    sessionStorage.setItem('consent_accepted', 'true')
    sessionStorage.setItem('consent_timestamp', new Date().toISOString())
    sessionStorage.setItem('privacy_accepted', 'true')
    sessionStorage.setItem('terms_accepted', 'true')

    onAccept()
  }

  const canProceed = privacyAccepted && termsAccepted && micPermission === true && !isCheckingPermissions

  return (
    <div className="consent-modal-overlay">
      <div className="consent-modal">
        <div className="consent-modal__header">
          <h2>Welcome to The Note Taker</h2>
          <p>Before you begin, please review and accept our policies and grant necessary permissions.</p>
        </div>

        <div className="consent-modal__content">
          <div className="consent-modal__section">
            <h3>Legal Agreements</h3>
            <div className="consent-modal__checkbox-group">
              <label className="consent-modal__checkbox">
                <input
                  type="checkbox"
                  checked={privacyAccepted}
                  onChange={(e) => setPrivacyAccepted(e.target.checked)}
                />
                <span>
                  I have read and agree to the{' '}
                  <a href="/privacy-policy.html" target="_blank" rel="noopener noreferrer">
                    Privacy Policy
                  </a>
                </span>
              </label>
              <label className="consent-modal__checkbox">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                />
                <span>
                  I have read and agree to the{' '}
                  <a href="/terms-of-service.html" target="_blank" rel="noopener noreferrer">
                    Terms of Service
                  </a>
                </span>
              </label>
            </div>
          </div>

          <div className="consent-modal__section">
            <h3>Browser Permissions</h3>
            <div className="consent-modal__permission">
              <div className="consent-modal__permission-status">
                <span className="consent-modal__permission-label">Microphone Access:</span>
                {isCheckingPermissions ? (
                  <span className="consent-modal__status checking">Checking...</span>
                ) : micPermission === true ? (
                  <span className="consent-modal__status granted">✓ Granted</span>
                ) : (
                  <span className="consent-modal__status denied">✗ Not Granted</span>
                )}
              </div>
              {micPermission === false && (
                <Button variant="secondary" onClick={requestMicrophonePermission} style={{ marginTop: '8px' }}>
                  Grant Microphone Permission
                </Button>
              )}
              <p className="consent-modal__permission-hint">
                Microphone access is required for real-time transcription. Your audio is processed locally in your browser.
              </p>
            </div>

            <div className="consent-modal__permission">
              <div className="consent-modal__permission-status">
                <span className="consent-modal__permission-label">Audio Playback:</span>
                {isCheckingPermissions ? (
                  <span className="consent-modal__status checking">Checking...</span>
                ) : audioPermission === true ? (
                  <span className="consent-modal__status granted">✓ Available</span>
                ) : (
                  <span className="consent-modal__status denied">✗ Unavailable</span>
                )}
              </div>
              <p className="consent-modal__permission-hint">
                Audio playback is required for transcribing uploaded audio files. This is usually automatically available.
              </p>
            </div>
          </div>

          {error && (
            <div className="consent-modal__error">
              {error}
            </div>
          )}

          <div className="consent-modal__important">
            <strong>Important:</strong> By using this application, you acknowledge that:
            <ul>
              <li>Your audio may be processed by your browser vendor's speech recognition services</li>
              <li>You have the legal right to record any audio you transcribe</li>
              <li>Transcripts may contain sensitive information—review before downloading</li>
              <li>All processing occurs locally in your browser—we do not store your data</li>
            </ul>
          </div>
        </div>

        <div className="consent-modal__footer">
          <Button
            variant="primary"
            onClick={handleAccept}
            disabled={!canProceed}
          >
            Accept and Continue
          </Button>
          <p className="consent-modal__footer-note">
            You can revoke permissions or withdraw consent at any time through your browser settings.
          </p>
        </div>
      </div>
    </div>
  )
}

export default ConsentModal

