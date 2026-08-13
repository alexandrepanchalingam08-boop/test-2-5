import { useState } from 'react';
import { useSessions } from '../../lib/SessionsContext.jsx';
import AdminGate from '../../components/AdminGate.jsx';
import AdminPanel from './admin/AdminPanel.jsx';
import ParticipantFlow from './ParticipantFlow.jsx';

export default function TasteTestApp() {
  const { sessions, activeSession, loading, error, refresh } = useSessions();
  const [mode, setMode] = useState('participant');

  return (
    <div className="app-shell">
      {loading && <CenteredMessage text="Chargement…" />}
      {!loading && error && <CenteredMessage text="Impossible de charger les données. Vérifiez la connexion." />}
      {!loading && !error && mode === 'gate' && (
        <AdminGate onSuccess={() => setMode('admin')} onExit={() => setMode('participant')} />
      )}
      {!loading && !error && mode === 'admin' && (
        <AdminPanel sessions={sessions} activeSession={activeSession} refresh={refresh} onExit={() => setMode('participant')} />
      )}
      {!loading && !error && mode === 'participant' && (
        activeSession ? (
          <ParticipantFlow session={activeSession} onOpenAdminGate={() => setMode('gate')} />
        ) : (
          <NoActiveSession onOpenAdminGate={() => setMode('gate')} />
        )
      )}
    </div>
  );
}

function CenteredMessage({ text }) {
  return (
    <div style={{ height: '100%', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 24 }}>
      <p style={{ margin: 0, fontSize: 14, opacity: 0.7 }}>{text}</p>
    </div>
  );
}

function NoActiveSession({ onOpenAdminGate }) {
  return (
    <div style={{ height: '100%', minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', gap: 14, padding: '40px 24px' }}>
      <h2 style={{ margin: 0 }}>Aucun test actif</h2>
      <p style={{ margin: 0, fontSize: 14, opacity: 0.75, maxWidth: 260 }}>
        Créez un test depuis l'espace administrateur pour commencer.
      </p>
      <button className="btn btn-ghost" onClick={onOpenAdminGate} style={{ fontSize: 12 }}>Accès administrateur</button>
    </div>
  );
}
