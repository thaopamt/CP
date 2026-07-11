import type { ICheckinBoardCell, ICheckinStatus } from '@cp/shared';

export interface CheckinBoardWeek {
  cells: (ICheckinBoardCell | null)[];
}

/** Monday-first weekday index (0 = Mon … 6 = Sun) for a 'YYYY-MM-DD' key. */
function mondayFirstDow(dayKey: string): number {
  const [y, m, d] = dayKey.split('-').map(Number);
  const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay(); // 0 = Sun
  return (dow + 6) % 7;
}

/**
 * Chunk a month's day cells into Monday-first calendar weeks, padding the
 * first and last weeks with nulls. Phase-1 status values only.
 */
export function buildBoardWeeks(status: ICheckinStatus): CheckinBoardWeek[] {
  const cells = status.board;
  if (cells.length === 0) return [];
  const slots: (ICheckinBoardCell | null)[] = [];
  const lead = mondayFirstDow(cells[0].dayKey);
  for (let i = 0; i < lead; i++) slots.push(null);
  slots.push(...cells);
  while (slots.length % 7 !== 0) slots.push(null);

  const weeks: CheckinBoardWeek[] = [];
  for (let i = 0; i < slots.length; i += 7) {
    weeks.push({ cells: slots.slice(i, i + 7) });
  }
  return weeks;
}

/** Phase-1 streak bonus gems: 0 on day 1, +2/day, capped at 20. Mirrors backend. */
export function streakBonusGems(currentStreak: number): number {
  return Math.min(20, Math.max(0, currentStreak - 1) * 2);
}

/**
 * Once/day popup gate: open only when the student has not checked in today AND
 * the popup has not already been shown for the server-authoritative VN day
 * (`today`). Pure so it can be unit-tested without a DOM.
 */
export function shouldOpenCheckinPopup(params: {
  checkedInToday: boolean;
  today: string;
  lastPopupDay: string | null;
}): boolean {
  if (params.checkedInToday) return false;
  if (params.lastPopupDay === params.today) return false;
  return true;
}
