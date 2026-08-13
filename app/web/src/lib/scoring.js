// The "truth" 2-sample group for a participant: whichever letter (A or B)
// appears exactly twice in truthOrder is the minority/group-of-2.
export function truthGroup2(participant) {
  const countA = participant.truthOrder.filter((o) => o === 'A').length;
  const minorityLetter = countA === 2 ? 'A' : 'B';
  return participant.codes.filter((_, i) => participant.truthOrder[i] === minorityLetter);
}

export function isCorrect(participant, bloc2) {
  const truth = [...truthGroup2(participant)].sort().join(',');
  const answer = [...bloc2].sort().join(',');
  return truth === answer;
}
