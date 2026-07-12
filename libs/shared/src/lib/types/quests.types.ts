// ───────────────────────────────────────────────────────────────────────────
// Quest domain — gamified missions for students.
//
// A Quest is an admin-authored mission with a measurable *objective* (e.g.
// "solve 5 MEDIUM problems", "finish assignment X", "keep a 7-day streak").
// Progress is driven by a server-side Objective Engine that reacts to events
// (accepted submissions, maze clears, streak ticks, level-ups). Completed
// quests can be *claimed* for XP / gems / an optional badge reward.
// ───────────────────────────────────────────────────────────────────────────

export enum QuestType {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MAIN = 'MAIN',
  BOUNTY = 'BOUNTY',
  EVENT = 'EVENT',
}

/** Admin-side publish lifecycle of a quest definition. */
export enum QuestStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
}

/** Per-student progress lifecycle of an assigned quest. */
export enum StudentQuestStatus {
  LOCKED = 'LOCKED', // prerequisite not yet satisfied
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED', // target reached, reward not claimed
  CLAIMED = 'CLAIMED', // reward granted
  EXPIRED = 'EXPIRED', // recurring/event window passed before completion
}

/** How often a quest resets and re-assigns a fresh attempt to each student. */
export enum QuestRecurrence {
  NONE = 'NONE',
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  BIWEEKLY = 'BIWEEKLY',
}

/**
 * What real-world action moves the needle on a quest. The Objective Engine
 * matches incoming events against this type + {@link IQuestObjectiveConfig}.
 */
export enum QuestObjectiveType {
  /** Any accepted submission (coding or maze). */
  SUBMIT_ACCEPTED = 'SUBMIT_ACCEPTED',
  /** Accepted coding submission. */
  SOLVE_CODING = 'SOLVE_CODING',
  /** Accepted coding submission of a specific difficulty. */
  SOLVE_BY_DIFFICULTY = 'SOLVE_BY_DIFFICULTY',
  /** Accepted coding submission whose assignment carries a given tag. */
  SOLVE_BY_TAG = 'SOLVE_BY_TAG',
  /** Complete one or more specific assignments. */
  COMPLETE_ASSIGNMENT = 'COMPLETE_ASSIGNMENT',
  /** Clear a maze level (any, or specific ones). */
  SOLVE_MAZE = 'SOLVE_MAZE',
  /** Accumulate N assignment points. */
  EARN_POINTS = 'EARN_POINTS',
  /** Reach a streak of N consecutive active days. */
  STREAK_DAYS = 'STREAK_DAYS',
  /** Reach a total XP threshold. */
  EARN_XP = 'EARN_XP',
  /** Reach a profile level. */
  REACH_LEVEL = 'REACH_LEVEL',
}

export const PERIOD_SCOPED_QUEST_OBJECTIVES: readonly QuestObjectiveType[] = [
  QuestObjectiveType.SUBMIT_ACCEPTED,
  QuestObjectiveType.SOLVE_CODING,
  QuestObjectiveType.SOLVE_BY_DIFFICULTY,
  QuestObjectiveType.SOLVE_BY_TAG,
  QuestObjectiveType.COMPLETE_ASSIGNMENT,
  QuestObjectiveType.SOLVE_MAZE,
  QuestObjectiveType.EARN_POINTS,
];

export function isPeriodScopedQuestObjective(objectiveType: QuestObjectiveType): boolean {
  return PERIOD_SCOPED_QUEST_OBJECTIVES.includes(objectiveType);
}

/** Local string-literal difficulty (mirrors Assignment.difficulty literals). */
export type QuestDifficulty = 'EASY' | 'MEDIUM' | 'HARD';

/** Free-form, objective-specific tuning stored as JSONB on the quest. */
export interface IQuestObjectiveConfig {
  /** For SOLVE_BY_DIFFICULTY. */
  difficulty?: QuestDifficulty;
  /** For SOLVE_BY_TAG. */
  tag?: string;
  /** For COMPLETE_ASSIGNMENT — the assignment(s) that count. */
  assignmentIds?: string[];
  /** For SOLVE_MAZE — restrict to specific levels (empty = any). */
  mazeLevelIds?: string[];
  /**
   * When true, repeated actions on the *same* resource each count toward the
   * target. Default (false) counts a resource only once (distinct problems).
   */
  allowRepeat?: boolean;
}

export interface IQuest {
  id: string;
  title: string;
  description: string;
  type: QuestType;
  status: QuestStatus;

  // Objective
  objectiveType: QuestObjectiveType;
  objectiveConfig: IQuestObjectiveConfig | null;
  targetCount: number;

  // Rewards
  rewardXp: number;
  rewardGems: number;
  /** Optional badge granted on claim. */
  rewardBadgeId: string | null;

  // Presentation
  icon: string;
  /** Free-form grouping label, e.g. "Beginner", "Algorithms". */
  category: string | null;
  /** Manual ordering within a type column (asc). */
  sortOrder: number;

  // Scheduling
  recurrence: QuestRecurrence;
  startsAt: string | null;
  endsAt: string | null;

  // Gating & targeting
  prerequisiteQuestId: string | null;
  /** Restrict visibility to students enrolled in these classes (empty = all). */
  classIds: string[] | null;

  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IStudentQuest {
  id: string;
  userId: string;
  questId: string;
  quest: IQuest;
  progress: number;
  status: StudentQuestStatus;
  /** Engine bookkeeping (distinct resource ids counted, points accrued, …). */
  progressData: IStudentQuestProgressData | null;
  /** Identifies the recurrence window this attempt belongs to. */
  periodKey: string;
  startedAt: string | null;
  completedAt: string | null;
  claimedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface IStudentQuestProgressData {
  /** Distinct resource ids already counted (anti double-count). */
  countedIds?: string[];
  /** Accumulated points for EARN_POINTS objectives. */
  pointsAccrued?: number;
}

export interface IClaimQuestPayload {
  studentQuestId: string;
}

/** Result returned by a claim, carrying side-effects for nice client UX. */
export interface IClaimQuestResult {
  studentQuest: IStudentQuest;
  awardedXp: number;
  awardedGems: number;
  newLevel: number;
  leveledUp: boolean;
  badgeAwarded: import('./gamification.types').IBadge | null;
}

export interface ICreateQuestPayload {
  title: string;
  description?: string;
  type: QuestType;
  status?: QuestStatus;
  objectiveType: QuestObjectiveType;
  objectiveConfig?: IQuestObjectiveConfig | null;
  targetCount: number;
  rewardXp: number;
  rewardGems: number;
  rewardBadgeId?: string | null;
  icon?: string;
  category?: string | null;
  sortOrder?: number;
  recurrence?: QuestRecurrence;
  startsAt?: string | null;
  endsAt?: string | null;
  prerequisiteQuestId?: string | null;
  classIds?: string[] | null;
  isActive?: boolean;
}

export type IUpdateQuestPayload = Partial<ICreateQuestPayload>;

// ── Human-readable catalog metadata (shared by admin form & validation) ──────

export interface IQuestObjectiveMeta {
  type: QuestObjectiveType;
  /** i18n key suffix, label, and which config fields are relevant. */
  needsDifficulty?: boolean;
  needsTag?: boolean;
  needsAssignments?: boolean;
  needsMazeLevels?: boolean;
  /** Counting unit i18n hint, e.g. "problems", "points", "days". */
  unit: 'submissions' | 'problems' | 'assignments' | 'mazes' | 'points' | 'days' | 'level' | 'xp';
}

export const QUEST_OBJECTIVE_META: Record<QuestObjectiveType, IQuestObjectiveMeta> = {
  [QuestObjectiveType.SUBMIT_ACCEPTED]: { type: QuestObjectiveType.SUBMIT_ACCEPTED, unit: 'submissions' },
  [QuestObjectiveType.SOLVE_CODING]: { type: QuestObjectiveType.SOLVE_CODING, unit: 'problems' },
  [QuestObjectiveType.SOLVE_BY_DIFFICULTY]: {
    type: QuestObjectiveType.SOLVE_BY_DIFFICULTY,
    needsDifficulty: true,
    unit: 'problems',
  },
  [QuestObjectiveType.SOLVE_BY_TAG]: { type: QuestObjectiveType.SOLVE_BY_TAG, needsTag: true, unit: 'problems' },
  [QuestObjectiveType.COMPLETE_ASSIGNMENT]: {
    type: QuestObjectiveType.COMPLETE_ASSIGNMENT,
    needsAssignments: true,
    unit: 'assignments',
  },
  [QuestObjectiveType.SOLVE_MAZE]: { type: QuestObjectiveType.SOLVE_MAZE, needsMazeLevels: true, unit: 'mazes' },
  [QuestObjectiveType.EARN_POINTS]: { type: QuestObjectiveType.EARN_POINTS, unit: 'points' },
  [QuestObjectiveType.STREAK_DAYS]: { type: QuestObjectiveType.STREAK_DAYS, unit: 'days' },
  [QuestObjectiveType.EARN_XP]: { type: QuestObjectiveType.EARN_XP, unit: 'xp' },
  [QuestObjectiveType.REACH_LEVEL]: { type: QuestObjectiveType.REACH_LEVEL, unit: 'level' },
};
