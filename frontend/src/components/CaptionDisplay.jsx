import { useEffect, useRef } from 'react';

export default function CaptionDisplay({
  captions, interimText, topic, isListening,
  confidence, colors, presentationMode, onToggleOff,
}) {
  const rawBottomRef = useRef(null);
  const cleanBottomRef = useRef(null);

  // Separate raw and cleaned captions
  const rawCaptions = captions.filter(c => c.type === 'raw' || !c.type);
  const cleanedCaptions = captions.filter(c => c.type === 'cleaned');

  useEffect(() => {
    rawBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [captions, interimText]);

  useEffect(() => {
    cleanBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [captions]);

  const panelStyle = {
    display: 'flex', flexDirection: 'column', height: '100%',
    background: colors.panel, border: `1px solid ${colors.border}`,
    borderRadius: presentationMode ? '0' : '16px', overflow: 'hidden',
  };

  const columnStyle = {
    flex: 1, overflowY: 'auto', padding: '14px',
    display: 'flex', flexDirection: 'column', gap: '8px',
  };

  const emptyState = (label) => (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', height: '100%', gap: '8px', color: colors.muted,
    }}>
      <span style={{ fontSize: '22px' }}>{label === 'raw' ? '🎙️' : '✦'}</span>
      <p style={{ margin: 0, fontSize: '12px', textAlign: 'center', lineHeight: 1.6 }}>
        {isListening
          ? label === 'raw' ? 'Listening...' : 'Waiting for speech...'
          : 'Press Start to begin'}
      </p>
    </div>
  );

  return (
    <div style={panelStyle}>

      {/* ── Header ── */}
      <div style={{
        padding: '10px 14px', borderBottom: `1px solid ${colors.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontWeight: 700, fontSize: '13px', color: colors.text }}>Captions</span>
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
        {!presentationMode && onToggleOff && (
          <button
            onClick={onToggleOff}
            style={{
              background: 'none', border: `1px solid ${colors.border}`,
              borderRadius: '6px', padding: '3px 8px', cursor: 'pointer',
              color: colors.muted, fontSize: '11px', fontWeight: 600,
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = colors.danger; e.currentTarget.style.color = colors.danger; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = colors.border; e.currentTarget.style.color = colors.muted; }}
          >
            ✕ Hide
          </button>
        )}
      </div>

      {/* ── Column headers ── */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr',
        borderBottom: `1px solid ${colors.border}`, flexShrink: 0,
      }}>
        <div style={{
          padding: '6px 14px', borderRight: `1px solid ${colors.border}`,
          display: 'flex', alignItems: 'center', gap: '6px',
        }}>
          <span style={{ fontSize: '9px', fontFamily: 'monospace', color: colors.muted, letterSpacing: '1px' }}>
            RAW TRANSCRIPT
          </span>
          <span style={{ fontSize: '9px', color: colors.muted, fontFamily: 'monospace' }}>
            (Whisper)
          </span>
        </div>
        <div style={{
          padding: '6px 14px',
          display: 'flex', alignItems: 'center', gap: '6px',
        }}>
          <span style={{ fontSize: '9px', fontFamily: 'monospace', color: colors.accentGlow, letterSpacing: '1px' }}>
            CLEANED
          </span>
          <span style={{ fontSize: '9px', color: colors.muted, fontFamily: 'monospace' }}>
            (Sign grammar)
          </span>
        </div>
      </div>

      {/* ── Two columns ── */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: 0 }}>

        {/* Raw column */}
        <div style={{ ...columnStyle, borderRight: `1px solid ${colors.border}` }}>
          {rawCaptions.length === 0 && !interimText ? emptyState('raw') : (
            <>
              {rawCaptions.map((c, i) => (
                <div key={c.id || i} style={{
                  background: colors.bg,
                  border: `1px solid ${colors.border}`,
                  borderRadius: '8px', padding: '8px 10px',
                }}>
                  <p style={{
                    margin: 0, color: colors.text,
                    fontSize: presentationMode ? '16px' : '13px',
                    lineHeight: 1.6,
                  }}>
                    {c.text}
                  </p>
                  <span style={{ fontSize: '10px', color: colors.muted, fontFamily: 'monospace' }}>
                    {new Date(c.timestamp || Date.now()).toLocaleTimeString()}
                  </span>
                </div>
              ))}

              {/* Interim text */}
              {interimText && (
                <div style={{
                  background: colors.accent + '10',
                  border: `1px solid ${colors.accent}30`,
                  borderRadius: '8px', padding: '8px 10px',
                }}>
                  <p style={{ margin: 0, color: colors.accentGlow, fontSize: '13px', fontStyle: 'italic' }}>
                    {interimText}
                    <span style={{
                      display: 'inline-block', width: 2, height: 12,
                      background: colors.accent, marginLeft: 3,
                      verticalAlign: 'middle', animation: 'blink 1s step-end infinite',
                    }} />
                  </p>
                </div>
              )}
              <div ref={rawBottomRef} />
            </>
          )}
        </div>

        {/* Cleaned column */}
        <div style={columnStyle}>
          {cleanedCaptions.length === 0 ? emptyState('cleaned') : (
            <>
              {cleanedCaptions.map((c, i) => (
                <div key={c.id || i} style={{
                  background: colors.accent + '08',
                  border: `1px solid ${colors.accent}22`,
                  borderRadius: '8px', padding: '8px 10px',
                }}>
                  <p style={{
                    margin: 0, color: colors.text,
                    fontSize: presentationMode ? '16px' : '13px',
                    lineHeight: 1.6,
                  }}>
                    {c.text}
                  </p>
                  <div style={{ display: 'flex', gap: '6px', marginTop: '3px', alignItems: 'center' }}>
                    <span style={{ fontSize: '10px', color: colors.muted, fontFamily: 'monospace' }}>
                      {new Date(c.timestamp || Date.now()).toLocaleTimeString()}
                    </span>
                    {c.topic && (
                      <span style={{ fontSize: '9px', color: colors.accentGlow, fontFamily: 'monospace' }}>
                        {c.topic}
                      </span>
                    )}
                  </div>
                </div>
              ))}
              <div ref={cleanBottomRef} />
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes blink { 0%,100%{opacity:1}50%{opacity:0} }
        @keyframes livePulse { 0%,100%{opacity:1}50%{opacity:0.4} }
      `}</style>
    </div>
  );
}