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

// Which letter lands in the first position is balanced the same way as the
// minority letter — a plain shuffle would already favor the majority letter
// there (3 of its 5 slots vs 2), on top of whatever skew the minority-letter
// balance itself introduces.
export function pickFirstLetter(existingOrders) {
  let countA = 0;
  let countB = 0;
  for (const order of existingOrders) {
    if (order[0] === 'A') countA++;
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
  // Force position 0 to the balanced choice without disturbing the 2-vs-3
  // composition: swap it in from wherever it landed (always found, since
  // both letters are always present in a 2-vs-3 split).
  const desiredFirst = pickFirstLetter(existingOrders);
  if (order[0] !== desiredFirst) {
    const swapIndex = order.findIndex((letter, idx) => idx > 0 && letter === desiredFirst);
    [order[0], order[swapIndex]] = [order[swapIndex], order[0]];
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
