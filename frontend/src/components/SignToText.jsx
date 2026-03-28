// 📄 frontend/src/components/SignToText.jsx  — NEW FILE
import { useState, useCallback, useRef, useEffect } from 'react';
import { useHandRecognition } from '../hooks/useHandRecognition';

const WORD_PAUSE_MS     = 1500;  // pause between letters = new word
const SENTENCE_PAUSE_MS = 3500;  // pause after words = send sentence

export default function SignToText({ colors, language }) {
  const [active, setActive]           = useState(false);
  const [letterBuffer, setLetterBuffer] = useState([]);   // letters building current word
  const [wordBuffer, setWordBuffer]   = useState([]);     // confirmed words
  const [sentences, setSentences]     = useState([]);     // completed sentences
  const [currentWord, setCurrentWord] = useState('');
  const [lastConfirmed, setLastConfirmed] = useState(null);

  const wordTimerRef     = useRef(null);
  const sentenceTimerRef = useRef(null);
  const bottomRef        = useRef(null);

  // ── Seal current letters into a word ─────────────────────────────────────
  const sealWord = useCallback(() => {
    setLetterBuffer(prev => {
      if (prev.length === 0) return prev;
      const word = prev.join('').toLowerCase();
      setCurrentWord('');
      setWordBuffer(wb => {
        const next = [...wb, word];
        // Start sentence timer
        clearTimeout(sentenceTimerRef.current);
        sentenceTimerRef.current = setTimeout(() => {
          setWordBuffer(wb2 => {
            if (wb2.length === 0) return wb2;
            const sentence = wb2.join(' ');
            setSentences(s => [...s, { text: sentence, timestamp: Date.now() }]);
            return [];
          });
        }, SENTENCE_PAUSE_MS);
        return next;
      });
      return [];
    });
  }, []);

  // ── Handle a confirmed sign from the buffer ───────────────────────────────
  const handleConfirmed = useCallback((sign, isWordSign) => {
    setLastConfirmed(sign);

    if (isWordSign) {
      // Whole word sign — seal any pending letters first, then add the word
      sealWord();
      clearTimeout(sentenceTimerRef.current);
      const word = sign.toLowerCase();
      setWordBuffer(prev => {
        const next = [...prev, word];
        sentenceTimerRef.current = setTimeout(() => {
          setWordBuffer(wb => {
            if (wb.length === 0) return wb;
            const sentence = wb.join(' ');
            setSentences(s => [...s, { text: sentence, timestamp: Date.now() }]);
            return [];
          });
        }, SENTENCE_PAUSE_MS);
        return next;
      });
    } else {
      // Single letter — accumulate into word buffer
      setLetterBuffer(prev => {
        const next = [...prev, sign];
        setCurrentWord(next.join(''));
        return next;
      });

      // Reset word boundary timer
      clearTimeout(wordTimerRef.current);
      wordTimerRef.current = setTimeout(sealWord, WORD_PAUSE_MS);
    }
  }, [sealWord]);

  const { videoRef, canvasRef, isLoading, isReady, error, currentSign, progress } =
    useHandRecognition({ onConfirmed: handleConfirmed, enabled: active });

  const handleToggle = () => {
    if (active) {
      // Stop and clear
      setActive(false);
      clearTimeout(wordTimerRef.current);
      clearTimeout(sentenceTimerRef.current);
      setLetterBuffer([]);
      setWordBuffer([]);
      setCurrentWord('');
      setLastConfirmed(null);
    } else {
      setActive(true);
    }
  };

  const clearAll = () => {
    setSentences([]);
    setWordBuffer([]);
    setLetterBuffer([]);
    setCurrentWord('');
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [sentences]);

  useEffect(() => () => {
    clearTimeout(wordTimerRef.current);
    clearTimeout(sentenceTimerRef.current);
  }, []);

  // Progress ring for stability buffer
  const ringRadius = 18;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset = ringCircumference * (1 - progress);

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
          <span style={{ fontWeight: 700, fontSize: '13px', color: colors.text }}>Sign to Text</span>
          <span style={{
            fontSize: '10px', padding: '2px 8px', borderRadius: '20px',
            background: colors.accent + '22', color: colors.accentGlow,
            border: `1px solid ${colors.accent}33`, fontFamily: 'monospace',
          }}>
            {language.toUpperCase()}
          </span>
          {isReady && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: colors.live, animation: 'sPulse 1.4s infinite' }} />
              <span style={{ fontSize: '10px', color: colors.live, fontFamily: 'monospace' }}>TRACKING</span>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '6px' }}>
          {sentences.length > 0 && (
            <button onClick={clearAll} style={{
              padding: '4px 10px', borderRadius: '6px', cursor: 'pointer',
              fontSize: '10px', fontWeight: 700, border: `1px solid ${colors.border}`,
              background: 'transparent', color: colors.muted, fontFamily: 'monospace',
            }}>
              Clear
            </button>
          )}
          <button onClick={handleToggle} style={{
            padding: '5px 14px', borderRadius: '8px', cursor: 'pointer',
            fontSize: '11px', fontWeight: 700, border: 'none',
            background: active ? colors.danger + '22' : colors.accent,
            color: active ? colors.danger : '#fff',
            border: active ? `1px solid ${colors.danger}44` : 'none',
            transition: 'all 0.15s',
          }}>
            {active ? 'Stop' : 'Start'}
          </button>
        </div>
      </div>

      {/* ── Camera canvas ── */}
      <div style={{
        position: 'relative', width: '100%', background: '#000',
        flexShrink: 0, maxHeight: '220px', overflow: 'hidden',
      }}>
        <video ref={videoRef} style={{ display: 'none' }} playsInline muted />
        <canvas
          ref={canvasRef}
          width={640} height={480}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />

        {/* Not started */}
        {!active && !isLoading && (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: '10px',
            background: 'rgba(0,0,0,0.8)',
          }}>
            <span style={{ fontSize: '36px' }}>👋</span>
            <span style={{ fontSize: '12px', color: colors.muted }}>Press Start to begin hand tracking</span>
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: '14px',
            background: 'rgba(0,0,0,0.85)',
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              border: `2px solid ${colors.border}`, borderTopColor: colors.accent,
              animation: 'sRotate 0.8s linear infinite',
            }} />
            <span style={{ fontSize: '12px', color: colors.muted }}>Loading hand tracking...</span>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
            justifyContent: 'center', background: 'rgba(0,0,0,0.85)', padding: '20px',
          }}>
            <span style={{ fontSize: '12px', color: colors.danger, textAlign: 'center' }}>{error}</span>
          </div>
        )}

        {/* Live sign badge + progress ring */}
        {isReady && currentSign && (
          <div style={{
            position: 'absolute', top: '10px', right: '10px',
            display: 'flex', alignItems: 'center', gap: '8px',
          }}>
            {/* Progress ring */}
            <svg width={44} height={44} style={{ transform: 'rotate(-90deg)' }}>
              <circle cx={22} cy={22} r={ringRadius} fill="none" stroke={colors.border} strokeWidth={3} />
              <circle
                cx={22} cy={22} r={ringRadius}
                fill="none" stroke={colors.accent} strokeWidth={3}
                strokeDasharray={ringCircumference}
                strokeDashoffset={ringOffset}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 0.1s linear' }}
              />
              <text
                x={22} y={22}
                textAnchor="middle" dominantBaseline="central"
                fill={colors.text} fontSize={14} fontWeight={800}
                fontFamily="monospace"
                style={{ transform: 'rotate(90deg)', transformOrigin: '22px 22px' }}
              >
                {currentSign}
              </text>
            </svg>
          </div>
        )}

        {/* Mode label */}
        {isReady && (
          <div style={{
            position: 'absolute', bottom: '8px', left: '10px',
            background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)',
            borderRadius: '6px', padding: '3px 10px',
          }}>
            <span style={{ fontSize: '9px', color: colors.accentGlow, fontFamily: 'monospace' }}>
              FINGERSPELLING + WORD SIGNS
            </span>
          </div>
        )}
      </div>

      {/* ── Live buffer ── */}
      <div style={{
        padding: '10px 14px', borderTop: `1px solid ${colors.border}`,
        borderBottom: `1px solid ${colors.border}`, flexShrink: 0, minHeight: '50px',
        display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap',
      }}>
        {/* Current word being spelled */}
        {currentWord && (
          <span style={{
            fontSize: '22px', fontWeight: 800, color: colors.accent,
            fontFamily: 'monospace', letterSpacing: '4px', textTransform: 'uppercase',
          }}>
            {currentWord}
            <span style={{
              display: 'inline-block', width: 2, height: 20, background: colors.accent,
              marginLeft: 4, verticalAlign: 'middle', animation: 'sBlink 0.8s step-end infinite',
            }} />
          </span>
        )}

        {/* Confirmed words */}
        {wordBuffer.map((w, i) => (
          <span key={i} style={{
            padding: '3px 10px', borderRadius: '20px', fontSize: '12px',
            background: colors.live + '22', color: colors.live,
            border: `1px solid ${colors.live}44`, fontFamily: 'monospace',
          }}>
            {w}
          </span>
        ))}

        {/* Empty */}
        {!currentWord && wordBuffer.length === 0 && (
          <span style={{ fontSize: '12px', color: colors.muted }}>
            {isReady ? 'Hold each letter steady for ~0.5s' : 'Press Start to begin'}
          </span>
        )}
      </div>

      {/* ── Completed sentences ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {sentences.length === 0 && (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', height: '100%', gap: '10px', color: colors.muted,
          }}>
            <span style={{ fontSize: '28px' }}>🤟</span>
            <p style={{ margin: 0, fontSize: '12px', textAlign: 'center', lineHeight: 1.6 }}>
              Sentences appear here after a pause.<br />
              Pause 1.5s between words, 3.5s to send.
            </p>
          </div>
        )}

        {sentences.map((s, i) => (
          <div key={i} style={{
            background: colors.bg, border: `1px solid ${colors.border}`,
            borderRadius: '10px', padding: '10px 14px',
          }}>
            <p style={{ margin: 0, color: colors.text, fontSize: '14px', lineHeight: 1.6 }}>
              {s.text}
            </p>
            <span style={{ fontSize: '10px', color: colors.muted, fontFamily: 'monospace' }}>
              {new Date(s.timestamp).toLocaleTimeString()}
            </span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <style>{`
        @keyframes sPulse  { 0%,100%{opacity:1}50%{opacity:0.4} }
        @keyframes sRotate { to{transform:rotate(360deg)} }
        @keyframes sBlink  { 0%,100%{opacity:1}50%{opacity:0} }
      `}</style>
    </div>
  );
}