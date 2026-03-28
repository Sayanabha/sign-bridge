// 📄 frontend/src/components/Toolbar.jsx  — REPLACE ENTIRE FILE
export default function Toolbar({
  colors, signSpeed, setSignSpeed, signSize, setSignSize,
  theme, setTheme, showWebcam, setShowWebcam,
  showCaptions, setShowCaptions,
  presentationMode, setPresentationMode,
  onShowDictionary, onShowExport, onHelp, session,
}) {
  const toggleBtn = (active, label, onClick, activeColor) => (
    <button onClick={onClick} style={{
      padding: '5px 12px', borderRadius: '8px', cursor: 'pointer',
      fontSize: '11px', fontWeight: 700, fontFamily: 'monospace', border: '1px solid',
      background: active ? (activeColor || colors.accent) + '22' : 'transparent',
      color: active ? (activeColor || colors.accent) : colors.muted,
      borderColor: active ? (activeColor || colors.accent) + '55' : colors.border,
      transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: '5px',
    }}>
      {label}
    </button>
  );

  return (
    <div style={{ background: colors.surface, borderBottom: `1px solid ${colors.border}`, padding: '8px 24px' }}>
      <div style={{ maxWidth: '1600px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>

        {/* Panel toggles */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '10px', color: colors.muted, fontFamily: 'monospace', marginRight: '2px' }}>PANELS</span>
          {toggleBtn(showWebcam, '📷 Webcam', () => setShowWebcam(!showWebcam))}
          {toggleBtn(showCaptions, '💬 Captions', () => setShowCaptions(!showCaptions))}
        </div>

        <div style={{ width: '1px', height: '20px', background: colors.border }} />

        {/* Sign speed */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '10px', color: colors.muted, fontFamily: 'monospace' }}>SPEED</span>
          <input type="range" min="0.5" max="2" step="0.25" value={signSpeed}
            onChange={e => setSignSpeed(parseFloat(e.target.value))}
            style={{ width: '70px', accentColor: colors.accent }} />
          <span style={{ fontSize: '11px', color: colors.accent, fontFamily: 'monospace', minWidth: '28px' }}>{signSpeed}x</span>
        </div>

        {/* Sign size */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '10px', color: colors.muted, fontFamily: 'monospace' }}>SIZE</span>
          <input type="range" min="0.6" max="1.8" step="0.2" value={signSize}
            onChange={e => setSignSize(parseFloat(e.target.value))}
            style={{ width: '70px', accentColor: colors.accent }} />
          <span style={{ fontSize: '11px', color: colors.accent, fontFamily: 'monospace', minWidth: '28px' }}>{signSize}x</span>
        </div>

        <div style={{ width: '1px', height: '20px', background: colors.border }} />

        {/* Theme */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '10px', color: colors.muted, fontFamily: 'monospace' }}>THEME</span>
          {toggleBtn(theme === 'dark', '🌙 Dark', () => setTheme('dark'))}
          {toggleBtn(theme === 'contrast', '⬛ Contrast', () => setTheme('contrast'))}
          {toggleBtn(theme === 'colorblind', '🔵 CB', () => setTheme('colorblind'))}
        </div>

        <div style={{ flex: 1 }} />

        {/* Actions */}
        <div style={{ display: 'flex', gap: '6px' }}>
          {toggleBtn(false, '📖 Dictionary', onShowDictionary)}
          <button onClick={onShowExport} disabled={session.captions.length === 0} style={{
            padding: '5px 12px', borderRadius: '8px',
            cursor: session.captions.length > 0 ? 'pointer' : 'not-allowed',
            fontSize: '11px', fontWeight: 700, fontFamily: 'monospace',
            border: `1px solid ${colors.live}44`,
            background: colors.live + '18', color: colors.live,
            opacity: session.captions.length === 0 ? 0.4 : 1,
            transition: 'all 0.15s',
          }}>
            ⬇️ Export
          </button>
          {toggleBtn(false, '❓ Help', onHelp)}
        </div>

        {session.segmentsProcessed > 0 && (
          <div style={{ display: 'flex', gap: '10px', paddingLeft: '8px', borderLeft: `1px solid ${colors.border}` }}>
            <span style={{ fontSize: '10px', color: colors.muted, fontFamily: 'monospace' }}>{session.segmentsProcessed} segs</span>
            <span style={{ fontSize: '10px', fontFamily: 'monospace', color: session.coverage > 60 ? colors.live : '#F59E0B' }}>{session.coverage}% signed</span>
          </div>
        )}
      </div>
    </div>
  );
}