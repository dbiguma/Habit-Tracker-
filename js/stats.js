// The math: goal met?, weekly count, streak. Pure functions — no screens, no storage.
// `days` is the object of day records keyed by "YYYY-MM-DD".
import { addDays } from './dates.js';

// Compare in hundredths so 2 L vs a 2 L goal (both 67.63 fl oz) is an exact match.
const hundredths = (n) => Math.round(n * 100);

/** The goal that applies to a day: the one saved with that day, else the current goal. */
export function goalFor(habit, record, currentGoals) {
  const saved = record?.goals?.[habit.id];
  return typeof saved === 'number' ? saved : currentGoals[habit.id];
}

/** { amount, goal, logged, met } for one habit on one day. Met = logged AND amount >= goal. */
export function dayStatus(habit, record, currentGoals) {
  const amount = habit.getAmount(record ?? null);
  const goal = goalFor(habit, record, currentGoals);
  const logged = amount !== null;
  const met = logged && hundredths(amount) >= hundredths(goal);
  return { amount, goal, logged, met };
}

export function isMet(habit, days, key, currentGoals) {
  return dayStatus(habit, days[key] ?? null, currentGoals).met;
}

/** The last n day keys ending today, oldest first. */
export function lastNDays(today, n = 7) {
  return Array.from({ length: n }, (_, i) => addDays(today, i - (n - 1)));
}

/** How many of the last 7 days (today + 6 before) hit the goal. */
export function weekSummary(habit, days, currentGoals, today) {
  const results = lastNDays(today, 7).map((key) => ({ key, met: isMet(habit, days, key, currentGoals) }));
  return { count: results.filter((r) => r.met).length, total: 7, days: results };
}

/**
 * Consecutive days hitting the goal, counting back from today.
 * If today isn't met YET, it doesn't break the streak — we start counting from yesterday.
 */
export function currentStreak(habit, days, currentGoals, today) {
  let key = isMet(habit, days, today, currentGoals) ? today : addDays(today, -1);
  let count = 0;
  while (isMet(habit, days, key, currentGoals)) {
    count += 1;
    key = addDays(key, -1);
  }
  return count;
}
