// "Today" = the day editor opened on today's local date.
import { renderDayEditor } from './day-editor.js';
import { todayKey } from '../dates.js';

export function render(root) {
  renderDayEditor(root, todayKey());
}
