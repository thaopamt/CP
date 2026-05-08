/**
 * Domain enums + DTOs for the Teacher portal v3 pages
 * (Dashboard, Attendance, Coding Challenge Builder, Live Classroom Monitoring).
 */

// ── Dashboard ─────────────────────────────────────────────────────────────

export enum ClassSessionStatus {
  ACTIVE = 'ACTIVE',
  UPCOMING = 'UPCOMING',
  COMPLETED = 'COMPLETED',
}

export interface IClassSession {
  id: string;
  title: string;
  /** ISO datetime */
  startTime: string;
  endTime: string;
  room: string;
  studentCount: number;
  status: ClassSessionStatus;
}

export interface IAttendanceSummary {
  presentCount: number;
  absentCount: number;
  lateCount: number;
  totalCount: number;
  /** ISO date */
  date: string;
}

export interface IPendingReview {
  id: string;
  title: string;
  context: string;
  submissionCount: number;
}

// ── Attendance ────────────────────────────────────────────────────────────

export enum AttendanceStatus {
  PRESENT = 'PRESENT',
  ABSENT = 'ABSENT',
  LATE = 'LATE',
  UNMARKED = 'UNMARKED',
}

export const ATTENDANCE_STATUS_LABEL: Record<AttendanceStatus, string> = {
  [AttendanceStatus.PRESENT]: 'Present',
  [AttendanceStatus.ABSENT]: 'Absent',
  [AttendanceStatus.LATE]: 'Late',
  [AttendanceStatus.UNMARKED]: 'Unmarked',
};

export interface IRosterStudent {
  id: string;
  name: string;
  studentId: string;
  avatarUrl?: string | null;
}

export interface IAttendanceRecord {
  studentId: string;
  status: AttendanceStatus;
  /** ISO datetime — when the status was last set */
  recordedAt?: string;
}

// ── Coding Challenge Builder ──────────────────────────────────────────────

export enum ChallengeDifficulty {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD',
}

export enum ChallengeCategory {
  DATA_STRUCTURES = 'DATA_STRUCTURES',
  ALGORITHMS = 'ALGORITHMS',
  BASICS = 'BASICS',
}

export const CHALLENGE_CATEGORY_LABEL: Record<ChallengeCategory, string> = {
  [ChallengeCategory.DATA_STRUCTURES]: 'Data Structures',
  [ChallengeCategory.ALGORITHMS]: 'Algorithms',
  [ChallengeCategory.BASICS]: 'Basics',
};

export type SupportedLanguage = 'javascript' | 'python' | 'java';

export interface ITestCase {
  id: string;
  input: string;
  expectedOutput: string;
  isPublic: boolean;
}

export interface ICodingChallenge {
  id: string;
  title: string;
  category: ChallengeCategory;
  difficulty: ChallengeDifficulty;
  description: string;
  tags: string[];
  starterCode: string;
  language: SupportedLanguage;
  testCases: ITestCase[];
  publishedAt?: string | null;
}

// ── Live Classroom Monitoring ─────────────────────────────────────────────

export enum ClassroomStudentStatus {
  ACTIVE = 'ACTIVE',
  HELP_NEEDED = 'HELP_NEEDED',
  IDLE = 'IDLE',
  AWAY = 'AWAY',
}

export interface IClassroomStudent {
  id: string;
  name: string;
  avatarUrl?: string | null;
  status: ClassroomStudentStatus;
  /** Code currently in their editor — show as a thumbnail */
  currentCode?: string | null;
  /** Minutes since last active. Used for idle indicators. */
  idleMinutes?: number;
}

export interface IHelpRequest {
  id: string;
  studentId: string;
  studentName: string;
  studentAvatarUrl?: string | null;
  message: string;
  /** ISO datetime */
  requestedAt: string;
}

export interface IClassroomSnapshot {
  classId: string;
  className: string;
  totalOnline: number;
  activeCoding: number;
  idleOrAway: number;
  helpQueue: IHelpRequest[];
}
