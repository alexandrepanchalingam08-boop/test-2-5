import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useSessions } from '../../lib/SessionsContext.jsx';
import { createSession, updateSession, setActiveSession, registerParticipant, removeParticipant } from '../../lib/db.js';
import { ADMIN_CODE } from '../../components/AdminGate.jsx';
import { CloseIcon } from '../../components/icons.jsx';
import { DEFAULT_SLOT_LABELS } from '../../lib/timeSlots.js';

const SPOTS_PER_SLOT = 4;

function emptyDraft() {
  return { sessionId: '__new__', product: '', day: '', place: '', slotLabels: ['', '', ''], labelA: '', labelB: '' };
}

export default function Inscription() {
  const { sessionId: urlSessionId } = useParams();
  const { sessions, activeSession, loading, refresh } = useSessions();
  // A URL like /inscription/<id> pins this page to that exact session,
  // regardless of which one is globally active — lets each session have
  // its own stable sign-up link. Plain /inscription keeps following
  // whichever session is active, as before.
  const currentSession = urlSessionId ? sessions.find((s) => s.id === urlSessionId) : activeSession;
  const sessionNotFound = !!urlSessionId && !loading && !currentSession;
  const [gateOpen, setGateOpen] = useState(false);
  const [gateCode, setGateCode] = useState('');
  const [gateError, setGateError] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [draft, setDraft] = useState(emptyDraft());
  const [regDrafts, setRegDrafts] = useState({});
  const [saving, setSaving] = useState(false);

  const openAdmin = () => { setGateOpen(true); setGateCode(''); setGateError(false); };
  const closeDialogs = () => { setGateOpen(false); setAdminOpen(false); };

  const loadDraftFromSession = (session) => {
    setDraft({
      sessionId: session ? session.id : '__new__',
      product: session?.productName ?? '',
      day: session?.day ?? '',
      place: session?.place ?? '',
      slotLabels: session?.slotLabels?.length ? [...session.slotLabels] : ['', '', ''],
      labelA: session?.labelA ?? '',
      labelB: session?.labelB ?? '',
    });
  };

  const onGateSubmit = () => {
    if (gateCode !== ADMIN_CODE) { setGateError(true); return; }
    setGateOpen(false);
    setAdminOpen(true);
    loadDraftFromSession(currentSession);
  };

  const onDraftSessionChange = (e) => {
    const id = e.target.value;
    if (id === '__new__') setDraft(emptyDraft());
    else loadDraftFromSession(sessions.find((s) => s.id === id));
  };

  const setSlotLabel = (i, value) => setDraft((d) => {
    const slotLabels = [...d.slotLabels];
    slotLabels[i] = value;
    return { ...d, slotLabels };
  });

  const saveAdmin = async () => {
    setSaving(true);
    try {
      const productName = draft.product.trim() || 'Produit à tester';
      if (draft.sessionId && draft.sessionId !== '__new__') {
        await updateSession(draft.sessionId, {
          productName, day: draft.day, place: draft.place, slotLabels: draft.slotLabels,
          labelA: draft.labelA, labelB: draft.labelB,
        });
        await setActiveSession(draft.sessionId);
      } else {
        const created = await createSession({
          productName, storeName: draft.place, day: draft.day, place: draft.place, slotLabels: draft.slotLabels,
          labelA: draft.labelA, labelB: draft.labelB,
        });
        await setActiveSession(created.id);
      }
      setAdminOpen(false);
      await refresh();
    } finally {
      setSaving(false);
    }
  };

  const regKey = (slotLabel, idx) => `${currentSession?.id}:${slotLabel}:${idx}`;
  const setRegDraft = (slotLabel, idx, value) => setRegDrafts((d) => ({ ...d, [regKey(slotLabel, idx)]: value }));
  const register = async (slotLabel, idx) => {
    if (!currentSession) return;
    const key = regKey(slotLabel, idx);
    const name = (regDrafts[key] || '').trim();
    if (!name) return;
    const inSlot = currentSession.participants.filter((p) => p.creneau === slotLabel).length;
    if (inSlot >= SPOTS_PER_SLOT) return;
    setRegDrafts((d) => ({ ...d, [key]: '' }));
    await registerParticipant(currentSession.id, { name, creneau: slotLabel });
    await refresh();
  };
  const unregister = async (participantId) => {
    await removeParticipant(participantId);
    await refresh();
  };

  if (loading) {
    return <div className="app-shell" style={{ maxWidth: 640, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><p style={{ opacity: 0.7 }}>Chargement…</p></div>;
  }

  const slotLabels = currentSession?.slotLabels?.length ? currentSession.slotLabels : DEFAULT_SLOT_LABELS;
  const sessionOptions = [...sessions].reverse().map((s) => ({ id: s.id, label: s.productName }));
  const isNewSession = !draft.sessionId || draft.sessionId === '__new__';

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)', padding: '56px 24px', display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: 640, display: 'flex', flexDirection: 'column', gap: 28 }}>

        {currentSession ? (
          <>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span className="tag tag-accent" style={{ alignSelf: 'flex-start' }}>Inscription</span>
                <h1 style={{ margin: 0 }}>{currentSession.productName}</h1>
                <span style={{ fontSize: 21, fontWeight: 700, letterSpacing: '.04em', textTransform: 'uppercase', opacity: 0.75 }}>
                  {currentSession.day || new Date(currentSession.createdAt).toLocaleDateString('fr-FR')}
                </span>
                <p style={{ margin: '4px 0 0', fontSize: 14, opacity: 0.7 }}>Merci de vous inscrire dans l'un des créneaux ci-dessous.</p>
              </div>
              <button className="btn btn-ghost" onClick={openAdmin} style={{ flex: 'none', fontSize: 12 }}>Admin</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {slotLabels.map((label) => {
                const hasLabel = !!label && !!label.trim();
                const list = currentSession.participants.filter((p) => p.creneau === label);
                const full = list.length >= SPOTS_PER_SLOT;
                const spots = Array.from({ length: SPOTS_PER_SLOT }).map((_, idx) => list[idx]);
                return (
                  <div key={label || '_empty_'} className="card elev-sm" style={{ gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span className="card-title">{label || '(créneau sans nom)'}</span>
                      <span className={`tag ${full ? 'tag-accent-2' : 'tag-neutral'}`}>{list.length}/{SPOTS_PER_SLOT}</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {spots.map((p, idx) => {
                        const filled = !!p;
                        const key = regKey(label, idx);
                        const rowStyle = {
                          display: 'flex', alignItems: 'center', gap: 8, minHeight: 44,
                          padding: filled ? '8px 14px' : '0', borderRadius: 999,
                          background: filled ? 'var(--color-accent-100)' : 'transparent',
                          border: filled ? '1px solid var(--color-accent-300)' : 'none',
                          justifyContent: filled ? 'space-between' : 'flex-start',
                        };
                        return (
                          <div key={idx} style={rowStyle}>
                            {filled ? (
                              <>
                                <span style={{ fontSize: 14 }}>{p.name}</span>
                                <button
                                  onClick={() => unregister(p.id)}
                                  aria-label="Retirer"
                                  style={{ width: 28, height: 28, borderRadius: '50%', border: '1px solid var(--color-divider)', background: 'var(--color-bg)', color: 'var(--color-text)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0, flex: 'none' }}
                                >
                                  <CloseIcon />
                                </button>
                              </>
                            ) : hasLabel ? (
                              <>
                                <input
                                  className="input" type="text" placeholder="Votre nom" value={regDrafts[key] || ''}
                                  onChange={(e) => setRegDraft(label, idx, e.target.value)}
                                  onKeyDown={(e) => { if (e.key === 'Enter') register(label, idx); }}
                                  style={{ flex: 1, minHeight: 38 }}
                                />
                                <button className="btn btn-secondary" onClick={() => register(label, idx)} style={{ height: 38, fontSize: 13, flex: 'none' }}>S'inscrire</button>
                              </>
                            ) : (
                              <span style={{ fontSize: 13, opacity: 0.55, fontStyle: 'italic' }}>Renseignez d'abord l'intitulé du créneau dans les réglages.</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : sessionNotFound ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'flex-start' }}>
            <span className="tag tag-accent">Inscription</span>
            <h1 style={{ margin: 0 }}>Test introuvable</h1>
            <p style={{ margin: 0, fontSize: 14, opacity: 0.75 }}>
              Ce lien d'inscription ne correspond à aucun test existant — il a peut-être été supprimé.
            </p>
            <button className="btn btn-primary" onClick={openAdmin}>Admin</button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'flex-start' }}>
            <span className="tag tag-accent">Inscription</span>
            <h1 style={{ margin: 0 }}>Aucun test actif</h1>
            <p style={{ margin: 0, fontSize: 14, opacity: 0.75 }}>Créez d'abord un test depuis l'espace admin de l'app de dégustation, ou créez-en un ici.</p>
            <button className="btn btn-primary" onClick={openAdmin}>Admin</button>
          </div>
        )}

        {gateOpen && (
          <div className="dialog-backdrop" onClick={closeDialogs}>
            <div className="dialog" onClick={(e) => e.stopPropagation()}>
              <span className="dialog-title">Accès administrateur</span>
              <div className="dialog-body" style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center', textAlign: 'center' }}>
                <p style={{ margin: 0, fontSize: 13, opacity: 0.7 }}>Réservé à l'organisateur du test.</p>
                <input
                  className="input" type="password" placeholder="Code d'accès" value={gateCode}
                  onChange={(e) => { setGateCode(e.target.value); setGateError(false); }}
                  onKeyDown={(e) => { if (e.key === 'Enter') onGateSubmit(); }}
                  style={{ maxWidth: 200, textAlign: 'center' }}
                />
                {gateError && <span style={{ fontSize: 12, color: 'var(--color-accent-700)' }}>Code incorrect</span>}
              </div>
              <div className="dialog-actions">
                <button className="btn btn-secondary" onClick={closeDialogs}>Annuler</button>
                <button className="btn btn-primary" onClick={onGateSubmit}>Valider</button>
              </div>
            </div>
          </div>
        )}

        {adminOpen && (
          <div className="dialog-backdrop" onClick={closeDialogs}>
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
                </div>
                {isNewSession && (
                  <div className="field">
                    <label htmlFor="admin-product">Nom du produit</label>
                    <input id="admin-product" className="input" type="text" value={draft.product} onChange={(e) => setDraft((d) => ({ ...d, product: e.target.value }))} />
                  </div>
                )}
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
                <button className="btn btn-secondary" onClick={closeDialogs}>Annuler</button>
                <button className="btn btn-primary" onClick={saveAdmin} disabled={saving}>Enregistrer</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
