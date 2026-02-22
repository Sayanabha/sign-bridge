import { useState, useRef, useCallback, useEffect } from 'react';

const API_BASE = 'http://localhost:3001';

export function useSpeechRecognition({ onTranscript, onInterim }) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported] = useState(!!(navigator.mediaDevices?.getUserMedia));
  const [error, setError] = useState(null);

  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const onTranscriptRef = useRef(onTranscript);
  const activeRef = useRef(false);
  const intervalRef = useRef(null);

  useEffect(() => { onTranscriptRef.current = onTranscript; }, [onTranscript]);

  // Send recorded chunk to Groq via backend
  const sendChunk = useCallback(async (blob) => {
    if (blob.size < 1000) return; // skip silence/tiny chunks

    const formData = new FormData();
    formData.append('audio', blob, 'audio.webm');

    try {
      const res = await fetch(`${API_BASE}/api/transcribe`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.transcript?.trim()) {
        console.log('[Whisper] Transcript:', data.transcript);
        onTranscriptRef.current?.(data.transcript.trim());
      }
    } catch (err) {
      console.warn('[Whisper] Send failed:', err.message);
    }
  }, []);

  const startListening = useCallback(async () => {
    if (activeRef.current) return;
    setError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      activeRef.current = true;
      setIsListening(true);

      // Record in 4-second chunks and send each one
      const startChunk = () => {
        if (!activeRef.current) return;

        const recorder = new MediaRecorder(stream, {
          mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
            ? 'audio/webm;codecs=opus'
            : 'audio/webm',
        });

        chunksRef.current = [];

        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunksRef.current.push(e.data);
        };

        recorder.onstop = () => {
          const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
          sendChunk(blob);
          // Start next chunk immediately
          if (activeRef.current) startChunk();
        };

        mediaRecorderRef.current = recorder;
        recorder.start();

        // Stop after 4 seconds to send the chunk
        setTimeout(() => {
          if (recorder.state === 'recording') recorder.stop();
        }, 4000);
      };

      startChunk();

    } catch (err) {
      console.error('[Whisper] Mic access failed:', err);
      setError('Microphone access denied — please allow mic in browser settings');
      activeRef.current = false;
      setIsListening(false);
    }
  }, [sendChunk]);

  const stopListening = useCallback(() => {
    activeRef.current = false;
    clearInterval(intervalRef.current);

    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }

    setIsListening(false);
  }, []);

  useEffect(() => {
    return () => {
      activeRef.current = false;
      clearInterval(intervalRef.current);
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, []);

  return { isListening, isSupported, error, startListening, stopListening };
}