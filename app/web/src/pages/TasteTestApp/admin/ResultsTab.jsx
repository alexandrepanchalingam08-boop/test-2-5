import { buildAdminRow } from '../../../lib/adminRows.js';
import { extractKeywords } from '../../../lib/keywords.js';

export default function ResultsTab({ session }) {
  const rows = session.participants.map(buildAdminRow);
  const correctCount = rows.filter((r) => r.correctBool === true).length;
  const total = session.participants.length;
  const submissions = session.participants.map((p) => p.submission).filter(Boolean);
  const avgIntensity = submissions.length
    ? Math.round(submissions.reduce((sum, s) => sum + (s.intensity || 0), 0) / submissions.length)
    : 0;
  const keywordChips = extractKeywords(submissions.map((s) => s.description));

  const resultsBadgeStyle = {
    width: 96, height: 96, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: correctCount <= 4 ? 'var(--color-correct-bg)' : 'var(--color-accent-100)',
    border: `3px solid ${correctCount <= 4 ? 'var(--color-correct-text)' : 'var(--color-accent)'}`,
    color: correctCount <= 4 ? 'var(--color-correct-text)' : 'var(--color-accent-800)',
  };

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '8px 0 4px' }}>
        <span style={{ fontSize: 11, letterSpacing: '.08em', textTransform: 'uppercase', opacity: 0.55 }}>
          {session.productName} — bonnes réponses
        </span>
        <div style={resultsBadgeStyle}>
          <span style={{ fontFamily: 'var(--font-heading)', fontSize: 24 }}>{correctCount}/{total}</span>
        </div>
      </div>
      {submissions.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, marginTop: -8 }}>
          <span style={{ fontSize: 11, letterSpacing: '.08em', textTransform: 'uppercase', opacity: 0.55 }}>Intensité moyenne de la différence perçue</span>
          <span style={{ fontFamily: 'var(--font-heading)', fontSize: 20, fontWeight: 700 }}>{avgIntensity}/100</span>
        </div>
      )}
      {keywordChips.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
          <span style={{ fontSize: 11, letterSpacing: '.08em', textTransform: 'uppercase', opacity: 0.55 }}>Mots-clés fréquents</span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {keywordChips.map((kw) => (
              <span key={kw.word} className="tag tag-accent">{kw.word} ({kw.count})</span>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
