/**
 * ── Check-in reward economy (Phase 1) ────────────────────────────────────────
 *
 * Phase-1 tunables ONLY: base gems/XP per check-in + a capped streak bonus.
 * Weekly / freeze / makeup / wheel / milestone / perfect-month constants are
 * added in Phase 2 — do NOT reference them here.
 */

/** Gems granted for an ordinary check-in. */
export const CHECKIN_BASE_GEMS = 5;

/** XP granted for an ordinary check-in. */
export const CHECKIN_BASE_XP = 20;

/** Extra gems per streak day beyond day 1. */
export const CHECKIN_STREAK_GEM_PER_DAY = 2;

/** Cap on the streak-bonus gems. */
export const CHECKIN_STREAK_GEM_CAP = 20;

/** bonusGems = min(cap, (currentStreak - 1) * perDay); never negative. */
export function streakBonusGems(currentStreak: number): number {
  return Math.min(CHECKIN_STREAK_GEM_CAP, Math.max(0, currentStreak - 1) * CHECKIN_STREAK_GEM_PER_DAY);
}

// ── Phase 2: weekly milestone + freeze tokens (spec §5/§6a) ──────────────────
export const CHECKIN_WEEKLY_PERIOD = 7;
export const CHECKIN_WEEKLY_GEMS = 30;
export const CHECKIN_WEEKLY_XP = 100;
export const CHECKIN_WEEKLY_SPINS = 1;
export const CHECKIN_WEEKLY_FREEZE = 1;
export const CHECKIN_FREEZE_CAP = 3;
