import { useEffect, useRef, useState } from 'react';

// Handshape approximations using emoji + Unicode hands
// These aren't perfect signs but give visual feedback for demo
const SIGN_VISUALS = {
  hello: { emoji: '👋', color: '#7C6AF7', description: 'Wave hand at temple' },
  goodbye: { emoji: '👋', color: '#7C6AF7', description: 'Wave hand outward' },
  thankyou: { emoji: '🙏', color: '#22C55E', description: 'Flat hand from chin forward' },
  thank: { emoji: '🙏', color: '#22C55E', description: 'Flat hand from chin forward' },
  yes: { emoji: '✊', color: '#22C55E', description: 'Fist nodding motion' },
  no: { emoji: '✌️', color: '#EF4444', description: 'Index + middle finger close' },
  please: { emoji: '🤲', color: '#F59E0B', description: 'Circular motion on chest' },
  sorry: { emoji: '✊', color: '#F59E0B', description: 'Fist circles on chest' },
  help: { emoji: '👍', color: '#22C55E', description: 'Thumbs up lifts other palm' },
  love: { emoji: '🤞', color: '#EC4899', description: 'Cross arms over chest' },
  understand: { emoji: '☝️', color: '#7C6AF7', description: 'Index flicks up from temple' },
  know: { emoji: '🤚', color: '#7C6AF7', description: 'Flat hand taps temple' },
  think: { emoji: '👆', color: '#7C6AF7', description: 'Index circles at temple' },
  want: { emoji: '🤏', color: '#F59E0B', description: 'Claw hands pull toward body' },
  need: { emoji: '☝️', color: '#F59E0B', description: 'Index hooks and bends' },
  go: { emoji: '👉', color: '#22C55E', description: 'Both index fingers point forward' },
  come: { emoji: '👈', color: '#22C55E', description: 'Index fingers beckon inward' },
  stop: { emoji: '✋', color: '#EF4444', description: 'Open palm cuts down on other hand' },
  start: { emoji: '🤙', color: '#22C55E', description: 'Index twists between fingers' },
  good: { emoji: '👍', color: '#22C55E', description: 'Flat hand from chin forward down' },
  bad: { emoji: '👎', color: '#EF4444', description: 'Hand flips down from chin' },
  me: { emoji: '☝️', color: '#7C6AF7', description: 'Index points to self' },
  you: { emoji: '👉', color: '#7C6AF7', description: 'Index points to other person' },
  what: { emoji: '🤷', color: '#F59E0B', description: 'Wiggle index fingers outward' },
  where: { emoji: '☝️', color: '#F59E0B', description: 'Index shakes side to side' },
  when: { emoji: '🤏', color: '#F59E0B', description: 'Index circles then meets other index' },
  how: { emoji: '🤜', color: '#F59E0B', description: 'Bent hands roll forward' },
  why: { emoji: '🤔', color: '#F59E0B', description: 'Middle finger bends at forehead' },
  meeting: { emoji: '🤝', color: '#7C6AF7', description: 'Both hands fingers come together' },
  work: { emoji: '✊', color: '#7C6AF7', description: 'Fist taps other fist' },
  today: { emoji: '⬇️', color: '#22C55E', description: 'Both hands lower together' },
  tomorrow: { emoji: '👍', color: '#22C55E', description: 'Thumb arcs forward from cheek' },
  now: { emoji: '⬇️', color: '#22C55E', description: 'Y-hands lower together' },
  more: { emoji: '🤏', color: '#F59E0B', description: 'Pinched hands tap together' },
  finish: { emoji: '🖐️', color: '#22C55E', description: 'Open hands shake outward' },
  name: { emoji: '✌️', color: '#7C6AF7', description: 'H-hands tap together twice' },
  welcome: { emoji: '🤗', color: '#22C55E', description: 'Open hand sweeps toward body' },
  friend: { emoji: '🤝', color: '#EC4899', description: 'Hooked index fingers link together' },
  important: { emoji: '☝️', color: '#F59E0B', description: 'F-hands circle up to meet' },
  question: { emoji: '❓', color: '#F59E0B', description: 'Index draws question mark' },
  time: { emoji: '⌚', color: '#7C6AF7', description: 'Index taps wrist' },
  people: { emoji: '👥', color: '#7C6AF7', description: 'P-hands circle alternately' },
  new: { emoji: '🆕', color: '#22C55E', description: 'Back of hand sweeps across palm' },
  true: { emoji: '👆', color: '#22C55E', description: 'Index from lips moves forward' },
  big: { emoji: '🙌', color: '#F59E0B', description: 'L-hands move apart' },
  small: { emoji: '🤏', color: '#F59E0B', description: 'Flat hands move close together' },
  learn: { emoji: '📖', color: '#7C6AF7', description: 'Fingers scoop to forehead' },
  ready: { emoji: '🤜', color: '#22C55E', description: 'R-hands sweep from left to right' },
  home: { emoji: '🏠', color: '#22C55E', description: 'Flat O taps cheek then jaw' },
   family: { emoji: '👨‍👩‍👧‍👦', color: '#EC4899', description: 'F-hands circle together' },
  mother: { emoji: '🤱', color: '#EC4899', description: 'Open hand taps chin' },
  father: { emoji: '👨', color: '#7C6AF7', description: 'Open hand taps forehead' },
  sister: { emoji: '👭', color: '#EC4899', description: 'L-hand moves from jaw downward' },
  brother: { emoji: '👬', color: '#7C6AF7', description: 'L-hand moves from forehead downward' },
  eat: { emoji: '🍽️', color: '#22C55E', description: 'Flattened O hand taps mouth' },
  drink: { emoji: '🥤', color: '#22C55E', description: 'C-hand tips toward mouth' },
  sleep: { emoji: '😴', color: '#7C6AF7', description: 'Open hand moves down over face' },
  read: { emoji: '📚', color: '#7C6AF7', description: 'V-hands move across palm' },
  write: { emoji: '✍️', color: '#7C6AF7', description: 'Dominant hand scribbles on palm' },
  pay: { emoji: '💳', color: '#F59E0B', description: 'Flat hand taps other palm' },
  buy: { emoji: '🛒', color: '#F59E0B', description: 'Pinched fingers pull into palm' },
  bathroom: { emoji: '🚻', color: '#F59E0B', description: 'T-hand shakes side to side' },
  water: { emoji: '💧', color: '#22C55E', description: 'W-hand taps chin' },
  food: { emoji: '🍎', color: '#22C55E', description: 'O-hand taps mouth twice' },
  school: { emoji: '🏫', color: '#7C6AF7', description: 'Clap hands twice' },
  teacher: { emoji: '👩‍🏫', color: '#7C6AF7', description: 'Teach + person sign combo' },
  student: { emoji: '🧑‍🎓', color: '#7C6AF7', description: 'Learn + person sign combo' },
  happy: { emoji: '😊', color: '#22C55E', description: 'Flat hands brush upward on chest' },
  sad: { emoji: '😢', color: '#EF4444', description: 'Flat hands brush downward on face' },
};

// Fingerspelling (A-Z)
const FINGERSPELL = {
  a: '🤛', b: '🖐️', c: '🤏', d: '☝️', e: '✊',
  f: '👌', g: '👉', h: '🤞', i: '🤙', j: '🤙',
  k: '✌️', l: '🤟', m: '✊', n: '✊', o: '👌',
  p: '☞', q: '👇', r: '🤞', s: '✊', t: '✊',
  u: '✌️', v: '✌️', w: '🖖', x: '☝️', y: '🤙', z: '☝️',
};

function getVisual(token) {
  const lower = token.toLowerCase();
  return SIGN_VISUALS[lower] || null;
}

function AnimatedSignCard({ sign, isActive }) {
  const visual = getVisual(sign.token);

  if (!visual) {
    // Fingerspell unknown word
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px',
        padding: '24px', animation: isActive ? 'signPop 0.3s ease-out' : 'none'
      }}>
        <div style={{ fontSize: '13px', color: '#6B6B8A', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '2px' }}>
          Fingerspelling
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', maxWidth: '280px' }}>
          {sign.token.toLowerCase().split('').map((char, i) => (
            <div key={i} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px',
              padding: '8px', background: 'rgba(124,106,247,0.1)', border: '1px solid rgba(124,106,247,0.2)',
              borderRadius: '8px', minWidth: '40px',
              animation: `letterIn 0.2s ease-out ${i * 0.08}s both`
            }}>
              <span style={{ fontSize: '20px' }}>{FINGERSPELL[char] || '✋'}</span>
              <span style={{ fontSize: '12px', color: '#A89BFA', fontFamily: 'monospace', textTransform: 'uppercase', fontWeight: 700 }}>{char}</span>
            </div>
          ))}
        </div>
        <div style={{ fontSize: '22px', color: '#E8E6FF', fontFamily: 'monospace', fontWeight: 800, letterSpacing: '4px', textTransform: 'uppercase' }}>
          {sign.token}
        </div>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px',
      padding: '32px 24px', animation: isActive ? 'signPop 0.3s ease-out' : 'none'
    }}>
      {/* Giant emoji handshape */}
      <div style={{
        fontSize: '80px', lineHeight: 1,
        filter: 'drop-shadow(0 0 20px ' + visual.color + '44)',
        animation: isActive ? 'handPulse 0.6s ease-in-out' : 'none'
      }}>
        {visual.emoji}
      </div>

      {/* Sign word */}
      <div style={{
        fontSize: '28px', fontWeight: 800, color: visual.color,
        fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '3px',
        textShadow: `0 0 20px ${visual.color}66`
      }}>
        {sign.token}
      </div>

      {/* Description */}
      <div style={{
        fontSize: '13px', color: '#6B6B8A', textAlign: 'center', maxWidth: '220px',
        lineHeight: 1.5, fontStyle: 'italic'
      }}>
        {visual.description}
      </div>

      {/* Color bar */}
      <div style={{ width: '40px', height: '3px', borderRadius: '2px', background: visual.color, opacity: 0.6 }} />
    </div>
  );
}

export default function SignPlayer({ signQueue, language, isProcessing }) {
  const [displayQueue, setDisplayQueue] = useState([]);
  const [currentSign, setCurrentSign] = useState(null);
  const [completedSigns, setCompletedSigns] = useState([]);
  const queueRef = useRef([]);
  const timerRef = useRef(null);
  const isRunningRef = useRef(false);

  useEffect(() => {
    if (!signQueue?.length) return;
    queueRef.current = [...queueRef.current, ...signQueue];
    setDisplayQueue([...queueRef.current]);
    if (!isRunningRef.current) playNext();
  }, [signQueue]);

  const playNext = () => {
    if (queueRef.current.length === 0) {
      isRunningRef.current = false;
      setTimeout(() => setCurrentSign(null), 800);
      return;
    }

    isRunningRef.current = true;
    const next = queueRef.current.shift();
    setDisplayQueue([...queueRef.current]);
    setCurrentSign(next);

    // Duration: fingerspell takes longer
    const visual = getVisual(next.token);
    const duration = visual ? 1400 : Math.max(1200, next.token.length * 180);

    timerRef.current = setTimeout(playNext, duration);
  };

  useEffect(() => () => clearTimeout(timerRef.current), []);

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%',
      background: '#1A1A24', border: '1px solid #2A2A38', borderRadius: '16px', overflow: 'hidden'
    }}>

      {/* Header */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #2A2A38', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <span style={{ fontWeight: 700, fontSize: '14px', color: '#E8E6FF' }}>Sign Language</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '11px', color: '#6B6B8A', fontFamily: 'monospace', textTransform: 'uppercase' }}>{language}</span>
          {isRunningRef.current && currentSign && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#7C6AF7', animation: 'pulse 1s ease-in-out infinite' }} />
              <span style={{ color: '#A89BFA', fontSize: '11px', fontFamily: 'monospace' }}>SIGNING</span>
            </div>
          )}
        </div>
      </div>

      {/* Main sign display */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 0 }}>
        {isProcessing && !currentSign ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', color: '#6B6B8A' }}>
            <div style={{ width: '32px', height: '32px', border: '2px solid #2A2A38', borderTop: '2px solid #7C6AF7', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <span style={{ fontSize: '13px' }}>Processing signs...</span>
          </div>
        ) : currentSign ? (
          <AnimatedSignCard key={currentSign.token + Date.now()} sign={currentSign} isActive />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', color: '#6B6B8A' }}>
            <span style={{ fontSize: '48px' }}>🤟</span>
            <p style={{ margin: 0, fontSize: '14px', textAlign: 'center' }}>
              Signs will animate here<br />when you speak
            </p>
          </div>
        )}
      </div>

      {/* Queue pills */}
      {displayQueue.length > 0 && (
        <div style={{ padding: '12px 16px', borderTop: '1px solid #2A2A38', flexShrink: 0 }}>
          <p style={{ margin: '0 0 8px', fontSize: '11px', color: '#6B6B8A', fontFamily: 'monospace' }}>
            UP NEXT ({displayQueue.length})
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {displayQueue.slice(0, 10).map((s, i) => (
              <span key={i} style={{
                padding: '3px 10px', background: 'rgba(124,106,247,0.1)', border: '1px solid rgba(124,106,247,0.2)',
                borderRadius: '20px', fontSize: '11px', color: '#A89BFA', fontFamily: 'monospace',
                textTransform: 'uppercase', animation: `fadeIn 0.2s ease-out ${i * 0.04}s both`
              }}>
                {s.token}
              </span>
            ))}
            {displayQueue.length > 10 && (
              <span style={{ fontSize: '11px', color: '#6B6B8A', alignSelf: 'center', fontFamily: 'monospace' }}>
                +{displayQueue.length - 10}
              </span>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes signPop { from { opacity:0; transform: scale(0.8) translateY(10px); } to { opacity:1; transform: scale(1) translateY(0); } }
        @keyframes handPulse { 0%,100% { transform: scale(1); } 40% { transform: scale(1.15) rotate(-5deg); } 70% { transform: scale(1.05) rotate(3deg); } }
        @keyframes letterIn { from { opacity:0; transform: scale(0.6) translateY(8px); } to { opacity:1; transform: scale(1) translateY(0); } }
        @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
      `}</style>
    </div>
  );
}