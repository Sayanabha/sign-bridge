# SignBridge

Real-time, bidirectional sign language interpretation for the browser. No interpreter. No special hardware. No scheduling a human being two weeks in advance just so a deaf colleague can attend a standup.

Someone speaks. SignBridge listens, transcribes, converts to sign language grammar, and animates the signs on screen within seconds. The deaf person signs back. SignBridge reads their hands via webcam, converts that to text, and sends it to every connected screen in the room. Both sides of the conversation happen simultaneously. Useful for Accenture employees and clients alike, across meetings, presentations, client calls, and any setting where someone is currently just hoping they can follow along.

---

## What it does

**Speech to Sign.** A hearing person speaks into their microphone. Groq Whisper transcribes the audio in near real time. A rule-based grammar engine strips the filler words, expands contractions, and restructures the sentence into topic-comment order the way sign languages actually work. An animated hand (SVG or optional 3D) renders each sign on screen.

**Sign to Text.** A deaf person shows their hand to the webcam. MediaPipe tracks 21 hand landmarks at 30 frames per second, entirely in the browser. A confidence-scored classifier identifies letters and common word signs. Letters accumulate into words, words into sentences. Completed sentences broadcast instantly to all connected screens via Socket.io.

**Draw to Text.** No sign language knowledge required on either side. The deaf person can draw letters on the canvas with a finger or mouse. A directional stroke recognizer identifies the letter, adds it to the word buffer, and sends the completed sentence to all viewers after a pause.

**QR Audience View.** The presenter generates a QR code from the Share button. Anyone in the room scans it on their phone. A clean, mobile-optimized page appears showing live captions, sign tokens, and the deaf person's responses in real time. No app to install, no account to create, just a QR code and a phone on the same WiFi.

**Dual Screen Mode.** Both directions run simultaneously in a split layout. The hearing person's speech converts to signs on the left. The deaf person's signing converts to text on the right. Neither person has to wait for the other to finish.

**Microsoft Teams Integration.** SignBridge runs as a tab inside a Teams meeting side panel. One person starts it, everyone in the meeting benefits. (Currently in progress, launching by end of June 2025.)

---

## The tech

| Layer | What it does | How |
|---|---|---|
| Speech to text | Transcribes audio in real time | Groq Whisper (whisper-large-v3-turbo) |
| Sign grammar | Converts transcripts to sign tokens | Rule-based engine, runs in-process |
| Sign rendering | Animates signs on screen | SVG emoji signs (default), Three.js 3D hand (opt-in) |
| Hand tracking | Reads hand landmarks from webcam | Google MediaPipe Hands, runs in browser |
| Sign classification | Identifies letters and word signs | Landmark geometry classifier with stability buffer |
| Real-time comms | Syncs everything across screens | Socket.io |
| Frontend | The UI | React + Vite |
| Backend | API and WebSocket server | Node.js + Express |

Gemini 1.5 Flash is kept in the codebase as a dormant backup for sign grammar processing. It was the original LLM used for this, but the free tier rate limits made real-time use impractical. The rule-based engine replaced it and is faster, more predictable, and has zero rate limits.

---

## Getting started

You need Node.js 18 or higher and two free API keys. That is the entire prerequisite list.

**Get your keys first:**

- Groq: [console.groq.com](https://console.groq.com) — used for Whisper speech transcription. Free, generous limits.
- Gemini (optional backup): [aistudio.google.com/apikey](https://aistudio.google.com/apikey) — dormant unless you re-enable it.

**Clone and install:**

```bash
git clone https://github.com/Sayanabha/sign-bridge.git
cd sign-bridge
```

**Backend:**

```bash
cd backend
npm install
cp .env.example .env
# Open .env and add your GROQ_API_KEY
npm run dev
# Runs on http://localhost:3001
```

**Frontend:**

```bash
cd frontend
npm install
npm run dev
# Runs on http://localhost:5173
```

Open `http://localhost:5173` in Chrome. Chrome is required for WebRTC and the MediaRecorder API. Firefox and Safari support for this is a story for another day.

---

## Project structure

```
sign-bridge/
├── backend/
│   ├── server.js                  WebSocket server, speech pipeline, bidirectional broadcast
│   ├── signGrammar.js             Rule-based sign language grammar converter
│   ├── geminiProcessor.js         Dormant Gemini backup (kept for reference)
│   ├── signMapper.js              Maps word tokens to sign definitions
│   ├── dictionaries/
│   │   ├── asl.json               American Sign Language vocabulary
│   │   ├── bsl.json               British Sign Language vocabulary
│   │   └── isl.json               Indian Sign Language vocabulary
│   └── public/
│       └── viewer.html            Mobile audience view served via Express
│
└── frontend/
    └── src/
        ├── App.jsx                Main shell, mode switching, theme system
        ├── hooks/
        │   ├── useSession.js      Central state, WebSocket connection, audio pipeline
        │   ├── useHandRecognition.js   MediaPipe hand tracking hook
        │   └── useFingerDraw.js   Touch and webcam drawing hook
        ├── components/
        │   ├── SignPlayer.jsx      SVG animated sign renderer
        │   ├── AvatarSignPlayer.jsx   Three.js 3D hand renderer
        │   ├── CaptionDisplay.jsx  Live captions panel (raw + cleaned columns)
        │   ├── WebcamPanel.jsx     Presenter webcam feed
        │   ├── SignToText.jsx      Deaf person input panel with MediaPipe
        │   ├── FingerDrawPanel.jsx Draw-to-text panel
        │   ├── QRShare.jsx         QR code generator for audience
        │   ├── Toolbar.jsx         Sign speed, size, theme controls
        │   ├── DictionaryBrowser.jsx   Searchable sign reference
        │   ├── SessionExport.jsx   Export to TXT, SRT, or JSON
        │   └── OnboardingModal.jsx First-run setup wizard
        ├── utils/
        │   ├── handClassifier.js   A-Z letter classifier with confidence scoring
        │   └── LetterRecognizer.js Stroke-based letter recognizer for draw mode
        └── three/
            ├── HandModel.jsx       Procedural 3D hand model
            └── HandPoseData.js     Bone rotation data for 70+ signs
```

---

## Environment variables

Create `backend/.env` by copying `backend/.env.example`:

```
GROQ_API_KEY=your_groq_key_here
GEMINI_API_KEY=your_gemini_key_here   # optional, only needed if re-enabling Gemini
PORT=3001
```

The `.env` file is gitignored. The `.env.example` file is committed and contains no real values.

---

## Application modes

**Speech to Sign** is the default. The hearing person speaks, signs appear on screen for the deaf person to read. All the speech pipeline controls live in the toolbar.

**Dual Mode** runs both directions at once. Left side is the hearing person's stream: live captions and animated signs. Right side is the deaf person's stream: webcam hand tracking with letter buffer and completed sentences. Both update in real time without switching modes.

**Draw Mode** is the alternative input for people who do not sign. A canvas appears where letters can be drawn with a finger on touchscreen or a mouse on desktop. In Air mode, MediaPipe tracks the index fingertip and converts the drawn path to letters.

The **SVG / 3D toggle** in the header switches the sign player between the default SVG emoji hand renderer and the Three.js 3D procedural hand model.

---

## How the sign grammar engine works

The rule-based grammar converter runs entirely in-process with no API calls. It does five things:

1. Expands contractions (don't becomes do not, it's becomes it)
2. Removes filler words (um, uh, like, basically, so, you know)
3. Drops articles (a, an, the) and copula (is, are, was, were)
4. Detects question sentences and moves question words to the end (ASL topic-comment structure puts the question word last)
5. Strips short tokens that are not meaningful signs

The result is a clean list of content words that maps well to the sign dictionary. For anything outside the dictionary, fingerspelling fallback covers every letter of the alphabet.

---

## How the sign classifier works

MediaPipe returns 21 hand landmark coordinates per frame. The classifier computes geometric features from those coordinates: which fingers are extended, distances between fingertips and palm, spread between fingers. Each letter has a scoring function that returns a confidence value between 0 and 1.

Detections below 0.65 confidence are rejected outright. Ambiguous letter pairs (U vs V, M vs N, S vs A vs T) require more consecutive frames before confirming. The progress ring in the Sign to Text panel fills as frames accumulate, then confirms the sign and starts a cooldown to prevent repeated registrations.

---

## Known limitations

The sign dictionary currently covers around 70 words plus the full A-Z alphabet. This is enough for most conversational vocabulary but not for technical or domain-specific language. The fingerspelling fallback handles anything outside the dictionary but is slower to read than a direct sign.

The 3D hand model renders correctly but bone rotation data for some signs needs refinement. Using the default SVG renderer avoids this entirely. The 3D renderer is opt-in via the SVG / 3D toggle.

The draw-to-text recognizer works well for clearly written block capital letters. Casual handwriting with loops and connecting strokes will produce incorrect results. Write slowly and lift between letters.

MediaPipe hand tracking degrades significantly in poor lighting or when the hand is at the edge of the frame. A plain background behind the hand makes a measurable difference.

---

## What is coming next

**Microsoft Teams integration** is in progress. SignBridge will run as a tab in the Teams meeting side panel. Presenters launch it, all participants benefit. Timeline: end of June 2025.

**Teachable Machine model** trained on real hand data will significantly improve sign recognition accuracy for common word signs, from roughly 85% to 95%+.

**Expanded dictionary** from 70 to 500+ signs using the WLASL dataset. Medical, legal, and enterprise vocabulary specifically.

**3D avatar signing** with a full upper-body Ready Player Me avatar driving the sign animations using the existing pose system.

---

## Contributing

The most useful contribution right now is expanding the sign dictionaries. Each entry in `backend/dictionaries/asl.json` is a word mapped to a sign definition. Adding a word is one line.

Improving the sign grammar rules in `backend/signGrammar.js` is also high value. If you know ASL, BSL, or ISL and want to review whether the grammar output is linguistically accurate, open an issue.

For bugs, open a GitHub issue with what you said, what happened, and what you expected to happen. For everything else, fork it, change it, open a pull request.

---

## License

MIT. Use it, build on it, ship it.

---


Built to be beneficial for Accenture employees and clients alike. Accessible communication should not be a feature request. It should be the default.