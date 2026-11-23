// All date logic lives here. Every date is a "day key" string like "2026-11-22",
// built from the phone's LOCAL calendar date. We never use toISOString(),
// because that is UTC and would push late-evening entries into the next day.

const pad = (n) => String(n).padStart(2, '0');

/** Local calendar date of a Date object -> "YYYY-MM-DD". */
export function toKey(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Today's key in the local time zone. `now` can be passed in for testing. */
export function todayKey(now = new Date()) {
  return toKey(now);
}

/** "YYYY-MM-DD" -> Date at local NOON (noon avoids daylight-saving edge cases). */
export function fromKey(key) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d, 12);
}

/** Move a day key forward (n > 0) or back (n < 0) by whole calendar days. */
export function addDays(key, n) {
  const d = fromKey(key);
  return toKey(new Date(d.getFullYear(), d.getMonth(), d.getDate() + n, 12));
}

/** Whole calendar days from key a to key b (b later = positive). */
export function daysBetween(a, b) {
  return Math.round((fromKey(b) - fromKey(a)) / 86400000);
}

/** True for a real calendar date in "YYYY-MM-DD" form (rejects 2026-02-30). */
export function isValidKey(key) {
  if (typeof key !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(key)) return false;
  return toKey(fromKey(key)) === key;
}

function yearOpt(key) {
  return fromKey(key).getFullYear() === new Date().getFullYear() ? {} : { year: 'numeric' };
}

/** "Sunday, November 22" (adds the year when it is not the current year). */
export function formatLong(key) {
  return fromKey(key).toLocaleDateString(undefined, {
    weekday: 'long', month: 'long', day: 'numeric', ...yearOpt(key),
  });
}

/** "Sun, Nov 22" */
export function formatMedium(key) {
  return fromKey(key).toLocaleDateString(undefined, {
    weekday: 'short', month: 'short', day: 'numeric', ...yearOpt(key),
  });
}

/** "Nov 22" */
export function formatShort(key) {
  return fromKey(key).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

/** "Sun" */
export function weekdayShort(key) {
  return fromKey(key).toLocaleDateString(undefined, { weekday: 'short' });
}
