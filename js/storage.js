// Everything about saving data on this device (localStorage), plus export/import checks.
// All data lives under ONE key. The key is unique on purpose: every project site under
// <username>.github.io shares the same localStorage, so a generic name could clash.
import { isValidKey } from './dates.js';
import { habits, defaultGoals } from './habits/index.js';

export const STORAGE_KEY = 'habitTracker.v1.data';
export const SCHEMA_VERSION = 1;
const WATER_UNITS = ['us', 'metric'];

let data = null;          // in-memory copy, loaded once
let loadProblem = null;   // set if stored data couldn't be read

export function freshData() {
  return {
    schemaVersion: SCHEMA_VERSION,
    settings: { goals: defaultGoals(), waterUnit: 'us', lastExportAt: null },
    days: {},
  };
}

// Future versions: add upgrade steps here, e.g. 1 -> 2 when adding meditation.
const migrations = {
  // 1: (old) => ({ ...old, schemaVersion: 2, ... }),
};

export function load() {
  if (data) return data;
  let raw = null;
  try { raw = localStorage.getItem(STORAGE_KEY); } catch { /* storage blocked */ }
  if (raw) {
    let result;
    try { result = validateData(JSON.parse(raw)); } catch { result = { ok: false }; }
    if (result.ok) {
      data = result.data;
    } else {
      // Never silently destroy data: keep the unreadable copy aside before starting fresh.
      try { localStorage.setItem(`${STORAGE_KEY}.unreadable-${Date.now()}`, raw); } catch { /* ignore */ }
      loadProblem = 'Saved data could not be read, so the app started fresh. A copy was kept.';
    }
  }
  if (!data) data = freshData();
  return data;
}

export function getLoadProblem() { return loadProblem; }

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

export const getSettings = () => load().settings;
export const getDays = () => load().days;
export const getDay = (key) => load().days[key] ?? null;

/**
 * Change one day. patch = { water: 64 } etc.; a null value means "not logged" (removed).
 * A new day record gets a copy of the current goals, so later goal changes don't rewrite history.
 * Returns true if saved.
 */
export function updateDay(key, patch) {
  const d = load();
  const record = d.days[key] ?? { goals: { ...d.settings.goals } };
  for (const [field, value] of Object.entries(patch)) {
    if (value === null) delete record[field];
    else record[field] = value;
  }
  if (habits.some((h) => h.getAmount(record) !== null)) d.days[key] = record;
  else delete d.days[key]; // nothing logged at all -> no record
  return save();
}

/** Change a goal. Today's record (if any) is updated too; past days keep theirs. */
export function setGoal(habitId, value, today) {
  const d = load();
  d.settings.goals[habitId] = value;
  if (d.days[today]) d.days[today].goals = { ...d.days[today].goals, [habitId]: value };
  return save();
}

export function resetGoals(today) {
  const defaults = defaultGoals();
  return Object.entries(defaults).every(([id, g]) => setGoal(id, g, today));
}

export function setWaterUnit(unit) {
  if (!WATER_UNITS.includes(unit)) return false;
  load().settings.waterUnit = unit;
  return save();
}

export function exportJSON() {
  return JSON.stringify(load(), null, 2);
}

export function markExported() {
  load().settings.lastExportAt = new Date().toISOString();
  return save();
}

/** Replace everything with already-validated data (from validateData). */
export function replaceAll(newData) {
  data = newData;
  return save();
}

const fail = (error) => ({ ok: false, error });

/**
 * Check a backup (or stored data) and return a clean copy: { ok: true, data } or { ok: false, error }.
 * Strict on purpose: if anything is wrong, nothing is imported.
 */
export function validateData(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return fail("This file isn't a Habit Tracker backup.");
  }
  let obj = input;
  if (typeof obj.schemaVersion !== 'number') return fail("This file isn't a Habit Tracker backup.");
  if (obj.schemaVersion > SCHEMA_VERSION) return fail('This backup is from a newer version of the app. Please update the app first.');
  while (obj.schemaVersion < SCHEMA_VERSION) {
    const step = migrations[obj.schemaVersion];
    if (!step) return fail("This backup's format isn't recognized.");
    obj = step(obj);
  }

  const out = freshData();
  const s = obj.settings && typeof obj.settings === 'object' ? obj.settings : {};
  for (const h of habits) {
    const g = s.goals?.[h.id];
    if (g === undefined) continue;
    if (!h.validGoal(g)) return fail(`The ${h.label} goal in this file isn't valid.`);
    out.settings.goals[h.id] = g;
  }
  if (WATER_UNITS.includes(s.waterUnit)) out.settings.waterUnit = s.waterUnit;
  if (typeof s.lastExportAt === 'string' && !Number.isNaN(Date.parse(s.lastExportAt))) {
    out.settings.lastExportAt = s.lastExportAt;
  }

  const days = obj.days ?? {};
  if (typeof days !== 'object' || Array.isArray(days)) return fail("This file's day list isn't valid.");
  for (const [key, rec] of Object.entries(days)) {
    if (!isValidKey(key)) return fail(`"${key}" in this file isn't a valid date.`);
    if (!rec || typeof rec !== 'object') return fail(`The entry for ${key} isn't valid.`);
    const clean = { goals: {} };
    for (const h of habits) {
      const v = rec[h.id];
      if (v !== undefined && v !== null) {
        const value = h.validateValue(v);
        if (value === undefined) return fail(`The ${h.label} value for ${key} isn't valid.`);
        clean[h.id] = value;
      }
      const g = rec.goals?.[h.id];
      if (g !== undefined && !h.validGoal(g)) return fail(`The ${h.label} goal for ${key} isn't valid.`);
      clean.goals[h.id] = g ?? out.settings.goals[h.id];
    }
    if (habits.some((h) => h.getAmount(clean) !== null)) out.days[key] = clean;
  }
  return { ok: true, data: out };
}
