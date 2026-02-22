// 📄 backend/server.js  — REPLACE ENTIRE FILE
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import Groq from 'groq-sdk';
import { createReadStream, writeFileSync, unlinkSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { processTranscript } from './geminiProcessor.js';
import { mapTokensToVideos, getAvailableSigns } from './signMapper.js';

dotenv.config();

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

// ── Session store (in-memory, keyed by socket id) ──────────────────────────
// Each session tracks: transcript history, sign queue, topic, timestamps
const sessions = new Map();

function getSession(socketId) {
  if (!sessions.has(socketId)) {
    sessions.set(socketId, {
      id: socketId,
      startedAt: Date.now(),
      language: 'asl',
      transcriptHistory: [],   // last N chunks for Gemini context
      captionLog: [],          // full caption log for export
      signLog: [],             // full sign log for export
      topic: '',
    });
  }
  return sessions.get(socketId);
}

// ── Socket.IO ──────────────────────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log(`[WS] Client connected: ${socket.id}`);
  const session = getSession(socket.id);

  // Client sets language preference
  socket.on('set-language', (lang) => {
    session.language = lang || 'asl';
  });

  // Client sends transcript text (from Groq on frontend, or we process here)
  socket.on('transcript', async (data) => {
    const { text, language } = data;
    if (!text?.trim()) return;

    const lang = language || session.language;
    const timestamp = Date.now();

    // Add to context history (keep last 5 for Gemini)
    session.transcriptHistory.push(text);
    if (session.transcriptHistory.length > 5) session.transcriptHistory.shift();

    // Immediately emit raw caption so frontend shows it instantly
    const captionEntry = { text, timestamp, type: 'raw' };
    socket.emit('caption', captionEntry);
    session.captionLog.push(captionEntry);

    // Process with Gemini (with context)
    try {
      const geminiResult = await processTranscript(
        text,
        lang,
        session.transcriptHistory.slice(0, -1) // previous chunks as context
      );

      // Emit cleaned caption
      const cleanedEntry = {
        text: geminiResult.cleanedCaption,
        timestamp,
        type: 'cleaned',
        topic: geminiResult.topic,
        confidence: geminiResult.confidence,
      };
      socket.emit('caption-update', cleanedEntry);
      session.captionLog[session.captionLog.length - 1] = cleanedEntry;
      session.topic = geminiResult.topic;

      // Map tokens to sign visuals
      const signQueue = mapTokensToVideos(geminiResult.signTokens, lang);
      const coverage = Math.round(
        (signQueue.filter(s => s.hasVideo).length / Math.max(signQueue.length, 1)) * 100
      );

      // Log signs
      session.signLog.push({
        tokens: geminiResult.signTokens,
        timestamp,
        topic: geminiResult.topic,
      });

      socket.emit('signs', {
        signQueue,
        topic: geminiResult.topic,
        confidence: geminiResult.confidence,
        coverage,
        timestamp,
      });

    } catch (err) {
      console.error('[Gemini] Error:', err.message);
      // Fallback sign queue from raw words
      const fallbackTokens = text.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/).filter(Boolean);
      const signQueue = fallbackTokens.map(t => ({ token: t, hasVideo: false, videoPath: null }));
      socket.emit('signs', { signQueue, topic: '', confidence: 0.3, coverage: 0 });
    }
  });

  // Client requests session export data
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

  // Client resets session
  socket.on('session-reset', () => {
    sessions.delete(socket.id);
    console.log(`[WS] Session reset: ${socket.id}`);
  });

  socket.on('disconnect', () => {
    console.log(`[WS] Client disconnected: ${socket.id}`);
    // Keep session briefly for reconnect, then clean up
    setTimeout(() => sessions.delete(socket.id), 60000);
  });
});

// ── REST: Audio transcription (Groq Whisper) ──────────────────────────────
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
    console.error('[Groq] Error:', err.message);
    res.status(500).json({ error: err.message });
  } finally {
    try { unlinkSync(tmpPath); } catch (_) {}
  }
});

// ── REST: Get available signs ──────────────────────────────────────────────
app.get('/api/signs/:language', (req, res) => {
  const signs = getAvailableSigns(req.params.language);
  res.json({ language: req.params.language, count: signs.length, signs });
});

// ── REST: Health check ─────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    groq: !!process.env.GROQ_API_KEY,
    gemini: !!process.env.GEMINI_API_KEY,
    activeSessions: sessions.size,
    timestamp: new Date().toISOString(),
  });
});

httpServer.listen(PORT, () => {
  console.log(`\n🤟 SignBridge Backend running on http://localhost:${PORT}`);
  console.log(`   Groq:   ${process.env.GROQ_API_KEY ? '✅' : '❌ Missing GROQ_API_KEY'}`);
  console.log(`   Gemini: ${process.env.GEMINI_API_KEY ? '✅' : '❌ Missing GEMINI_API_KEY'}\n`);
});