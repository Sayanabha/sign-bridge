// 📄 frontend/src/components/DictionaryBrowser.jsx  — NEW FILE
import { useState } from 'react';

// Import sign definitions from SignPlayer
const SIGNS = {
  hello: { emoji: '👋', description: 'Wave hand at temple', category: 'Greetings' },
  goodbye: { emoji: '👋', description: 'Wave hand outward', category: 'Greetings' },
  welcome: { emoji: '🤗', description: 'Sweep hand toward body', category: 'Greetings' },
  yes: { emoji: '✊', description: 'Fist nods up and down', category: 'Responses' },
  no: { emoji: '✌️', description: 'Index + middle close together', category: 'Responses' },
  please: { emoji: '🤲', description: 'Circular motion on chest', category: 'Responses' },
  sorry: { emoji: '✊', description: 'Fist circles on chest', category: 'Responses' },
  thankyou: { emoji: '🙏', description: 'Flat hand from chin forward', category: 'Responses' },
  thank: { emoji: '🙏', description: 'Flat hand from chin forward', category: 'Responses' },
  me: { emoji: '☝️', description: 'Point to yourself', category: 'Pronouns' },
  you: { emoji: '👉', description: 'Point outward to person', category: 'Pronouns' },
  we: { emoji: '👈', description: 'Index arcs from self outward', category: 'Pronouns' },
  what: { emoji: '🤷', description: 'Fingers wiggle outward', category: 'Questions' },
  where: { emoji: '☝️', description: 'Index shakes side to side', category: 'Questions' },
  when: { emoji: '🤏', description: 'Indexes circle then meet', category: 'Questions' },
  how: { emoji: '🤜', description: 'Bent hands roll forward', category: 'Questions' },
  why: { emoji: '🤔', description: 'Middle finger bends at forehead', category: 'Questions' },
  who: { emoji: '☝️', description: 'Index circles near mouth', category: 'Questions' },
  good: { emoji: '👍', description: 'Flat hand from chin forward-down', category: 'Descriptors' },
  bad: { emoji: '👎', description: 'Hand flips down from chin', category: 'Descriptors' },
  love: { emoji: '🤞', description: 'Cross arms over chest', category: 'Emotions' },
  like: { emoji: '👌', description: 'Middle finger flicks from chest', category: 'Emotions' },
  want: { emoji: '🤏', description: 'Claw hands pull toward body', category: 'Actions' },
  need: { emoji: '☝️', description: 'Index hooks and bends down', category: 'Actions' },
  think: { emoji: '👆', description: 'Index circles at temple', category: 'Cognitive' },
  know: { emoji: '🤚', description: 'Flat hand taps forehead', category: 'Cognitive' },
  understand: { emoji: '☝️', description: 'Fist flicks index up', category: 'Cognitive' },
  learn: { emoji: '📖', description: 'Fingers scoop to forehead', category: 'Cognitive' },
  go: { emoji: '👉', description: 'Both indexes point forward', category: 'Actions' },
  come: { emoji: '👈', description: 'Index beckons inward', category: 'Actions' },
  stop: { emoji: '✋', description: 'Open palm cuts down', category: 'Actions' },
  start: { emoji: '☝️', description: 'Index twists between fingers', category: 'Actions' },
  finish: { emoji: '🖐️', description: 'Open hands shake outward', category: 'Actions' },
  help: { emoji: '👍', description: 'Thumbs up lifts on palm', category: 'Actions' },
  work: { emoji: '✊', description: 'Fist taps other fist', category: 'Actions' },
  meeting: { emoji: '🤝', description: 'Both hand fingers come together', category: 'Work' },
  presentation: { emoji: '🖐️', description: 'Palms show forward', category: 'Work' },
  important: { emoji: '☝️', description: 'F-hands rise to meet', category: 'Work' },
  question: { emoji: '❓', description: 'Index draws question mark', category: 'Work' },
  friend: { emoji: '🤝', description: 'Hooked indexes link together', category: 'People' },
  people: { emoji: '👥', description: 'P-hands circle alternately', category: 'People' },
  name: { emoji: '✌️', description: 'H-hands tap together twice', category: 'People' },
  home: { emoji: '🏠', description: 'Flat-O taps cheek then jaw', category: 'Places' },
  now: { emoji: '⬇️', description: 'Y-hands lower together', category: 'Time' },
  today: { emoji: '⬇️', description: 'Both hands lower', category: 'Time' },
  tomorrow: { emoji: '👍', description: 'Thumb arcs forward from cheek', category: 'Time' },
  time: { emoji: '⌚', description: 'Index taps wrist', category: 'Time' },
  more: { emoji: '🤏', description: 'Pinched hands tap together', category: 'Descriptors' },
  new: { emoji: '🆕', description: 'Back of hand sweeps palm', category: 'Descriptors' },
  big: { emoji: '🙌', description: 'L-hands move apart', category: 'Descriptors' },
  small: { emoji: '🤏', description: 'Flat hands move together', category: 'Descriptors' },
  ready: { emoji: '🤜', description: 'R-hands sweep left to right', category: 'Descriptors' },
  true: { emoji: '👆', description: 'Index from lips moves forward', category: 'Descriptors' },
};

const CATEGORIES = ['All', ...new Set(Object.values(SIGNS).map(s => s.category))];

export default function DictionaryBrowser({ colors, language, signSpeed, signSize, onClose }) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [hoveredSign, setHoveredSign] = useState(null);

  const filtered = Object.entries(SIGNS).filter(([word, data]) => {
    const matchSearch = word.includes(search.toLowerCase()) ||
      data.description.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === 'All' || data.category === category;
    return matchSearch && matchCat;
  });

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 900,
      background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px',
    }}>
      <div style={{
        background: colors.panel, border: `1px solid ${colors.border}`,
        borderRadius: '20px', width: '100%', maxWidth: '800px',
        maxHeight: '90vh', display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px', borderBottom: `1px solid ${colors.border}`,
          display: 'flex', alignItems: 'center', gap: '16px', flexShrink: 0,
        }}>
          <span style={{ fontSize: '22px' }}>📖</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '16px', fontWeight: 800, color: colors.text }}>Sign Dictionary</div>
            <div style={{ fontSize: '11px', color: colors.muted, fontFamily: 'monospace' }}>
              {Object.keys(SIGNS).length} signs available · {language.toUpperCase()}
            </div>
          </div>
          <button onClick={onClose} style={{
            background: 'none', border: `1px solid ${colors.border}`,
            borderRadius: '8px', padding: '6px 12px', cursor: 'pointer',
            color: colors.muted, fontSize: '12px',
          }}>✕ Close</button>
        </div>

        {/* Search + filter */}
        <div style={{ padding: '16px 24px', borderBottom: `1px solid ${colors.border}`, flexShrink: 0 }}>
          <input
            type="text"
            placeholder="Search signs..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%', padding: '10px 14px', borderRadius: '10px', marginBottom: '12px',
              background: colors.bg, border: `1px solid ${colors.border}`,
              color: colors.text, fontSize: '14px', outline: 'none',
              fontFamily: 'sans-serif',
            }}
          />
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {CATEGORIES.map(cat => (
              <button key={cat} onClick={() => setCategory(cat)} style={{
                padding: '4px 12px', borderRadius: '20px', cursor: 'pointer',
                fontSize: '11px', fontWeight: 700, fontFamily: 'monospace',
                background: category === cat ? colors.accent + '22' : 'transparent',
                color: category === cat ? colors.accent : colors.muted,
                border: `1px solid ${category === cat ? colors.accent + '44' : colors.border}`,
                transition: 'all 0.15s',
              }}>
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
            gap: '12px',
          }}>
            {filtered.map(([word, data]) => (
              <div
                key={word}
                onMouseEnter={() => setHoveredSign(word)}
                onMouseLeave={() => setHoveredSign(null)}
                style={{
                  background: hoveredSign === word ? colors.accent + '18' : colors.bg,
                  border: `1px solid ${hoveredSign === word ? colors.accent + '44' : colors.border}`,
                  borderRadius: '12px', padding: '14px 10px',
                  cursor: 'default', transition: 'all 0.15s',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
                  textAlign: 'center',
                }}
              >
                <span style={{
                  fontSize: hoveredSign === word ? '40px' : '32px',
                  transition: 'font-size 0.2s',
                  filter: hoveredSign === word ? `drop-shadow(0 0 8px ${colors.accent}88)` : 'none',
                }}>
                  {data.emoji}
                </span>
                <span style={{
                  fontSize: '11px', fontWeight: 800, color: hoveredSign === word ? colors.accent : colors.text,
                  fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '1px',
                }}>
                  {word}
                </span>
                <span style={{ fontSize: '10px', color: colors.muted, lineHeight: 1.4 }}>
                  {data.description}
                </span>
                <span style={{
                  fontSize: '9px', color: colors.accent, fontFamily: 'monospace',
                  padding: '1px 6px', borderRadius: '4px',
                  background: colors.accent + '11', border: `1px solid ${colors.accent}22`,
                }}>
                  {data.category}
                </span>
              </div>
            ))}
            {filtered.length === 0 && (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', color: colors.muted, padding: '40px', fontSize: '14px' }}>
                No signs found for "{search}"
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '12px 24px', borderTop: `1px solid ${colors.border}`,
          fontSize: '11px', color: colors.muted, flexShrink: 0,
        }}>
          Hover a sign to preview · Unknown words will be fingerspelled automatically
        </div>
      </div>
    </div>
  );
}