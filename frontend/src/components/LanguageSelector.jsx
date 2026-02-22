const LANGUAGES = [
  { code: 'asl', label: 'ASL', flag: '🇺🇸', full: 'American Sign Language' },
  { code: 'bsl', label: 'BSL', flag: '🇬🇧', full: 'British Sign Language' },
  { code: 'isl', label: 'ISL', flag: '🇮🇳', full: 'Indian Sign Language' },
];

export default function LanguageSelector({ selected, onChange, disabled, colors }) {
  const c = colors || {
    accent: '#7C6AF7', border: '#2A2A38', panel: '#1A1A24',
    muted: '#6B6B8A', text: '#E8E6FF', live: '#22C55E',
  };

  return (
    <div style={{ display: 'flex', gap: '6px' }}>
      {LANGUAGES.map(lang => (
        <button
          key={lang.code}
          onClick={() => onChange(lang.code)}
          disabled={disabled}
          title={lang.full}
          style={{
            padding: '7px 14px', borderRadius: '10px', cursor: disabled ? 'not-allowed' : 'pointer',
            fontWeight: 700, fontSize: '12px', border: '1px solid', transition: 'all 0.15s',
            background: selected === lang.code ? c.accent + '22' : 'transparent',
            color: selected === lang.code ? c.accent : c.muted,
            borderColor: selected === lang.code ? c.accent + '66' : c.border,
            opacity: disabled ? 0.6 : 1,
            display: 'flex', alignItems: 'center', gap: '5px', position: 'relative',
          }}
        >
          <span>{lang.flag}</span>
          <span style={{ fontFamily: 'monospace' }}>{lang.label}</span>
          {selected === lang.code && (
            <span style={{
              position: 'absolute', top: -3, right: -3,
              width: 7, height: 7, borderRadius: '50%',
              background: c.live, border: `1px solid ${c.panel || '#1A1A24'}`,
            }} />
          )}
        </button>
      ))}
    </div>
  );
}