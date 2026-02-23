# SignBridge

Real-time sign language interpretation for live speech. You talk, it signs. No video files, no expensive APIs, no PhD required to set it up.

Built for people who believe accessibility shouldn't be an afterthought bolted on at the end of a project.

---

## What it does

Someone speaks into a microphone. Within a second, their words appear as captions on screen. A few seconds later, an animated hand works through the sign language equivalent of what was just said, one sign at a time, with fingerspelling for anything it doesn't recognize.

It works during presentations, meetings, lectures, or any situation where a deaf or hard-of-hearing person is expected to simply "keep up."

The stack is deliberately simple: a React frontend, a Node backend, two free API keys, and a browser. Nothing exotic.

---

## Tech stack

| Concern | Solution |
|---|---|
| Speech to text | Groq Whisper (whisper-large-v3-turbo) |
| Sign grammar | Groq LLM (llama-3.3-70b-versatile) |
| LLM fallback | OpenRouter (llama-3.1-8b, free tier) |
| Signs rendered as | SVG - procedurally drawn, no video files |
| Real-time comms | Socket.io |
| Frontend | React + Vite |
| Backend | Node.js + Express |

Every AI service used here has a free tier generous enough for demos, development, and reasonable production use.

## Model updates

The project originally experimented with Groq's Llama 3.3 70B for sign grammar processing. It was fast but hallucinated too much on structured JSON output — sign tokens would come back malformed or completely invented. Gemini 2.5 Flash handles the grammar conversion more reliably, so that is what the project uses now.

Groq is still used for speech-to-text via Whisper (whisper-large-v3-turbo), where it remains the best free option available. The two services now have clearly separate responsibilities — Groq transcribes audio, Gemini converts text into sign language grammar.

---

## Features

**Core**
- Live captions appear before AI processing is even done - raw transcript first, cleaned version replaces it silently
- SVG hand signs animate per word with motion that approximates the actual handshape
- Fingerspelling fallback for any word not in the dictionary, letter by letter
- ASL, BSL, and ISL support (dictionary-based, swappable)

**UI**
- Webcam panel shows the presenter alongside the signs - the split-screen format that makes the accessibility use case immediately obvious
- Dark, high contrast, and colorblind-friendly themes
- Sign speed and size controls, because different users process signs at different speeds
- Presentation mode strips the UI and goes full-screen for projection

**Utilities**
- Sign dictionary browser - searchable, categorized, hover to preview
- Session export as plain text, SRT subtitle file, or JSON
- Onboarding wizard that walks new users through setup in three steps

---

## Getting started

You will need Node.js 18 or higher and two free API keys. That's the entire prerequisite list.

**Get your API keys first - it takes about two minutes:**
- Groq: [console.groq.com](https://console.groq.com) - the primary model for both transcription and sign grammar
- OpenRouter: [openrouter.ai/keys](https://openrouter.ai/keys) - optional but recommended as a fallback

**Clone and install:**

```bash
git clone https://github.com/YOUR_USERNAME/sign-bridge.git
cd sign-bridge
```

**Backend:**

```bash
cd backend
npm install
cp .env.example .env
# Open .env and paste your API keys
npm run dev
```

**Frontend:**

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` in Chrome. Chrome is required - the Web Speech API situation in Firefox and Safari is a story for another day.

---

## Project structure

```
sign-bridge/
├── frontend/
│   └── src/
│       ├── App.jsx                    - main shell, layout, theme system
│       ├── hooks/
│       │   ├── useSession.js          - websocket connection, all shared state
│       │   └── useSpeechRecognition.js
│       └── components/
│           ├── SignPlayer.jsx         - SVG hand renderer and sign queue
│           ├── CaptionDisplay.jsx     - live caption panel with confidence meter
│           ├── WebcamPanel.jsx        - presenter webcam with topic overlay
│           ├── Toolbar.jsx            - speed, size, theme, panel toggles
│           ├── LanguageSelector.jsx   - ASL / BSL / ISL switcher
│           ├── OnboardingModal.jsx    - three-step setup wizard
│           ├── DictionaryBrowser.jsx  - searchable sign reference
│           └── SessionExport.jsx      - txt, srt, json export
│
└── backend/
    ├── server.js                      - Express + Socket.io, rate limit handling
    ├── geminiProcessor.js             - Groq LLM with OpenRouter fallback
    ├── signMapper.js                  - maps LLM tokens to sign definitions
    ├── dictionaries/
    │   ├── asl.json
    │   ├── bsl.json
    │   └── isl.json
    └── .env.example
```

---

## Environment variables

Create `backend/.env` by copying `backend/.env.example`:

```
GROQ_API_KEY=your_key_here
OPENROUTER_API_KEY=your_key_here
PORT=3001
```

The `.env` file is gitignored. The `.env.example` file is committed and contains no real values - it exists purely to tell the next person what variables they need.

---

## How the rate limiting works

The free tier on Groq's LLM allows 30 requests per minute. If you sent one request per speech chunk (every 4 seconds), you'd hit that limit in two minutes of continuous talking.

Instead, the backend uses a debounce strategy: Groq LLM is called 8 seconds after the last speech chunk arrives. During continuous speech, the timer keeps resetting. During natural pauses, it fires. This means in normal conversation you're making roughly 4-6 LLM calls per minute rather than 15.

If a rate limit error comes back anyway, the accumulated text is held and retried automatically after 20 seconds. The captions keep working throughout - only the sign grammar processing is delayed.

---

## Known limitations

The sign dictionary currently covers around 70 words. This is enough for a demo and for common conversational vocabulary, but not enough for a technical presentation about, say, distributed systems. Everything outside the dictionary gets fingerspelled, which works but is slower to read.

Expanding the dictionary is straightforward - each entry in `asl.json` is just a word mapped to a video filename or SVG definition. Pull requests welcome.

The fingerspelling uses emoji approximations of handshapes rather than anatomically accurate SVG renderings. It communicates the concept clearly but a trained ASL reader would notice the shortcuts.

Last but not the least, I am building this project for an internal hackathon at my workplace, with my team. 

---

## Contributing

The most useful contribution right now is expanding the sign dictionaries. If you know ASL, BSL, or ISL and want to review or improve the sign grammar prompts, open an issue.

For everything else, fork it, change it, open a PR. The code is readable and the components are intentionally small.

---

## License

MIT. Use it, modify it, build on it.
