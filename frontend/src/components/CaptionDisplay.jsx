import { useEffect, useRef } from 'react';

export default function CaptionDisplay({
  captions, interimText, topic, isListening,
  confidence, colors, presentationMode, onToggleOff,
}) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [captions, interimText]);

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%',
      background: colors.panel, border: `1px solid ${colors.border}`,
      borderRadius: presentationMode ? '0' : '16px', overflow: 'hidden',
    }}>
      {/* Header with toggle off button */}
      <div style={{
        padding: '10px 14px', borderBottom: `1px solid ${colors.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '13px' }}>💬</span>
          <span style={{ fontWeight: 700, fontSize: '13px', color: colors.text }}>Live Captions</span>
          {topic && (
            <span style={{
              padding: '2px 8px', borderRadius: '20px', fontSize: '10px',
              background: colors.accent + '22', color: colors.accentGlow,
              border: `1px solid ${colors.accent}33`, fontFamily: 'monospace',
            }}>
              {topic}
            </span>
          )}
          {isListening && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: colors.live, animation: 'livePulse 1.4s infinite' }} />
              <span style={{ fontSize: '10px', color: colors.live, fontFamily: 'monospace' }}>LIVE</span>
            </div>
          )}
        </div>

        {/* Toggle off button */}
        {!presentationMode && (
          <button
            onClick={onToggleOff}
            title="Hide captions"
            style={{
              background: 'none', border: `1px solid ${colors.border}`,
              borderRadius: '6px', padding: '3px 8px', cursor: 'pointer',
              color: colors.muted, fontSize: '11px', fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: '4px',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = colors.danger; e.currentTarget.style.color = colors.danger; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = colors.border; e.currentTarget.style.color = colors.muted; }}
          >
            ✕ Hide
          </button>
        )}
      </div>

      {/* Confidence bar */}
      {confidence > 0 && (
        <div style={{ padding: '6px 14px', borderBottom: `1px solid ${colors.border}`, flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
            <span style={{ fontSize: '9px', color: colors.muted, fontFamily: 'monospace' }}>GEMINI CONFIDENCE</span>
            <span style={{ fontSize: '9px', color: confidence > 0.7 ? colors.live : '#F59E0B', fontFamily: 'monospace' }}>
              {Math.round(confidence * 100)}%
            </span>
          </div>
          <div style={{ height: '3px', background: colors.border, borderRadius: '2px' }}>
            <div style={{
              height: '100%', borderRadius: '2px', transition: 'width 0.5s ease',
              width: `${confidence * 100}%`,
              background: confidence > 0.7 ? colors.live : '#F59E0B',
            }} />
          </div>
        </div>
      )}

      {/* Scrollable captions */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {captions.length === 0 && !interimText && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '10px', color: colors.muted }}>
            <span style={{ fontSize: '28px' }}>🎙️</span>
            <p style={{ margin: 0, fontSize: '13px', textAlign: 'center' }}>
              {isListening ? 'Speak now — captions will appear here' : 'Press Start to begin'}
            </p>
          </div>
        )}

        {captions.map((c, i) => (
          <div key={c.id || i} style={{
            background: c.cleaned ? colors.bg : colors.accent + '08',
            border: `1px solid ${c.cleaned ? colors.border : colors.accent + '22'}`,
            borderRadius: '10px', padding: '10px 14px',
            transition: 'all 0.3s ease',
          }}>
            <p style={{
              margin: 0, color: colors.text,
              fontSize: presentationMode ? '18px' : '14px',
              lineHeight: 1.6,
            }}>
              {c.text}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
              <span style={{ fontSize: '10px', color: colors.muted, fontFamily: 'monospace' }}>
                {new Date(c.timestamp || Date.now()).toLocaleTimeString()}
              </span>
              {c.cleaned && (
                <span style={{ fontSize: '9px', color: colors.live, fontFamily: 'monospace' }}>✓ cleaned</span>
              )}
            </div>
          </div>
        ))}

        {/* Interim live text */}
        {interimText && (
          <div style={{
            background: colors.accent + '10', border: `1px solid ${colors.accent}30`,
            borderRadius: '10px', padding: '10px 14px',
          }}>
            <p style={{ margin: 0, color: colors.accentGlow, fontSize: '14px', fontStyle: 'italic', lineHeight: 1.6 }}>
              {interimText}
              <span style={{
                display: 'inline-block', width: 2, height: 14,
                background: colors.accent, marginLeft: 2,
                verticalAlign: 'middle', animation: 'blink 1s step-end infinite',
              }} />
            </p>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <style>{`
        @keyframes blink { 0%,100%{opacity:1}50%{opacity:0} }
        @keyframes livePulse { 0%,100%{opacity:1}50%{opacity:0.4} }
      `}</style>
    </div>
  );
}