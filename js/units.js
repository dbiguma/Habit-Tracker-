// Unit conversions and number formatting.
// Water is always STORED in US fluid ounces; liters and gallons are calculated for display.

export const ML_PER_FL_OZ = 29.5735295625; // exact US definition
export const FL_OZ_PER_GALLON = 128;

/** Round to `decimals` places (default 2). */
export function round(x, decimals = 2) {
  const f = 10 ** decimals;
  return Math.round(x * f) / f;
}

export function litersToFlOz(liters) {
  return round((liters * 1000) / ML_PER_FL_OZ, 2);
}

export function flOzToLiters(flOz) {
  return (flOz * ML_PER_FL_OZ) / 1000;
}

export function flOzToGallons(flOz) {
  return flOz / FL_OZ_PER_GALLON;
}

/** Friendly number for display: "10,000", "1.89", "7.5" (no trailing zeros). */
export function formatNumber(x, maxDecimals = 2) {
  return round(x, maxDecimals).toLocaleString(undefined, { maximumFractionDigits: maxDecimals });
}
