// 📄 frontend/src/components/OnboardingModal.jsx  — NEW FILE
import { useState } from 'react';

const STEPS = [
  {
    icon: '🌐',
    title: 'Choose Your Sign Language',
    desc: 'Select the sign language you want to interpret into. You can change this anytime.',
    action: 'languagePicker',
  },
  {
    icon: '🎙️',
    title: 'Allow Microphone Access',
    desc: 'SignBridge needs your microphone to hear speech. Click Allow when your browser asks.',
    action: 'micTest',
  },
  {
    icon: '🤟',
    title: 'See a Demo Sign',
    desc: 'This is how signs will appear. Each word becomes an animated hand shape.',
    action: 'demoSign',
  },
];

const DEMO_SIGNS = ['hello', 'welcome', 'thank'];

export default function OnboardingModal({ colors, onClose, language, onSetLanguage }) {
  const [step, setStep] = useState(0);
  const [demoIndex, setDemoIndex] = useState(0);

  const next = () => {
    if (step < STEPS.length - 1) setStep(step + 1);
    else onClose();
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px',
    }}>
      <div style={{
        background: colors.panel, border: `1px solid ${colors.border}`,
        borderRadius: '20px', padding: '36px', maxWidth: '440px', width: '100%',
        boxShadow: `0 0 60px ${colors.accent}22`,
      }}>
        {/* Progress dots */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '28px' }}>
          {STEPS.map((_, i) => (
            <div key={i} style={{
              height: '3px', flex: 1, borderRadius: '2px',
              background: i <= step ? colors.accent : colors.border,
              transition: 'background 0.3s',
            }} />
          ))}
        </div>

        {/* Step content */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ fontSize: '52px', marginBottom: '16px' }}>{STEPS[step].icon}</div>
          <h2 style={{ margin: '0 0 10px', fontSize: '20px', fontWeight: 800, color: colors.text }}>
            {STEPS[step].title}
          </h2>
          <p style={{ margin: 0, fontSize: '14px', color: colors.muted, lineHeight: 1.6 }}>
            {STEPS[step].desc}
          </p>
        </div>

        {/* Step-specific content */}
        {step === 0 && (
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '20px' }}>
            {[
              { code: 'asl', label: 'ASL', flag: '🇺🇸' },
              { code: 'bsl', label: 'BSL', flag: '🇬🇧' },
              { code: 'isl', label: 'ISL', flag: '🇮🇳' },
            ].map(l => (
              <button key={l.code} onClick={() => onSetLanguage(l.code)} style={{
                padding: '12px 20px', borderRadius: '12px', cursor: 'pointer',
                fontWeight: 700, fontSize: '14px', border: '2px solid',
                background: language === l.code ? colors.accent + '22' : 'transparent',
                color: language === l.code ? colors.accent : colors.muted,
                borderColor: language === l.code ? colors.accent : colors.border,
                transition: 'all 0.15s',
              }}>
                <div style={{ fontSize: '20px', marginBottom: '4px' }}>{l.flag}</div>
                {l.label}
              </button>
            ))}
          </div>
        )}

        {step === 1 && (
          <div style={{
            background: colors.bg, border: `1px solid ${colors.border}`,
            borderRadius: '12px', padding: '16px', marginBottom: '20px', textAlign: 'center',
          }}>
            <p style={{ margin: 0, fontSize: '12px', color: colors.muted, lineHeight: 1.6 }}>
              When you click <strong style={{ color: colors.text }}>Start Interpreting</strong>, 
              your browser will ask for microphone access.<br /><br />
              <strong style={{ color: colors.accent }}>Click Allow</strong> to enable speech recognition.
            </p>
          </div>
        )}

        {step === 2 && (
          <div style={{
            background: colors.bg, border: `1px solid ${colors.accent}33`,
            borderRadius: '12px', padding: '20px', marginBottom: '20px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px',
          }}>
            <div style={{ fontSize: '64px' }}>
              {['👋', '🤗', '🙏'][demoIndex]}
            </div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: colors.accent, fontFamily: 'monospace', letterSpacing: '3px' }}>
              {DEMO_SIGNS[demoIndex].toUpperCase()}
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              {DEMO_SIGNS.map((_, i) => (
                <button key={i} onClick={() => setDemoIndex(i)} style={{
                  width: '8px', height: '8px', borderRadius: '50%', border: 'none', cursor: 'pointer', padding: 0,
                  background: i === demoIndex ? colors.accent : colors.border,
                }} />
              ))}
            </div>
          </div>
        )}

        {/* Nav buttons */}
        <div style={{ display: 'flex', gap: '10px' }}>
          {step > 0 && (
            <button onClick={() => setStep(step - 1)} style={{
              flex: 1, padding: '12px', borderRadius: '12px', cursor: 'pointer',
              background: 'transparent', border: `1px solid ${colors.border}`,
              color: colors.muted, fontWeight: 600, fontSize: '14px',
            }}>
              Back
            </button>
          )}
          <button onClick={next} style={{
            flex: 2, padding: '12px', borderRadius: '12px', cursor: 'pointer', border: 'none',
            background: colors.accent, color: '#fff', fontWeight: 700, fontSize: '14px',
            boxShadow: `0 0 20px ${colors.accent}44`,
          }}>
            {step < STEPS.length - 1 ? 'Next →' : "Let's Go 🤟"}
          </button>
        </div>

        {/* Skip */}
        <button onClick={onClose} style={{
          display: 'block', width: '100%', marginTop: '12px', padding: '8px',
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: '12px', color: colors.muted,
        }}>
          Skip setup
        </button>
      </div>
    </div>
  );
}