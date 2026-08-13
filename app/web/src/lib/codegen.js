// 5 samples split 2-vs-3 by a hidden truth letter (A = minority, B = majority,
// or vice versa) — the participant sees only the 3-digit codes, never the letters.
export function genOrder() {
  const minority = Math.random() < 0.5 ? 'A' : 'B';
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
