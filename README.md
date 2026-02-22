# 🤟 SignBridge — Real-Time Sign Language Interpreter

A web application that converts live speech into animated sign language in real time, making presentations and meetings accessible to deaf and hard-of-hearing individuals.

---

## ✨ Features

- 🎙️ **Live speech capture** via Groq Whisper (whisper-large-v3-turbo)
- 💬 **Instant captions** shown before AI processing completes
- 🤟 **SVG animated hand signs** — no video files needed
- ✦ **Fingerspelling fallback** for unknown words
- 🌐 **ASL / BSL / ISL** support
- 📷 **Webcam split-screen** alongside signs
- 🎨 **Three themes** — Dark, High Contrast, Colorblind-friendly
- ⬇️ **Session export** as .txt, .srt (subtitles), or .json
- 📖 **Sign dictionary browser** with search and categories
- 🖥️ **Presentation mode** — full screen for projectors
- 🔄 **Auto fallback** — Groq LLM → OpenRouter → word split

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite |
| Styling | Inline styles + CSS animations |
| Speech | Groq Whisper (whisper-large-v3-turbo) |
| Sign grammar | Groq LLM (llama-3.3-70b-versatile) |
| Fallback LLM | OpenRouter (llama-3.1-8b free) |
| Real-time | Socket.io |
| Backend | Node.js + Express |

**All AI APIs used are on free tiers.**

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- A free [Groq API key](https://console.groq.com)
- (Optional) A free [OpenRouter API key](https://openrouter.ai/keys)

### 1. Clone the repo

```bash
git clone https://github.com/YOUR_USERNAME/sign-bridge.git
cd sign-bridge
```

### 2. Set up the backend

```bash
cd backend
npm install

# Copy the example env file and fill in your keys
cp .env.example .env
# Edit .env and add your GROQ_API_KEY
```

### 3. Set up the frontend

```bash
cd ../frontend
npm install
```

### 4. Run both servers

**Terminal 1 — Backend:**
```bash
cd backend
npm run dev
# Runs on http://localhost:3001
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
# Runs on http://localhost:5173
```

### 5. Open in Chrome

Go to `http://localhost:5173` — Chrome is required for microphone support.

---

## 📁 Project Structure

```
sign-bridge/
├── frontend/
│   └── src/
│       ├── App.jsx                    # Main shell
│       ├── hooks/
│       │   ├── useSession.js          # Central state + WebSocket
│       │   └── useSpeechRecognition.js
│       └── components/
│           ├── SignPlayer.jsx         # SVG animated hands
│           ├── CaptionDisplay.jsx     # Live captions panel
│           ├── WebcamPanel.jsx        # Webcam feed
│           ├── Toolbar.jsx            # Controls bar
│           ├── LanguageSelector.jsx   # ASL/BSL/ISL picker
│           ├── OnboardingModal.jsx    # Setup wizard
│           ├── DictionaryBrowser.jsx  # Sign dictionary
│           └── SessionExport.jsx      # Export session
│
└── backend/
    ├── server.js                      # Express + Socket.io
    ├── geminiProcessor.js             # Groq LLM + OpenRouter fallback
    ├── signMapper.js                  # Token → sign mapping
    ├── dictionaries/
    │   ├── asl.json
    │   ├── bsl.json
    │   └── isl.json
    └── .env.example                   # Copy to .env and fill keys
```

---

## ⚙️ Environment Variables

Create `backend/.env` from `backend/.env.example`:

```
GROQ_API_KEY=your_groq_key        # Required
OPENROUTER_API_KEY=your_key       # Optional fallback
PORT=3001
```

---

## 🔒 Security Notes

- Never commit your `.env` file — it's in `.gitignore`
- API keys are server-side only, never exposed to the browser
- The `.env.example` file shows required variables without real values

---

## 📄 License

MIT