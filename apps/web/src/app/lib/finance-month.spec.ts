import { describe, expect, it } from 'vitest';

import {
  currentFinanceMonth,
  formatFinanceMonthLabel,
  shiftFinanceMonth,
} from './finance-month';

describe('finance month helpers', () => {
  it('formats a report month for display', () => {
    expect(formatFinanceMonthLabel('2026-07')).toBe('07/2026');
  });

  it('moves to the previous or next report month across year boundaries', () => {
    expect(shiftFinanceMonth('2026-07', -1)).toBe('2026-06');
    expect(shiftFinanceMonth('2026-01', -1)).toBe('2025-12');
    expect(shiftFinanceMonth('2026-12', 1)).toBe('2027-01');
  });

  it('creates the current report month from a Date', () => {
    expect(currentFinanceMonth(new Date(2026, 6, 11))).toBe('2026-07');
  });
});
