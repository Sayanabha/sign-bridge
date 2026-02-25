import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import Groq from 'groq-sdk';
import { createReadStream, writeFileSync, unlinkSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { tmpdir, networkInterfaces } from 'os';
import { fileURLToPath } from 'url';
import { processTranscriptLocally } from './signGrammar.js';
import { mapTokensToVideos, getAvailableSigns } from './signMapper.js';

// NOTE: geminiProcessor.js is kept but not imported here.
// To switch back to Gemini, replace the processTranscriptLocally call
// with: import { processTranscript } from './geminiProcessor.js';

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

const PORT = process.env.PORT || 3001;
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.static(resolve(__dirname, 'public')));

// ── Viewer page ───────────────────────────────────────────────────────────────
app.get('/view', (req, res) => {
  res.sendFile(resolve(__dirname, 'public', 'viewer.html'));
});

// ── Viewer URL (for QR code) ──────────────────────────────────────────────────
app.get('/api/viewer-url', async (req, res) => {
  const nets = networkInterfaces();
  let localIp = 'localhost';

  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        localIp = net.address;
        break;
      }
    }
  }

  const url = `http://${localIp}:${PORT}/view`;
  console.log(`[QR] Viewer URL: ${url}`);
  res.json({ url, ip: localIp, port: PORT });
});

// ── Viewer count ──────────────────────────────────────────────────────────────
app.get('/api/viewer-count', (req, res) => {
  res.json({ count: viewerSockets.size });
});

// ── Track viewer sockets ──────────────────────────────────────────────────────
const viewerSockets = new Set();

// ── Session store ─────────────────────────────────────────────────────────────
const sessions = new Map();

function getSession(socketId) {
  if (!sessions.has(socketId)) {
    sessions.set(socketId, {
      id: socketId,
      startedAt: Date.now(),
      language: 'asl',
      captionLog: [],
      signLog: [],
      topic: '',
    });
  }
  return sessions.get(socketId);
}

// ── Socket.IO ─────────────────────────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log(`[WS] Client connected: ${socket.id}`);

  const session = getSession(socket.id);
  let geminiDebounceTimer = null;

  // Viewer join (audience phone — read only)
  socket.on('viewer-join', () => {
    socket.join('viewers');
    viewerSockets.add(socket.id);
    console.log(`[Viewer] Joined: ${socket.id} | Total: ${viewerSockets.size}`);
  });

  socket.on('set-language', (lang) => {
    session.language = lang || 'asl';
  });

  // ── Transcript received from frontend (after Groq Whisper) ───────────────
  socket.on('transcript', (data) => {
    const { text, language } = data;
    if (!text?.trim()) return;

    session.language = language || session.language;
    const timestamp = Date.now();

    console.log(`[${session.language.toUpperCase()}] "${text}"`);

    // STEP 1: Instant raw caption
    const captionEntry = { text, timestamp, type: 'raw' };
    socket.emit('caption', captionEntry);
    io.to('viewers').emit('caption', captionEntry);
    session.captionLog.push(captionEntry);

    // STEP 2: Rule-based sign grammar — instant, no API call
    const result = processTranscriptLocally(text);

    console.log(`[Grammar] Topic: ${result.topic} | Tokens: ${result.signTokens.length} | Q: ${result.isQuestion}`);

    // Emit cleaned caption
    const cleanedEntry = {
      text: result.cleanedCaption,
      timestamp,
      type: 'cleaned',
      topic: result.topic,
      confidence: result.confidence,
    };
    socket.emit('caption-update', cleanedEntry);
    io.to('viewers').emit('caption-update', cleanedEntry);

    session.topic = result.topic;

    // Map tokens to signs
    const signQueue = mapTokensToVideos(result.signTokens, session.language);
    const coverage = Math.round(
      (signQueue.filter(s => s.hasVideo).length / Math.max(signQueue.length, 1)) * 100
    );

    session.signLog.push({
      tokens: result.signTokens,
      timestamp,
      topic: result.topic,
    });

    const signsPayload = {
      signQueue,
      topic: result.topic,
      confidence: result.confidence,
      coverage,
      timestamp,
    };
    socket.emit('signs', signsPayload);
    io.to('viewers').emit('signs', signsPayload);
  });

  // ── Export ────────────────────────────────────────────────────────────────
  socket.on('export-request', () => {
    socket.emit('export-data', {
      sessionId: session.id,
      startedAt: session.startedAt,
      language: session.language,
      topic: session.topic,
      captionLog: session.captionLog,
      signLog: session.signLog,
    });
  });

  // ── Session reset ─────────────────────────────────────────────────────────
  socket.on('session-reset', () => {
    clearTimeout(geminiDebounceTimer);
    sessions.delete(socket.id);
    console.log(`[WS] Session reset: ${socket.id}`);
  });

  // ── Disconnect ────────────────────────────────────────────────────────────
  socket.on('disconnect', () => {
    if (viewerSockets.has(socket.id)) {
      socket.leave('viewers');
      viewerSockets.delete(socket.id);
      console.log(`[Viewer] Disconnected: ${socket.id} | Remaining: ${viewerSockets.size}`);
      return;
    }

    clearTimeout(geminiDebounceTimer);
    console.log(`[WS] Disconnected: ${socket.id}`);
    setTimeout(() => sessions.delete(socket.id), 60000);
  });
});

// ── REST: Groq Whisper transcription ──────────────────────────────────────────
app.post('/api/transcribe', upload.single('audio'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No audio file' });

  const tmpPath = join(tmpdir(), `audio_${Date.now()}.webm`);
  writeFileSync(tmpPath, req.file.buffer);

  try {
    const transcription = await groq.audio.transcriptions.create({
      file: createReadStream(tmpPath),
      model: 'whisper-large-v3-turbo',
      language: 'en',
    });
    res.json({ transcript: transcription.text });
  } catch (err) {
    console.error('[Groq] ❌', err.message);
    res.status(500).json({ error: err.message });
  } finally {
    try { unlinkSync(tmpPath); } catch (_) {}
  }
});

// ── REST: Available signs ─────────────────────────────────────────────────────
app.get('/api/signs/:language', (req, res) => {
  const signs = getAvailableSigns(req.params.language);
  res.json({ language: req.params.language, count: signs.length, signs });
});

// ── REST: Health check ────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    mode: 'whisper-only',
    groq: !!process.env.GROQ_API_KEY,
    gemini: 'dormant',
    activeSessions: sessions.size,
    viewers: viewerSockets.size,
    timestamp: new Date().toISOString(),
  });
});

// ── Start ─────────────────────────────────────────────────────────────────────
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🤟 SignBridge Backend — http://localhost:${PORT}`);
  console.log(`   Mode:   Whisper only (rule-based sign grammar)`);
  console.log(`   Groq:   ${process.env.GROQ_API_KEY ? '✅' : '❌ Missing GROQ_API_KEY'}`);
  console.log(`   Gemini: dormant (geminiProcessor.js kept for reference)\n`);
});