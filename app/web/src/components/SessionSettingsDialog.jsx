import { useState } from 'react';
import { createSession, updateSession, setActiveSession } from '../lib/db.js';
import { DEFAULT_SLOT_LABELS } from '../lib/timeSlots.js';

function buildDraft(session) {
  return {
    sessionId: session ? session.id : '__new__',
    product: session?.productName ?? '',
    day: session?.day ?? '',
    place: session?.place ?? '',
    slotLabels: session?.slotLabels?.length ? [...session.slotLabels] : ['', '', ''],
    labelA: session?.labelA ?? '',
    labelB: session?.labelB ?? '',
  };
}

// Shared "Réglages du test" form — lets you edit an existing session's
// info, switch which one you're editing, create a new one, or explicitly
// activate one. Used from both the Inscription page (behind its own
// passcode gate) and the main app's admin panel (already behind AdminGate,
// so no gate needed here).
export default function SessionSettingsDialog({ sessions, activeSession, initialSessionId, onClose, refresh }) {
  const [draft, setDraft] = useState(() => buildDraft(sessions.find((s) => s.id === initialSessionId) ?? null));
  const [saving, setSaving] = useState(false);

  const sessionOptions = [...sessions].reverse().map((s) => ({ id: s.id, label: s.productName }));
  const isNewSession = !draft.sessionId || draft.sessionId === '__new__';

  const onDraftSessionChange = (e) => {
    const id = e.target.value;
    setDraft(buildDraft(id === '__new__' ? null : sessions.find((s) => s.id === id)));
  };

  const setSlotLabel = (i, value) => setDraft((d) => {
    const slotLabels = [...d.slotLabels];
    slotLabels[i] = value;
    return { ...d, slotLabels };
  });

  const onActivateDraftSession = async () => {
    if (!draft.sessionId || draft.sessionId === '__new__') return;
    await setActiveSession(draft.sessionId);
    await refresh();
  };

  const saveAdmin = async () => {
    setSaving(true);
    try {
      const productName = draft.product.trim() || 'Produit à tester';
      if (draft.sessionId && draft.sessionId !== '__new__') {
        // Editing settings never activates the session by itself — that's
        // the separate "Activer ce test" action above, so a session
        // prepared in advance doesn't go live just because it was edited.
        await updateSession(draft.sessionId, {
          productName, day: draft.day, place: draft.place, slotLabels: draft.slotLabels,
          labelA: draft.labelA, labelB: draft.labelB,
        });
      } else {
        const created = await createSession({
          productName, storeName: draft.place, day: draft.day, place: draft.place, slotLabels: draft.slotLabels,
          labelA: draft.labelA, labelB: draft.labelB,
        });
        // Only auto-activates if there was no active session at all yet.
        if (!activeSession) await setActiveSession(created.id);
      }
      await refresh();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <div className="dialog" onClick={(e) => e.stopPropagation()}>
        <span className="dialog-title">Réglages du test</span>
        <div className="dialog-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="field">
            <label htmlFor="admin-session">Test</label>
            <select id="admin-session" className="input" value={draft.sessionId} onChange={onDraftSessionChange}>
              <option value="__new__">+ Nouveau test</option>
              {sessionOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>{opt.label}</option>
              ))}
            </select>
            {!isNewSession && (
              draft.sessionId === activeSession?.id ? (
                <span style={{ fontSize: 12, opacity: 0.6, marginTop: 6, display: 'inline-block' }}>Ce test est actuellement actif.</span>
              ) : (
                <button
                  type="button" className="btn btn-ghost" onClick={onActivateDraftSession}
                  style={{ fontSize: 12, marginTop: 4, paddingInline: 0 }}
                >
                  Activer ce test
                </button>
              )
            )}
          </div>
          <div className="field">
            <label htmlFor="admin-product">Nom du produit</label>
            <input id="admin-product" className="input" type="text" value={draft.product} onChange={(e) => setDraft((d) => ({ ...d, product: e.target.value }))} />
          </div>
          <div className="field">
            <label htmlFor="admin-day">Date</label>
            <input id="admin-day" className="input" type="text" value={draft.day} onChange={(e) => setDraft((d) => ({ ...d, day: e.target.value }))} />
          </div>
          <div className="field">
            <label htmlFor="admin-place">Lieu</label>
            <input id="admin-place" className="input" type="text" value={draft.place} onChange={(e) => setDraft((d) => ({ ...d, place: e.target.value }))} />
          </div>
          {draft.slotLabels.map((val, i) => (
            <div className="field" key={i}>
              <label>Créneau {i + 1}</label>
              <select className="input" value={val} onChange={(e) => setSlotLabel(i, e.target.value)}>
                <option value="">Choisir un créneau…</option>
                {!!val && !DEFAULT_SLOT_LABELS.includes(val) && <option value={val}>{val}</option>}
                {DEFAULT_SLOT_LABELS.map((label) => (
                  <option key={label} value={label}>{label}</option>
                ))}
              </select>
            </div>
          ))}
          <div className="field">
            <label htmlFor="admin-label-a">Correspondance du groupe A</label>
            <input
              id="admin-label-a" className="input" type="text" value={draft.labelA}
              placeholder="ex : recette actuelle"
              onChange={(e) => setDraft((d) => ({ ...d, labelA: e.target.value }))}
            />
          </div>
          <div className="field">
            <label htmlFor="admin-label-b">Correspondance du groupe B</label>
            <input
              id="admin-label-b" className="input" type="text" value={draft.labelB}
              placeholder="ex : recette modifiée"
              onChange={(e) => setDraft((d) => ({ ...d, labelB: e.target.value }))}
            />
          </div>
        </div>
        <div className="dialog-actions">
          <button className="btn btn-secondary" onClick={onClose}>Annuler</button>
          <button className="btn btn-primary" onClick={saveAdmin} disabled={saving}>Enregistrer</button>
        </div>
      </div>
    </div>
  );
}
