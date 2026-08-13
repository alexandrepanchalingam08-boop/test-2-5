import { useState } from 'react';
import { updateParticipant } from '../../../lib/db.js';

function letterStyle(letter) {
  return {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    width: 20, height: 20, borderRadius: '50%', fontSize: 11, fontFamily: 'var(--font-heading)',
    background: letter === 'A' ? 'var(--color-correct-bg)' : 'var(--color-groupb-bg)',
    color: letter === 'A' ? 'var(--color-correct-text)' : 'var(--color-groupb-text)',
  };
}
function codeStyle(letter) {
  return { fontSize: 10, color: letter === 'A' ? 'var(--color-correct-text)' : 'var(--color-groupb-text)' };
}

export default function TableTab({ session, refresh }) {
  const [drafts, setDrafts] = useState({});

  const valueOf = (p, field) => drafts[`${p.id}:${field}`] ?? p[field];
  const onChange = (p, field, value) => setDrafts((d) => ({ ...d, [`${p.id}:${field}`]: value }));
  const onCommit = async (p, field) => {
    const key = `${p.id}:${field}`;
    if (!(key in drafts)) return;
    const value = drafts[key];
    setDrafts((d) => {
      const next = { ...d };
      delete next[key];
      return next;
    });
    if (value === p[field]) return;
    await updateParticipant(p.id, { [field]: value });
    refresh();
  };

  return (
    <>
      <span style={{ fontSize: 11, letterSpacing: '.08em', textTransform: 'uppercase', opacity: 0.55 }}>
        {session.productName} — table de codage
      </span>
      <div style={{ overflowX: 'auto' }}>
        <table className="table" style={{ minWidth: 340 }}>
          <thead>
            <tr><th>#</th><th>Nom</th><th>Créneau</th><th>Ordre</th></tr>
          </thead>
          <tbody>
            {session.participants.map((p, i) => (
              <tr key={p.id}>
                <td>{i + 1}</td>
                <td>
                  <input
                    className="input" type="text" value={valueOf(p, 'name')}
                    onChange={(e) => onChange(p, 'name', e.target.value)}
                    onBlur={() => onCommit(p, 'name')}
                    onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); }}
                    style={{ minHeight: 28, padding: '3px 8px', fontSize: 12, minWidth: 110 }}
                  />
                </td>
                <td>
                  <input
                    className="input" type="text" value={valueOf(p, 'creneau')}
                    onChange={(e) => onChange(p, 'creneau', e.target.value)}
                    onBlur={() => onCommit(p, 'creneau')}
                    onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); }}
                    style={{ minHeight: 28, padding: '3px 8px', fontSize: 12, minWidth: 100 }}
                  />
                </td>
                <td style={{ fontFamily: 'monospace', display: 'flex', gap: 6 }}>
                  {p.truthOrder.map((letter, ci) => (
                    <div key={ci} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                      <span style={letterStyle(letter)}>{letter}</span>
                      <span style={codeStyle(letter)}>{p.codes[ci]}</span>
                    </div>
                  ))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
