/**
 * Class management domain types — shared between web and api.
 *
 * Distinguish between:
 *   - "Course" / curriculum (syllabus, modules, lessons) → see admin.types.ts
 *   - "Class" / offering (scheduled instance with teacher, room, roster) → here
 */

export enum ClassStatus {
  ACTIVE = 'ACTIVE',
  UPCOMING = 'UPCOMING',
  FULL = 'FULL',
  ARCHIVED = 'ARCHIVED',
}

export const CLASS_STATUS_LABEL: Record<ClassStatus, string> = {
  [ClassStatus.ACTIVE]: 'Active',
  [ClassStatus.UPCOMING]: 'Upcoming',
  [ClassStatus.FULL]: 'Full',
  [ClassStatus.ARCHIVED]: 'Archived',
};

export enum DayOfWeek {
  MON = 'MON',
  TUE = 'TUE',
  WED = 'WED',
  THU = 'THU',
  FRI = 'FRI',
  SAT = 'SAT',
  SUN = 'SUN',
}

export enum EnrollmentLifecycle {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  DROPPED = 'DROPPED',
  WAITLIST = 'WAITLIST',
}

export enum PaymentStatus {
  PAID = 'PAID',
  PENDING = 'PENDING',
  OVERDUE = 'OVERDUE',
  WAIVED = 'WAIVED',
}

// ── Domain DTOs (wire shape) ─────────────────────────────────────────────

/**
 * A recurring weekly slot when a class meets. Renamed from `IClassSession`
 * to avoid collision with `teacher.types.IClassSession` (which is the
 * one-off "class session for today" model used by the Teacher Dashboard).
 */
export interface IClassMeeting {
  id: string;
  dayOfWeek: DayOfWeek;
  /** "HH:MM" in 24h */
  startTime: string;
  endTime: string;
}

export interface IClassInstructor {
  id: string;
  fullName: string;
  email: string;
  title?: string | null;
  avatarUrl?: string | null;
}

export interface IClass {
  id: string;
  name: string;
  /** Course code, e.g. "MATH-301" */
  code: string;
  description?: string | null;
  capacity: number;
  /** Enrollment count, denormalized for the list page */
  enrolledCount: number;
  status: ClassStatus;
  /** Term label, e.g. "Fall 2024" */
  term: string;
  /** 0..100 — denormalized for the detail-page KPI */
  attendanceRate?: number;
  sessions: IClassMeeting[];
  createdAt: string;
  updatedAt: string;
}

export interface IClassEnrollment {
  id: string;
  classId: string;
  className?: string;
  classCode?: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  studentExternalId: string;
  status: EnrollmentLifecycle;
  /** 0..100 — student's attendance % for this class */
  attendancePercentage: number;
  paymentStatus: PaymentStatus;
  enrolledAt: string;
}

/** Wizard payload — what the create form posts to POST /api/classes */
export interface ICreateClassPayload {
  name: string;
  code: string;
  description?: string;
  capacity: number;
  term: string;
  sessions: Array<{
    dayOfWeek: DayOfWeek;
    startTime: string;
    endTime: string;

  }>;
}

// ── Student schedule (admin-managed) ────────────────────────────────────

/** A single schedule session — either custom (admin-managed) or derived from a class */
export interface IStudentScheduleSession {
  id: string;
  studentId: string;
  classId?: string | null;
  /** Denormalized for display — name of the linked class */
  className?: string | null;
  classCode?: string | null;
  dayOfWeek: DayOfWeek;
  /** "HH:MM" in 24h */
  startTime: string;
  endTime: string;

  /** Free-text note (admin only) */
  note?: string | null;
}

/** GET /api/students/:id/schedule response */
export interface IStudentSchedule {
  studentId: string;
  /** true when custom sessions override the class-derived schedule */
  isCustom: boolean;
  /** Effective sessions — custom if isCustom, else merged class sessions */
  sessions: IStudentScheduleSession[];
  /** Class-derived sessions — always returned so admin can compare */
  classSessions: IStudentScheduleSession[];
}

/** Payload for POST /api/students/:id/schedule/custom */
export interface ICreateStudentSchedulePayload {
  classId?: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;

  note?: string;
}

