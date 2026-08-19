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
  const [creneauFilter, setCreneauFilter] = useState('');

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

  const onCreneauChange = async (p, value) => {
    if (value === p.creneau) return;
    await updateParticipant(p.id, { creneau: value });
    refresh();
  };

  const creneauxPresent = [...new Set(session.participants.map((p) => p.creneau))];
  const orderedCreneaux = [
    ...session.slotLabels.filter((c) => creneauxPresent.includes(c)),
    ...creneauxPresent.filter((c) => !session.slotLabels.includes(c)),
  ];
  const filteredParticipants = creneauFilter
    ? session.participants.filter((p) => p.creneau === creneauFilter)
    : session.participants;

  return (
    <>
      <span style={{ fontSize: 11, letterSpacing: '.08em', textTransform: 'uppercase', opacity: 0.55 }}>
        {session.productName} — table de codage
      </span>
      {orderedCreneaux.length > 1 && (
        <div className="field" style={{ maxWidth: 220 }}>
          <label htmlFor="table-creneau-filter">Filtrer par créneau</label>
          <select
            id="table-creneau-filter" className="input" value={creneauFilter}
            onChange={(e) => setCreneauFilter(e.target.value)}
            style={{ minHeight: 32, fontSize: 13, padding: '3px 12px' }}
          >
            <option value="">Tous les créneaux</option>
            {orderedCreneaux.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      )}
      {(session.labelA || session.labelB) && (
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', fontSize: 12 }}>
          {session.labelA && (
            <span><span style={{ color: 'var(--color-correct-text)', fontFamily: 'var(--font-heading)' }}>A</span> = {session.labelA}</span>
          )}
          {session.labelB && (
            <span><span style={{ color: 'var(--color-groupb-text)', fontFamily: 'var(--font-heading)' }}>B</span> = {session.labelB}</span>
          )}
        </div>
      )}
      <div style={{ overflowX: 'auto' }}>
        <table className="table" style={{ minWidth: 340 }}>
          <thead>
            <tr><th>#</th><th>Nom</th><th>Créneau</th><th>Ordre</th></tr>
          </thead>
          <tbody>
            {filteredParticipants.map((p, i) => (
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
                  <select
                    className="input" value={p.creneau}
                    onChange={(e) => onCreneauChange(p, e.target.value)}
                    style={{ minHeight: 28, padding: '3px 8px', fontSize: 12, minWidth: 130 }}
                  >
                    {!session.slotLabels.includes(p.creneau) && (
                      <option value={p.creneau}>{p.creneau}</option>
                    )}
                    {session.slotLabels.map((label) => (
                      <option key={label} value={label}>{label}</option>
                    ))}
                  </select>
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
