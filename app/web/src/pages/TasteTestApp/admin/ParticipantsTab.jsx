import { buildAdminRow } from '../../../lib/adminRows.js';
import { BackIcon } from '../../../components/icons.jsx';

export default function ParticipantsTab({ session, detailId, setDetailId }) {
  const rows = session.participants.map(buildAdminRow);

  if (detailId) {
    const row = rows.find((r) => r.id === detailId);
    if (!row) {
      setDetailId(null);
      return null;
    }
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <button
          onClick={() => setDetailId(null)}
          style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 6, background: 'transparent', border: 'none', color: 'var(--color-accent-700)', fontSize: 13, cursor: 'pointer', padding: 0 }}
        >
          <BackIcon width={16} height={16} />
          Participants
        </button>
        <div className="card elev-sm" style={{ gap: 10 }}>
          <span className="card-title" style={{ fontSize: 19 }}>{row.name}</span>
          <span style={{ fontSize: 11, opacity: 0.6 }}>{row.creneau}</span>
          <div style={{ fontSize: 13, opacity: 0.8 }}>Codes : {row.codesStr}</div>
          <span className="tag tag-accent-2" style={{ alignSelf: 'flex-start' }}>Groupe de 2 (vérité) : {row.truth2Str}</span>
          <div style={{ height: 1, background: 'var(--color-divider)', margin: '4px 0' }} />
          {row.hasSubmission ? (
            <>
              <div style={{ fontSize: 13 }}>Bloc de 2 (réponse) : {row.answerStr}</div>
              <div style={{ fontSize: 13 }}>Bloc de 3 (réponse) : {row.bloc3Str}</div>
              <span style={row.resultTagStyle}>{row.resultLabel}</span>
              <div style={{ fontSize: 13 }}>Intensité perçue : {row.intensityStr}</div>
              <div style={{ fontSize: 14, lineHeight: 1.6, fontStyle: 'italic', opacity: 0.85 }}>« {row.description} »</div>
            </>
          ) : (
            <span style={{ fontSize: 13, opacity: 0.6 }}>Ce participant n'a pas encore répondu.</span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <span style={{ fontSize: 11, letterSpacing: '.08em', textTransform: 'uppercase', opacity: 0.55 }}>
        Correspondances — {session.productName}
      </span>
      {rows.length === 0 && (
        <p style={{ margin: 0, fontSize: 13, opacity: 0.6 }}>Aucun participant inscrit pour ce test.</p>
      )}
      {rows.map((row) => (
        <div key={row.id} className="card elev-sm" style={{ gap: 8, cursor: 'pointer' }} onClick={() => setDetailId(row.id)}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span className="card-title">{row.name}</span>
            <span style={{ fontSize: 11, opacity: 0.55 }}>{row.creneau}</span>
          </div>
          <div style={{ fontSize: 12, opacity: 0.7 }}>Codes : {row.codesStr}</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <span className="tag tag-accent-2">Groupe de 2 (vérité) : {row.truth2Str}</span>
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            <span className="tag tag-neutral">Réponse : {row.answerStr}</span>
            <span style={row.resultTagStyle}>{row.resultLabel}</span>
          </div>
          {row.hasSubmission && (
            <>
              <div style={{ fontSize: 12, opacity: 0.7 }}>Intensité : {row.intensityStr}</div>
              <div style={{ fontSize: 12, opacity: 0.7, fontStyle: 'italic' }}>« {row.description} »</div>
            </>
          )}
        </div>
      ))}
    </div>
  );
}
