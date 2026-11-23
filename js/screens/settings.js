// "Settings": goals, water units, Export / Import backup.
import { el, screenHeader, stepper, segmented, toast } from '../ui.js';
import { habits } from '../habits/index.js';
import { unitOptions } from '../habits/water.js';
import {
  getSettings, setGoal, resetGoals, setWaterUnit, exportJSON, markExported, validateData, replaceAll,
} from '../storage.js';
import { todayKey, toKey, daysBetween } from '../dates.js';
import { refresh } from '../router.js';

function lastBackupText(iso, today) {
  if (!iso) return { text: 'Never backed up. Tap Export to save a copy.', warn: true };
  const n = daysBetween(toKey(new Date(iso)), today);
  const when = n <= 0 ? 'today' : n === 1 ? 'yesterday' : `${n} days ago`;
  return { text: `Last backup: ${when}`, warn: n > 30 };
}

async function doExport() {
  const name = `habit-tracker-${todayKey()}.json`;
  const file = new File([exportJSON()], name, { type: 'application/json' });

  // On iPhone, the share sheet lets you "Save to Files" / iCloud Drive.
  const touch = window.matchMedia('(pointer: coarse)').matches;
  if (touch && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: 'Habit Tracker backup' });
      markExported();
      toast('Backup saved ✓');
      refresh();
      return;
    } catch (e) {
      if (e.name === 'AbortError') return; // closed the share sheet
    }
  }
  // Computers (and fallback): a normal download.
  const url = URL.createObjectURL(file);
  const a = el('a', { href: url, download: name });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
  markExported();
  toast('Backup downloaded ✓');
  refresh();
}

async function doImport(file) {
  let parsed;
  try {
    parsed = JSON.parse(await file.text());
  } catch {
    alert("That file couldn't be read. Please choose a backup file made with Export.");
    return;
  }
  const result = validateData(parsed);
  if (!result.ok) { alert(`Import stopped: ${result.error}\n\nYour current data was not changed.`); return; }
  const n = Object.keys(result.data.days).length;
  const ok = confirm(`Replace ALL data on this device with this backup (${n} day${n === 1 ? '' : 's'} of entries)?\n\nThis can't be undone.`);
  if (!ok) return;
  if (replaceAll(result.data)) { toast('Backup restored ✓'); refresh(); }
  else toast("Couldn't save the imported data.", 'error');
}

export function render(root) {
  const settings = getSettings();
  const today = todayKey();

  root.append(screenHeader('Settings'));

  // ---- Goals ----
  const goals = el('section', { class: 'card' },
    el('h2', { class: 'section-title' }, 'Daily goals'),
    el('p', { class: 'note' }, 'Changes apply to today and future days. Past days keep the goal they had.'),
    el('div', { class: 'field' },
      el('span', { class: 'field-label' }, '💧 Water units'),
      segmented({
        label: 'Water units', options: unitOptions, value: settings.waterUnit, focusKey: 'set-unit',
        onChange: (u) => { setWaterUnit(u); refresh(); },
      })));

  for (const h of habits) {
    const f = h.goalField(settings.goals[h.id], settings);
    const id = `goal-${h.id}`;
    goals.append(el('div', { class: 'field' },
      el('label', { class: 'field-label', for: id }, `${h.emoji} ${h.label} goal`),
      stepper({
        id, label: `${h.label} goal`, value: f.value, step: f.step, stepText: f.stepText, unit: f.unit,
        min: f.min, max: f.max, decimals: f.decimals, integer: f.integer, allowEmpty: false,
        onChange: (v) => {
          if (setGoal(h.id, f.toStored(v), today)) toast('Goal saved ✓');
          else toast("Couldn't save.", 'error');
          refresh();
        },
      }),
      f.hint && el('p', { class: 'hint center' }, f.hint)));
  }
  goals.append(el('button', {
    type: 'button', class: 'btn plain wide',
    onclick: () => {
      if (confirm('Reset all goals to 64 fl oz water, 7 h sleep, 30 min exercise, 10,000 steps?')) {
        resetGoals(today);
        toast('Goals reset ✓');
        refresh();
      }
    },
  }, 'Reset goals to defaults'));
  root.append(goals);

  // ---- Backup ----
  const backup = lastBackupText(settings.lastExportAt, today);
  const fileInput = el('input', { type: 'file', class: 'visually-hidden', id: 'import-file', tabindex: '-1' });
  fileInput.addEventListener('change', () => {
    const file = fileInput.files?.[0];
    fileInput.value = '';
    if (file) doImport(file);
  });

  root.append(el('section', { class: 'card' },
    el('h2', { class: 'section-title' }, 'Backup'),
    el('p', { class: 'note' }, 'Your data is stored only on this phone. Export saves a copy you can keep in Files or iCloud Drive. Import restores from that copy.'),
    el('p', { class: backup.warn ? 'note warn' : 'note' }, backup.text),
    el('div', { class: 'stack' },
      el('button', { type: 'button', class: 'btn primary wide', onclick: doExport }, '⬆️ Export data'),
      el('button', { type: 'button', class: 'btn secondary wide', onclick: () => fileInput.click() }, '⬇️ Import data'),
      fileInput)));

  // ---- About ----
  root.append(el('section', { class: 'card' },
    el('h2', { class: 'section-title' }, 'About'),
    el('p', { class: 'note' }, 'Habit Tracker v1.0. Works offline. No accounts, no tracking, nothing leaves this device.'),
    el('p', { class: 'note' }, 'Tip: use the app from its Home Screen icon. Safari and the Home Screen app keep separate data.')));
}
