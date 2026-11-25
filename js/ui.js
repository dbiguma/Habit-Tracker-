// Small shared building blocks for screens: element builder, toast message,
// number stepper, segmented toggle. No screen-specific logic here.
import { formatNumber, round } from './units.js';

/** el('div', {class: 'x', onclick: fn}, child, 'text', [more]) -> HTMLElement */
export function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === null || v === undefined || v === false) continue;
    if (k === 'class') node.className = v;
    else if (k === 'dataset') Object.assign(node.dataset, v);
    else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2), v);
    else if (v === true) node.setAttribute(k, '');
    else node.setAttribute(k, v);
  }
  for (const c of children.flat(Infinity)) {
    if (c === null || c === undefined || c === false) continue;
    node.append(c instanceof Node ? c : String(c));
  }
  return node;
}

export function screenHeader(title, subtitle) {
  return el('header', { class: 'screen-head' },
    el('h1', {}, title),
    subtitle && el('p', { class: 'sub' }, subtitle));
}

let toastTimer;
/** Brief message above the tab bar. kind: 'info' | 'error' */
export function toast(message, kind = 'info') {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = message;
  t.className = `toast show ${kind}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.className = 'toast'; }, kind === 'error' ? 4000 : 1400);
}

/**
 * Parse what someone typed. '' -> null, junk -> NaN.
 * Decimal fields accept a comma as the decimal mark (e.g. "1,5" L).
 * Whole-number fields ignore separators (e.g. "10,000" steps).
 */
export function parseNumber(text, { integer = false } = {}) {
  let s = String(text).trim();
  if (s === '') return null;
  s = integer ? s.replace(/[^\d]/g, '') : s.replace(/\s/g, '').replace(',', '.');
  if (s === '') return NaN;
  const n = Number(s);
  return Number.isFinite(n) ? n : NaN;
}

/**
 * Big  [ − ]  [ value ]  [ + ]  control.
 * value: number or null (null = empty / not logged), in display units.
 * onChange(newValue) is called after each change.
 * onStep(direction) can replace the built-in +/- math (used by water to avoid rounding drift).
 * canStep(direction) can decide when +/- are enabled (used by sleep so minutes carry into hours).
 */
export function stepper({
  id, label, value, step, stepText, unit = '', min = 0, max = Infinity,
  decimals = 2, integer = false, allowEmpty = true, onChange, onStep, canStep, focusKey = id,
}) {
  let current = value;

  const input = el('input', {
    type: 'text', id, class: 'stepper-input',
    inputmode: integer ? 'numeric' : 'decimal',
    'aria-label': label, placeholder: '0', autocomplete: 'off', enterkeyhint: 'done',
  });
  const show = (v) => { input.value = v === null ? '' : String(round(v, decimals)); };
  show(current);

  const button = (dir) => el('button', {
    type: 'button', class: 'step-btn',
    'aria-label': `${dir < 0 ? 'Decrease' : 'Increase'} ${label} by ${stepText}`,
    dataset: { focusKey: `${focusKey}-${dir < 0 ? 'minus' : 'plus'}` },
    onclick: () => stepBy(dir),
  },
  el('span', { class: 'step-sign', 'aria-hidden': 'true' }, dir < 0 ? '−' : '+'),
  el('span', { class: 'step-amt', 'aria-hidden': 'true' }, stepText));

  const minus = button(-1);
  const plus = button(1);
  const updateButtons = () => {
    if (canStep) { minus.disabled = !canStep(-1); plus.disabled = !canStep(1); return; }
    minus.disabled = current === null || current <= min;
    plus.disabled = current !== null && current >= max;
  };

  function commit(v) {
    current = v;
    show(v);
    updateButtons();
    onChange?.(v);
  }

  function stepBy(dir) {
    if (onStep) { onStep(dir); return; }
    const next = Math.min(max, Math.max(min, round((current ?? 0) + dir * step, decimals)));
    commit(next);
  }

  input.addEventListener('focus', () => input.select());
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') input.blur(); });
  input.addEventListener('change', () => {
    const n = parseNumber(input.value, { integer });
    if (n === null) {
      if (allowEmpty) commit(null);
      else { show(current); toast('This needs a number.', 'error'); }
      return;
    }
    if (Number.isNaN(n)) { show(current); toast('Please enter a number.', 'error'); return; }
    let v = round(n, decimals);
    let warning = null;
    if (v < min) { v = min; warning = `The lowest allowed is ${formatNumber(min)} ${unit}.`; }
    if (v > max) { v = max; warning = `The highest allowed is ${formatNumber(max)} ${unit}.`; }
    commit(v);
    if (warning) toast(warning, 'error');
  });

  updateButtons();
  return el('div', { class: 'stepper' },
    minus,
    el('div', { class: 'stepper-mid' },
      input,
      unit && el('label', { class: 'stepper-unit', for: id }, unit)),
    plus);
}

/** Two-or-more option toggle, e.g. [ fl oz / gal | Liters ]. */
export function segmented({ label, options, value, onChange, focusKey = 'seg' }) {
  return el('div', { class: 'seg', role: 'radiogroup', 'aria-label': label },
    options.map((o) => el('button', {
      type: 'button', role: 'radio',
      class: o.value === value ? 'seg-btn on' : 'seg-btn',
      'aria-checked': String(o.value === value),
      dataset: { focusKey: `${focusKey}-${o.value}` },
      onclick: () => { if (o.value !== value) onChange(o.value); },
    }, o.label)));
}
