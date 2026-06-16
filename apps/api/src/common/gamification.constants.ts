/**
 * ── Gamification constants & helpers ───────────────────────────────────────
 *
 * Single source of truth for every XP / level / daily-goal tunable.
 * Importing from here instead of hardcoding `1000` scattered across
 * services keeps the system easy to recalibrate.
 */

// ── Levelling ───────────────────────────────────────────────────────────────

/**
 * XP required per level.
 * Level N spans the XP range `[N * XP_PER_LEVEL, (N+1) * XP_PER_LEVEL)`.
 *
 * Exception: Level 1 starts at 0 XP (the "opening" level: `[0, 2000)`).
 */
export const XP_PER_LEVEL = 3000;

// ── Daily goals ─────────────────────────────────────────────────────────────

/** Number of accepted submissions a student should aim for per day. */
export const DAILY_QUESTS_TARGET = 5;

// ── Helpers ─────────────────────────────────────────────────────────────────

/**
 * The XP threshold at which a student advances from `level` to `level + 1`.
 *
 * ```
 * Level 1 → 2 : 2 000 XP
 * Level 2 → 3 : 3 000 XP
 * Level N → N+1 : (N+1) * XP_PER_LEVEL
 * ```
 */
export function xpThresholdForNextLevel(level: number): number {
  return (level + 1) * XP_PER_LEVEL;
}

/**
 * The XP floor for a given level.
 * Level 1 starts at 0; every other level N starts at `N * XP_PER_LEVEL`.
 */
export function xpFloorForLevel(level: number): number {
  return level <= 1 ? 0 : level * XP_PER_LEVEL;
}

/** XP earned *within* the current level (for progress bars). */
export function xpIntoCurrentLevel(xp: number, level: number): number {
  return Math.max(0, xp - xpFloorForLevel(level));
}

/** Width of the current level bucket in XP (for progress bars). */
export function xpBucketSize(level: number): number {
  return xpThresholdForNextLevel(level) - xpFloorForLevel(level);
}

/**
 * Advance `level` as many times as the current `xp` warrants.
 * Mutates the profile-like object in place and returns `true` if at least
 * one level-up occurred.
 *
 * ```ts
 * const leveledUp = advanceLevel(profile);
 * ```
 */
export function advanceLevel(p: { xp: number; level: number }): boolean {
  const start = p.level;
  while (p.xp >= xpThresholdForNextLevel(p.level)) {
    p.level += 1;
  }
  return p.level > start;
}
