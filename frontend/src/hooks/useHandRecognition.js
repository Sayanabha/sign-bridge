// 📄 frontend/src/hooks/useHandRecognition.js  — NEW FILE
import { useEffect, useRef, useState, useCallback } from 'react';
import { classifyLetter, classifyWordSign, StabilityBuffer } from '../utils/handClassifier';

export function useHandRecognition({ onConfirmed, enabled }) {
  const [isLoading, setIsLoading]     = useState(false);
  const [isReady, setIsReady]         = useState(false);
  const [error, setError]             = useState(null);
  const [currentSign, setCurrentSign] = useState(null);  // live (unconfirmed)
  const [progress, setProgress]       = useState(0);     // 0-1 fill toward confirm

  const videoRef    = useRef(null);
  const canvasRef   = useRef(null);
  const handsRef    = useRef(null);
  const cameraRef   = useRef(null);
  const bufferRef   = useRef(new StabilityBuffer({ requiredFrames: 10, cooldownFrames: 18 }));
  const enabledRef  = useRef(enabled);

  useEffect(() => { enabledRef.current = enabled; }, [enabled]);

  const stop = useCallback(() => {
    try { cameraRef.current?.stop(); } catch (_) {}
    try { handsRef.current?.close(); } catch (_) {}
    cameraRef.current = null;
    handsRef.current  = null;
    bufferRef.current.reset();
    setIsReady(false);
    setCurrentSign(null);
    setProgress(0);
  }, []);

  const start = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;
    setIsLoading(true);
    setError(null);

    try {
      const { Hands, HAND_CONNECTIONS }   = await import('@mediapipe/hands');
      const { Camera }                    = await import('@mediapipe/camera_utils');
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

          // Draw landmarks (also mirrored)
          ctx.save();
          ctx.scale(-1, 1);
          ctx.translate(-canvas.width, 0);
          drawConnectors(ctx, lm, HAND_CONNECTIONS, { color: '#7C6AF7', lineWidth: 2 });
          drawLandmarks(ctx, lm, { color: '#A89BFA', lineWidth: 1, radius: 3 });
          ctx.restore();

          // Classify — word signs take priority over letters
          const wordSign = classifyWordSign(lm);
          const letter   = classifyLetter(lm);
          const detected = wordSign || letter;

          setCurrentSign(detected);

          // Run through stability buffer
          const confirmed = bufferRef.current.update(detected);
          setProgress(bufferRef.current.progress);

          if (confirmed) {
            onConfirmed?.(confirmed, !!wordSign);
          }
        } else {
          // No hand detected
          setCurrentSign(null);
          bufferRef.current.update(null);
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
      console.error('[MediaPipe]', err);
      setError('Could not load hand tracking. Check your internet connection.');
    } finally {
      setIsLoading(false);
    }
  }, [onConfirmed]);

  // Start/stop based on enabled prop
  useEffect(() => {
    if (enabled && !isReady && !isLoading) start();
    else if (!enabled && isReady) stop();
  }, [enabled]);

  // Cleanup on unmount
  useEffect(() => () => stop(), []);

  return { videoRef, canvasRef, isLoading, isReady, error, currentSign, progress };
}