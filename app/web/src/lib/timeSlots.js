// Half-hour slot labels between two hours, e.g. generateHalfHourSlots(11, 16)
// -> ['11h - 11h30', '11h30 - 12h', ..., '15h30 - 16h'].
export function generateHalfHourSlots(startHour, endHour) {
  const points = [];
  for (let totalMin = startHour * 60; totalMin <= endHour * 60; totalMin += 30) {
    const h = Math.floor(totalMin / 60);
    const m = totalMin % 60;
    points.push(m === 0 ? `${h}h` : `${h}h${m}`);
  }
  const slots = [];
  for (let i = 0; i < points.length - 1; i++) {
    slots.push(`${points[i]} - ${points[i + 1]}`);
  }
  return slots;
}

export const DEFAULT_SLOT_LABELS = generateHalfHourSlots(11, 16);
