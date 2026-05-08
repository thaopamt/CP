/**
 * Domain enums + DTOs for the Student portal v4 pages
 * (Home, Assignments / Feedback Hub, Coding Workspace).
 */

// ── Generic progression / gamification ───────────────────────────────────

export interface IStudentProgress {
  level: number;
  currentXP: number;
  nextLevelXP: number;
  /** Streak in consecutive days. */
  streakDays: number;
  /** Days needed to reach the next streak milestone. */
  nextStreakMilestone: number;
}

export interface IDailyGoal {
  /** Target minutes for the day */
  targetMinutes: number;
  /** Minutes already logged today */
  loggedMinutes: number;
}

export interface IAchievement {
  id: string;
  /** Material symbol icon name */
  icon: string;
  label: string;
  caption?: string;
  unlocked: boolean;
}

// ── Quests (extends QuestCard's idea with extra metadata) ────────────────

export enum QuestState {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
}

export enum DifficultyLevel {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD',
}

export const DIFFICULTY_LABEL: Record<DifficultyLevel, string> = {
  [DifficultyLevel.EASY]: 'Easy',
  [DifficultyLevel.MEDIUM]: 'Medium',
  [DifficultyLevel.HARD]: 'Hard',
};

export interface IQuest {
  id: string;
  title: string;
  subject: string;
  /** Material symbol icon name */
  icon: string;
  /** Tailwind classes for the icon container, e.g. "bg-primary-container text-primary" */
  iconClass?: string;
  difficulty: DifficultyLevel;
  durationLabel: string;
  state: QuestState;
  /** 0–100 */
  progress?: number;
  xpReward?: number;
}

// ── Assignments / Feedback Hub ───────────────────────────────────────────

export enum AssignmentTab {
  TODO = 'TODO',
  IN_REVIEW = 'IN_REVIEW',
  COMPLETED = 'COMPLETED',
}

export const ASSIGNMENT_TAB_LABEL: Record<AssignmentTab, string> = {
  [AssignmentTab.TODO]: 'To Do',
  [AssignmentTab.IN_REVIEW]: 'In Review',
  [AssignmentTab.COMPLETED]: 'Completed',
};

export interface IAssignment {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: DifficultyLevel;
  /** Tailwind text color for the leading icon, e.g. 'text-primary' */
  iconColor?: string;
  /** Material symbol icon name */
  icon: string;
  xpReward: number;
  /** ISO datetime */
  dueAt: string;
  status: AssignmentTab;
  /** 0–100, populated for IN_PROGRESS work */
  progress?: number;
}

export interface IFeedback {
  id: string;
  assignmentId: string;
  assignmentTitle: string;
  teacherName: string;
  teacherAvatarUrl?: string | null;
  /** ISO datetime */
  postedAt: string;
  text: string;
}

// ── Coding workspace ─────────────────────────────────────────────────────

export interface IProblem {
  id: string;
  title: string;
  questIndex: number;
  questTotal: number;
  description: string;
  /** Bullet-pointed instructions, may include `\`code\`` markup */
  instructions: string[];
  hint?: string;
  expectedResult?: string;
  difficulty: DifficultyLevel;
}

export type ConsoleLineType = 'info' | 'success' | 'error' | 'warning';

export interface IConsoleLine {
  id: string;
  text: string;
  type: ConsoleLineType;
  /** ISO datetime — optional, used for log timestamps */
  loggedAt?: string;
}

export interface ITestResult {
  id: string;
  name: string;
  passed: boolean;
  details?: string;
}
