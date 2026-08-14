import { useEffect, useRef, useState } from 'react';
import ProgressHeader from '../../components/ProgressHeader.jsx';
import { submitAnswer } from '../../lib/db.js';
import { isCorrect } from '../../lib/scoring.js';

const PROTOCOL_STEPS = [
  { n: 1, text: 'Regroupez les 5 échantillons selon leur ressemblance perçue (2 contre 3).' },
  { n: 2, text: "Notez l'intensité de la différence entre les deux groupes." },
  { n: 3, text: 'Décrivez ce que vous percevez comme différence.' },
];

const CTA_LABELS = {
  0: 'Continuer',
  1: "J'ai compris, continuer",
  2: 'Passer au classement',
  3: 'Continuer',
  4: 'Continuer',
  5: 'Envoyer mes réponses',
};

function chipStyle(isDraggingThis) {
  return {
    width: 48, height: 48, borderRadius: '50%', flex: 'none',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: 'var(--font-heading)', fontSize: 14,
    background: 'var(--color-surface)', border: '1px solid var(--color-divider)',
    cursor: 'grab', touchAction: 'none', userSelect: 'none',
    opacity: isDraggingThis ? 0 : 1,
  };
}

const emptySlotStyle = { width: 48, height: 48, borderRadius: '50%', flex: 'none', border: '1.5px dashed var(--color-neutral-400)' };
const blockStyle = {
  display: 'flex', flexWrap: 'wrap', gap: 10, minHeight: 60,
  padding: 10, borderRadius: 'var(--radius-lg)', justifyContent: 'center',
  border: '1.5px dashed var(--color-divider)', background: 'var(--color-surface)',
};

export default function ParticipantFlow({ session, onOpenAdminGate }) {
  const [step, setStep] = useState(0);
  const [selectedName, setSelectedName] = useState('');
  const [locations, setLocations] = useState({});
  const [dragging, setDragging] = useState(null);
  const [intensity, setIntensity] = useState(50);
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const poolRef = useRef(null);
  const block2Ref = useRef(null);
  const block3Ref = useRef(null);
  const draggingRef = useRef(null);
  useEffect(() => { draggingRef.current = dragging; }, [dragging]);
  const locationsRef = useRef(locations);
  useEffect(() => { locationsRef.current = locations; }, [locations]);

  useEffect(() => {
    if (step !== 3) return undefined;
    const onMove = (e) => {
      if (!draggingRef.current) return;
      setDragging((d) => (d ? { ...d, x: e.clientX, y: e.clientY } : d));
    };
    const onUp = () => {
      const d = draggingRef.current;
      if (!d) return;
      const { code, x, y } = d;
      const inRect = (ref) => {
        if (!ref.current) return false;
        const r = ref.current.getBoundingClientRect();
        return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
      };
      const locs = { ...locationsRef.current };
      const countIn = (loc) => Object.entries(locs).filter(([c, l]) => l === loc && c !== code).length;
      const overB2 = inRect(block2Ref);
      const overB3 = inRect(block3Ref);
      let newLoc = 'pool';
      if (overB2 && countIn('b2') < 2) newLoc = 'b2';
      else if (overB3 && countIn('b3') < 3) newLoc = 'b3';
      else if (overB2 || overB3) newLoc = locs[code];
      locs[code] = newLoc;
      setLocations(locs);
      setDragging(null);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [step]);

  const nameOptions = session.participants.filter((p) => !p.submission).map((p) => p.name);
  const participant = session.participants.find((p) => p.name === selectedName) || null;
  const codes = participant ? participant.codes : [];

  const onNameChange = (e) => {
    const name = e.target.value;
    const p = session.participants.find((x) => x.name === name);
    const c = p ? p.codes : [];
    setSelectedName(name);
    setLocations(Object.fromEntries(c.map((code) => [code, 'pool'])));
  };

  const startDrag = (code, e) => {
    e.preventDefault();
    setDragging({ code, x: e.clientX, y: e.clientY });
  };

  const poolCodes = codes.filter((c) => (locations[c] ?? 'pool') === 'pool');
  const b2Codes = codes.filter((c) => locations[c] === 'b2');
  const b3Codes = codes.filter((c) => locations[c] === 'b3');
  const b2Empty = Array.from({ length: Math.max(0, 2 - b2Codes.length) });
  const b3Empty = Array.from({ length: Math.max(0, 3 - b3Codes.length) });

  const progressPct = step < 1 ? 0 : step > 5 ? 100 : (step / 5) * 100;
  const ctaDisabled = (step === 0 && !selectedName) || (step === 3 && poolCodes.length > 0) || submitting;
  const showHeader = step >= 1 && step <= 5;
  const showCta = step <= 5;

  const next = async () => {
    if (step === 5) {
      setSubmitting(true);
      try {
        await submitAnswer(participant.id, session.id, { bloc2: b2Codes, bloc3: b3Codes, intensity, description });
      } finally {
        setSubmitting(false);
      }
    }
    setStep((s) => Math.min(6, s + 1));
  };
  const back = () => setStep((s) => Math.max(0, s - 1));

  const renderChip = (code) => (
    <div key={code} onPointerDown={(e) => startDrag(code, e)} style={chipStyle(dragging?.code === code)}>
      {code}
    </div>
  );

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <ProgressHeader show={showHeader} showBack={showHeader} onBack={back} progressPct={progressPct} />

      <div style={{ flex: 1, overflow: 'auto', padding: '0 20px 8px', position: 'relative' }}>
        {step === 0 && (
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 16, padding: '40px 8px' }}>
            <span style={{ fontFamily: 'var(--font-heading)', fontSize: 28, color: 'var(--color-accent-700)', textAlign: 'center' }}>{session.productName}</span>
            <span style={{ fontSize: 12, letterSpacing: '.08em', textTransform: 'uppercase', opacity: 0.6, marginTop: -12, textAlign: 'center' }}>
              {session.day || new Date(session.createdAt).toLocaleDateString('fr-FR')}
            </span>
            <h1 style={{ margin: 0, fontSize: 12, lineHeight: 1.15, textAlign: 'center' }}>
              Test de discrimination<br />2 parmi 5
            </h1>
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, opacity: 0.75, maxWidth: 280 }}>Sélectionnez votre nom pour commencer.</p>
            <div className="field" style={{ marginTop: 6 }}>
              <label htmlFor="name-select">Votre nom</label>
              <select id="name-select" className="input" value={selectedName} onChange={onNameChange}>
                <option value="">Choisissez votre nom</option>
                {nameOptions.map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
            <button className="btn btn-ghost" onClick={onOpenAdminGate} style={{ alignSelf: 'flex-start', fontSize: 12, paddingInline: 0, marginTop: 2 }}>
              Accès administrateur
            </button>
          </div>
        )}

        {step === 1 && (
          <div style={{ paddingTop: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <span className="tag tag-accent" style={{ alignSelf: 'flex-start' }}>Protocole</span>
            <h2 style={{ margin: 0 }}>Comment se déroule ce test</h2>
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, opacity: 0.85 }}>
              5 échantillons vous sont présentés. Répartissez-les en deux groupes : un groupe de 2 échantillons identiques, un groupe de 3 échantillons identiques. Donnez obligatoirement une réponse.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 6 }}>
              {PROTOCOL_STEPS.map((p) => (
                <div key={p.n} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, background: 'var(--color-surface)', borderRadius: 'var(--radius-md)', padding: '12px 14px' }}>
                  <span style={{ width: 26, height: 26, borderRadius: '50%', background: 'var(--color-accent-2)', color: 'var(--color-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-heading)', fontSize: 13, flex: 'none' }}>{p.n}</span>
                  <span style={{ fontSize: 13.5, lineHeight: 1.5, paddingTop: 3 }}>{p.text}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div style={{ paddingTop: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <span className="tag tag-accent" style={{ alignSelf: 'flex-start' }}>Vos échantillons</span>
            <h2 style={{ margin: 0 }}>5 échantillons vous sont attribués</h2>
            <p style={{ margin: 0, fontSize: 14, opacity: 0.75 }}>Dégustez-les dans l'ordre de votre choix.</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 8 }}>
              {codes.map((code) => (
                <div key={code} className="card elev-sm" style={{ alignItems: 'center', textAlign: 'center', padding: '20px 8px' }}>
                  <span style={{ fontFamily: 'var(--font-heading)', fontSize: 26 }}>{code}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div style={{ paddingTop: 20, display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center', textAlign: 'center' }}>
            <span className="tag tag-accent">Regroupement</span>
            <h2 style={{ margin: '10px 0 2px' }}>Classez les échantillons en 2 groupes</h2>
            <p style={{ margin: '0 0 10px', fontSize: 14, opacity: 0.7 }}>Faites glisser chaque code vers un bloc, selon leur ressemblance perçue.</p>
            <div ref={poolRef} style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 10, minHeight: 56, width: '100%' }}>
              {poolCodes.map(renderChip)}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 20, width: '100%', alignItems: 'center' }}>
              <div style={{ width: '100%' }}>
                <div style={{ fontSize: 11, letterSpacing: '.08em', textTransform: 'uppercase', opacity: 0.55, marginBottom: 8, textAlign: 'center' }}>Bloc de 2</div>
                <div ref={block2Ref} style={blockStyle}>
                  {b2Codes.map(renderChip)}
                  {b2Empty.map((_, i) => <div key={`e2-${i}`} style={emptySlotStyle} />)}
                </div>
              </div>
              <div style={{ width: '100%' }}>
                <div style={{ fontSize: 11, letterSpacing: '.08em', textTransform: 'uppercase', opacity: 0.55, marginBottom: 8, textAlign: 'center' }}>Bloc de 3</div>
                <div ref={block3Ref} style={blockStyle}>
                  {b3Codes.map(renderChip)}
                  {b3Empty.map((_, i) => <div key={`e3-${i}`} style={emptySlotStyle} />)}
                </div>
              </div>
            </div>
          </div>
        )}

        {dragging && (
          <div
            style={{
              position: 'fixed', left: dragging.x - 24, top: dragging.y - 24,
              width: 48, height: 48, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--font-heading)', fontSize: 14,
              background: 'var(--color-accent)', color: 'var(--color-bg)',
              border: '1px solid var(--color-accent)', pointerEvents: 'none',
              zIndex: 999, boxShadow: 'var(--shadow-md)',
            }}
          >
            {dragging.code}
          </div>
        )}

        {step === 4 && (
          <div style={{ paddingTop: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span className="tag tag-accent" style={{ alignSelf: 'flex-start' }}>Intensité</span>
            <h2 style={{ margin: '10px 0 2px' }}>Quelle est l'intensité de la différence perçue ?</h2>
            <p style={{ margin: '0 0 20px', fontSize: 14, opacity: 0.7 }}>Entre le groupe de 2 et le groupe de 3.</p>
            <input
              type="range" min="0" max="100" value={intensity}
              onChange={(e) => setIntensity(Number(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--color-accent)', height: 24 }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, opacity: 0.65, marginTop: 4 }}>
              <span>Très faible</span>
              <span>Moyenne</span>
              <span>Très forte</span>
            </div>
          </div>
        )}

        {step === 5 && (
          <div style={{ paddingTop: 20, display: 'flex', flexDirection: 'column', gap: 6, position: 'relative' }}>
            <span className="tag tag-accent" style={{ alignSelf: 'flex-start' }}>Description</span>
            <h2 style={{ margin: '10px 0 2px' }}>Qu'avez-vous perçu ?</h2>
            <p style={{ margin: '0 0 4px', fontSize: 14, opacity: 0.7 }}>
              Décrivez la nature de la différence perçue et la ou les composante(s) du {session.productName} qu'elle affecte.
            </p>
            <textarea
              className="input" rows={6} placeholder="Décrivez votre perception ici…"
              value={description} onChange={(e) => setDescription(e.target.value)}
              style={{
                marginTop: 14, textAlign: 'center', width: '100%', maxWidth: '100%', boxSizing: 'border-box',
                overflowWrap: 'break-word', wordBreak: 'break-word', whiteSpace: 'pre-wrap', resize: 'none',
                backgroundColor: 'var(--color-neutral-300)', borderRadius: '50%', padding: '40px 30px',
              }}
            />
          </div>
        )}

        {step === 6 && participant && (
          <ThankYouStep participant={participant} bloc2={b2Codes} />
        )}
      </div>

      {showCta && (
        <div style={{ padding: '14px 20px 30px', flex: 'none' }}>
          <button className="btn btn-primary btn-block" onClick={next} disabled={ctaDisabled} style={{ height: 50, fontSize: 15, marginTop: 0 }}>
            {CTA_LABELS[step] || 'Continuer'}
          </button>
        </div>
      )}
    </div>
  );
}

function ThankYouStep({ participant, bloc2 }) {
  const correct = isCorrect(participant, bloc2);
  const hearts = Array.from({ length: 8 }).map((_, i) => ({
    key: i,
    style: {
      position: 'absolute', bottom: '-10%', left: `${8 + i * 11}%`,
      fontSize: 18 + (i % 3) * 8, animation: `heartFloat ${2.4 + (i % 4) * 0.4}s ease-in ${i * 0.15}s infinite`,
      pointerEvents: 'none',
    },
  }));
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: 16, padding: '40px 16px', position: 'relative', overflow: 'hidden' }}>
      {hearts.map((h) => <span key={h.key} style={h.style}>❤️</span>)}
      <span
        style={{
          fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 22, letterSpacing: '.05em',
          padding: '8px 24px', borderRadius: 999,
          background: correct ? 'var(--color-correct-bg)' : 'var(--color-accent-100)',
          color: correct ? 'var(--color-correct-text)' : 'var(--color-accent-800)',
        }}
      >
        {correct ? 'CORRECTE' : 'INCORRECTE'}
      </span>
      <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--color-accent-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-bg)', flex: 'none' }}>
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.75" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
      </div>
      <h2 style={{ margin: 0 }}>Merci pour votre participation</h2>
      <p style={{ margin: 0, fontSize: 14, opacity: 0.75, maxWidth: 260 }}>Vos réponses ont été enregistrées pour l'analyse du panel.</p>
    </div>
  );
}
