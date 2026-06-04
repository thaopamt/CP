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
  avatarUrl?: string | null;
}

export interface IAttendanceRecord {
  studentId: string;
  status: AttendanceStatus;
  /** ISO datetime — when the status was last set */
  recordedAt?: string;
}

// ── Admin attendance management ───────────────────────────────────────────

/** A single attendance entry for a student in a session on a date */
export interface IAttendanceEntry {
  id?: string;
  studentId: string;
  studentName: string;
  classId: string;
  sessionId: string | null;
  date: string; // YYYY-MM-DD
  status: AttendanceStatus;
  note?: string | null;
}

/** Session with its attendance data for a class on a date */
export interface ISessionAttendance {
  sessionId: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;

  records: IAttendanceEntry[];
}

/** Full attendance payload for a class on a date */
export interface IClassDateAttendance {
  classId: string;
  className: string;
  date: string;
  sessions: ISessionAttendance[];
}

/** Payload for POST /api/attendance/classes/:classId */
export interface IBulkAttendancePayload {
  date: string;
  records: Array<{
    studentId: string;
    sessionId: string | null;
    status: AttendanceStatus;
    note?: string;
  }>;
}

/** Summary stats for a class */
export interface IAttendanceClassSummary {
  classId: string;
  className: string;
  total: number;
  present: number;
  absent: number;
  late: number;
  presentRate: number;
}

export interface IStudentAttendanceHistoryItem {
  id?: string;
  source: 'schedule-slot' | 'class';
  date: string;
  dayOfWeek?: string;
  startTime?: string | null;
  endTime?: string | null;
  classId?: string | null;
  className?: string | null;
  status: AttendanceStatus;
  note?: string | null;
  cancelled?: boolean;
}

export interface IStudentAttendanceHistory {
  studentId: string;
  from: string;
  to: string;
  records: IStudentAttendanceHistoryItem[];
  summary: {
    total: number;
    present: number;
    late: number;
    absent: number;
    unmarked: number;
    cancelled: number;
    attended: number;
    attendanceRate: number;
  };
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
