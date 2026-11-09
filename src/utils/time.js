// Time helpers used by the business rules (opening hours + delivery slots).
// All times in the JSON file are written as "HH:MM" strings (24h format).

// "09:45" -> 585 (minutes since midnight)
export function toMinutes(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

// Date -> minutes since midnight
export function minutesOfDay(date) {
  return date.getHours() * 60 + date.getMinutes();
}

// Builds a Date for today at the given "HH:MM" (used by the demo clock)
export function todayAt(hhmm) {
  const d = new Date();
  const [h, m] = hhmm.split(':').map(Number);
  d.setHours(h, m, 0, 0);
  return d;
}

// A store is open when the current time is between its open and close times
export function isStoreOpen(store, now) {
  const t = minutesOfDay(now);
  const { open, close } = store.openingHours;
  return t >= toMinutes(open) && t < toMinutes(close);
}

// Rule: a slot is disabled if it already started, or if the store
// does not have enough time to prepare the order before the slot starts.
export function getSlotStatus(slot, now, prepTime = 0) {
  const t = minutesOfDay(now);
  const start = toMinutes(slot.start);
  if (t >= start) return { available: false, reason: 'Passed' };
  if (t + prepTime > start) return { available: false, reason: 'Too soon' };
  return { available: true, reason: '' };
}

// First slot still reachable today (or null)
export function getNextSlot(slots, now, prepTime = 0) {
  return slots.find((slot) => getSlotStatus(slot, now, prepTime).available) || null;
}

export function slotLabel(slot) {
  return `${slot.start} – ${slot.end}`;
}

const pad = (n) => (n < 10 ? `0${n}` : `${n}`);

export function formatTime(date) {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function formatDateTime(iso) {
  const d = new Date(iso);
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()} · ${formatTime(d)}`;
}
