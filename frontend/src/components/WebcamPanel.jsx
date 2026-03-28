// 📄 frontend/src/components/WebcamPanel.jsx  — REPLACE ENTIRE FILE
import { useEffect, useRef, useState } from 'react';

export default function WebcamPanel({ colors, isListening, topic, presentationMode, onToggleOff }) {
  const videoRef = useRef(null);
  const [hasCamera, setHasCamera] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let stream;
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false })
      .then(s => {
        stream = s;
        if (videoRef.current) {
          videoRef.current.srcObject = s;
          videoRef.current.play();
        }
        setHasCamera(true);
      })
      .catch(err => {
        setError('Camera unavailable');
        console.warn('[Webcam]', err.message);
      });
    return () => stream?.getTracks().forEach(t => t.stop());
  }, []);

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%',
      background: colors.panel, border: `1px solid ${colors.border}`,
      borderRadius: presentationMode ? '0' : '16px', overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '10px 14px', borderBottom: `1px solid ${colors.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontWeight: 700, fontSize: '13px', color: colors.text }}>Webcam</span>
          {isListening && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: colors.danger, animation: 'wPulse 1s infinite' }} />
              <span style={{ fontSize: '10px', color: colors.danger, fontFamily: 'monospace' }}>LIVE</span>
            </div>
          )}
        </div>
        {!presentationMode && (
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

      {/* Video */}
      <div style={{ flex: 1, position: 'relative', background: '#000', minHeight: 0 }}>
        {hasCamera ? (
          <video
            ref={videoRef} muted playsInline
            style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }}
          />
        ) : (
          <div style={{
            width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: '10px', color: colors.muted,
          }}>
            <span style={{ fontSize: '32px' }}>📷</span>
            <span style={{ fontSize: '12px' }}>{error || 'Loading camera...'}</span>
          </div>
        )}

        {topic && (
          <div style={{
            position: 'absolute', bottom: '12px', left: '12px', right: '12px',
            background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)',
            borderRadius: '8px', padding: '6px 12px',
            display: 'flex', alignItems: 'center', gap: '6px',
          }}>
            <span style={{ fontSize: '9px', color: colors.accentGlow, fontFamily: 'monospace' }}>TOPIC</span>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#fff' }}>{topic}</span>
          </div>
        )}
      </div>
      <style>{`@keyframes wPulse { 0%,100%{opacity:1}50%{opacity:0.4} }`}</style>
    </div>
  );
}