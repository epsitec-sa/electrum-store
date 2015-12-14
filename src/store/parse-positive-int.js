'use strict';

export default function parsePositiveInt (value) {
  if (typeof value === 'number') {
    if (Number.isSafeInteger (value) && value >= 0) {
      return value;
    }
    return NaN;
  }
  if (typeof value === 'string') {
    if (/^([0-9]+)$/.test (value)) {
      const num = Number.parseInt (value, 10);
      if (Number.isSafeInteger (num)) {
        return num;
      }
    }
  }
  return NaN;
}

export function isPositiveInt (value) {
  return !isNaN (parsePositiveInt (value));
}
