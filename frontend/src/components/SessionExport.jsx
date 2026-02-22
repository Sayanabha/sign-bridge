// 📄 frontend/src/components/SessionExport.jsx  — NEW FILE
import { useState } from 'react';

function formatSRT(captions) {
  return captions.map((c, i) => {
    const start = new Date(c.timestamp || Date.now() - (captions.length - i) * 4000);
    const end = new Date(start.getTime() + 4000);
    const fmt = (d) => d.toISOString().substr(11, 8).replace('.', ',') + '000';
    return `${i + 1}\n${fmt(start)} --> ${fmt(end)}\n${c.text}\n`;
  }).join('\n');
}

function formatTXT(captions, topic, language) {
  const header = [
    'SIGNBRIDGE SESSION TRANSCRIPT',
    '═'.repeat(40),
    `Language: ${language.toUpperCase()}`,
    `Topic: ${topic || 'General'}`,
    `Date: ${new Date().toLocaleDateString()}`,
    `Segments: ${captions.length}`,
    '═'.repeat(40),
    '',
  ].join('\n');

  const body = captions.map(c => {
    const time = new Date(c.timestamp || Date.now()).toLocaleTimeString();
    return `[${time}] ${c.text}`;
  }).join('\n');

  return header + body;
}

function formatJSON(captions, topic, language, sessionStart) {
  return JSON.stringify({
    meta: {
      language,
      topic,
      sessionStart: new Date(sessionStart).toISOString(),
      exportedAt: new Date().toISOString(),
      totalSegments: captions.length,
    },
    captions: captions.map(c => ({
      text: c.text,
      timestamp: c.timestamp,
      cleaned: c.cleaned,
    })),
  }, null, 2);
}

function download(filename, content, type = 'text/plain') {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function SessionExport({ colors, session, onClose }) {
  const [exported, setExported] = useState(null);
  const { captions, topic, language, sessionStart, segmentsProcessed } = session;

  const duration = sessionStart
    ? Math.round((Date.now() - sessionStart) / 1000)
    : 0;

  const handleExport = (format) => {
    const ts = new Date().toISOString().replace(/[:.]/g, '-').substr(0, 19);
    const base = `signbridge-session-${ts}`;

    if (format === 'srt') {
      download(`${base}.srt`, formatSRT(captions));
    } else if (format === 'txt') {
      download(`${base}.txt`, formatTXT(captions, topic, language));
    } else if (format === 'json') {
      download(`${base}.json`, formatJSON(captions, topic, language, sessionStart), 'application/json');
    }

    setExported(format);
    setTimeout(() => setExported(null), 2000);
  };

  const FORMATS = [
    {
      id: 'txt',
      icon: '📄',
      label: 'Plain Text',
      desc: 'Formatted transcript with timestamps. Good for notes and sharing.',
      ext: '.txt',
    },
    {
      id: 'srt',
      icon: '🎬',
      label: 'SRT Subtitles',
      desc: 'Standard subtitle format. Import into video editors or players.',
      ext: '.srt',
    },
    {
      id: 'json',
      icon: '🔧',
      label: 'JSON Data',
      desc: 'Raw structured data with all metadata. Good for developers.',
      ext: '.json',
    },
  ];

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 900,
      background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px',
    }}>
      <div style={{
        background: colors.panel, border: `1px solid ${colors.border}`,
        borderRadius: '20px', width: '100%', maxWidth: '500px',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px', borderBottom: `1px solid ${colors.border}`,
          display: 'flex', alignItems: 'center', gap: '12px',
        }}>
          <span style={{ fontSize: '22px' }}>⬇️</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '16px', fontWeight: 800, color: colors.text }}>Export Session</div>
            <div style={{ fontSize: '11px', color: colors.muted, fontFamily: 'monospace' }}>
              {segmentsProcessed} segments · {duration}s · {language.toUpperCase()}
            </div>
          </div>
          <button onClick={onClose} style={{
            background: 'none', border: `1px solid ${colors.border}`,
            borderRadius: '8px', padding: '6px 12px', cursor: 'pointer',
            color: colors.muted, fontSize: '12px',
          }}>✕</button>
        </div>

        {/* Session summary */}
        <div style={{ padding: '16px 24px', borderBottom: `1px solid ${colors.border}` }}>
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', textAlign: 'center',
          }}>
            {[
              { label: 'Segments', value: segmentsProcessed },
              { label: 'Topic', value: topic || 'General' },
              { label: 'Duration', value: `${duration}s` },
            ].map(s => (
              <div key={s.label} style={{
                background: colors.bg, border: `1px solid ${colors.border}`,
                borderRadius: '10px', padding: '10px',
              }}>
                <div style={{ fontSize: '16px', fontWeight: 800, color: colors.accent }}>{s.value}</div>
                <div style={{ fontSize: '10px', color: colors.muted, fontFamily: 'monospace' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Caption preview */}
        <div style={{ padding: '16px 24px', borderBottom: `1px solid ${colors.border}`, maxHeight: '140px', overflowY: 'auto' }}>
          <div style={{ fontSize: '11px', color: colors.muted, fontFamily: 'monospace', marginBottom: '8px' }}>PREVIEW</div>
          {captions.slice(-3).map((c, i) => (
            <div key={i} style={{
              fontSize: '12px', color: colors.text, padding: '4px 0',
              borderBottom: i < 2 ? `1px solid ${colors.border}` : 'none',
            }}>
              <span style={{ color: colors.muted, fontFamily: 'monospace', marginRight: '8px', fontSize: '10px' }}>
                {new Date(c.timestamp || Date.now()).toLocaleTimeString()}
              </span>
              {c.text}
            </div>
          ))}
        </div>

        {/* Export format buttons */}
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {FORMATS.map(f => (
            <button
              key={f.id}
              onClick={() => handleExport(f.id)}
              disabled={captions.length === 0}
              style={{
                padding: '14px 18px', borderRadius: '12px', cursor: 'pointer',
                background: exported === f.id ? colors.live + '22' : colors.bg,
                border: `1px solid ${exported === f.id ? colors.live : colors.border}`,
                color: colors.text, textAlign: 'left', transition: 'all 0.15s',
                display: 'flex', alignItems: 'center', gap: '12px',
              }}
            >
              <span style={{ fontSize: '22px' }}>{exported === f.id ? '✅' : f.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: '13px', marginBottom: '2px' }}>
                  {f.label} <span style={{ color: colors.muted, fontWeight: 400, fontFamily: 'monospace' }}>{f.ext}</span>
                </div>
                <div style={{ fontSize: '11px', color: colors.muted }}>{f.desc}</div>
              </div>
              <span style={{ fontSize: '11px', color: colors.accent, fontFamily: 'monospace' }}>
                {exported === f.id ? 'Saved!' : '⬇ Download'}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}