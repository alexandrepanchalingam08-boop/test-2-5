import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { fetchSessions, subscribeToChanges } from './db';

const SessionsCtx = createContext(null);

export function SessionsProvider({ children }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const refreshing = useRef(false);

  const refresh = useCallback(async () => {
    if (refreshing.current) return;
    refreshing.current = true;
    try {
      const data = await fetchSessions();
      setSessions(data);
      setError(null);
    } catch (e) {
      setError(e);
    } finally {
      refreshing.current = false;
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const unsubscribe = subscribeToChanges(() => refresh());
    const onFocus = () => refresh();
    window.addEventListener('focus', onFocus);
    return () => {
      unsubscribe();
      window.removeEventListener('focus', onFocus);
    };
  }, [refresh]);

  const activeSession = sessions.find((s) => s.isActive) || null;

  return (
    <SessionsCtx.Provider value={{ sessions, loading, error, refresh, activeSession }}>
      {children}
    </SessionsCtx.Provider>
  );
}

export function useSessions() {
  const ctx = useContext(SessionsCtx);
  if (!ctx) throw new Error('useSessions must be used within SessionsProvider');
  return ctx;
}
