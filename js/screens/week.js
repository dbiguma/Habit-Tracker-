// "This Week": for each habit, how many of the last 7 days hit the goal, plus the current streak.
import { el, screenHeader } from '../ui.js';
import { habits } from '../habits/index.js';
import { getDays, getSettings } from '../storage.js';
import { weekSummary, currentStreak } from '../stats.js';
import { todayKey, formatShort, weekdayShort, formatMedium } from '../dates.js';

export function render(root) {
  const today = todayKey();
  const days = getDays();
  const settings = getSettings();
  const first = weekSummary(habits[0], days, settings.goals, today).days[0].key;

  root.append(screenHeader('This Week', `Last 7 days: ${formatShort(first)} – ${formatShort(today)}`));

  for (const habit of habits) {
    const week = weekSummary(habit, days, settings.goals, today);
    const streak = currentStreak(habit, days, settings.goals, today);

    root.append(el('section', { class: 'card', 'aria-label': `${habit.label} this week` },
      el('div', { class: 'habit-head' },
        el('h2', {}, el('span', { 'aria-hidden': 'true' }, habit.emoji), habit.label),
        el('span', { class: 'muted small' }, `Goal: ${habit.formatAmount(settings.goals[habit.id], settings)}`)),
      el('p', { class: 'big-count' }, `${week.count} of 7 `, el('small', {}, 'days')),
      el('div', { class: 'dots' }, week.days.map((d) => el('a', {
        class: `dot${d.met ? ' met' : ''}${d.key === today ? ' today' : ''}`,
        href: d.key === today ? '#/today' : `#/day/${d.key}`,
        'aria-label': `${formatMedium(d.key)}: ${d.met ? 'goal met' : 'goal not met'}`,
      },
      el('span', { class: 'mark', 'aria-hidden': 'true' }, d.met ? '✓' : '✕'),
      el('span', { class: 'label', 'aria-hidden': 'true' }, d.key === today ? 'Today' : weekdayShort(d.key))))),
      el('p', { class: 'streak' }, streak > 0
        ? `🔥 ${streak}-day streak`
        : 'No streak yet — hit your goal today to start one')));
  }

  root.append(el('p', { class: 'note center' }, 'Tap any day to view or edit it.'));
}
