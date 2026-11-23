// 👟 Steps — a whole number, typed in or adjusted by 1,000.
import { formatNumber as fmt } from '../units.js';
import { el, stepper } from '../ui.js';

const MAX_STEPS = 100000;

export default {
  id: 'steps',
  label: 'Steps',
  emoji: '👟',
  defaultGoal: 10000,

  getAmount(record) {
    return typeof record?.steps === 'number' ? record.steps : null;
  },

  validateValue(v) {
    return Number.isInteger(v) && v >= 0 && v <= MAX_STEPS ? v : undefined;
  },

  validGoal(g) {
    return Number.isInteger(g) && g >= 1 && g <= MAX_STEPS;
  },

  formatAmount: (n) => `${fmt(n, 0)} steps`,
  formatValue: (n) => fmt(n, 0),

  goalField(goal) {
    return {
      value: goal, unit: 'steps', step: 500, stepText: '500',
      min: 1, max: MAX_STEPS, decimals: 0, integer: true, toStored: (v) => Math.round(v),
    };
  },

  renderInput(ctx) {
    return el('div', { class: 'habit-input' },
      el('p', { class: 'hint' }, 'Tap the number to type it (e.g. from the Health app)'),
      stepper({
        id: 'steps-input', label: 'Steps', value: this.getAmount(ctx.record),
        step: 1000, stepText: '1,000', unit: 'steps', min: 0, max: MAX_STEPS, decimals: 0, integer: true,
        onChange: (v) => ctx.update({ steps: v }),
      }));
  },
};
