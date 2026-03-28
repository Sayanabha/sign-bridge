// 📄 frontend/src/hooks/useHandRecognition.js  — DAY 2 REBUILD
// Changes from Day 1:
//   - Uses classifyLetterWithConfidence instead of classifyLetter
//   - Passes confidence score to StabilityBuffer (low confidence = rejected)
//   - Exposes currentConfidence for UI display
//   - Exposes requiredFrames so progress ring scales per letter

import { useEffect, useRef, useState, useCallback } from 'react';
import {
  classifyLetterWithConfidence,
  classifyWordSign,
  StabilityBuffer,
} from '../utils/handClassifier';

export function useHandRecognition({ onConfirmed, enabled }) {
  const [isLoading, setIsLoading]           = useState(false);
  const [isReady, setIsReady]               = useState(false);
  const [error, setError]                   = useState(null);
  const [currentSign, setCurrentSign]       = useState(null);
  const [currentConfidence, setCurrentConfidence] = useState(0);
  const [progress, setProgress]             = useState(0);
  const [framesRequired, setFramesRequired] = useState(10);

  const videoRef   = useRef(null);
  const canvasRef  = useRef(null);
  const handsRef   = useRef(null);
  const cameraRef  = useRef(null);
  const bufferRef  = useRef(new StabilityBuffer({ requiredFrames: 10, cooldownFrames: 18 }));
  const enabledRef = useRef(enabled);

  useEffect(() => { enabledRef.current = enabled; }, [enabled]);

  const stop = useCallback(() => {
    try { cameraRef.current?.stop(); } catch (_) {}
    try { handsRef.current?.close(); } catch (_) {}
    cameraRef.current = null;
    handsRef.current  = null;
    bufferRef.current.reset();
    setIsReady(false);
    setCurrentSign(null);
    setCurrentConfidence(0);
    setProgress(0);
  }, []);

  const start = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;
    setIsLoading(true);
    setError(null);

    try {
      const { Hands, HAND_CONNECTIONS }      = await import('@mediapipe/hands');
      const { Camera }                       = await import('@mediapipe/camera_utils');
      const { drawConnectors, drawLandmarks } = await import('@mediapipe/drawing_utils');

      const hands = new Hands({
        locateFile: file => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
      });

      hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.75,
        minTrackingConfidence: 0.75,
      });

      hands.onResults(results => {
        if (!enabledRef.current) return;

        const canvas = canvasRef.current;
        const ctx    = canvas?.getContext('2d');
        if (!canvas || !ctx) return;

        // Draw mirrored video
        ctx.save();
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.scale(-1, 1);
        ctx.translate(-canvas.width, 0);
        ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);
        ctx.restore();

        if (results.multiHandLandmarks?.length > 0) {
          const lm = results.multiHandLandmarks[0];

          // Draw landmarks
          ctx.save();
          ctx.scale(-1, 1);
          ctx.translate(-canvas.width, 0);

          // Color landmarks based on confidence
          drawConnectors(ctx, lm, HAND_CONNECTIONS, { color: '#7C6AF7', lineWidth: 2 });
          drawLandmarks(ctx, lm, { color: '#A89BFA', lineWidth: 1, radius: 3 });

          ctx.restore();

          // Word signs take priority
          const wordSign = classifyWordSign(lm);
          let letter = null;
          let confidence = 0;

          if (wordSign) {
            letter     = wordSign;
            confidence = 0.92; // word signs are high confidence by design
          } else {
            const result = classifyLetterWithConfidence(lm);
            letter       = result.letter;
            confidence   = result.confidence;
          }

          setCurrentSign(letter);
          setCurrentConfidence(confidence);
          setFramesRequired(bufferRef.current.currentRequired || 10);

          // Update buffer — passes confidence for filtering
          const confirmed = bufferRef.current.update(letter, confidence);
          setProgress(bufferRef.current.progress);

          if (confirmed) {
            onConfirmed?.(confirmed, !!wordSign);
          }
        } else {
          // No hand in frame
          setCurrentSign(null);
          setCurrentConfidence(0);
          bufferRef.current.update(null, 0);
          setProgress(0);
        }
      });

      handsRef.current = hands;

      const camera = new Camera(videoRef.current, {
        onFrame: async () => {
          if (handsRef.current && enabledRef.current) {
            await handsRef.current.send({ image: videoRef.current });
          }
        },
        width: 640,
        height: 480,
      });

      cameraRef.current = camera;
      await camera.start();
      setIsReady(true);

    } catch (err) {
      console.error('[MediaPipe]', err.message);
      setError('Could not load hand tracking. Check your internet connection.');
    } finally {
      setIsLoading(false);
    }
  }, [onConfirmed]);

  useEffect(() => {
    if (enabled && !isReady && !isLoading) start();
    else if (!enabled && isReady) stop();
  }, [enabled]);

  useEffect(() => () => stop(), []);

  return {
    videoRef,
    canvasRef,
    isLoading,
    isReady,
    error,
    currentSign,
    currentConfidence,
    progress,
    framesRequired,
  };
}