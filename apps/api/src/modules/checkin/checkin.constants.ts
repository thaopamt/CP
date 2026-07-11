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

// ── Phase 2: lucky wheel (spec §5/§6c) — total weight = 100, server-authoritative ──
export const CHECKIN_WHEEL_SEGMENTS = [
  { index: 0, kind: 'gems', amount: 10, weight: 30 },
  { index: 1, kind: 'xp', amount: 50, weight: 25 },
  { index: 2, kind: 'gems', amount: 25, weight: 20 },
  { index: 3, kind: 'xp', amount: 150, weight: 12 },
  { index: 4, kind: 'gems', amount: 60, weight: 8 },
  { index: 5, kind: 'gems', amount: 100, weight: 5 },
] as const;

// ── Phase 2: all-time streak milestones + badges (spec §4.4/§5/§6d) ──────────
export const CHECKIN_ALLTIME_MILESTONES = [7, 30, 100] as const;
export const CHECKIN_MILESTONE_SHOP_ITEM_AT = [30, 100] as const;   // grant a gems-fallback bundle
export const CHECKIN_MILESTONE_ITEM_FALLBACK_GEMS = 100;
export const CHECKIN_BADGE_CODES = {
  STREAK_7: 'checkin-streak-7',
  STREAK_30: 'checkin-streak-30',
  STREAK_100: 'checkin-streak-100',
  PERFECT_MONTH: 'checkin-perfect-month',
} as const;

// ── Phase 2: attendance leaderboard (Task 13) ─────────────────────────────────
export const CHECKIN_LEADERBOARD_DEFAULT_LIMIT = 20;
