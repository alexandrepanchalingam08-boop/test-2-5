import { useState } from 'react';

export const ADMIN_CODE = 'QuickR&D2026';

export default function AdminGate({ onSuccess, onExit }) {
  const [code, setCode] = useState('');
  const [error, setError] = useState(false);

  const submit = () => {
    if (code === ADMIN_CODE) onSuccess();
    else setError(true);
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', gap: 14, padding: '40px 24px' }}>
      <span style={{ fontFamily: 'var(--font-heading)', fontSize: 11, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--color-accent-700)' }}>Accès réservé</span>
      <h2 style={{ margin: 0 }}>Espace administrateur</h2>
      <p style={{ margin: 0, fontSize: 13, opacity: 0.7, maxWidth: 240 }}>Réservé à l'organisateur du test.</p>
      <input
        className="input" type="password" placeholder="Code d'accès" value={code}
        onChange={(e) => { setCode(e.target.value); setError(false); }}
        onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
        style={{ marginTop: 10, maxWidth: 200, textAlign: 'center' }}
      />
      {error && <span style={{ fontSize: 12, color: 'var(--color-accent-700)' }}>Code incorrect</span>}
      <button className="btn btn-primary" onClick={submit} style={{ marginTop: 6 }}>Valider</button>
      <button className="btn btn-ghost" onClick={onExit} style={{ fontSize: 12 }}>Retour au test</button>
    </div>
  );
}
