// 5 samples split 2-vs-3 by a hidden truth letter (A = minority, B = majority,
// or vice versa) — the participant sees only the 3-digit codes, never the letters.
//
// Which letter is the minority is balanced across the session's participants
// (not an independent coin flip per participant) so "2A/3B" vs "2B/3A" stays
// within 1 of an even split regardless of how many people register — an
// independent 50/50 draw per participant would only be balanced on average,
// and can drift noticeably lopsided at small participant counts.
export function pickMinorityLetter(existingOrders) {
  let countA = 0;
  let countB = 0;
  for (const order of existingOrders) {
    const aCount = order.filter((o) => o === 'A').length;
    if (aCount === 2) countA++;
    else countB++;
  }
  if (countA < countB) return 'A';
  if (countB < countA) return 'B';
  return Math.random() < 0.5 ? 'A' : 'B';
}

export function genOrder(existingOrders = []) {
  const minority = pickMinorityLetter(existingOrders);
  const majority = minority === 'A' ? 'B' : 'A';
  const order = [minority, minority, majority, majority, majority];
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
}

export function genCodes(usedCodes, count) {
  const used = new Set(usedCodes);
  const codes = [];
  for (let i = 0; i < count; i++) {
    let c;
    do {
      c = String(Math.floor(100 + Math.random() * 900));
    } while (used.has(c));
    used.add(c);
    codes.push(c);
  }
  return codes;
}
