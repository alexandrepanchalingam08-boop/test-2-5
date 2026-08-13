import { BackIcon } from './icons.jsx';

export default function ProgressHeader({ show, showBack, onBack, progressPct }) {
  if (!show) return null;
  return (
    <div style={{ padding: 'calc(20px + env(safe-area-inset-top)) 20px 0', flex: 'none' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {showBack && (
          <button
            onClick={onBack}
            aria-label="Retour"
            style={{
              width: 36, height: 36, borderRadius: 999, border: '1px solid var(--color-divider)',
              background: 'var(--color-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', flex: 'none', color: 'var(--color-text)', padding: 0,
            }}
          >
            <BackIcon />
          </button>
        )}
        <div style={{ flex: 1, height: 6, borderRadius: 999, background: 'var(--color-neutral-300)', overflow: 'hidden' }}>
          <div style={{ height: '100%', borderRadius: 999, background: 'var(--color-accent)', width: `${progressPct}%` }} />
        </div>
      </div>
    </div>
  );
}
