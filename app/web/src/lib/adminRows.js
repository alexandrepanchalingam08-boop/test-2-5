import { truthGroup2, isCorrect } from './scoring';

export function buildAdminRow(participant) {
  const truth2 = truthGroup2(participant);
  const sub = participant.submission;
  const correct = sub ? isCorrect(participant, sub.bloc2) : null;
  return {
    id: participant.id,
    name: participant.name,
    creneau: participant.creneau,
    codes: participant.codes,
    truthOrder: participant.truthOrder,
    correctBool: correct,
    codesStr: participant.codes.join(' · '),
    truth2Str: truth2.join(' + '),
    hasSubmission: !!sub,
    answerStr: sub ? sub.bloc2.join(' + ') : 'en attente',
    bloc3Str: sub ? sub.bloc3.join(' + ') : '',
    resultLabel: sub ? (correct ? 'Correct' : 'Incorrect') : '—',
    resultTagStyle: {
      display: 'inline-flex', alignItems: 'center', fontSize: 11, padding: '3px 10px', borderRadius: 999,
      background: sub ? (correct ? 'var(--color-correct-bg)' : 'var(--color-accent-100)') : 'var(--color-neutral-100)',
      color: sub ? (correct ? 'var(--color-correct-text)' : 'var(--color-accent-800)') : 'var(--color-neutral-700)',
    },
    intensityStr: sub ? `${sub.intensity}/100` : '',
    description: sub ? (sub.description || '(aucune description)') : '',
  };
}
