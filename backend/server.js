// 📄 backend/server.js  — DAY 4 UPDATE
// New: sign-output socket event — deaf person's signed sentences
//      broadcast to all viewer screens in real time

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
import { processTranscriptLocally as convertToSignGrammar } from './signGrammar.js';
import { mapTokensToVideos, getAvailableSigns } from './signMapper.js';

// Gemini kept but unused — to re-enable uncomment:
// import { processTranscript } from './geminiProcessor.js';

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

// ── REST routes ───────────────────────────────────────────────────────────────

app.get('/view', (req, res) => {
  res.sendFile(resolve(__dirname, 'public', 'viewer.html'));
});

app.get('/api/viewer-url', (req, res) => {
  const nets = networkInterfaces();
  let localIp = 'localhost';
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) { localIp = net.address; break; }
    }
  }
  const url = `http://${localIp}:${PORT}/view`;
  console.log(`[QR] Viewer URL: ${url}`);
  res.json({ url, ip: localIp, port: PORT });
});

app.get('/api/viewer-count', (req, res) => {
  res.json({ count: viewerSockets.size });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    model: 'groq-whisper-only',
    groq: !!process.env.GROQ_API_KEY,
    gemini: 'disabled — geminiProcessor.js kept as backup',
    grammar: 'rule-based',
    activeSessions: sessions.size,
    viewers: viewerSockets.size,
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/signs/:language', (req, res) => {
  const signs = getAvailableSigns(req.params.language);
  res.json({ language: req.params.language, count: signs.length, signs });
});

// ── State ─────────────────────────────────────────────────────────────────────

const sessions = new Map();
const viewerSockets = new Set();

function getSession(socketId) {
  if (!sessions.has(socketId)) {
    sessions.set(socketId, {
      id: socketId,
      startedAt: Date.now(),
      language: 'asl',
      captionLog: [],
      signLog: [],
      signOutputLog: [],   // ← deaf person's sentences
      topic: '',
    });
  }
  return sessions.get(socketId);
}

// ── Socket.IO ─────────────────────────────────────────────────────────────────

io.on('connection', (socket) => {
  console.log(`[WS] Client connected: ${socket.id}`);

  const session = getSession(socket.id);

  // ── Viewer join ─────────────────────────────────────────────────────────
  socket.on('viewer-join', () => {
    socket.join('viewers');
    viewerSockets.add(socket.id);
    console.log(`[Viewer] Joined: ${socket.id} | Total: ${viewerSockets.size}`);
  });

  socket.on('set-language', (lang) => {
    session.language = lang || 'asl';
  });

  // ── Hearing person: speech transcript → captions + signs ────────────────
  socket.on('transcript', (data) => {
    const { text, language } = data;
    if (!text?.trim()) return;

    session.language = language || session.language;
    const timestamp = Date.now();

    console.log(`[${session.language.toUpperCase()}] "${text}"`);

    // Instant raw caption
    const captionEntry = { text, timestamp, type: 'raw' };
    socket.emit('caption', captionEntry);
    io.to('viewers').emit('caption', captionEntry);
    session.captionLog.push(captionEntry);

    // Rule-based sign grammar
    const { signTokens, cleanedCaption, topic, confidence } = convertToSignGrammar(
      text, session.language
    );

    console.log(`[Grammar] Topic: ${topic} | Tokens: ${signTokens.length}`);

    const cleanedEntry = { text: cleanedCaption, timestamp, type: 'cleaned', topic, confidence };
    socket.emit('caption-update', cleanedEntry);
    io.to('viewers').emit('caption-update', cleanedEntry);
    session.topic = topic;

    const signQueue = mapTokensToVideos(signTokens, session.language);
    const coverage = Math.round(
      (signQueue.filter(s => s.hasVideo).length / Math.max(signQueue.length, 1)) * 100
    );

    session.signLog.push({ tokens: signTokens, timestamp, topic });

    const signsPayload = { signQueue, topic, confidence, coverage, timestamp };
    socket.emit('signs', signsPayload);
    io.to('viewers').emit('signs', signsPayload);
  });

  // ── NEW: Deaf person: signed sentence → broadcast to viewers ────────────
  socket.on('sign-output', (data) => {
    const { text, timestamp } = data;
    if (!text?.trim()) return;

    console.log(`[Sign→Text] "${text}"`);

    // Log it
    session.signOutputLog.push({ text, timestamp: timestamp || Date.now() });

    // Broadcast to all viewer screens
    const payload = {
      text,
      timestamp: timestamp || Date.now(),
      type: 'sign-output',
      from: 'deaf-person',
    };

    // Send back to the presenter's own screen too
    socket.emit('sign-output-echo', payload);

    // Broadcast to all viewers
    io.to('viewers').emit('sign-output', payload);

    console.log(`[Sign→Text] Broadcast to ${viewerSockets.size} viewer(s)`);
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
      signOutputLog: session.signOutputLog,
    });
  });

  socket.on('session-reset', () => {
    sessions.delete(socket.id);
    console.log(`[WS] Session reset: ${socket.id}`);
  });

  socket.on('disconnect', () => {
    if (viewerSockets.has(socket.id)) {
      socket.leave('viewers');
      viewerSockets.delete(socket.id);
      console.log(`[Viewer] Disconnected: ${socket.id} | Remaining: ${viewerSockets.size}`);
      return;
    }
    console.log(`[WS] Disconnected: ${socket.id}`);
    setTimeout(() => sessions.delete(socket.id), 60000);
  });
});

// ── REST: Groq Whisper ────────────────────────────────────────────────────────

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
    console.error('[Groq]', err.message);
    res.status(500).json({ error: err.message });
  } finally {
    try { unlinkSync(tmpPath); } catch (_) {}
  }
});

// ── Start ─────────────────────────────────────────────────────────────────────

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🤟 SignBridge Backend — http://localhost:${PORT}`);
  console.log(`   Groq Whisper: ${process.env.GROQ_API_KEY ? '✅' : '❌ Missing GROQ_API_KEY'}`);
  console.log(`   Gemini:       disabled (geminiProcessor.js kept as backup)`);
  console.log(`   Grammar:      rule-based — instant, zero rate limits`);
  console.log(`   Bidirectional: ✅ sign-output channel active\n`);
});