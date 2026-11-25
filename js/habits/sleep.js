// 😴 Sleep — stored as whole MINUTES (e.g. 7 h 23 min = 443), so it can be logged to the minute.
// Last night's sleep counts for the day you wake up.
import { el, stepper } from '../ui.js';

const MAX_MIN = 24 * 60;

/** 443 -> "7 h 23 min", 420 -> "7 h", 45 -> "45 min" */
export function hoursAndMinutes(total) {
  const H = Math.floor(total / 60);
  const M = total % 60;
  if (!H) return `${M} min`;
  return M ? `${H} h ${M} min` : `${H} h`;
}

/**
 * Two stacked steppers: Hours (±1 hour) and Minutes (±1 min).
 * total: minutes or null. onChange(totalMinutes | null).
 */
function hoursMinutesControl({ total, onChange, idPrefix, label, minTotal = 0 }) {
  const clamp = (m) => Math.min(MAX_MIN, Math.max(minTotal, m));
  const mins = total === null ? 0 : total % 60;
  const hrs = total === null ? 0 : Math.floor(total / 60);
  const canStep = (dir) => (dir < 0 ? total !== null && total > minTotal : (total ?? 0) < MAX_MIN);

  return el('div', { class: 'hm' },
    stepper({
      id: `${idPrefix}-hours`, label: `${label} hours`,
      value: total === null ? null : hrs,
      step: 1, stepText: '1 hour', unit: 'hours', min: 0, max: 24, decimals: 0, integer: true,
      allowEmpty: total === null || minTotal === 0,
      canStep,
      onStep: (dir) => onChange(clamp((total ?? 0) + dir * 60)),
      onChange: (h) => {
        if (h === null && total === null) return;
        onChange(clamp((h ?? 0) * 60 + mins));
      },
    }),
    stepper({
      id: `${idPrefix}-minutes`, label: `${label} minutes`,
      value: total === null ? null : mins,
      step: 1, stepText: '1 min', unit: 'minutes', min: 0, max: 59, decimals: 0, integer: true,
      allowEmpty: total === null || minTotal === 0,
      // Buttons carry over: 6 h 59 min + 1 min = 7 h 0 min.
      canStep,
      onStep: (dir) => onChange(clamp((total ?? 0) + dir)),
      onChange: (m) => {
        if (m === null && total === null) return;
        onChange(clamp(hrs * 60 + (m ?? 0)));
      },
    }));
}

export default {
  id: 'sleep',
  label: 'Sleep',
  emoji: '😴',
  defaultGoal: 420, // minutes = 7 hours

  getAmount(record) {
    return typeof record?.sleep === 'number' ? record.sleep : null;
  },

  validateValue(v) {
    return Number.isInteger(v) && v >= 0 && v <= MAX_MIN ? v : undefined;
  },

  validGoal(g) {
    return Number.isInteger(g) && g >= 60 && g <= MAX_MIN;
  },

  formatAmount: hoursAndMinutes,
  formatValue: hoursAndMinutes,

  /** Settings uses this instead of the standard single stepper. */
  renderGoalInput(goal, onChange) {
    return hoursMinutesControl({ total: goal, onChange, idPrefix: 'goal-sleep', label: 'Sleep goal', minTotal: 60 });
  },

  renderInput(ctx) {
    return el('div', { class: 'habit-input' },
      el('p', { class: 'hint' }, 'How long you slept last night'),
      hoursMinutesControl({
        total: this.getAmount(ctx.record),
        onChange: (v) => ctx.update({ sleep: v }),
        idPrefix: 'sleep', label: 'Sleep',
      }));
  },
};
