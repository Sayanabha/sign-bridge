// 📄 frontend/src/hooks/useFingerDraw.js  — NEW FILE
// Handles two input modes:
//   1. Webcam — tracks index fingertip via MediaPipe, draws trail on canvas
//   2. Touch  — finger/stylus draws directly on a canvas element
// Both modes feed into the same recognizer

import { useRef, useState, useCallback, useEffect } from 'react';
import { recognizeLetter, normalizeTrail } from '../utils/LetterRecognizer';

const PAUSE_MS         = 1000; // ms of stillness before recognizing
const MIN_TRAIL_POINTS = 8;    // minimum points before attempting recognition
const TRAIL_COLOR      = '#7C6AF7';
const TRAIL_WIDTH      = 4;

export function useFingerDraw({ onLetter, canvasRef, mode = 'touch' }) {
  const [isDrawing, setIsDrawing]       = useState(false);
  const [lastRecognized, setLastRecognized] = useState(null);
  const [confidence, setConfidence]     = useState(0);

  const trailRef      = useRef([]);   // raw points being drawn
  const pauseTimer    = useRef(null);
  const lastPointRef  = useRef(null);
  const activeRef     = useRef(false);

  // ── Draw the trail on canvas ──────────────────────────────────────────────
  const drawTrail = useCallback((ctx, trail, width, height) => {
    if (trail.length < 2) return;
    ctx.clearRect(0, 0, width, height);
    ctx.beginPath();
    ctx.strokeStyle = TRAIL_COLOR;
    ctx.lineWidth = TRAIL_WIDTH;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Fading trail — newer points are brighter
    for (let i = 1; i < trail.length; i++) {
      const alpha = i / trail.length;
      ctx.globalAlpha = alpha * 0.9 + 0.1;
      ctx.beginPath();
      ctx.moveTo(trail[i-1].x * width, trail[i-1].y * height);
      ctx.lineTo(trail[i].x * width, trail[i].y * height);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }, []);

  // ── Attempt recognition and reset ────────────────────────────────────────
  const recognize = useCallback(() => {
    const trail = trailRef.current;
    if (trail.length < MIN_TRAIL_POINTS) {
      clearTrail();
      return;
    }

    const result = recognizeLetter(trail);

    if (result) {
      setLastRecognized(result.letter);
      setConfidence(result.confidence);
      onLetter?.(result.letter, result.confidence);
    }

    // Clear after brief flash
    setTimeout(clearTrail, 600);
  }, [onLetter]);

  const clearTrail = useCallback(() => {
    trailRef.current = [];
    setIsDrawing(false);
    lastPointRef.current = null;

    // Clear canvas
    const canvas = canvasRef?.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }, [canvasRef]);

  // ── Add a point to the trail ──────────────────────────────────────────────
  const addPoint = useCallback((x, y) => {
    // x and y should be 0-1 normalized
    const point = { x, y };

    // Ignore if too close to last point (noise reduction)
    const last = lastPointRef.current;
    if (last) {
      const d = Math.sqrt((x - last.x) ** 2 + (y - last.y) ** 2);
      if (d < 0.01) return;
    }

    trailRef.current.push(point);
    lastPointRef.current = point;
    setIsDrawing(true);

    // Draw on canvas
    const canvas = canvasRef?.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      drawTrail(ctx, trailRef.current, canvas.width, canvas.height);
    }

    // Reset pause timer
    clearTimeout(pauseTimer.current);
    pauseTimer.current = setTimeout(recognize, PAUSE_MS);
  }, [recognize, drawTrail, canvasRef]);

  // ── TOUCH MODE: attach touch/mouse listeners to canvas ───────────────────
  useEffect(() => {
    if (mode !== 'touch') return;
    const canvas = canvasRef?.current;
    if (!canvas) return;

    const getPos = (e) => {
      const rect = canvas.getBoundingClientRect();
      const touch = e.touches?.[0] || e;
      return {
        x: (touch.clientX - rect.left) / rect.width,
        y: (touch.clientY - rect.top)  / rect.height,
      };
    };

    const onStart = (e) => {
      e.preventDefault();
      trailRef.current = [];
      lastPointRef.current = null;
      activeRef.current = true;
      const pos = getPos(e);
      addPoint(pos.x, pos.y);
    };

    const onMove = (e) => {
      e.preventDefault();
      if (!activeRef.current) return;
      const pos = getPos(e);
      addPoint(pos.x, pos.y);
    };

    const onEnd = (e) => {
      e.preventDefault();
      activeRef.current = false;
      clearTimeout(pauseTimer.current);
      pauseTimer.current = setTimeout(recognize, 300); // faster on lift
    };

    canvas.addEventListener('touchstart',  onStart, { passive: false });
    canvas.addEventListener('touchmove',   onMove,  { passive: false });
    canvas.addEventListener('touchend',    onEnd,   { passive: false });
    canvas.addEventListener('mousedown',   onStart);
    canvas.addEventListener('mousemove',   (e) => { if (e.buttons === 1) onMove(e); });
    canvas.addEventListener('mouseup',     onEnd);

    return () => {
      canvas.removeEventListener('touchstart',  onStart);
      canvas.removeEventListener('touchmove',   onMove);
      canvas.removeEventListener('touchend',    onEnd);
      canvas.removeEventListener('mousedown',   onStart);
      canvas.removeEventListener('mousemove',   onMove);
      canvas.removeEventListener('mouseup',     onEnd);
    };
  }, [mode, canvasRef, addPoint, recognize]);

  // ── WEBCAM MODE: called externally with fingertip position ───────────────
  // Call addPointFromWebcam(x, y, isRaised) each frame from MediaPipe
  const addPointFromWebcam = useCallback((x, y, isRaised) => {
    if (mode !== 'webcam') return;
    if (isRaised) {
      addPoint(x, y);
    } else {
      // Finger lowered = end of stroke
      if (trailRef.current.length >= MIN_TRAIL_POINTS) {
        clearTimeout(pauseTimer.current);
        pauseTimer.current = setTimeout(recognize, 300);
      }
    }
  }, [mode, addPoint, recognize]);

  useEffect(() => () => clearTimeout(pauseTimer.current), []);

  return {
    isDrawing,
    lastRecognized,
    confidence,
    addPointFromWebcam,
    clearTrail,
    trail: trailRef.current,
  };
}