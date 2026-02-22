// 📄 frontend/src/hooks/useSession.js  — NEW FILE
import { useState, useRef, useCallback, useEffect } from 'react';
import { io } from 'socket.io-client';

const API_BASE = 'http://localhost:3001';

export function useSession() {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);

  // Session state
  const [language, setLanguageState] = useState('asl');
  const [isListening, setIsListening] = useState(false);
  const [captions, setCaptions] = useState([]);
  const [interimText, setInterimText] = useState('');
  const [signQueue, setSignQueue] = useState([]);
  const [topic, setTopic] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [coverage, setCoverage] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [sessionStart, setSessionStart] = useState(null);
  const [segmentsProcessed, setSegmentsProcessed] = useState(0);

  // Refs
  const socketRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const activeRef = useRef(false);
  const captionIdRef = useRef(0);

  // ── Connect socket ──────────────────────────────────────────────────────
  useEffect(() => {
    const s = io(API_BASE, { transports: ['websocket', 'polling'] });
    socketRef.current = s;
    setSocket(s);

    s.on('connect', () => {
      setConnected(true);
      console.log('[Socket] Connected:', s.id);
    });

    s.on('disconnect', () => setConnected(false));

    // Raw caption (instant)
    s.on('caption', (entry) => {
      const id = ++captionIdRef.current;
      setCaptions(prev => [...prev, { ...entry, id, cleaned: false }]);
      setIsProcessing(true);
    });

    // Cleaned caption from Gemini (replaces last raw)
    s.on('caption-update', (entry) => {
      setCaptions(prev => {
        const updated = [...prev];
        if (updated.length > 0) {
          updated[updated.length - 1] = {
            ...updated[updated.length - 1],
            text: entry.text,
            topic: entry.topic,
            cleaned: true,
          };
        }
        return updated;
      });
      if (entry.topic) setTopic(entry.topic);
      if (entry.confidence) setConfidence(entry.confidence);
      setIsProcessing(false);
      setSegmentsProcessed(p => p + 1);
    });

    // Signs from Gemini
    s.on('signs', (data) => {
      setSignQueue(data.signQueue || []);
      setCoverage(data.coverage || 0);
    });

    return () => s.disconnect();
  }, []);

  // ── Set language ────────────────────────────────────────────────────────
  const setLanguage = useCallback((lang) => {
    setLanguageState(lang);
    socketRef.current?.emit('set-language', lang);
  }, []);

  // ── Send transcript chunk via socket ────────────────────────────────────
  const sendTranscript = useCallback((text) => {
    if (!text?.trim() || !socketRef.current) return;
    socketRef.current.emit('transcript', { text, language });
  }, [language]);

  // ── Audio recording (Groq) ──────────────────────────────────────────────
  const startChunk = useCallback(() => {
    if (!activeRef.current || !streamRef.current) return;

    const recorder = new MediaRecorder(streamRef.current, {
      mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus' : 'audio/webm',
    });
    const chunks = [];

    recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };

    recorder.onstop = async () => {
      const blob = new Blob(chunks, { type: 'audio/webm' });
      if (blob.size < 1000) {
        if (activeRef.current) startChunk();
        return;
      }

      // Send to Groq
      const formData = new FormData();
      formData.append('audio', blob, 'audio.webm');
      try {
        const res = await fetch(`${API_BASE}/api/transcribe`, { method: 'POST', body: formData });
        const data = await res.json();
        if (data.transcript?.trim()) {
          sendTranscript(data.transcript.trim());
        }
      } catch (err) {
        console.warn('[Groq] Failed:', err.message);
      }

      if (activeRef.current) startChunk();
    };

    mediaRecorderRef.current = recorder;
    recorder.start();
    setTimeout(() => {
      if (recorder.state === 'recording') recorder.stop();
    }, 4000);
  }, [sendTranscript]);

  // ── Start session ───────────────────────────────────────────────────────
  const startSession = useCallback(async () => {
    if (activeRef.current) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      activeRef.current = true;
      setIsListening(true);
      setSessionStart(Date.now());
      setCaptions([]);
      setSignQueue([]);
      setTopic('');
      setSegmentsProcessed(0);
      setCoverage(0);
      socketRef.current?.emit('session-reset');
      socketRef.current?.emit('set-language', language);
      startChunk();
    } catch (err) {
      console.error('[Mic] Access failed:', err);
      alert('Microphone access denied. Please allow mic in browser settings.');
    }
  }, [language, startChunk]);

  // ── Stop session ────────────────────────────────────────────────────────
  const stopSession = useCallback(() => {
    activeRef.current = false;
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setIsListening(false);
    setInterimText('');
  }, []);

  // ── Export session ──────────────────────────────────────────────────────
  const requestExport = useCallback(() => {
    return new Promise((resolve) => {
      socketRef.current?.emit('export-request');
      socketRef.current?.once('export-data', resolve);
      setTimeout(() => resolve(null), 3000); // timeout fallback
    });
  }, []);

  return {
    // State
    connected,
    language, setLanguage,
    isListening,
    captions, setCaptions,
    interimText, setInterimText,
    signQueue,
    topic,
    confidence,
    coverage,
    isProcessing,
    sessionStart,
    segmentsProcessed,
    // Actions
    startSession,
    stopSession,
    requestExport,
  };
}