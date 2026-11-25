// 🏃 Exercise — one or more sessions per day, each with minutes + type.
// The goal is checked against the TOTAL minutes; the type doesn't affect it.
// A 0-minute session is allowed: it records "I didn't exercise" (logged, goal not met).
import { formatNumber as fmt } from '../units.js';
import { el, stepper } from '../ui.js';

export const EXERCISE_TYPES = ['Walk', 'Run', 'Cycle', 'Strength', 'Yoga', 'Swim', 'Sports', 'Other'];
const MAX_MINUTES = 600;

export default {
  id: 'exercise',
  label: 'Exercise',
  emoji: '🏃',
  defaultGoal: 30, // minutes

  getAmount(record) {
    const s = record?.exercise;
    return Array.isArray(s) && s.length ? s.reduce((sum, x) => sum + x.minutes, 0) : null;
  },

  validateValue(v) {
    if (!Array.isArray(v)) return undefined;
    const out = [];
    for (const s of v) {
      if (!s || typeof s !== 'object') return undefined;
      if (!Number.isInteger(s.minutes) || s.minutes < 0 || s.minutes > MAX_MINUTES) return undefined;
      const type = typeof s.type === 'string' ? s.type.trim().slice(0, 30) : '';
      if (!type) return undefined;
      out.push({ minutes: s.minutes, type });
    }
    return out;
  },

  validGoal(g) {
    return Number.isInteger(g) && g >= 1 && g <= MAX_MINUTES;
  },

  formatAmount: (m) => `${fmt(m, 0)} min`,
  formatValue: (m) => fmt(m, 0),

  goalField(goal) {
    return {
      value: goal, unit: 'minutes', step: 5, stepText: '5 min',
      min: 1, max: MAX_MINUTES, decimals: 0, integer: true, toStored: (v) => Math.round(v),
    };
  },

  renderInput(ctx) {
    const sessions = ctx.record?.exercise ?? [];
    const wrap = el('div', { class: 'habit-input' });

    if (sessions.length) {
      wrap.append(el('ul', { class: 'sessions' }, sessions.map((s, i) => el('li', {},
        el('span', {}, `${s.type} · ${s.minutes} min`),
        el('button', {
          type: 'button', class: 'icon-btn', 'aria-label': `Remove ${s.type}, ${s.minutes} minutes`,
          onclick: () => {
            const next = sessions.filter((_, j) => j !== i);
            ctx.update({ exercise: next.length ? next : null });
          },
        }, '✕')))));
    }

    // "Add exercise" form, hidden until the button is tapped.
    let minutes = 30;
    let type = EXERCISE_TYPES[0];
    const chips = el('div', { class: 'chips', role: 'radiogroup', 'aria-label': 'Exercise type' });
    const drawChips = () => chips.replaceChildren(...EXERCISE_TYPES.map((t) => el('button', {
      type: 'button', role: 'radio', class: 'chip', 'aria-checked': String(t === type),
      onclick: () => { type = t; drawChips(); },
    }, t)));
    drawChips();

    const addButton = el('button', { type: 'button', class: 'btn secondary wide', dataset: { focusKey: 'ex-add' } },
      sessions.length ? '+ Add another session' : '+ Add exercise');
    const form = el('div', { class: 'add-form', hidden: true },
      el('p', { class: 'form-label' }, 'How long?'),
      stepper({
        id: 'exercise-minutes', label: 'Exercise minutes', value: minutes, step: 5, stepText: '5 min',
        unit: 'minutes', min: 0, max: MAX_MINUTES, decimals: 0, integer: true, allowEmpty: false,
        onChange: (v) => { minutes = v; },
      }),
      el('p', { class: 'form-label' }, 'What kind?'),
      chips,
      el('div', { class: 'form-actions' },
        el('button', { type: 'button', class: 'btn plain', onclick: () => { form.hidden = true; addButton.hidden = false; } }, 'Cancel'),
        el('button', {
          type: 'button', class: 'btn primary',
          onclick: () => ctx.update({ exercise: [...sessions, { minutes, type }] }),
        }, 'Add')));

    addButton.addEventListener('click', () => { form.hidden = false; addButton.hidden = true; });
    wrap.append(addButton, form);
    return wrap;
  },
};
