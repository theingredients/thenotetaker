# Standalone Transcription App

This project extracts the real-time and post-recording transcription experience from **On Repeat** into a lightweight Vite + React application. It uses the browser-native **Web Speech API** for recognition, the **Web Audio API** for file playback, and ships with the UI + utilities described in the extraction guide.

## Features

- 🔴 Real-time transcription with pause/resume, auto-restart, interim results, and data-usage estimation  
- 📁 “Transcribe later” flow that accepts audio files/Blob/ArrayBuffer/AudioBuffer inputs and plays them back while capturing the output  
- 🌐 13+ language presets with quick switching, clipboard copy, and transcript download helpers  
- 🌍 Optional (placeholder) translation workflow to wire up a provider later  
- 📊 Data usage tracker with warning states and UX that mirrors the original On Repeat component library

## Getting Started

```bash
npm install
npm run dev
```

The dev server runs on http://localhost:5173/ and automatically enables hot module reloading. Because the Web Speech API requires a secure context in most browsers, you may need to run Chrome/Edge with the `--unsafely-treat-insecure-origin-as-secure=http://localhost:5173` flag or configure Vite for HTTPS when testing microphone access.

## Project Structure

```
src/
├── App.jsx                     # Mode switching + shared layout
├── components/
│   ├── Button.jsx
│   ├── DataUsageTracker.jsx
│   ├── SpeechTranscriber.jsx
│   └── TranscribeLater.jsx
├── styles/
│   ├── global.css
│   └── components/
│       ├── DataUsageTracker.css
│       ├── SpeechTranscriber.css
│       └── TranscribeLater.css
└── utils/
    ├── deviceDetection.js
    ├── languageOptions.js
    └── translation.js
```

## Scripts

| Command        | Description                              |
| -------------- | ---------------------------------------- |
| `npm run dev`  | Start the Vite dev server with HMR       |
| `npm run build`| Production build to `dist/`              |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint against the source files      |

## Browser Compatibility

- ✅ Chrome / Chromium (desktop + Android)
- ✅ Edge (desktop + Android)
- ✅ Safari (desktop + iOS) – requires HTTPS
- ⚠️ Firefox – Web Speech API is not available yet

For HTTPS/local testing, use `npm run dev -- --host` plus a trusted SSL certificate or tunnel (e.g., `npm run dev -- --https` after adding certs).

## Testing Checklist

- Real-time: start/stop, pause/resume, language switching, copy/download buttons, data-usage alerts  
- Transcribe later: upload audio (WAV/MP3/M4A), preview playback, run transcription, cancel mid-run, verify transcript callback  
- Error cases: mic permission denied, unsupported browser, insecure context, invalid file type  
- Translation: confirm placeholder text appears and integrates once a provider is added

## Deployment

```bash
npm run build
```

Deploy the `dist/` folder to any static host that supports HTTPS (Vercel, Netlify, GitHub Pages, Cloudflare Pages, etc.). No environment variables are required.

## Notes & Next Steps

- The translation helper is intentionally a stub (`src/utils/translation.js`). Replace it with a provider such as Google Cloud Translate or DeepL when you are ready.
- The Web Speech API only listens to the active microphone. For offline files, the UI guides you to play audio near the mic; replace `TranscribeLater` with a server-side recognizer if you need deterministic results.
- Consider persisting transcripts or exporting to VTT/SRT for additional workflows.
