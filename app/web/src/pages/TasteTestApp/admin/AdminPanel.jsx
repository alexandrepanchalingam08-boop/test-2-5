import { useEffect, useState } from 'react';
import { createSession, deleteSession, setActiveSession } from '../../../lib/db.js';
import { TrashIcon, DownloadIcon, LinkIcon } from '../../../components/icons.jsx';
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
  const [linkCopied, setLinkCopied] = useState(false);
  // Which session's data is browsed in the admin tabs — independent from
  // which session is "active" (live for participants/Inscription). Only
  // seeded from activeSession once, on first load; changing the active
  // session afterward must not yank the admin's current view along with it.
  const [viewSessionId, setViewSessionId] = useState(activeSession?.id ?? null);
  useEffect(() => {
    if (viewSessionId === null && activeSession) setViewSessionId(activeSession.id);
  }, [activeSession, viewSessionId]);

  const viewSession = sessions.find((s) => s.id === viewSessionId) || activeSession || sessions[sessions.length - 1] || null;

  const sessionOptions = [...sessions].reverse().map((s) => ({
    id: s.id,
    label: `${s.productName}${s.day ? ' — ' + s.day : ''}${s.isActive ? ' (Active)' : ''}`,
  }));

  const onViewSessionChange = (e) => {
    const val = e.target.value;
    if (val === '__new__') {
      setDraft(emptyDraft());
      setCreating(true);
      return;
    }
    setCreating(false);
    setDetailId(null);
    setViewSessionId(val);
  };

  const onActiveSessionChange = async (e) => {
    await setActiveSession(e.target.value);
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
    const created = await createSession({
      productName: name,
      storeName: draft.place || activeSession?.storeName,
      day: draft.day,
      place: draft.place,
      slotLabels: draft.slotLabels,
      labelA: draft.labelA,
      labelB: draft.labelB,
    });
    // Only auto-activates when there was no active session at all yet
    // (first-ever session) — otherwise the currently active session stays
    // active, and the admin must pick the new one explicitly if it should
    // go live.
    if (!activeSession) await setActiveSession(created.id);
    setCreating(false);
    setDraft(emptyDraft());
    setDetailId(null);
    setViewSessionId(created.id);
    await refresh();
  };

  const onCopyLink = async () => {
    if (!viewSession) return;
    const url = `${window.location.origin}/inscription/${viewSession.id}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      window.prompt('Copiez ce lien :', url);
      return;
    }
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const onDeleteViewed = async () => {
    if (sessions.length <= 1 || !viewSession) return;
    const remaining = sessions.filter((s) => s.id !== viewSession.id);
    const wasActive = viewSession.isActive;
    await deleteSession(viewSession.id);
    if (wasActive) await setActiveSession(remaining[remaining.length - 1].id);
    setViewSessionId(remaining[remaining.length - 1].id);
    setDetailId(null);
    await refresh();
  };

  if (!activeSession && !creating) {
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
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
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
      <div style={{ padding: 'calc(56px + env(safe-area-inset-top)) 20px 4px', flex: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
        <select
          value={creating ? '__new__' : (viewSessionId ?? '')}
          onChange={onViewSessionChange}
          className="input"
          style={{ flex: 1, fontFamily: 'var(--font-heading)', fontSize: 14 }}
        >
          <option value="__new__">+ Nouvelle session</option>
          {sessionOptions.map((opt) => (
            <option key={opt.id} value={opt.id}>{opt.label}</option>
          ))}
        </select>
        {sessions.length > 1 && viewSession && (
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

      {!creating && activeSession && (
        <div style={{ padding: '0 20px 10px', flex: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, letterSpacing: '.06em', textTransform: 'uppercase', opacity: 0.55, flex: 'none' }}>
            Session active :
          </span>
          <select
            value={activeSession.id}
            onChange={onActiveSessionChange}
            className="input"
            style={{ flex: 1, fontSize: 13, minHeight: 32, padding: '3px 12px' }}
          >
            {sessionOptions.map((opt) => (
              <option key={opt.id} value={opt.id}>{opt.label}</option>
            ))}
          </select>
        </div>
      )}

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

      {!creating && viewSession && (
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

          <div style={{ padding: '0 20px 12px', flex: 'none', display: 'flex', justifyContent: 'flex-end', gap: 16 }}>
            <button
              className="btn btn-ghost"
              onClick={onCopyLink}
              style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <LinkIcon />
              {linkCopied ? 'Lien copié !' : "Lien d'inscription"}
            </button>
            <button
              className="btn btn-ghost"
              onClick={() => exportSessionToCsv(viewSession)}
              disabled={viewSession.participants.length === 0}
              style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <DownloadIcon />
              Télécharger (.csv)
            </button>
          </div>

          <div style={{ flex: 1, overflow: 'auto', padding: '0 20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            {tab === 'participants' && (
              <ParticipantsTab session={viewSession} refresh={refresh} detailId={detailId} setDetailId={setDetailId} />
            )}
            {tab === 'table' && <TableTab session={viewSession} refresh={refresh} />}
            {tab === 'results' && <ResultsTab session={viewSession} />}
          </div>
        </>
      )}
    </div>
  );
}
