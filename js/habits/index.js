// THE HABIT REGISTRY. Every screen loops over this list, so adding a habit
// (e.g. meditation) means: create habits/meditation.js with the same shape, then add it here.
//
// Each habit provides:
//   id, label, emoji, defaultGoal
//   getAmount(record)        -> number | null (null = not logged)
//   validateValue(v)         -> cleaned value | undefined (used when importing)
//   validGoal(g)             -> boolean
//   formatAmount(n, settings)-> "64 fl oz"
//   formatValue(n, settings) -> "64" (number only, in the chosen unit)
//   describe(n, settings)    -> optional extra line, e.g. a unit conversion
//   goalField(goal, settings)-> how Settings edits the goal (standard stepper)
//   renderGoalInput(goal, onChange) -> optional custom goal control (sleep uses hours + minutes)
//   renderInput(ctx)         -> the controls on the Today / Edit Day card
import water from './water.js';
import sleep from './sleep.js';
import exercise from './exercise.js';
import steps from './steps.js';

export const habits = [water, sleep, exercise, steps];

export const habitById = Object.fromEntries(habits.map((h) => [h.id, h]));

export function defaultGoals() {
  return Object.fromEntries(habits.map((h) => [h.id, h.defaultGoal]));
}
