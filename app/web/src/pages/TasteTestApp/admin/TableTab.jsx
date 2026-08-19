import { useState } from 'react';
import { updateParticipant, rebalanceUnsubmittedCodes } from '../../../lib/db.js';

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
  const [rebalancing, setRebalancing] = useState(false);

  const unsubmittedCount = session.participants.filter((p) => !p.submission).length;
  const onRebalance = async () => {
    if (!window.confirm(
      `Réattribuer codes et groupe A/B pour ${unsubmittedCount} participant(s) n'ayant pas encore répondu, ` +
      `pour équilibrer chaque créneau ? Les participants ayant déjà répondu ne sont pas touchés.`,
    )) return;
    setRebalancing(true);
    try {
      await rebalanceUnsubmittedCodes(session);
      await refresh();
    } finally {
      setRebalancing(false);
    }
  };

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

  const countLetter = (letter) => filteredParticipants.reduce(
    (sum, p) => sum + p.truthOrder.filter((o) => o === letter).length, 0,
  );
  const totalA = countLetter('A');
  const totalB = countLetter('B');
  const formatProduction = (n) => (Number.isInteger(n / 2) ? String(n / 2) : (n / 2).toFixed(1));

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <span style={{ fontSize: 11, letterSpacing: '.08em', textTransform: 'uppercase', opacity: 0.55 }}>
          {session.productName} — table de codage
        </span>
        {unsubmittedCount > 0 && (
          <button
            className="btn btn-ghost" onClick={onRebalance} disabled={rebalancing}
            style={{ fontSize: 11, flex: 'none' }}
          >
            {rebalancing ? 'Réattribution…' : 'Rééquilibrer les codes'}
          </button>
        )}
      </div>
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span style={{ fontSize: 11, letterSpacing: '.08em', textTransform: 'uppercase', opacity: 0.55 }}>Production</span>
        <div style={{ display: 'flex', gap: 20 }}>
          <span style={{ fontSize: 14 }}>
            <span style={{ color: 'var(--color-correct-text)', fontFamily: 'var(--font-heading)' }}>A</span> : {formatProduction(totalA)}
          </span>
          <span style={{ fontSize: 14 }}>
            <span style={{ color: 'var(--color-groupb-text)', fontFamily: 'var(--font-heading)' }}>B</span> : {formatProduction(totalB)}
          </span>
        </div>
      </div>
    </>
  );
}
