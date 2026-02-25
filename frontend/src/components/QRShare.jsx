import { useState, useEffect } from 'react';
import { QRCodeSVG as QRCode } from 'qrcode.react';
const API_BASE = 'http://localhost:3001';

export default function QRShare({ colors, isListening, onClose }) {
  const [viewerUrl, setViewerUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewerCount, setViewerCount] = useState(0);
  const [copied, setCopied] = useState(false);

useEffect(() => {
  fetch(`${API_BASE}/api/viewer-url`)
    .then(r => r.json())
    .then(data => {
      // Use the IP the backend detected, not localhost
      setViewerUrl(data.url);
      setLoading(false);
      console.log('[QR] Viewer URL:', data.url);
    })
    .catch(() => {
      // Fallback: build URL from current window location hostname
      const host = window.location.hostname;
      setViewerUrl(`http://${host}:3001/view`);
      setLoading(false);
    });
}, []);

  // Poll viewer count every 3s
  useEffect(() => {
    const interval = setInterval(() => {
      fetch(`${API_BASE}/api/viewer-count`)
        .then(r => r.json())
        .then(data => setViewerCount(data.count || 0))
        .catch(() => {});
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const copyUrl = () => {
    navigator.clipboard.writeText(viewerUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px',
    }}>
      <div style={{
        background: colors.panel,
        border: `1px solid ${colors.border}`,
        borderRadius: '24px',
        padding: '36px',
        maxWidth: '420px', width: '100%',
        boxShadow: `0 0 80px ${colors.accent}22`,
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px',
      }}>

        {/* Header */}
        <div style={{ width: '100%', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: colors.text, margin: 0 }}>
              Share with Audience
            </h2>
            <p style={{ fontSize: '13px', color: colors.muted, margin: '4px 0 0', lineHeight: 1.5 }}>
              Scan to follow live captions and signs on any phone
            </p>
          </div>
          <button onClick={onClose} style={{
            background: 'none', border: `1px solid ${colors.border}`,
            borderRadius: '8px', padding: '5px 10px', cursor: 'pointer',
            color: colors.muted, fontSize: '12px', flexShrink: 0,
          }}>
            ✕
          </button>
        </div>

        {/* QR Code */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: '16px',
          padding: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: `0 0 40px ${colors.accent}33`,
          position: 'relative',
        }}>
          {loading ? (
            <div style={{ width: 200, height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: 32, height: 32, border: `2px solid #eee`, borderTopColor: colors.accent, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            </div>
          ) : (
            <QRCode
              value={viewerUrl}
              size={200}
              bgColor="#FFFFFF"
              fgColor="#0A0A0F"
              level="M"
              includeMargin={false}
            />
          )}

          {/* Live indicator on QR */}
          {isListening && (
            <div style={{
              position: 'absolute', bottom: -10, left: '50%', transform: 'translateX(-50%)',
              background: colors.live, borderRadius: '20px',
              padding: '3px 12px', display: 'flex', alignItems: 'center', gap: '5px',
              border: `2px solid ${colors.panel}`,
            }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#fff', animation: 'pulse 1s infinite' }} />
              <span style={{ fontSize: '10px', fontWeight: 700, color: '#fff', fontFamily: 'monospace' }}>LIVE NOW</span>
            </div>
          )}
        </div>

        {/* Viewer count */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '8px 20px', borderRadius: '20px',
          background: viewerCount > 0 ? colors.live + '18' : colors.bg,
          border: `1px solid ${viewerCount > 0 ? colors.live + '44' : colors.border}`,
          transition: 'all 0.3s ease',
        }}>
          <span style={{ fontSize: '18px', fontWeight: 800, color: viewerCount > 0 ? colors.live : colors.muted }}>
            {viewerCount}
          </span>
          <span style={{ fontSize: '12px', color: viewerCount > 0 ? colors.live : colors.muted, fontFamily: 'monospace' }}>
            {viewerCount === 1 ? 'viewer connected' : 'viewers connected'}
          </span>
        </div>

        {/* URL + copy button */}
        {viewerUrl && (
          <div style={{ width: '100%', display: 'flex', gap: '8px' }}>
            <div style={{
              flex: 1, padding: '10px 14px', borderRadius: '10px',
              background: colors.bg, border: `1px solid ${colors.border}`,
              fontSize: '11px', color: colors.muted, fontFamily: 'monospace',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {viewerUrl}
            </div>
            <button onClick={copyUrl} style={{
              padding: '10px 16px', borderRadius: '10px', cursor: 'pointer',
              fontSize: '11px', fontWeight: 700, border: 'none', flexShrink: 0,
              background: copied ? colors.live : colors.accent,
              color: '#fff', transition: 'all 0.2s', fontFamily: 'monospace',
            }}>
              {copied ? '✓ Copied' : 'Copy'}
            </button>
          </div>
        )}

        {/* Instructions */}
        <div style={{
          width: '100%', borderRadius: '12px',
          background: colors.bg, border: `1px solid ${colors.border}`,
          padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '8px',
        }}>
          {[
            { n: '1', t: 'Audience opens camera app on their phone' },
            { n: '2', t: 'Point at the QR code — link opens automatically' },
            { n: '3', t: 'Live captions and signs stream to their screen' },
          ].map(step => (
            <div key={step.n} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
              <span style={{
                width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                background: colors.accent + '22', color: colors.accent,
                fontSize: '10px', fontWeight: 800, fontFamily: 'monospace',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: `1px solid ${colors.accent}44`,
              }}>
                {step.n}
              </span>
              <span style={{ fontSize: '12px', color: colors.muted, lineHeight: 1.5 }}>
                {step.t}
              </span>
            </div>
          ))}
        </div>

        {/* Note about WiFi */}
        <p style={{ fontSize: '11px', color: colors.muted, textAlign: 'center', lineHeight: 1.6, margin: 0 }}>
          All devices must be on the same WiFi network.
          <br />The QR link uses your local IP address, not the internet.
        </p>
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1}50%{opacity:0.4} }
        @keyframes spin { to{transform:rotate(360deg)} }
      `}</style>
    </div>
  );
}