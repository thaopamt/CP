/**
 * Exam / Contest feature — shared types used by both the NestJS API and the
 * React frontend (imported via `@cp/shared`).
 *
 * Design notes:
 *  - "Problem" reuses the existing `Assignment` entity; an exam references
 *    assignments through `ExamProblem`.
 *  - Scoring is computed from the existing per-testcase `SubmissionTestResult`
 *    rows, so the synchronous judge is reused unchanged.
 *  - Status stores the operator-driven lifecycle only; the time-based phase
 *    (UPCOMING / RUNNING / ENDED) is derived from start/end on the server.
 */
import { SubmissionStatus } from './submission.types';

// ─────────────────────────────────────────────────────────────────────────────
// Enums (values are stored verbatim in Postgres enum columns — do not rename
// without a migration).
// ─────────────────────────────────────────────────────────────────────────────

/** Operator-driven lifecycle stored on the exam row. */
export enum ExamStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  FINALIZING = 'FINALIZING',
  FINALIZED = 'FINALIZED',
  ARCHIVED = 'ARCHIVED',
}

/** Derived, time-based phase for a PUBLISHED exam (never persisted). */
export enum ExamPhase {
  UPCOMING = 'UPCOMING',
  RUNNING = 'RUNNING',
  ENDED = 'ENDED',
}

export enum ContestFormat {
  ICPC = 'ICPC',
  OI = 'OI',
  IOI = 'IOI',
  SCORE_BASED = 'SCORE_BASED',
  PRACTICE = 'PRACTICE',
  CUSTOM = 'CUSTOM',
}

export enum ExamRankingRule {
  SCORE_ONLY = 'SCORE_ONLY',
  SCORE_THEN_TIME = 'SCORE_THEN_TIME',
  ICPC = 'ICPC',
  OI = 'OI',
  CUSTOM = 'CUSTOM',
}

export enum ExamTieMode {
  DENSE = 'DENSE',
  COMPETITION = 'COMPETITION',
  UNIQUE = 'UNIQUE',
}

export enum ExamVisibility {
  PUBLIC = 'PUBLIC',
  CLASS = 'CLASS',
  INVITE = 'INVITE',
}

/** How a single problem's score is computed from its testcase results. */
export enum ExamScoringMode {
  /** Full points iff every testcase passes, else 0. */
  BINARY = 'BINARY',
  /** points * passed / total (proportional). */
  PARTIAL_TESTCASE = 'PARTIAL_TESTCASE',
  /** All-or-nothing per declared subtask range. */
  SUBTASK = 'SUBTASK',
}

export enum ExamParticipantState {
  INVITED = 'INVITED',
  REGISTERED = 'REGISTERED',
  JOINED = 'JOINED',
  BANNED = 'BANNED',
  DISQUALIFIED = 'DISQUALIFIED',
}

export enum ExamRewardType {
  RANK = 'RANK',
  SCORE = 'SCORE',
  COMPLETION = 'COMPLETION',
  PARTICIPATION = 'PARTICIPATION',
  FIRST_SOLVE = 'FIRST_SOLVE',
  BADGE = 'BADGE',
}

export enum ExamRewardGrantStatus {
  PENDING = 'PENDING',
  GRANTED = 'GRANTED',
  REVOKED = 'REVOKED',
  FAILED = 'FAILED',
}

export enum ExamAuditAction {
  CREATED = 'CREATED',
  UPDATED = 'UPDATED',
  PUBLISHED = 'PUBLISHED',
  CLOSED = 'CLOSED',
  ARCHIVED = 'ARCHIVED',
  FROZEN = 'FROZEN',
  UNFROZEN = 'UNFROZEN',
  FINALIZED = 'FINALIZED',
  SNAPSHOT_CREATED = 'SNAPSHOT_CREATED',
  RANKING_RECALCULATED = 'RANKING_RECALCULATED',
  REWARD_GRANTED = 'REWARD_GRANTED',
  REWARD_REVOKED = 'REWARD_REVOKED',
  REWARD_RETRIED = 'REWARD_RETRIED',
  REJUDGE_STARTED = 'REJUDGE_STARTED',
  REJUDGE_COMPLETED = 'REJUDGE_COMPLETED',
  PROBLEM_ADDED = 'PROBLEM_ADDED',
  PROBLEM_REMOVED = 'PROBLEM_REMOVED',
  PARTICIPANT_ADDED = 'PARTICIPANT_ADDED',
  PARTICIPANT_REMOVED = 'PARTICIPANT_REMOVED',
  PARTICIPANT_BANNED = 'PARTICIPANT_BANNED',
  PARTICIPANT_UNBANNED = 'PARTICIPANT_UNBANNED',
}

// ─────────────────────────────────────────────────────────────────────────────
// JSON sub-shapes
// ─────────────────────────────────────────────────────────────────────────────

/** One subtask = an inclusive testcase-index range scored all-or-nothing. */
export interface ISubtaskConfig {
  name?: string;
  testIndexFrom: number;
  testIndexTo: number;
  points: number;
}

/** Exam.settings_json — presentation/behaviour knobs never filtered on. */
export interface IExamSettings {
  /** ICPC penalty minutes added per wrong attempt before the first AC. */
  penaltyPerWrongMinutes?: number;
  /** Whether a compile error counts as a penalised wrong attempt (ICPC). */
  penaltyCountsCompileError?: boolean;
  /** Best-submission policy for OI/score formats. */
  oiBestPolicy?: 'max' | 'last';
  /** Restrict submission languages (overrides assignment config). */
  allowedLanguages?: string[];
  /** Show the leaderboard to students at all. */
  showLeaderboardToStudents?: boolean;
  /** Show numeric scores (vs only AC/WA verdicts) to students. */
  showScoreToStudents?: boolean;
  /** Reveal hidden testcase details only after the exam ends. */
  revealTestsAfterEnd?: boolean;
  /** Freeze the public leaderboard this many minutes before end_at. */
  freezeOffsetMinutes?: number;
  /** Allow joining after the exam has started. */
  allowLateJoin?: boolean;
  /** Cap submissions per problem per participant. */
  maxAttemptsPerProblem?: number;
  /** CUSTOM-format scoring/ranking knobs. */
  customScoring?: Record<string, unknown>;
  customRanking?: { keys: { field: string; dir: 'ASC' | 'DESC' }[] };
}

/** ExamRewardRule.condition_json — predicate evaluated against the snapshot. */
export interface IExamRewardCondition {
  rankFrom?: number;
  rankTo?: number;
  minScore?: number;
  /** Fraction of the exam's max total score, 0..1 (alternative to minScore). */
  minScoreRatio?: number;
  minSolved?: number;
  /** FIRST_SOLVE: award the first solver of each problem. */
  perProblem?: boolean;
}

/** ExamRewardRule.reward_json — what a matching participant receives. */
export interface IExamReward {
  gems?: number;
  xp?: number;
  badgeId?: string | null;
  /** Display label, e.g. "Gold Medal". */
  title?: string;
}

/** One problem's contribution to a participant's score. */
export interface IExamProblemResult {
  examProblemId: string;
  assignmentId: string;
  label: string | null;
  score: number;
  maxScore: number;
  solved: boolean;
  attempts: number;
  penalty: number;
  /** ms since the participant's exam start to the scoring submission. */
  solveTimeMs: number | null;
  bestSubmissionId: string | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Entity DTO shapes (wire types)
// ─────────────────────────────────────────────────────────────────────────────

export interface IExam {
  id: string;
  title: string;
  slug: string | null;
  description: string;
  format: ContestFormat;
  rankingRule: ExamRankingRule;
  tieMode: ExamTieMode;
  status: ExamStatus;
  /** Derived; present on read responses. */
  phase?: ExamPhase;
  startAt: string;
  endAt: string;
  durationMinutes: number | null;
  freezeAt: string | null;
  isFrozen: boolean;
  visibility: ExamVisibility;
  classIds: string[] | null;
  createdBy: string;
  autoFinalize: boolean;
  autoGrantReward: boolean;
  finalizedAt: string | null;
  snapshotVersion: number;
  settings: IExamSettings | null;
  createdAt: string;
  updatedAt: string;
  /** Optional embellishments on detail responses. */
  problemCount?: number;
  participantCount?: number;
}

export interface IExamProblem {
  id: string;
  examId: string;
  assignmentId: string;
  orderIndex: number;
  label: string | null;
  points: number;
  scoringMode: ExamScoringMode;
  subtaskConfig: ISubtaskConfig[] | null;
  createdAt: string;
  updatedAt: string;
  /** Joined assignment summary for admin/student UIs. */
  assignment?: {
    id: string;
    title: string;
    slug: string | null;
    difficulty?: string;
  };
}

export interface IExamParticipant {
  id: string;
  examId: string;
  userId: string;
  state: ExamParticipantState;
  joinedAt: string | null;
  invitedBy: string | null;
  banReason: string | null;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    username: string | null;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
  };
}

/** A single row in a live or official leaderboard. */
export interface IExamRankingRow {
  rank: number;
  displayRank: number;
  userId: string;
  name: string;
  username: string | null;
  avatarUrl: string | null;
  totalScore: number;
  solvedCount: number;
  penalty: number;
  lastSolveTimeMs: number | null;
  problemResults: IExamProblemResult[];
  isMe?: boolean;
}

export interface IExamLeaderboardResponse {
  examId: string;
  rankingRule: ExamRankingRule;
  tieMode: ExamTieMode;
  /** True when the rows reflect the frozen (pre-freeze) state. */
  frozen: boolean;
  /** True once the exam is finalized (rows come from the snapshot). */
  official: boolean;
  rows: IExamRankingRow[];
  me: IExamRankingRow | null;
  total: number;
}

export interface IExamRewardRule {
  id: string;
  examId: string;
  type: ExamRewardType;
  label: string | null;
  condition: IExamRewardCondition;
  reward: IExamReward;
  priority: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IExamRewardGrant {
  id: string;
  examId: string;
  userId: string;
  rewardRuleId: string;
  status: ExamRewardGrantStatus;
  grantedGems: number;
  grantedXp: number;
  grantedBadgeId: string | null;
  snapshotVersion: number;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
  user?: { id: string; firstName: string; lastName: string; username: string | null };
  rule?: { id: string; type: ExamRewardType; label: string | null };
}

export interface IExamAuditLogEntry {
  id: string;
  examId: string;
  actorId: string | null;
  action: ExamAuditAction;
  meta: Record<string, unknown> | null;
  createdAt: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Request payloads / responses
// ─────────────────────────────────────────────────────────────────────────────

export interface ICreateExamPayload {
  title: string;
  description?: string;
  format?: ContestFormat;
  rankingRule?: ExamRankingRule;
  tieMode?: ExamTieMode;
  startAt: string;
  endAt: string;
  durationMinutes?: number | null;
  freezeAt?: string | null;
  visibility?: ExamVisibility;
  classIds?: string[] | null;
  autoFinalize?: boolean;
  autoGrantReward?: boolean;
  settings?: IExamSettings | null;
}

export type IUpdateExamPayload = Partial<ICreateExamPayload>;

export interface IAddExamProblemPayload {
  assignmentId: string;
  orderIndex?: number;
  label?: string | null;
  points?: number;
  scoringMode?: ExamScoringMode;
  subtaskConfig?: ISubtaskConfig[] | null;
}

export type IUpdateExamProblemPayload = Partial<Omit<IAddExamProblemPayload, 'assignmentId'>>;

export interface ICreateExamRewardRulePayload {
  type: ExamRewardType;
  label?: string | null;
  condition: IExamRewardCondition;
  reward: IExamReward;
  priority?: number;
  isActive?: boolean;
}

export type IUpdateExamRewardRulePayload = Partial<ICreateExamRewardRulePayload>;

export interface IExamSubmitPayload {
  examProblemId: string;
  language: string;
  code: string;
}

/** Server-authoritative payload the take-exam page renders against. */
export interface ITakeExamResponse {
  exam: IExam;
  phase: ExamPhase;
  serverTime: string;
  /** Effective end for this participant (exam end or join+duration). */
  endsAt: string;
  participant: IExamParticipant | null;
  problems: IExamProblem[];
}

export interface IExamResultResponse {
  exam: IExam;
  rank: number | null;
  displayRank: number | null;
  totalScore: number;
  solvedCount: number;
  penalty: number;
  problemResults: IExamProblemResult[];
  rewards: IExamRewardGrant[];
}

export interface IExamListItem extends IExam {
  problemCount: number;
  participantCount: number;
  myState?: ExamParticipantState | null;
}
