// 📄 frontend/src/components/FingerDrawPanel.jsx  — UPDATED
// Layout: drawing canvas (left) + word buffer + sentences (right) side by side

import { useRef, useState, useCallback, useEffect } from 'react';
import { useFingerDraw } from '../hooks/useFingerDraw';

const WORD_PAUSE_MS     = 2000;
const SENTENCE_PAUSE_MS = 4000;

export default function FingerDrawPanel({ colors, language, socket }) {
  const [mode, setMode]                 = useState('touch');
  const [webcamActive, setWebcamActive] = useState(false);
  const [letterBuffer, setLetterBuffer] = useState([]);
  const [wordBuffer, setWordBuffer]     = useState([]);
  const [sentences, setSentences]       = useState([]);
  const [currentWord, setCurrentWord]   = useState('');
  const [flashLetter, setFlashLetter]   = useState(null);

  const drawCanvasRef   = useRef(null);
  const videoRef        = useRef(null);
  const webcamCanvasRef = useRef(null);
  const handsRef        = useRef(null);
  const cameraRef       = useRef(null);
  const wordTimerRef    = useRef(null);
  const sentenceTimerRef = useRef(null);
  const bottomRef       = useRef(null);

  // ── Handle recognized letter ──────────────────────────────────────────────
  const handleLetter = useCallback((letter, confidence) => {
    setFlashLetter(letter);
    setTimeout(() => setFlashLetter(null), 700);

    setLetterBuffer(prev => {
      const next = [...prev, letter];
      setCurrentWord(next.join(''));
      return next;
    });

    clearTimeout(wordTimerRef.current);
    wordTimerRef.current = setTimeout(() => {
      setLetterBuffer(prev => {
        if (prev.length === 0) return prev;
        const word = prev.join('').toLowerCase();
        setCurrentWord('');
        setWordBuffer(wb => {
          const next = [...wb, word];
          clearTimeout(sentenceTimerRef.current);
          sentenceTimerRef.current = setTimeout(() => {
            setWordBuffer(wb2 => {
              if (wb2.length === 0) return wb2;
              const sentence = wb2.join(' ');
              setSentences(s => [...s, { text: sentence, timestamp: Date.now() }]);
              socket?.emit('sign-output', { text: sentence, timestamp: Date.now() });
              return [];
            });
          }, SENTENCE_PAUSE_MS);
          return next;
        });
        return [];
      });
    }, WORD_PAUSE_MS);
  }, [socket]);

  // ── Touch/webcam drawing hook ─────────────────────────────────────────────
  const { isDrawing, lastRecognized, confidence, addPointFromWebcam, clearTrail } = useFingerDraw({
    onLetter: handleLetter,
    canvasRef: drawCanvasRef,
    mode,
  });

  // ── Webcam mode — MediaPipe ───────────────────────────────────────────────
  useEffect(() => {
    if (mode !== 'webcam' || !webcamActive) return;
    let running = true;

    const init = async () => {
      try {
        const { Hands, HAND_CONNECTIONS } = await import('@mediapipe/hands');
        const { Camera }                  = await import('@mediapipe/camera_utils');
        const { drawConnectors, drawLandmarks } = await import('@mediapipe/drawing_utils');

        const hands = new Hands({
          locateFile: f => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${f}`,
        });
        hands.setOptions({ maxNumHands: 1, modelComplexity: 0, minDetectionConfidence: 0.7, minTrackingConfidence: 0.7 });

        hands.onResults(results => {
          if (!running) return;
          const canvas = webcamCanvasRef.current;
          const ctx = canvas?.getContext('2d');
          if (!canvas || !ctx) return;

          ctx.save();
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.scale(-1, 1);
          ctx.translate(-canvas.width, 0);
          ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);
          ctx.restore();

          if (results.multiHandLandmarks?.length > 0) {
            const lm = results.multiHandLandmarks[0];
            ctx.save();
            ctx.scale(-1, 1);
            ctx.translate(-canvas.width, 0);
            drawConnectors(ctx, lm, HAND_CONNECTIONS, { color: '#7C6AF755', lineWidth: 1 });
            drawLandmarks(ctx, lm, { color: '#7C6AF7', lineWidth: 1, radius: 2 });
            ctx.restore();

            const tip = lm[8];
            const pip = lm[6];
            const isRaised = tip.y < pip.y - 0.04;
            addPointFromWebcam(1 - tip.x, tip.y, isRaised);
          } else {
            addPointFromWebcam(0, 0, false);
          }
        });

        handsRef.current = hands;

        const camera = new Camera(videoRef.current, {
          onFrame: async () => {
            if (handsRef.current && running) await handsRef.current.send({ image: videoRef.current });
          },
          width: 640, height: 480,
        });
        cameraRef.current = camera;
        await camera.start();
      } catch (err) {
        console.error('[FingerDraw webcam]', err);
      }
    };

    init();
    return () => {
      running = false;
      try { cameraRef.current?.stop(); } catch (_) {}
      try { handsRef.current?.close(); } catch (_) {}
    };
  }, [mode, webcamActive, addPointFromWebcam]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [sentences]);
  useEffect(() => () => { clearTimeout(wordTimerRef.current); clearTimeout(sentenceTimerRef.current); }, []);

  const clearAll = () => {
    setLetterBuffer([]);
    setWordBuffer([]);
    setCurrentWord('');
    clearTrail();
  };

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%',
      background: colors.panel, border: `1px solid ${colors.border}`,
      borderRadius: '16px', overflow: 'hidden',
    }}>

      {/* ── Header ── */}
      <div style={{
        padding: '10px 14px', borderBottom: `1px solid ${colors.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontWeight: 700, fontSize: '13px', color: colors.text }}>Draw Letters</span>
          <span style={{
            fontSize: '10px', padding: '2px 8px', borderRadius: '20px',
            background: colors.accent + '22', color: colors.accentGlow,
            border: `1px solid ${colors.accent}33`, fontFamily: 'monospace',
          }}>
            {language?.toUpperCase()}
          </span>
          {isDrawing && (
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: colors.accent, animation: 'fdPulse 0.6s infinite' }} />
          )}
        </div>

        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          {/* Mode toggle */}
          <div style={{
            display: 'flex', gap: '3px', background: colors.bg,
            borderRadius: '8px', padding: '3px', border: `1px solid ${colors.border}`,
          }}>
            {['touch', 'webcam'].map(m => (
              <button key={m} onClick={() => { setMode(m); setWebcamActive(m === 'webcam'); clearAll(); }} style={{
                padding: '4px 10px', borderRadius: '6px', cursor: 'pointer',
                fontSize: '10px', fontWeight: 700, border: 'none', fontFamily: 'monospace',
                background: mode === m ? colors.accent : 'transparent',
                color: mode === m ? '#fff' : colors.muted,
                transition: 'all 0.15s',
              }}>
                {m === 'touch' ? '✍ Touch' : '📷 Air'}
              </button>
            ))}
          </div>

          <button onClick={clearAll} style={{
            padding: '4px 10px', borderRadius: '6px', cursor: 'pointer',
            fontSize: '10px', fontWeight: 700, border: `1px solid ${colors.border}`,
            background: 'transparent', color: colors.muted, fontFamily: 'monospace',
          }}>
            Clear
          </button>
        </div>
      </div>

      {/* ── Main body: side by side ── */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: 0 }}>

        {/* ── LEFT: Drawing canvas ── */}
        <div style={{
          position: 'relative', borderRight: `1px solid ${colors.border}`,
          background: '#000', overflow: 'hidden',
        }}>
          {/* Webcam feed (air mode) */}
          {mode === 'webcam' && (
            <>
              <video ref={videoRef} style={{ display: 'none' }} playsInline muted />
              <canvas ref={webcamCanvasRef} width={640} height={480}
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
            </>
          )}

          {/* Drawing canvas */}
          <canvas
            ref={drawCanvasRef}
            width={640} height={480}
            style={{
              position: 'absolute', inset: 0,
              width: '100%', height: '100%',
              cursor: mode === 'touch' ? 'crosshair' : 'none',
              touchAction: 'none',
              background: mode === 'touch' ? '#0A0A0F' : 'transparent',
            }}
          />

          {/* Flash letter */}
          {flashLetter && (
            <div style={{
              position: 'absolute', top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              fontSize: '80px', fontWeight: 900,
              color: colors.accent, fontFamily: 'monospace',
              opacity: 0.85, pointerEvents: 'none',
              animation: 'fdFlash 0.6s ease-out forwards',
              textShadow: `0 0 40px ${colors.accent}`,
            }}>
              {flashLetter}
            </div>
          )}

          {/* Empty state */}
          {!isDrawing && mode === 'touch' && letterBuffer.length === 0 && (
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              gap: '10px', pointerEvents: 'none',
            }}>
              <span style={{ fontSize: '36px' }}>✍️</span>
              <span style={{ fontSize: '12px', color: colors.muted, textAlign: 'center', padding: '0 20px' }}>
                Draw a letter with your finger or mouse
              </span>
              <span style={{ fontSize: '10px', color: colors.muted + '88', fontFamily: 'monospace', textAlign: 'center' }}>
                Pause 2s between letters<br />4s to send sentence
              </span>
            </div>
          )}

          {mode === 'webcam' && !webcamActive && (
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(0,0,0,0.8)',
            }}>
              <span style={{ fontSize: '12px', color: colors.muted }}>Loading camera...</span>
            </div>
          )}

          {/* Confidence badge */}
          {lastRecognized && (
            <div style={{
              position: 'absolute', top: '8px', right: '8px',
              background: 'rgba(0,0,0,0.7)', borderRadius: '8px',
              padding: '4px 10px', border: `1px solid ${colors.accent}44`,
            }}>
              <span style={{ fontSize: '10px', color: colors.accentGlow, fontFamily: 'monospace' }}>
                {lastRecognized} · {Math.round(confidence * 100)}%
              </span>
            </div>
          )}

          {/* Mode label */}
          <div style={{
            position: 'absolute', bottom: '8px', left: '8px',
            background: 'rgba(0,0,0,0.6)', borderRadius: '6px',
            padding: '3px 10px',
          }}>
            <span style={{ fontSize: '9px', color: colors.accentGlow, fontFamily: 'monospace' }}>
              {mode === 'touch' ? 'TOUCH MODE' : 'AIR WRITING'}
            </span>
          </div>
        </div>

        {/* ── RIGHT: Word buffer + sentences ── */}
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>

          {/* Current word being spelled */}
          <div style={{
            padding: '14px', borderBottom: `1px solid ${colors.border}`,
            flexShrink: 0, minHeight: '70px',
            display: 'flex', flexDirection: 'column', gap: '8px',
          }}>
            <span style={{ fontSize: '9px', color: colors.muted, fontFamily: 'monospace', letterSpacing: '1px' }}>
              CURRENT WORD
            </span>
            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
              {currentWord ? (
                <span style={{
                  fontSize: '24px', fontWeight: 800, color: colors.accent,
                  fontFamily: 'monospace', letterSpacing: '4px', textTransform: 'uppercase',
                }}>
                  {currentWord}
                  <span style={{
                    display: 'inline-block', width: 2, height: 22,
                    background: colors.accent, marginLeft: 4,
                    verticalAlign: 'middle', animation: 'fdBlink 0.8s step-end infinite',
                  }} />
                </span>
              ) : (
                <span style={{ fontSize: '12px', color: colors.muted }}>
                  Draw letters to build a word
                </span>
              )}
            </div>
          </div>

          {/* Word buffer */}
          <div style={{
            padding: '10px 14px', borderBottom: `1px solid ${colors.border}`,
            flexShrink: 0, minHeight: '52px',
            display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '6px',
          }}>
            <span style={{ fontSize: '9px', color: colors.muted, fontFamily: 'monospace', letterSpacing: '1px', width: '100%' }}>
              WORDS
            </span>
            {wordBuffer.length === 0 ? (
              <span style={{ fontSize: '11px', color: colors.muted }}>Pause 2s after a word to confirm it</span>
            ) : (
              wordBuffer.map((w, i) => (
                <span key={i} style={{
                  padding: '3px 10px', borderRadius: '20px', fontSize: '12px',
                  background: colors.live + '22', color: colors.live,
                  border: `1px solid ${colors.live}44`, fontFamily: 'monospace',
                }}>
                  {w}
                </span>
              ))
            )}
          </div>

          {/* Completed sentences */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ fontSize: '9px', color: colors.muted, fontFamily: 'monospace', letterSpacing: '1px', flexShrink: 0 }}>
              SENTENCES
            </span>
            {sentences.length === 0 && (
              <div style={{
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                flex: 1, gap: '8px', color: colors.muted,
              }}>
                <span style={{ fontSize: '20px' }}>✍️</span>
                <p style={{ margin: 0, fontSize: '11px', textAlign: 'center', lineHeight: 1.6 }}>
                  Pause 4s to send<br />a completed sentence
                </p>
              </div>
            )}
            {sentences.map((s, i) => (
              <div key={i} style={{
                background: colors.bg, borderRadius: '8px', padding: '8px 12px',
                border: `1px solid ${i === sentences.length - 1 ? colors.accent + '44' : colors.border}`,
                flexShrink: 0,
              }}>
                <p style={{ margin: 0, color: colors.text, fontSize: '13px', lineHeight: 1.5 }}>{s.text}</p>
                <div style={{ display: 'flex', gap: '8px', marginTop: '3px' }}>
                  <span style={{ fontSize: '10px', color: colors.muted, fontFamily: 'monospace' }}>
                    {new Date(s.timestamp).toLocaleTimeString()}
                  </span>
                  {socket && (
                    <span style={{ fontSize: '9px', color: colors.live, fontFamily: 'monospace' }}>✓ broadcast</span>
                  )}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fdPulse { 0%,100%{opacity:1}50%{opacity:0.3} }
        @keyframes fdBlink { 0%,100%{opacity:1}50%{opacity:0} }
        @keyframes fdFlash { 0%{opacity:0.9;transform:translate(-50%,-50%) scale(1.2)} 100%{opacity:0;transform:translate(-50%,-50%) scale(0.8)} }
      `}</style>
    </div>
  );
}