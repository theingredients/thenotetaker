export const SUPPORTED_TRANSLATION_LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'pt', label: 'Portuguese' },
  { value: 'ja', label: 'Japanese' },
  { value: 'ko', label: 'Korean' },
  { value: 'zh', label: 'Chinese' },
]

export const DEFAULT_TRANSLATION_TARGET = 'es'

export const TRANSLATION_NOTICE =
  'Translation is a placeholder. Wire up a translation API for production-grade accuracy.'

export const translateText = async (text, targetLanguage) => {
  if (!text?.trim()) return ''

  // Placeholder implementation: mimic async request so UI can show spinners.
  await new Promise((resolve) => setTimeout(resolve, 400))

  return `[${targetLanguage}] ${text}`
}
