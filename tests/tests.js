// Math checks. Open tests/tests.html through the local server (see README) to run them.
import { toKey, todayKey, addDays, daysBetween, isValidKey } from '../js/dates.js';
import { litersToFlOz, flOzToLiters, flOzToGallons, round } from '../js/units.js';
import { habitById } from '../js/habits/index.js';
import { dayStatus, weekSummary, currentStreak } from '../js/stats.js';
import { validateData, freshData } from '../js/storage.js';

const results = [];
function test(name, fn) {
  try { fn(); results.push({ name, ok: true }); } catch (e) { results.push({ name, ok: false, msg: e.message }); }
}
function eq(actual, expected, label = '') {
  const a = JSON.stringify(actual);
  const b = JSON.stringify(expected);
  if (a !== b) throw new Error(`${label} expected ${b}, got ${a}`);
}

const { water, sleep, exercise, steps } = habitById;
const GOALS = { water: 64, sleep: 420, exercise: 30, steps: 10000 }; // sleep in minutes
const TODAY = '2026-11-22'; // a Sunday

// ---------- Dates (local time zone) ----------
test('11:30 p.m. counts for that same day', () => eq(toKey(new Date(2026, 10, 22, 23, 30)), '2026-11-22'));
test('12:05 a.m. counts for the new day', () => eq(toKey(new Date(2026, 10, 23, 0, 5)), '2026-11-23'));
test('11:59 p.m. on Dec 31 stays in the old year', () => eq(todayKey(new Date(2026, 11, 31, 23, 59)), '2026-12-31'));
test('Month boundary: Jan 31 + 1 = Feb 1', () => eq(addDays('2026-01-31', 1), '2026-02-01'));
test('Year boundary: Dec 31 + 1 = Jan 1', () => eq(addDays('2026-12-31', 1), '2027-01-01'));
test('Year boundary backwards: Jan 1 − 1 = Dec 31', () => eq(addDays('2027-01-01', -1), '2026-12-31'));
test('Leap year: Feb 28 2028 + 1 = Feb 29', () => eq(addDays('2028-02-28', 1), '2028-02-29'));
test('US daylight saving start (Mar 8 2026) + 1', () => eq(addDays('2026-03-08', 1), '2026-03-09'));
test('US daylight saving end (Nov 1 2026) + 1', () => eq(addDays('2026-11-01', 1), '2026-11-02'));
test('Europe daylight saving (Mar 29 2026) − 1', () => eq(addDays('2026-03-29', -1), '2026-03-28'));
test('daysBetween across DST', () => eq(daysBetween('2026-03-01', '2026-03-31'), 30));
test('Invalid date 2026-02-30 rejected', () => eq(isValidKey('2026-02-30'), false));
test('Valid date accepted', () => eq(isValidKey('2026-11-22'), true));

// ---------- Water units ----------
test('1 gallon = 128 fl oz', () => eq(flOzToGallons(128), 1));
test('64 fl oz = 0.5 gal', () => eq(flOzToGallons(64), 0.5));
test('64 fl oz = 1.89 L', () => eq(round(flOzToLiters(64), 2), 1.89));
test('1 L = 33.81 fl oz', () => eq(litersToFlOz(1), 33.81));
test('2 L = 67.63 fl oz', () => eq(litersToFlOz(2), 67.63));
test('Liters round-trip: 2 L -> fl oz -> 2.00 L', () => eq(round(flOzToLiters(litersToFlOz(2)), 2), 2));

// ---------- ✅ / ❌ for one day ----------
test('Water exactly at goal = met', () => eq(dayStatus(water, { water: 64 }, GOALS).met, true));
test('Water below goal = not met', () => eq(dayStatus(water, { water: 63.99 }, GOALS).met, false));
test('Not logged = not met, not logged', () => eq(dayStatus(water, null, GOALS), { amount: null, goal: 64, logged: false, met: false }));
test('Logged 0 = logged, not met', () => eq(dayStatus(water, { water: 0 }, GOALS).logged, true));
test('Liters: 2 L logged vs 2 L goal = met', () => eq(dayStatus(water, { water: litersToFlOz(2) }, { ...GOALS, water: litersToFlOz(2) }).met, true));
test('Sleep 6 h 59 min vs 7 h = not met', () => eq(dayStatus(sleep, { sleep: 419 }, GOALS).met, false));
test('Sleep exactly 7 h 0 min = met', () => eq(dayStatus(sleep, { sleep: 420 }, GOALS).met, true));
test('Sleep 7 h 23 min = met', () => eq(dayStatus(sleep, { sleep: 443 }, GOALS).met, true));
test('Sleep shows as hours + minutes', () => eq([sleep.formatAmount(443), sleep.formatAmount(420), sleep.formatAmount(45)], ['7 h 23 min', '7 h', '45 min']));
test('Sleep rejects fractional minutes', () => eq(sleep.validateValue(442.5), undefined));
test('Exercise: one 0-minute session = logged, not met', () => {
  const s = dayStatus(exercise, { exercise: [{ minutes: 0, type: 'Walk' }] }, GOALS);
  eq([s.logged, s.amount, s.met], [true, 0, false]);
});
test('Exercise: 0-minute session passes the import check', () => eq(exercise.validateValue([{ minutes: 0, type: 'Walk' }]), [{ minutes: 0, type: 'Walk' }]));
test('Exercise: negative minutes rejected', () => eq(exercise.validateValue([{ minutes: -5, type: 'Walk' }]), undefined));
test('Exercise sums sessions: 20 + 15 = 35 ≥ 30', () => {
  const s = dayStatus(exercise, { exercise: [{ minutes: 20, type: 'Walk' }, { minutes: 15, type: 'Yoga' }] }, GOALS);
  eq([s.amount, s.met], [35, true]);
});
test('Exercise 25 min < 30', () => eq(dayStatus(exercise, { exercise: [{ minutes: 25, type: 'Run' }] }, GOALS).met, false));
test('Steps 9,999 < 10,000', () => eq(dayStatus(steps, { steps: 9999 }, GOALS).met, false));
test('Steps 10,000 = met', () => eq(dayStatus(steps, { steps: 10000 }, GOALS).met, true));
test("A day's saved goal wins over the current goal", () => {
  eq(dayStatus(water, { water: 64, goals: { water: 80 } }, GOALS).met, false);
});

// ---------- Weekly count + streak (worked example from the plan) ----------
const week = (sunday) => ({
  '2026-11-16': { water: 64 }, // Mon ✅
  '2026-11-17': { water: 40 }, // Tue ❌
  '2026-11-18': { water: 72 }, // Wed ✅
  '2026-11-19': { water: 64 }, // Thu ✅
  //  2026-11-20 not logged    // Fri ❌
  '2026-11-21': { water: 80 }, // Sat ✅
  '2026-11-22': { water: sunday }, // Sun
});
test('Example A: week count = 5 of 7', () => eq(weekSummary(water, week(64), GOALS, TODAY).count, 5));
test('Example A: streak = 2', () => eq(currentStreak(water, week(64), GOALS, TODAY), 2));
test('Example B (24 fl oz so far today): week = 4 of 7', () => eq(weekSummary(water, week(24), GOALS, TODAY).count, 4));
test("Example B: streak = 1 (today in progress doesn't break it)", () => eq(currentStreak(water, week(24), GOALS, TODAY), 1));
test('Week covers Nov 16–22, oldest first', () => eq(weekSummary(water, {}, GOALS, TODAY).days.map((d) => d.key)[0], '2026-11-16'));
test('No data: streak 0, count 0', () => eq([currentStreak(water, {}, GOALS, TODAY), weekSummary(water, {}, GOALS, TODAY).count], [0, 0]));
test('Streak longer than a week, across a month boundary', () => {
  const days = {};
  for (let i = 0; i < 40; i++) days[addDays(TODAY, -i)] = { steps: 12000 };
  eq(currentStreak(steps, days, GOALS, TODAY), 40);
});
test('Yesterday missed, today met: streak = 1', () => {
  eq(currentStreak(sleep, { [TODAY]: { sleep: 480 }, '2026-11-21': { sleep: 300 } }, GOALS, TODAY), 1);
});

// ---------- Import checks ----------
const sample = () => ({
  schemaVersion: 2,
  settings: { goals: { ...GOALS }, waterUnit: 'metric', lastExportAt: null },
  days: { '2026-11-22': { water: 64, exercise: [{ minutes: 30, type: 'Walk' }], goals: { ...GOALS } } },
});
test('Valid backup is accepted unchanged', () => {
  const r = validateData(sample());
  eq([r.ok, r.data.settings.waterUnit, r.data.days['2026-11-22'].water], [true, 'metric', 64]);
});
test('Fresh data is valid', () => eq(validateData(freshData()).ok, true));
test('Rejects a non-backup file', () => eq(validateData({ hello: 'world' }).ok, false));
test('Rejects a bad date key', () => { const s = sample(); s.days['2026-13-01'] = { water: 8 }; eq(validateData(s).ok, false); });
test('Rejects negative water', () => { const s = sample(); s.days['2026-11-22'].water = -5; eq(validateData(s).ok, false); });
test('Rejects fractional steps', () => { const s = sample(); s.days['2026-11-22'].steps = 10.5; eq(validateData(s).ok, false); });
test('Rejects a backup from a newer app version', () => { const s = sample(); s.schemaVersion = 99; eq(validateData(s).ok, false); });
test('Old v1 backup: sleep hours are converted to minutes', () => {
  const v1 = {
    schemaVersion: 1,
    settings: { goals: { water: 64, sleep: 7.5, exercise: 30, steps: 10000 }, waterUnit: 'us', lastExportAt: null },
    days: { '2026-11-22': { sleep: 6.75, water: 64, goals: { water: 64, sleep: 7, exercise: 30, steps: 10000 } } },
  };
  const r = validateData(v1);
  eq([r.ok, r.data.schemaVersion, r.data.settings.goals.sleep, r.data.days['2026-11-22'].sleep, r.data.days['2026-11-22'].goals.sleep, r.data.days['2026-11-22'].water],
    [true, 2, 450, 405, 420, 64]);
});
test('Day without saved goals gets the file goals', () => {
  const s = sample(); delete s.days['2026-11-22'].goals;
  eq(validateData(s).data.days['2026-11-22'].goals.water, 64);
});

// ---------- Show results ----------
const passed = results.filter((r) => r.ok).length;
const failed = results.length - passed;
window.testResults = { passed, failed, results };
document.getElementById('summary').textContent = failed
  ? `❌ ${failed} failed, ${passed} passed`
  : `✅ All ${passed} tests passed`;
document.getElementById('summary').className = failed ? 'bad' : 'good';
document.getElementById('tz').textContent = `Time zone used: ${Intl.DateTimeFormat().resolvedOptions().timeZone}`;
const list = document.getElementById('results');
for (const r of results) {
  const li = document.createElement('li');
  li.className = r.ok ? 'good' : 'bad';
  li.textContent = `${r.ok ? '✅' : '❌'} ${r.name}${r.ok ? '' : ` — ${r.msg}`}`;
  list.append(li);
}
