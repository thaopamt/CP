/**
 * Period-key helpers shared by quests, badges and the leaderboard so that
 * "this week" / "this month" mean the same window everywhere.
 *
 * Weekly XP and monthly XP live denormalised on the student profile and are
 * lazily reset: the first XP gain in a new period zeroes the bucket before
 * adding to it. This avoids any cron job — a stale bucket is simply ignored
 * (treated as 0) until the next gain rolls it over.
 */

/** ISO week key, e.g. `2026-W24`. Mirrors QuestsService.weekKey. */
export function weekKey(d: Date): string {
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

/** Calendar month key, e.g. `2026-06`. */
export function monthKey(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

/** Milliseconds until the next ISO week starts (Monday 00:00 UTC). */
export function msUntilNextWeek(now: Date): number {
  const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const dayNum = date.getUTCDay() || 7; // 1..7, Mon..Sun
  const nextMonday = new Date(date);
  nextMonday.setUTCDate(date.getUTCDate() + (8 - dayNum));
  return nextMonday.getTime() - now.getTime();
}

/** Shape we need to mutate — a subset of StudentProfile's XP buckets. */
export interface XpBuckets {
  xp: number;
  weeklyXp: number;
  weekKey: string | null;
  monthlyXp: number;
  monthKey: string | null;
}

/**
 * Add `amount` XP to lifetime + the current weekly/monthly buckets, resetting a
 * bucket first if its stored key no longer matches the current period.
 */
export function applyXpGain(p: XpBuckets, amount: number, now: Date): void {
  if (amount <= 0) {
    // Still roll over stale buckets on read-ish paths if asked, but a 0 gain
    // shouldn't resurrect a new period; just bump lifetime (no-op here).
    p.xp += amount;
    return;
  }
  const wk = weekKey(now);
  const mk = monthKey(now);
  if (p.weekKey !== wk) {
    p.weekKey = wk;
    p.weeklyXp = 0;
  }
  if (p.monthKey !== mk) {
    p.monthKey = mk;
    p.monthlyXp = 0;
  }
  p.xp += amount;
  p.weeklyXp += amount;
  p.monthlyXp += amount;
}

/** Weekly XP as seen *now* — 0 if the stored bucket is from a previous week. */
export function currentWeeklyXp(p: XpBuckets, now: Date): number {
  return p.weekKey === weekKey(now) ? p.weeklyXp : 0;
}

/** Monthly XP as seen *now* — 0 if the stored bucket is from a previous month. */
export function currentMonthlyXp(p: XpBuckets, now: Date): number {
  return p.monthKey === monthKey(now) ? p.monthlyXp : 0;
}

// ── Check-in day keys (Asia/Ho_Chi_Minh, UTC+7) ──────────────────────────────

const VN_TZ = 'Asia/Ho_Chi_Minh';

/** Calendar day in VN (UTC+7), as 'YYYY-MM-DD'. */
export function checkinDayKey(now: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: VN_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

/** Whole calendar days from dayKey `a` to `b` (b - a). */
export function daysBetweenDayKeys(a: string, b: string): number {
  const toUtcNoon = (k: string) => {
    const [y, m, d] = k.split('-').map(Number);
    return Date.UTC(y, m - 1, d, 12);
  };
  return Math.round((toUtcNoon(b) - toUtcNoon(a)) / 86400000);
}
