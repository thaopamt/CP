/**
 * ── Check-in reward economy ───────────────────────────────────────────────────
 *
 * Phase-1 tunables: base gems/XP per check-in + a capped streak bonus.
 * Phase-2 weekly milestone, freeze token, and makeup constants now live in
 * this file too (wheel / all-time milestone / perfect-month are still
 * pending in later Phase-2 tasks).
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

// ── Phase 2: makeup check-in (spec §6b) ──────────────────────────────────────
export const CHECKIN_MAKEUP_COST_GEMS = 20;
export const CHECKIN_MAKEUP_MAX_PER_MONTH = 2;
