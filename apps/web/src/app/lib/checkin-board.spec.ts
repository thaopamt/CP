import { describe, expect, it } from 'vitest';
import type { ICheckinStatus } from '@cp/shared';

import { buildBoardWeeks, streakBonusGems, shouldOpenCheckinPopup } from './checkin-board';

function statusFor(month: string, cells: { dayKey: string; status: ICheckinStatus['board'][number]['status'] }[]): ICheckinStatus {
  return {
    today: `${month}-11`,
    checkedInToday: false,
    monthKey: month,
    board: cells,
    currentStreak: 0,
    longestStreak: 0,
    totalCheckins: 0,
    monthlyCheckins: 0,
    freezeTokens: 0,
    pendingWheelSpins: 0,
    makeupRemaining: 0,
    makeupCost: 0,
  };
}

describe('streakBonusGems', () => {
  it('is 0 on day 1, grows +2/day, and caps at 20', () => {
    expect(streakBonusGems(1)).toBe(0);
    expect(streakBonusGems(4)).toBe(6);
    expect(streakBonusGems(11)).toBe(20);
    expect(streakBonusGems(50)).toBe(20);
    expect(streakBonusGems(0)).toBe(0);
  });
});

describe('shouldOpenCheckinPopup', () => {
  it('opens when not checked in and not yet shown today', () => {
    expect(shouldOpenCheckinPopup({ checkedInToday: false, today: '2026-07-11', lastPopupDay: null })).toBe(true);
    expect(shouldOpenCheckinPopup({ checkedInToday: false, today: '2026-07-11', lastPopupDay: '2026-07-10' })).toBe(true);
  });

  it('stays closed when already checked in, or already shown today', () => {
    expect(shouldOpenCheckinPopup({ checkedInToday: true, today: '2026-07-11', lastPopupDay: null })).toBe(false);
    expect(shouldOpenCheckinPopup({ checkedInToday: false, today: '2026-07-11', lastPopupDay: '2026-07-11' })).toBe(false);
  });
});

describe('buildBoardWeeks', () => {
  it('lays a 31-day month (July 2026, 1st is Wednesday) into Monday-first weeks with padding', () => {
    const cells = Array.from({ length: 31 }, (_, i) => ({
      dayKey: `2026-07-${String(i + 1).padStart(2, '0')}`,
      status: 'future' as const,
    }));
    const weeks = buildBoardWeeks(statusFor('2026-07', cells));

    // July 1 2026 is a Wednesday → Monday-first offset 2 → two leading nulls.
    expect(weeks[0].cells.slice(0, 2)).toEqual([null, null]);
    expect(weeks[0].cells[2]?.dayKey).toBe('2026-07-01');
    // Every week has exactly 7 slots.
    for (const w of weeks) expect(w.cells).toHaveLength(7);
    // All 31 real cells preserved in order.
    const flat = weeks.flatMap((w) => w.cells).filter((c): c is NonNullable<typeof c> => c !== null);
    expect(flat).toHaveLength(31);
    expect(flat[0].dayKey).toBe('2026-07-01');
    expect(flat[30].dayKey).toBe('2026-07-31');
    // Trailing slots of the last week are null padding.
    const last = weeks[weeks.length - 1].cells;
    expect(last[last.length - 1]).toBeNull();
  });
});
