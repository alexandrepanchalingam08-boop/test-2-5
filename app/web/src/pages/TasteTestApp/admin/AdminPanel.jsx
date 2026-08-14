import { useState } from 'react';
import { createSession, deleteSession, setActiveSession } from '../../../lib/db.js';
import { TrashIcon, DownloadIcon } from '../../../components/icons.jsx';
import { exportSessionToCsv } from '../../../lib/exportCsv.js';
import { DEFAULT_SLOT_LABELS } from '../../../lib/timeSlots.js';
import ParticipantsTab from './ParticipantsTab.jsx';
import TableTab from './TableTab.jsx';
import ResultsTab from './ResultsTab.jsx';

const TABS = [
  { key: 'participants', label: 'Participants' },
  { key: 'table', label: 'Tableau' },
  { key: 'results', label: 'Résultats' },
];

function tabStyle(active) {
  return {
    flex: 1, textAlign: 'center', padding: '8px 0', fontSize: 13, cursor: 'pointer',
    fontFamily: 'var(--font-heading)', borderRadius: 999,
    background: active ? 'var(--color-accent)' : 'transparent',
    color: active ? 'var(--color-bg)' : 'var(--color-text)',
  };
}

function emptyDraft() {
  return { productName: '', day: '', place: '', slotLabels: ['', '', ''], labelA: '', labelB: '' };
}

export default function AdminPanel({ sessions, activeSession, refresh, onExit }) {
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState(emptyDraft());
  const [tab, setTab] = useState('participants');
  const [detailId, setDetailId] = useState(null);

  const sessionOptions = [...sessions].reverse().map((s) => ({
    id: s.id,
    label: `${s.productName}${s.day ? ' — ' + s.day : ''}${s.isActive ? ' (Active)' : ''}`,
  }));

  const onSessionSelectChange = async (e) => {
    const val = e.target.value;
    if (val === '__new__') {
      setDraft(emptyDraft());
      setCreating(true);
      return;
    }
    setDetailId(null);
    await setActiveSession(val);
    await refresh();
  };

  const setSlotLabel = (i, value) => setDraft((d) => {
    const slotLabels = [...d.slotLabels];
    slotLabels[i] = value;
    return { ...d, slotLabels };
  });

  const onCreateSession = async () => {
    const name = draft.productName.trim();
    if (!name) return;
    await createSession({
      productName: name,
      storeName: draft.place || activeSession?.storeName,
      day: draft.day,
      place: draft.place,
      slotLabels: draft.slotLabels,
      labelA: draft.labelA,
      labelB: draft.labelB,
    });
    setCreating(false);
    setDraft(emptyDraft());
    setDetailId(null);
    await refresh();
  };

  const onDeleteViewed = async () => {
    if (sessions.length <= 1 || !activeSession) return;
    const remaining = sessions.filter((s) => s.id !== activeSession.id);
    await deleteSession(activeSession.id);
    await setActiveSession(remaining[remaining.length - 1].id);
    setDetailId(null);
    await refresh();
  };

  if (!activeSession && !creating) {
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: 'calc(56px + env(safe-area-inset-top)) 20px 10px', flex: 'none', display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={onExit} style={{ height: 36, fontSize: 12, flex: 'none' }}>Quitter</button>
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 20, textAlign: 'center' }}>
          <p style={{ margin: 0, fontSize: 14, opacity: 0.75 }}>Aucun test pour le moment.</p>
          <button className="btn btn-primary" onClick={() => { setDraft(emptyDraft()); setCreating(true); }}>+ Nouvelle session</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: 'calc(56px + env(safe-area-inset-top)) 20px 10px', flex: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
        <select
          value={creating ? '__new__' : (activeSession?.id ?? '')}
          onChange={onSessionSelectChange}
          className="input"
          style={{ flex: 1, fontFamily: 'var(--font-heading)', fontSize: 14 }}
        >
          <option value="__new__">+ Nouvelle session</option>
          {sessionOptions.map((opt) => (
            <option key={opt.id} value={opt.id}>{opt.label}</option>
          ))}
        </select>
        {sessions.length > 1 && activeSession && (
          <button
            onClick={onDeleteViewed}
            aria-label="Supprimer la session"
            style={{ width: 36, height: 36, borderRadius: '50%', border: '1px solid var(--color-divider)', background: 'var(--color-surface)', color: 'var(--color-text)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0, flex: 'none' }}
          >
            <TrashIcon />
          </button>
        )}
        <button className="btn btn-secondary" onClick={onExit} style={{ height: 36, fontSize: 12, flex: 'none' }}>Quitter</button>
      </div>

      {creating && (
        <div style={{ padding: '0 20px 16px', flex: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div className="field">
            <label htmlFor="new-session-product">Nom du produit</label>
            <input
              id="new-session-product" className="input" type="text" value={draft.productName}
              onChange={(e) => setDraft((d) => ({ ...d, productName: e.target.value }))}
              style={{ minHeight: 38 }}
            />
          </div>
          <div className="field">
            <label htmlFor="new-session-day">Date</label>
            <input
              id="new-session-day" className="input" type="text" value={draft.day}
              onChange={(e) => setDraft((d) => ({ ...d, day: e.target.value }))}
              style={{ minHeight: 38 }}
            />
          </div>
          <div className="field">
            <label htmlFor="new-session-place">Lieu</label>
            <input
              id="new-session-place" className="input" type="text" value={draft.place}
              onChange={(e) => setDraft((d) => ({ ...d, place: e.target.value }))}
              style={{ minHeight: 38 }}
            />
          </div>
          {draft.slotLabels.map((val, i) => (
            <div className="field" key={i}>
              <label>Créneau {i + 1}</label>
              <select
                className="input" value={val}
                onChange={(e) => setSlotLabel(i, e.target.value)}
                style={{ minHeight: 38 }}
              >
                <option value="">Choisir un créneau…</option>
                {!!val && !DEFAULT_SLOT_LABELS.includes(val) && <option value={val}>{val}</option>}
                {DEFAULT_SLOT_LABELS.map((label) => (
                  <option key={label} value={label}>{label}</option>
                ))}
              </select>
            </div>
          ))}
          <div className="field">
            <label htmlFor="new-session-label-a">Correspondance du groupe A</label>
            <input
              id="new-session-label-a" className="input" type="text" value={draft.labelA}
              placeholder="ex : recette actuelle"
              onChange={(e) => setDraft((d) => ({ ...d, labelA: e.target.value }))}
              style={{ minHeight: 38 }}
            />
          </div>
          <div className="field">
            <label htmlFor="new-session-label-b">Correspondance du groupe B</label>
            <input
              id="new-session-label-b" className="input" type="text" value={draft.labelB}
              placeholder="ex : recette modifiée"
              onChange={(e) => setDraft((d) => ({ ...d, labelB: e.target.value }))}
              onKeyDown={(e) => { if (e.key === 'Enter') onCreateSession(); }}
              style={{ minHeight: 38 }}
            />
          </div>
          <button className="btn btn-primary" onClick={onCreateSession} style={{ marginTop: 4 }}>Créer</button>
        </div>
      )}

      {activeSession && (
        <>
          <div style={{ padding: '0 20px 12px', flex: 'none' }}>
            <div style={{ display: 'flex', gap: 4, background: 'var(--color-surface)', borderRadius: 999, padding: 4 }}>
              {TABS.map((t) => (
                <div key={t.key} onClick={() => { setTab(t.key); setDetailId(null); }} style={tabStyle(tab === t.key)}>
                  {t.label}
                </div>
              ))}
            </div>
          </div>

          <div style={{ padding: '0 20px 12px', flex: 'none', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              className="btn btn-ghost"
              onClick={() => exportSessionToCsv(activeSession)}
              disabled={activeSession.participants.length === 0}
              style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <DownloadIcon />
              Télécharger (.csv)
            </button>
          </div>

          <div style={{ flex: 1, overflow: 'auto', padding: '0 20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            {tab === 'participants' && (
              <ParticipantsTab session={activeSession} refresh={refresh} detailId={detailId} setDetailId={setDetailId} />
            )}
            {tab === 'table' && <TableTab session={activeSession} refresh={refresh} />}
            {tab === 'results' && <ResultsTab session={activeSession} />}
          </div>
        </>
      )}
    </div>
  );
}
