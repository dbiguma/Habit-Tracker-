// 😴 Sleep — hours, in 15-minute steps. Last night's sleep counts for the day you wake up.
import { round, formatNumber as fmt } from '../units.js';
import { el, stepper } from '../ui.js';

const MAX_HOURS = 24;

function hoursAndMinutes(h) {
  const total = Math.round(h * 60);
  const H = Math.floor(total / 60);
  const M = total % 60;
  return M ? `${H} h ${M} min` : `${H} h`;
}

export default {
  id: 'sleep',
  label: 'Sleep',
  emoji: '😴',
  defaultGoal: 7, // hours

  getAmount(record) {
    return typeof record?.sleep === 'number' ? record.sleep : null;
  },

  validateValue(v) {
    return typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= MAX_HOURS ? round(v, 2) : undefined;
  },

  validGoal(g) {
    return typeof g === 'number' && Number.isFinite(g) && g >= 1 && g <= MAX_HOURS;
  },

  formatAmount: (h) => `${fmt(h)} h`,
  formatValue: (h) => fmt(h),

  // Only show "7 h 30 min" when it adds information (i.e. not a whole hour).
  describe: (h) => (Number.isInteger(round(h, 2)) ? null : hoursAndMinutes(h)),

  goalField(goal) {
    return {
      value: goal, unit: 'hours', step: 0.25, stepText: '15 min',
      min: 1, max: MAX_HOURS, decimals: 2, toStored: (v) => round(v, 2),
      hint: Number.isInteger(goal) ? null : `= ${hoursAndMinutes(goal)}`,
    };
  },

  renderInput(ctx) {
    return el('div', { class: 'habit-input' },
      el('p', { class: 'hint' }, 'How long you slept last night'),
      stepper({
        id: 'sleep-input', label: 'Sleep', value: this.getAmount(ctx.record),
        step: 0.25, stepText: '15 min', unit: 'hours', min: 0, max: MAX_HOURS, decimals: 2,
        onChange: (v) => ctx.update({ sleep: v }),
      }));
  },
};
