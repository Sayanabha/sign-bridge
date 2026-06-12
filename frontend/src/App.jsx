// 📄 frontend/src/App.jsx
import { useState } from 'react';
import { useSession } from './hooks/useSession';
import LanguageSelector from './components/LanguageSelector';
import CaptionDisplay from './components/CaptionDisplay';
import SignPlayer from './components/SignPlayer';
import AvatarSignPlayer from './components/AvatarSignPlayer';
import WebcamPanel from './components/WebcamPanel';
import Toolbar from './components/Toolbar';
import OnboardingModal from './components/OnboardingModal';
import DictionaryBrowser from './components/DictionaryBrowser';
import SessionExport from './components/SessionExport';
import QRShare from './components/QRShare';
import SignToText from './components/SignToText';
import FingerDrawPanel from './components/FingerDrawPanel';

export default function App() {
  const session = useSession();

  // Modals
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [showDictionary, setShowDictionary] = useState(false);
  const [showExport, setShowExport]         = useState(false);
  const [showQR, setShowQR]                 = useState(false);

  // App mode
  const [appMode, setAppMode] = useState('interpret');

  // Panel toggles (interpret mode)
  const [showWebcam, setShowWebcam]     = useState(true);
  const [showCaptions, setShowCaptions] = useState(true);

  // Sign player settings
  const [signSpeed, setSignSpeed]   = useState(1);
  const [signSize, setSignSize]     = useState(1);
  const [theme, setTheme]           = useState('dark');
  const [use3D, setUse3D]           = useState(false); // ← default SVG, toggle to 3D

  const colors = getThemeColors(theme);

  const visibleCount  = [showWebcam, showCaptions, true].filter(Boolean).length;
  const interpretCols = visibleCount === 3 ? '1fr 1fr 1fr'
    : visibleCount === 2 ? '1fr 1fr' : '1fr';

  // ── Sign player — SVG by default, 3D if toggled ───────────────────────────
  const SignPlayerComponent = use3D ? AvatarSignPlayer : SignPlayer;

  return (
    <div style={{ minHeight: '100vh', background: colors.bg, color: colors.text, fontFamily: 'sans-serif' }}>

      {/* ── Modals ── */}
      {showOnboarding && (
        <OnboardingModal colors={colors} onClose={() => setShowOnboarding(false)}
          language={session.language} onSetLanguage={session.setLanguage} />
      )}
      {showDictionary && (
        <DictionaryBrowser colors={colors} language={session.language}
          signSpeed={signSpeed} signSize={signSize} onClose={() => setShowDictionary(false)} />
      )}
      {showExport && (
        <SessionExport colors={colors} session={session} onClose={() => setShowExport(false)} />
      )}
      {showQR && (
        <QRShare colors={colors} isListening={session.isListening} onClose={() => setShowQR(false)} />
      )}

      {/* ── Header ── */}
      <div style={{
        borderBottom: `1px solid ${colors.border}`,
        background: colors.surface,
        position: 'sticky', top: 0, zIndex: 40,
      }}>
        <div style={{
          maxWidth: '1600px', margin: '0 auto',
          padding: '12px 24px',
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap',
        }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '22px' }}>🤟</span>
            <div>
              <div style={{ fontSize: '16px', fontWeight: 800, color: colors.text }}>SignBridge</div>
              <div style={{ fontSize: '10px', fontFamily: 'monospace', color: session.connected ? colors.live : colors.muted }}>
                {session.connected ? '● Connected' : '○ Connecting...'}
              </div>
            </div>
          </div>

          {/* Mode toggle */}
          <div style={{
            display: 'flex', gap: '3px',
            background: colors.bg, borderRadius: '10px', padding: '3px',
            border: `1px solid ${colors.border}`,
          }}>
            {[
              { id: 'interpret', label: 'Speech → Sign' },
              { id: 'dual',      label: 'Dual — Both'   },
              { id: 'draw',      label: '✍ Draw'        },
            ].map(m => (
              <button key={m.id} onClick={() => setAppMode(m.id)} style={{
                padding: '6px 14px', borderRadius: '8px', cursor: 'pointer',
                fontSize: '12px', fontWeight: 700, border: 'none',
                background: appMode === m.id ? colors.accent : 'transparent',
                color: appMode === m.id ? '#fff' : colors.muted,
                transition: 'all 0.15s',
              }}>
                {m.label}
              </button>
            ))}
          </div>

          {/* Right controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <LanguageSelector
              selected={session.language}
              onChange={session.setLanguage}
              disabled={session.isListening}
              colors={colors}
            />

            {/* 3D toggle — only shown in interpret/dual mode */}
            {appMode !== 'draw' && (
              <button
                onClick={() => setUse3D(!use3D)}
                title={use3D ? 'Switch to SVG signs' : 'Switch to 3D hand'}
                style={{
                  padding: '7px 14px', borderRadius: '10px', cursor: 'pointer',
                  fontWeight: 700, fontSize: '11px', fontFamily: 'monospace',
                  border: `1px solid ${use3D ? colors.accent + '66' : colors.border}`,
                  background: use3D ? colors.accent + '22' : colors.panel,
                  color: use3D ? colors.accent : colors.muted,
                  transition: 'all 0.15s',
                }}
              >
                {use3D ? '3D ✦' : 'SVG'}
              </button>
            )}

            <button onClick={() => setShowQR(true)} style={{
              padding: '9px 16px', borderRadius: '12px', cursor: 'pointer',
              fontWeight: 700, fontSize: '12px',
              border: `1px solid ${colors.border}`,
              background: colors.panel, color: colors.muted,
              transition: 'all 0.15s',
            }}>
              Share
            </button>

            {appMode === 'interpret' && (
              <button
                onClick={session.isListening ? session.stopSession : session.startSession}
                style={{
                  padding: '9px 22px', borderRadius: '12px', cursor: 'pointer',
                  fontWeight: 700, fontSize: '13px',
                  background: session.isListening ? colors.danger + '22' : colors.accent,
                  color: session.isListening ? colors.danger : '#fff',
                  border: session.isListening ? `1px solid ${colors.danger}44` : 'none',
                  boxShadow: session.isListening ? 'none' : `0 0 20px ${colors.accent}44`,
                  display: 'flex', alignItems: 'center', gap: '8px',
                  transition: 'all 0.15s',
                }}
              >
                {session.isListening ? (
                  <>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: colors.danger, display: 'inline-block', animation: 'pulse 1s infinite' }} />
                    Stop
                  </>
                ) : '▶ Start'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Toolbar (interpret mode only) ── */}
      {appMode === 'interpret' && (
        <Toolbar
          colors={colors}
          signSpeed={signSpeed} setSignSpeed={setSignSpeed}
          signSize={signSize} setSignSize={setSignSize}
          theme={theme} setTheme={setTheme}
          showWebcam={showWebcam} setShowWebcam={setShowWebcam}
          showCaptions={showCaptions} setShowCaptions={setShowCaptions}
          presentationMode={false} setPresentationMode={() => {}}
          onShowDictionary={() => setShowDictionary(true)}
          onShowExport={() => setShowExport(true)}
          onHelp={() => setShowOnboarding(true)}
          session={session}
        />
      )}

      {/* ── Main content ── */}
      <div style={{ maxWidth: '1600px', margin: '0 auto', padding: '20px 24px' }}>

        {/* ── INTERPRET MODE ── */}
        {appMode === 'interpret' && (
          <>
            <div style={{
              display: 'grid',
              gridTemplateColumns: interpretCols,
              gap: '20px', height: '580px',
              transition: 'grid-template-columns 0.3s ease',
            }}>
              {showWebcam && (
                <WebcamPanel
                  colors={colors} isListening={session.isListening}
                  topic={session.topic} presentationMode={false}
                  onToggleOff={() => setShowWebcam(false)}
                />
              )}
              {showCaptions && (
                <CaptionDisplay
                  captions={session.captions} interimText={session.interimText}
                  topic={session.topic} isListening={session.isListening}
                  confidence={session.confidence} colors={colors}
                  presentationMode={false} onToggleOff={() => setShowCaptions(false)}
                />
              )}
              <SignPlayerComponent
                signQueue={session.signQueue} language={session.language}
                isProcessing={session.isProcessing} speed={signSpeed}
                size={signSize} colors={colors}
                coverage={session.coverage} presentationMode={false}
              />
            </div>

            {(!showWebcam || !showCaptions) && (
              <div style={{ display: 'flex', gap: '10px', marginTop: '14px' }}>
                {!showWebcam && (
                  <button onClick={() => setShowWebcam(true)} style={restoreStyle(colors)}>
                    📷 Show Webcam
                  </button>
                )}
                {!showCaptions && (
                  <button onClick={() => setShowCaptions(true)} style={restoreStyle(colors)}>
                    💬 Show Captions
                  </button>
                )}
              </div>
            )}
          </>
        )}

        {/* ── DUAL MODE ── */}
        {appMode === 'dual' && (
          <DualLayout
            colors={colors}
            session={session}
            signSpeed={signSpeed}
            signSize={signSize}
            SignPlayerComponent={SignPlayerComponent}
          />
        )}

        {/* ── DRAW MODE ── */}
        {appMode === 'draw' && (
          <div style={{ height: '580px' }}>
            <FingerDrawPanel
              colors={colors}
              language={session.language}
              socket={session.socket}
            />
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1}50%{opacity:0.4} }
        * { box-sizing: border-box; }
      `}</style>
    </div>
  );
}

// ── Dual Layout ───────────────────────────────────────────────────────────────

function DualLayout({ colors, session, signSpeed, signSize, SignPlayerComponent }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <PersonLabel colors={colors} label="Hearing Person"
          sub="Speaking — signs shown to sign language user"
          accent={colors.accent} icon="🎙️" />
        <PersonLabel colors={colors} label="Sign Language User"
          sub="Signing or drawing — text shown to hearing person"
          accent={colors.live} icon="🤟" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', alignItems: 'start' }}>

        {/* LEFT: Hearing person */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{
            background: colors.panel, border: `1px solid ${colors.border}`,
            borderRadius: '14px', padding: '12px 16px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span style={{ fontSize: '12px', color: colors.muted }}>
              {session.isListening ? 'Listening to speech...' : 'Press Start to begin speaking'}
            </span>
            <button
              onClick={session.isListening ? session.stopSession : session.startSession}
              style={{
                padding: '7px 18px', borderRadius: '10px', cursor: 'pointer',
                fontWeight: 700, fontSize: '12px',
                background: session.isListening ? colors.danger + '22' : colors.accent,
                color: session.isListening ? colors.danger : '#fff',
                border: session.isListening ? `1px solid ${colors.danger}44` : 'none',
                display: 'flex', alignItems: 'center', gap: '6px',
                transition: 'all 0.15s',
              }}
            >
              {session.isListening ? (
                <>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: colors.danger, display: 'inline-block', animation: 'pulse 1s infinite' }} />
                  Stop
                </>
              ) : '▶ Start'}
            </button>
          </div>

          <CompactCaptions
            captions={session.captions}
            interimText={session.interimText}
            isListening={session.isListening}
            colors={colors}
            accentColor={colors.accent}
          />

          <div style={{ height: '280px' }}>
            <SignPlayerComponent
              signQueue={session.signQueue}
              language={session.language}
              isProcessing={session.isProcessing}
              speed={signSpeed} size={signSize}
              colors={colors} coverage={session.coverage}
              presentationMode={false}
            />
          </div>
        </div>

        {/* RIGHT: Sign language user — Sign to Text + Draw */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <SignToText
            colors={{ ...colors, accent: colors.live, accentGlow: colors.live }}
            language={session.language}
            socket={session.socket}
          />
        </div>
      </div>

      <div style={{
        display: 'flex', alignItems: 'center', gap: '16px',
        padding: '10px 16px',
        background: colors.panel, borderRadius: '12px',
        border: `1px solid ${colors.border}`,
      }}>
        <span style={{ fontSize: '10px', color: colors.muted, fontFamily: 'monospace' }}>SESSION</span>
        {session.topic && (
          <span style={{
            fontSize: '10px', padding: '2px 8px', borderRadius: '20px',
            background: colors.accent + '22', color: colors.accentGlow,
            border: `1px solid ${colors.accent}33`, fontFamily: 'monospace',
          }}>
            {session.topic}
          </span>
        )}
        {session.segmentsProcessed > 0 && (
          <span style={{ fontSize: '10px', color: colors.muted, fontFamily: 'monospace' }}>
            {session.segmentsProcessed} segments · {session.coverage}% coverage
          </span>
        )}
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: '10px', color: colors.muted, fontFamily: 'monospace' }}>
          Both streams active simultaneously
        </span>
      </div>
    </div>
  );
}

// ── Person label ──────────────────────────────────────────────────────────────

function PersonLabel({ colors, label, sub, accent, icon }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '10px',
      padding: '10px 16px', background: colors.panel,
      border: `1px solid ${accent}33`, borderRadius: '12px',
      borderLeft: `3px solid ${accent}`,
    }}>
      <span style={{ fontSize: '18px' }}>{icon}</span>
      <div>
        <div style={{ fontSize: '13px', fontWeight: 700, color: colors.text }}>{label}</div>
        <div style={{ fontSize: '11px', color: colors.muted }}>{sub}</div>
      </div>
    </div>
  );
}

// ── Compact captions ──────────────────────────────────────────────────────────

function CompactCaptions({ captions, interimText, isListening, colors, accentColor }) {
  const rawCaptions = captions.filter(c => c.type === 'raw' || !c.type).slice(-4);
  return (
    <div style={{ background: colors.panel, border: `1px solid ${colors.border}`, borderRadius: '14px', overflow: 'hidden' }}>
      <div style={{ padding: '8px 14px', borderBottom: `1px solid ${colors.border}`, display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span style={{ fontSize: '11px', fontWeight: 700, color: colors.text }}>Live Captions</span>
        {isListening && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: accentColor, animation: 'pulse 1.4s infinite' }} />
            <span style={{ fontSize: '9px', color: accentColor, fontFamily: 'monospace' }}>LIVE</span>
          </div>
        )}
      </div>
      <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: '6px', minHeight: '80px' }}>
        {rawCaptions.length === 0 && !interimText && (
          <span style={{ fontSize: '12px', color: colors.muted }}>
            {isListening ? 'Listening...' : 'Start speaking to see captions'}
          </span>
        )}
        {rawCaptions.map((c, i) => (
          <p key={i} style={{ margin: 0, fontSize: '13px', lineHeight: 1.5, color: i === rawCaptions.length - 1 ? colors.text : colors.muted }}>
            {c.text}
          </p>
        ))}
        {interimText && (
          <p style={{ margin: 0, fontSize: '13px', color: accentColor, fontStyle: 'italic', lineHeight: 1.5 }}>{interimText}</p>
        )}
      </div>
    </div>
  );
}

// ── Restore button ────────────────────────────────────────────────────────────

function restoreStyle(colors) {
  return {
    padding: '7px 14px', borderRadius: '10px', cursor: 'pointer',
    fontSize: '12px', fontWeight: 700, border: `1px solid ${colors.border}`,
    background: colors.panel, color: colors.muted,
    display: 'flex', alignItems: 'center', gap: '6px',
    transition: 'all 0.15s',
  };
}

// ── Theme system ──────────────────────────────────────────────────────────────

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