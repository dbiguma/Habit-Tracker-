// "History": a list of past days (newest first). Tap one to open it in the day editor.
import { el, screenHeader, toast } from '../ui.js';
import { habits } from '../habits/index.js';
import { getDays, getSettings } from '../storage.js';
import { dayStatus } from '../stats.js';
import { todayKey, addDays, formatMedium, isValidKey } from '../dates.js';
import { refresh } from '../router.js';

const PAGE = 60;
let shown = PAGE;

export function render(root) {
  const today = todayKey();
  const days = getDays();
  const goals = getSettings().goals;

  root.append(screenHeader('History', 'Tap a day to view or change it.'));

  const picker = el('input', { type: 'date', id: 'go-date', class: 'date-input', max: today, value: today });
  picker.addEventListener('change', () => {
    const key = picker.value;
    if (!isValidKey(key)) return;
    if (key > today) { toast("Future days can't be logged yet.", 'error'); picker.value = today; return; }
    location.hash = key === today ? '#/today' : `#/day/${key}`;
  });
  root.append(el('div', { class: 'card' },
    el('label', { class: 'field-label', for: 'go-date' }, 'Go to a date'), picker));

  const list = el('ul', { class: 'history-list' });
  for (let i = 0; i < shown; i++) {
    const key = addDays(today, -i);
    const rec = days[key] ?? null;
    const label = i === 0 ? 'Today' : i === 1 ? 'Yesterday' : formatMedium(key);
    const statuses = habits.map((h) => ({ h, s: dayStatus(h, rec, goals) }));
    const spoken = rec
      ? statuses.map(({ h, s }) => `${h.label} ${s.met ? 'met' : 'not met'}`).join(', ')
      : 'nothing logged';

    list.append(el('li', {}, el('a', {
      class: 'history-row', href: i === 0 ? '#/today' : `#/day/${key}`, 'aria-label': `${label}: ${spoken}`,
    },
    el('span', { class: 'date' }, label),
    rec
      ? el('span', { class: 'marks', 'aria-hidden': 'true' },
        statuses.map(({ h, s }) => el('span', {}, `${h.emoji}${s.met ? '✅' : '❌'}`)))
      : el('span', { class: 'empty-day', 'aria-hidden': 'true' }, 'Nothing logged'),
    el('span', { class: 'chev', 'aria-hidden': 'true' }, '›'))));
  }
  root.append(list, el('button', {
    type: 'button', class: 'btn secondary wide',
    onclick: () => { shown += PAGE; refresh(); },
  }, `Show ${PAGE} more days`));
}
