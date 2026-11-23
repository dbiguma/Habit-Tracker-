// 💧 Water — stored in US fluid ounces. You can view/type in fl oz or liters;
// the other units (gallons, liters / fl oz) are always shown as a conversion.
import { litersToFlOz, flOzToLiters, flOzToGallons, round, formatNumber as fmt } from '../units.js';
import { el, stepper, segmented } from '../ui.js';

const MAX_FL_OZ = 400;           // about 3.1 gallons / 11.8 liters
const US_STEP_FL_OZ = 8;         // one cup
const METRIC_STEP_L = 0.25;

const isMetric = (settings) => settings.waterUnit === 'metric';
const clamp = (oz) => Math.min(MAX_FL_OZ, Math.max(0, oz));

export const unitOptions = [
  { value: 'us', label: 'fl oz / gal' },
  { value: 'metric', label: 'Liters' },
];

/** Amount in the chosen unit: "64 fl oz" or "1.89 L". */
function formatAmount(oz, settings) {
  return isMetric(settings) ? `${fmt(flOzToLiters(oz))} L` : `${fmt(oz)} fl oz`;
}

/** The conversion line: "0.5 gal · 1.89 L" or "67.63 fl oz · 0.53 gal". */
function describe(oz, settings) {
  const gal = `${fmt(flOzToGallons(oz))} gal`;
  return isMetric(settings)
    ? `${fmt(oz)} fl oz · ${gal}`
    : `${gal} · ${fmt(flOzToLiters(oz))} L`;
}

export default {
  id: 'water',
  label: 'Water',
  emoji: '💧',
  defaultGoal: 64, // fl oz (= 8 cups, 0.5 gal, 1.89 L)

  getAmount(record) {
    return typeof record?.water === 'number' ? record.water : null;
  },

  validateValue(v) {
    return typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= MAX_FL_OZ ? round(v, 2) : undefined;
  },

  validGoal(g) {
    return typeof g === 'number' && Number.isFinite(g) && g >= 1 && g <= MAX_FL_OZ;
  },

  formatAmount,
  formatValue: (oz, settings) => (isMetric(settings) ? fmt(flOzToLiters(oz)) : fmt(oz)),
  describe,

  /** How the goal is edited in Settings, in whichever unit is selected. */
  goalField(goal, settings) {
    const hint = `= ${describe(goal, settings)}`;
    if (isMetric(settings)) {
      return {
        value: round(flOzToLiters(goal), 2), unit: 'L', step: METRIC_STEP_L, stepText: '0.25 L',
        min: 0.05, max: round(flOzToLiters(MAX_FL_OZ), 2), decimals: 2, hint,
        toStored: (liters) => Math.max(1, clamp(litersToFlOz(liters))),
      };
    }
    return {
      value: goal, unit: 'fl oz', step: US_STEP_FL_OZ, stepText: '8 fl oz',
      min: 1, max: MAX_FL_OZ, decimals: 2, hint,
      toStored: (oz) => round(oz, 2),
    };
  },

  renderInput(ctx) {
    const metric = isMetric(ctx.settings);
    const oz = this.getAmount(ctx.record);
    const stepOz = metric ? litersToFlOz(METRIC_STEP_L) : US_STEP_FL_OZ;

    return el('div', { class: 'habit-input' },
      segmented({
        label: 'Water units', options: unitOptions, value: ctx.settings.waterUnit,
        focusKey: 'water-unit', onChange: (u) => ctx.setWaterUnit(u),
      }),
      stepper({
        id: `water-input`,
        label: 'Water',
        value: oz === null ? null : (metric ? round(flOzToLiters(oz), 2) : oz),
        step: metric ? METRIC_STEP_L : US_STEP_FL_OZ,
        stepText: metric ? '0.25 L' : '8 fl oz',
        unit: metric ? 'liters' : 'fl oz',
        min: 0,
        max: metric ? round(flOzToLiters(MAX_FL_OZ), 2) : MAX_FL_OZ,
        decimals: 2,
        // Step in fl oz so repeated taps don't drift from rounding liters.
        onStep: (dir) => ctx.update({ water: clamp(round((oz ?? 0) + dir * stepOz, 2)) }),
        onChange: (v) => ctx.update({
          water: v === null ? null : clamp(metric ? litersToFlOz(v) : round(v, 2)),
        }),
      }),
      el('p', { class: 'hint center' }, metric ? 'Tip: a typical bottle is 0.5 L' : 'Tip: 1 cup = 8 fl oz · 1 gal = 128 fl oz'));
  },
};
