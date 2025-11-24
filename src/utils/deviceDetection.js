const BROWSER_NAMES = [
  { test: /chrome|crios|crmo/i, name: 'Chrome / Chromium' },
  { test: /edg/i, name: 'Microsoft Edge' },
  { test: /safari/i, name: 'Safari' },
  { test: /firefox|fxios/i, name: 'Firefox' },
]

export const getSpeechRecognitionClass = () => {
  if (typeof window === 'undefined') return null
  return window.SpeechRecognition || window.webkitSpeechRecognition || null
}

export const isSpeechRecognitionSupported = () => Boolean(getSpeechRecognitionClass())

export const getBrowserName = () => {
  if (typeof navigator === 'undefined' || !navigator.userAgent) return 'Unknown'
  const ua = navigator.userAgent
  const match = BROWSER_NAMES.find((item) => item.test.test(ua))
  return match ? match.name : 'Unknown'
}

export const isSecureContextRequired = () => typeof window !== 'undefined' && !window.isSecureContext

export const getSupportMessage = () => {
  if (!isSpeechRecognitionSupported()) {
    return 'Speech recognition is not supported in this browser. Try Chrome, Edge, or Safari.'
  }

  if (isSecureContextRequired()) {
    return 'Speech recognition requires HTTPS in most browsers. Use a secure connection.'
  }

  return ''
}
