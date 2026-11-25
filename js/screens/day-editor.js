// The shared "log a day" view. Today uses it for today's date; History uses it for past days.
import { el, toast } from '../ui.js';
import { habits } from '../habits/index.js';
import { getDay, getSettings, updateDay, setWaterUnit } from '../storage.js';
import { dayStatus } from '../stats.js';
import { todayKey, addDays, formatLong, formatMedium } from '../dates.js';

/** Bar at the top of Today: one tap to log yesterday, with how much of it is filled in. */
function yesterdayShortcut(yesterday) {
  const goals = getSettings().goals;
  const record = getDay(yesterday);
  const met = habits.filter((h) => dayStatus(h, record, goals).met).length;
  const status = record ? `${met} of ${habits.length} goals met` : 'Nothing logged yet';
  return el('a', {
    class: record ? 'yesterday' : 'yesterday empty',
    href: `#/day/${yesterday}`,
    'aria-label': `Log yesterday, ${formatLong(yesterday)}: ${status}`,
  },
  el('span', { class: 'y-icon', 'aria-hidden': 'true' }, '⏪'),
  el('span', { class: 'y-text', 'aria-hidden': 'true' },
    el('strong', {}, `Log yesterday · ${formatMedium(yesterday)}`),
    el('span', { class: 'y-status' }, status)),
  el('span', { class: 'chev', 'aria-hidden': 'true' }, '›'));
}

export function renderDayEditor(root, key) {
  const today = todayKey();
  const isToday = key === today;
  const prev = addDays(key, -1);
  const next = addDays(key, 1);

  if (isToday) {
    root.append(el('header', { class: 'screen-head' },
      el('h1', {}, 'Today'),
      el('p', { class: 'sub' }, formatLong(key))),
    yesterdayShortcut(addDays(key, -1)));
  } else {
    root.append(
      el('header', { class: 'screen-head' },
        next === today
          ? el('a', { class: 'back-link', href: '#/today' }, '‹ Back to Today')
          : el('a', { class: 'back-link', href: '#/history' }, '‹ Back to History'),
        el('h1', {}, formatLong(key)),
        el('p', { class: 'sub' }, 'Editing a past day')),
      el('nav', { class: 'day-nav', 'aria-label': 'Change day' },
        el('a', { class: 'btn secondary', href: `#/day/${prev}` }, '‹ Previous day'),
        el('a', { class: 'btn secondary', href: next === today ? '#/today' : `#/day/${next}` },
          next === today ? 'Today ›' : 'Next day ›')));
  }

  const cards = {};

  function save(habit, patch) {
    if (updateDay(key, patch)) toast('Saved ✓');
    else toast("Couldn't save — your phone's storage may be full.", 'error');
    redraw(habit);
  }

  function redraw(habit) {
    const focusKey = document.activeElement?.dataset?.focusKey;
    const fresh = buildCard(habit);
    cards[habit.id].replaceWith(fresh);
    cards[habit.id] = fresh;
    if (focusKey) {
      const target = fresh.querySelector(`[data-focus-key="${CSS.escape(focusKey)}"]`);
      if (target && !target.disabled) target.focus({ preventScroll: true });
    }
  }

  function buildCard(habit) {
    const settings = getSettings();
    const record = getDay(key);
    const s = dayStatus(habit, record, settings.goals);

    let badge;
    if (s.met) badge = el('span', { class: 'badge good' }, '✅ Goal met');
    else if (s.logged) badge = el('span', { class: 'badge bad' }, isToday ? '❌ Not yet' : '❌ Missed');
    else badge = el('span', { class: 'badge bad' }, '❌ Not logged');

    const goalText = habit.formatAmount(s.goal, settings);
    const extra = s.logged && habit.describe ? habit.describe(s.amount, settings) : null;
    const pct = s.logged ? Math.min(100, Math.round((s.amount / s.goal) * 100)) : 0;

    return el('section', { class: `card habit habit-${habit.id}`, 'aria-label': habit.label },
      el('div', { class: 'habit-head' },
        el('h2', {}, el('span', { 'aria-hidden': 'true' }, habit.emoji), habit.label),
        badge),
      el('p', { class: 'progress-text' },
        s.logged ? `${habit.formatValue(s.amount, settings)} of ${goalText}` : `Goal: ${goalText}`),
      extra && el('p', { class: 'convert' }, `= ${extra}`),
      el('div', {
        class: s.met ? 'bar met' : 'bar', role: 'progressbar', 'aria-label': `${habit.label} progress`,
        'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-valuenow': String(pct),
      }, el('span', { style: `width:${pct}%` })),
      habit.renderInput({
        record,
        settings,
        update: (patch) => save(habit, patch),
        setWaterUnit: (u) => { setWaterUnit(u); redraw(habit); },
      }),
      s.logged && el('div', { class: 'card-foot' },
        el('button', {
          type: 'button', class: 'btn-text',
          onclick: () => {
            if (confirm(`Clear ${habit.label} for ${isToday ? 'today' : formatLong(key)}?`)) {
              save(habit, { [habit.id]: null });
            }
          },
        }, `Clear ${habit.label.toLowerCase()}`)));
  }

  for (const habit of habits) {
    cards[habit.id] = buildCard(habit);
    root.append(cards[habit.id]);
  }
}
