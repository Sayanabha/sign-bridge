import { useState } from 'react';
import { useSession } from './hooks/useSession';
import LanguageSelector from './components/LanguageSelector';
import CaptionDisplay from './components/CaptionDisplay';
import SignPlayer from './components/SignPlayer';
import WebcamPanel from './components/WebcamPanel';
import Toolbar from './components/Toolbar';
import OnboardingModal from './components/OnboardingModal';
import DictionaryBrowser from './components/DictionaryBrowser';
import SessionExport from './components/SessionExport';
import QRShare from './components/QRShare';

/* ✅ NEW IMPORT */
import SignToText from './components/SignToText';

export default function App() {
  const session = useSession();

  const [showQR, setShowQR] = useState(false);

  const [showOnboarding, setShowOnboarding] = useState(true);
  const [showDictionary, setShowDictionary] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [presentationMode, setPresentationMode] = useState(false);
  const [showWebcam, setShowWebcam] = useState(true);
  const [showCaptions, setShowCaptions] = useState(true);
  const [signSpeed, setSignSpeed] = useState(1);
  const [signSize, setSignSize] = useState(1);
  const [theme, setTheme] = useState('dark');

  /* ✅ NEW STATE */
  const [appMode, setAppMode] = useState('interpret'); // 'interpret' | 'sign'

  const colors = getThemeColors(theme);
  const visibleCount = [showWebcam, showCaptions, true].filter(Boolean).length;

  const gridCols = presentationMode
    ? '1fr 1fr'
    : visibleCount === 3
    ? '1fr 1fr 1fr'
    : visibleCount === 2
    ? '1fr 1fr'
    : '1fr';

  return (
    <div style={{ minHeight: '100vh', background: colors.bg, color: colors.text, fontFamily: 'sans-serif' }}>

      {showOnboarding && (
        <OnboardingModal
          colors={colors}
          onClose={() => setShowOnboarding(false)}
          language={session.language}
          onSetLanguage={session.setLanguage}
        />
      )}

      {showDictionary && (
        <DictionaryBrowser
          colors={colors}
          language={session.language}
          signSpeed={signSpeed}
          signSize={signSize}
          onClose={() => setShowDictionary(false)}
        />
      )}

      {showExport && (
        <SessionExport
          colors={colors}
          session={session}
          onClose={() => setShowExport(false)}
        />
      )}

      {/* Header */}
      {!presentationMode && (
        <div style={{ borderBottom: `1px solid ${colors.border}`, background: colors.surface, position: 'sticky', top: 0, zIndex: 40 }}>
          <div style={{
            maxWidth: '1400px',
            margin: '0 auto',
            padding: '12px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            flexWrap: 'wrap'
          }}>
            
            {/* LEFT */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '24px' }}>🤟</span>
              <div>
                <div style={{ fontSize: '17px', fontWeight: 800, color: colors.text }}>SignBridge</div>
                <div style={{
                  fontSize: '10px',
                  color: session.connected ? colors.live : colors.muted,
                  fontFamily: 'monospace'
                }}>
                  {session.connected ? '● Connected' : '○ Connecting...'}
                </div>
              </div>
            </div>

            {/* RIGHT */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>

              <LanguageSelector
                selected={session.language}
                onChange={session.setLanguage}
                disabled={session.isListening}
                colors={colors}
              />

              {/* ✅ MODE TOGGLE (NEW) */}
              <div style={{ display: 'flex', gap: '4px', background: colors.bg, borderRadius: '10px', padding: '4px' }}>
                {[{ id: 'interpret', label: 'Speech → Sign' }, { id: 'sign', label: 'Sign → Text' }].map(m => (
                  <button
                    key={m.id}
                    onClick={() => setAppMode(m.id)}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: 700,
                      border: 'none',
                      background: appMode === m.id ? colors.accent : 'transparent',
                      color: appMode === m.id ? '#fff' : colors.muted,
                      transition: 'all 0.15s',
                    }}
                  >
                    {m.label}
                  </button>
                ))}
              </div>

              {/* Share */}
              <button
                onClick={() => setShowQR(true)}
                style={{
                  padding: '10px 18px',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '13px',
                  border: `1px solid ${colors.border}`,
                  background: colors.panel,
                  color: colors.muted,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                Share
              </button>

              {/* Start / Stop */}
              <button
                onClick={session.isListening ? session.stopSession : session.startSession}
                style={{
                  padding: '10px 24px',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '13px',
                  background: session.isListening ? colors.danger + '22' : colors.accent,
                  color: session.isListening ? colors.danger : '#fff',
                  border: session.isListening ? `1px solid ${colors.danger}44` : 'none',
                  boxShadow: session.isListening ? 'none' : `0 0 20px ${colors.accent}44`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                {session.isListening
                  ? <><span style={{ width: 8, height: 8, borderRadius: '50%', background: colors.danger, display: 'inline-block', animation: 'pulse 1s infinite' }} /> Stop</>
                  : '▶ Start Interpreting'}
              </button>

            </div>
          </div>
        </div>
      )}

      {/* Toolbar */}
      {!presentationMode && (
        <Toolbar
          colors={colors}
          signSpeed={signSpeed} setSignSpeed={setSignSpeed}
          signSize={signSize} setSignSize={setSignSize}
          theme={theme} setTheme={setTheme}
          showWebcam={showWebcam} setShowWebcam={setShowWebcam}
          showCaptions={showCaptions} setShowCaptions={setShowCaptions}
          presentationMode={presentationMode} setPresentationMode={setPresentationMode}
          onShowDictionary={() => setShowDictionary(true)}
          onShowExport={() => setShowExport(true)}
          onHelp={() => setShowOnboarding(true)}
          session={session}
        />
      )}

      {/* Panels */}
      <div style={{ maxWidth: presentationMode ? '100%' : '1400px', margin: '0 auto', padding: presentationMode ? '0' : '24px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: gridCols,
          gap: presentationMode ? '0' : '20px',
          height: '580px'
        }}>

          {/* ✅ SWITCHED VIEW */}
          {appMode === 'interpret' ? (
            <>
              {showWebcam && (
                <WebcamPanel
                  colors={colors}
                  isListening={session.isListening}
                  topic={session.topic}
                  presentationMode={presentationMode}
                  onToggleOff={() => setShowWebcam(false)}
                />
              )}

              {showCaptions && (
                <CaptionDisplay
                  captions={session.captions}
                  interimText={session.interimText}
                  topic={session.topic}
                  isListening={session.isListening}
                  confidence={session.confidence}
                  colors={colors}
                  presentationMode={presentationMode}
                  onToggleOff={() => setShowCaptions(false)}
                />
              )}

              <SignPlayer
                signQueue={session.signQueue}
                language={session.language}
                isProcessing={session.isProcessing}
                speed={signSpeed}
                size={signSize}
                colors={colors}
                coverage={session.coverage}
                presentationMode={presentationMode}
              />
            </>
          ) : (
            <SignToText
              colors={colors}
              language={session.language}
            />
          )}

        </div>
      </div>

      {showQR && (
        <QRShare
          colors={colors}
          isListening={session.isListening}
          onClose={() => setShowQR(false)}
        />
      )}

      <style>{`@keyframes pulse { 0%,100%{opacity:1}50%{opacity:0.4} } *{box-sizing:border-box}`}</style>
    </div>
  );
}

/* unchanged helpers */
function restoreStyle(colors) {
  return {
    padding: '8px 16px',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: 700,
    border: `1px solid ${colors.border}`,
    background: colors.panel,
    color: colors.muted,
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  };
}

export function getThemeColors(theme) {
  if (theme === 'contrast') return {
    bg: '#000', surface: '#0A0A0A', panel: '#111',
    border: '#ffffff33', text: '#FFF', muted: '#AAA',
    accent: '#FFFF00', accentGlow: '#FFFF00', live: '#00FF00', danger: '#FF4444',
  };
  if (theme === 'colorblind') return {
    bg: '#0A0A14', surface: '#111120', panel: '#1A1A2E',
    border: '#2A2A48', text: '#E8E6FF', muted: '#6B6BA0',
    accent: '#0096FF', accentGlow: '#60BBFF', live: '#FF6B00', danger: '#FF6B00',
  };
  return {
    bg: '#0A0A0F', surface: '#111118', panel: '#1A1A24',
    border: '#2A2A38', text: '#E8E6FF', muted: '#6B6B8A',
    accent: '#7C6AF7', accentGlow: '#A89BFA', live: '#22C55E', danger: '#EF4444',
  };
}