// ───────────────────────────────────────────────────────────────────────────
// Gamification — badges/achievements, leaderboard, and quest analytics.
//
// Badges are awarded automatically when a student crosses a milestone
// (quests completed, problems solved, streak, level, XP, …). The leaderboard
// ranks students by a chosen stat. Analytics summarise quest engagement for
// admins.
// ───────────────────────────────────────────────────────────────────────────

export enum BadgeRarity {
  COMMON = 'COMMON',
  RARE = 'RARE',
  EPIC = 'EPIC',
  LEGENDARY = 'LEGENDARY',
}

/** What stat a badge watches. Evaluated against the student's live profile. */
export enum BadgeCriteriaType {
  QUESTS_COMPLETED = 'QUESTS_COMPLETED',
  PROBLEMS_SOLVED = 'PROBLEMS_SOLVED',
  MAZE_SOLVED = 'MAZE_SOLVED',
  STREAK_DAYS = 'STREAK_DAYS',
  REACH_LEVEL = 'REACH_LEVEL',
  EARN_XP = 'EARN_XP',
  EARN_GEMS = 'EARN_GEMS',
}

export interface IBadgeCriteria {
  type: BadgeCriteriaType;
  threshold: number;
}

export interface IBadge {
  id: string;
  code: string; // stable unique key, e.g. "FIRST_BLOOD"
  title: string;
  description: string;
  icon: string;
  rarity: BadgeRarity;
  criteria: IBadgeCriteria;
  rewardXp: number;
  rewardGems: number;
  isActive: boolean;
  /** Denormalized count of students who own this badge. */
  earnedCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface IStudentBadge {
  id: string;
  userId: string;
  badgeId: string;
  badge: IBadge;
  earnedAt: string;
  createdAt: string;
}

/** Student view: every badge in the catalog, flagged earned/locked + progress. */
export interface IStudentBadgeProgress {
  badge: IBadge;
  earned: boolean;
  earnedAt: string | null;
  current: number;
  threshold: number;
  /** 0–100. */
  percent: number;
}

export interface ICreateBadgePayload {
  code: string;
  title: string;
  description?: string;
  icon?: string;
  rarity?: BadgeRarity;
  criteria: IBadgeCriteria;
  rewardXp?: number;
  rewardGems?: number;
  isActive?: boolean;
}

export type IUpdateBadgePayload = Partial<ICreateBadgePayload>;

// ── Leaderboard ──────────────────────────────────────────────────────────────

export type LeaderboardScope = 'xp' | 'level' | 'gems' | 'questsCompleted' | 'streak';
export type LeaderboardWindow = 'all_time' | 'weekly' | 'monthly';

export interface ILeaderboardRankEntry {
  rank: number;
  userId: string;
  name: string;
  avatarUrl: string | null;
  level: number;
  xp: number;
  gems: number;
  streak: number;
  questsCompleted: number;
  badgeCount: number;
  /** The value of the chosen scope, pre-formatted server-side. */
  value: number;
  /** True for the requesting student's own row. */
  isMe?: boolean;
}

export interface ILeaderboardResponse {
  scope: LeaderboardScope;
  window: LeaderboardWindow;
  entries: ILeaderboardRankEntry[];
  /** The caller's own rank/entry even if outside the top N. */
  me: ILeaderboardRankEntry | null;
  total: number;
}

export interface ILeaderboardParams {
  scope?: LeaderboardScope;
  window?: LeaderboardWindow;
  classId?: string;
  limit?: number;
}

// ── Quest analytics (admin) ──────────────────────────────────────────────────

export interface IQuestAnalyticsRow {
  questId: string;
  title: string;
  type: string;
  icon: string;
  assignedCount: number;
  inProgressCount: number;
  completedCount: number;
  claimedCount: number;
  /** completed+claimed over assigned, 0–100. */
  completionRate: number;
  xpAwarded: number;
  gemsAwarded: number;
}

export interface IQuestAnalyticsSummary {
  totalQuests: number;
  activeQuests: number;
  totalAssignments: number; // student-quest rows
  totalCompleted: number;
  totalClaimed: number;
  totalXpAwarded: number;
  totalGemsAwarded: number;
  /** IN_PROGRESS → COMPLETED → CLAIMED funnel. */
  funnel: { inProgress: number; completed: number; claimed: number };
  rows: IQuestAnalyticsRow[];
}

// ── Realtime gamification events (WebSocket /gamification) ────────────────────

export type GamificationEventType = 'quest:completed' | 'badge:earned' | 'level:up';

export interface IGamificationEvent {
  type: GamificationEventType;
  title: string;
  message: string;
  icon: string;
  // Optional payloads
  questId?: string;
  badgeId?: string;
  level?: number;
  rewardXp?: number;
  rewardGems?: number;
  at: string;
}
