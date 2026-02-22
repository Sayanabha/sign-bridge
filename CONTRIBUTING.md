# Contributing to SignBridge

This guide is for anyone who wants to run the project locally, make changes, and contribute back. It assumes you have basic familiarity with the terminal but does not assume you know the codebase.

---

## Before you start

You need three things installed on your machine:

- **Node.js 18 or higher** — check with `node --version`
- **Git** — check with `git --version`
- **Chrome** — the app uses the MediaRecorder API which works best in Chrome

You also need two free API keys. Getting both takes about five minutes:

- **Groq** — go to [console.groq.com](https://console.groq.com), sign up, and create an API key. This powers both the speech transcription and the sign language grammar processing.
- **OpenRouter** — go to [openrouter.ai/keys](https://openrouter.ai/keys), sign up, and create a key. This is the fallback if Groq hits a rate limit. Optional but recommended.

---

## Setting up locally

**1. Fork the repository**

Go to [github.com/Sayanabha/sign-bridge](https://github.com/Sayanabha/sign-bridge) and click Fork in the top right. This creates your own copy of the repo under your GitHub account. You will make changes on your fork and submit them back via a pull request.

**2. Clone your fork**

```bash
git clone https://github.com/YOUR_USERNAME/sign-bridge.git
cd sign-bridge
```

**3. Set up the backend**

```bash
cd backend
npm install
cp .env.example .env
```

Now open `backend/.env` in any text editor and fill in your keys:

```
GROQ_API_KEY=paste_your_groq_key_here
OPENROUTER_API_KEY=paste_your_openrouter_key_here
PORT=3001
```

Save the file. Never commit this file — it is already in `.gitignore` so Git will ignore it automatically.

**4. Set up the frontend**

```bash
cd ../frontend
npm install
```

**5. Run both servers**

You need two terminal windows open at the same time.

Terminal 1 — backend:
```bash
cd backend
npm run dev
```

You should see:
```
🤟 SignBridge Backend — http://localhost:3001
   Groq:   ✅
   Gemini: ✅
```

Terminal 2 — frontend:
```bash
cd frontend
npm run dev
```

You should see:
```
VITE ready in 500ms
Local: http://localhost:5173
```

Open `http://localhost:5173` in Chrome. The app should load with the onboarding modal.

---

## Making changes

**Always work on a new branch — never commit directly to main.**

```bash
# Make sure your main is up to date first
git checkout main
git pull origin main

# Create a new branch named after what you are working on
git checkout -b fix/caption-display-bug
# or
git checkout -b feature/add-more-signs
```

Make your changes, test them in the browser, then commit:

```bash
git add .
git commit -m "Fix caption display not scrolling on mobile"
git push origin fix/caption-display-bug
```

Then go to your fork on GitHub and click **Compare and pull request**. Write a short description of what you changed and why, then submit it.

---

## Project structure at a glance

```
sign-bridge/
├── frontend/src/
│   ├── App.jsx                  — layout, themes, panel visibility
│   ├── hooks/
│   │   └── useSession.js        — all shared state, websocket, audio recording
│   └── components/
│       ├── SignPlayer.jsx        — SVG hand animations, fingerspelling
│       ├── CaptionDisplay.jsx    — live caption panel
│       ├── WebcamPanel.jsx       — presenter camera
│       ├── Toolbar.jsx           — speed, size, theme controls
│       ├── OnboardingModal.jsx   — first-run setup wizard
│       ├── DictionaryBrowser.jsx — searchable sign reference
│       └── SessionExport.jsx     — export to txt, srt, json
│
└── backend/
    ├── server.js                 — Express routes, Socket.io, rate limiting
    ├── geminiProcessor.js        — LLM calls (Groq primary, OpenRouter fallback)
    ├── signMapper.js             — maps word tokens to sign definitions
    └── dictionaries/
        ├── asl.json              — American Sign Language word list
        ├── bsl.json              — British Sign Language word list
        └── isl.json              — Indian Sign Language word list
```

---

## Where to contribute

**Expanding the sign dictionaries** is the most impactful thing you can do right now. Each dictionary file maps a word to a video filename. Adding more words increases the percentage of speech that gets signed rather than fingerspelled.

Open `backend/dictionaries/asl.json` and you will see the format immediately:

```json
{
  "hello": "hello.mp4",
  "goodbye": "goodbye.mp4"
}
```

If you know ASL, BSL, or ISL and want to review whether the sign grammar output from the LLM is accurate, that is also extremely valuable. The prompt lives in `backend/geminiProcessor.js` in the `buildPrompt` function.

**Improving SVG handshapes** in `SignPlayer.jsx` is another good area. The current hand renderer is functional but the finger positions are approximations. If you have knowledge of hand anatomy or sign language linguistics, the `SIGNS` object at the top of that file is where handshape definitions live.

**Bug reports** are welcome as GitHub issues. Include what you said, what the app did, and what you expected it to do.

---

## Common problems

**Backend starts but shows key missing**

Your `.env` file is either in the wrong folder or has a formatting issue. It must be at `backend/.env`, not the project root. Keys must have no quotes and no spaces around the equals sign.

```
GROQ_API_KEY=gsk_abc123   ← correct
GROQ_API_KEY="gsk_abc123" ← wrong
GROQ_API_KEY = gsk_abc123 ← wrong
```

**Frontend loads but mic does not work**

Use Chrome. Make sure you are on `http://localhost:5173` and not some other port. When you click Start Interpreting, Chrome will ask for microphone permission — click Allow.

**Signs are not appearing**

The LLM processes speech in batches using a debounce — it fires 8 seconds after you stop speaking, not in real time. Captions appear instantly. Signs follow after a short pause. This is intentional to stay within free API rate limits.

**Push rejected on git push**

Your local branch is behind the remote. Run:
```bash
git pull origin main --rebase
git push
```

---

## Code style

There is no linter configured. The conventions used throughout the project are:

- Inline styles over CSS classes (keeps components self-contained)
- No TypeScript (kept simple intentionally for accessibility to new contributors)
- Each component is one file, no splitting into separate style files
- Console logs are left in intentionally for backend debugging — prefix with the service name in brackets like `[Groq]` or `[WS]`

---

## Questions

Open a GitHub issue with the label `question`. Response time is not guaranteed but contributions and questions are genuinely welcome.