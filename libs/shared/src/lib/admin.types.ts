/**
 * Domain enums + DTOs for the Admin portal v2 pages.
 * Used by both web (UI badges, filters) and api (entity columns, DTO validation).
 */

export enum EnrollmentStatus {
  ACTIVE = 'ACTIVE',
  PENDING = 'PENDING',
  INACTIVE = 'INACTIVE',
  GRADUATED = 'GRADUATED',
}

export const ENROLLMENT_STATUS_LABEL: Record<EnrollmentStatus, string> = {
  [EnrollmentStatus.ACTIVE]: 'Active',
  [EnrollmentStatus.PENDING]: 'Pending',
  [EnrollmentStatus.INACTIVE]: 'Inactive',
  [EnrollmentStatus.GRADUATED]: 'Graduated',
};

export enum InvoiceStatus {
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
  PARTIAL = 'PARTIAL',
  DRAFT = 'DRAFT',
}

export const INVOICE_STATUS_LABEL: Record<InvoiceStatus, string> = {
  [InvoiceStatus.PAID]: 'Paid',
  [InvoiceStatus.OVERDUE]: 'Overdue',
  [InvoiceStatus.PARTIAL]: 'Partial',
  [InvoiceStatus.DRAFT]: 'Draft',
};

export enum CourseStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
}

export enum LessonType {
  VIDEO = 'VIDEO',
  READING = 'READING',
  QUIZ = 'QUIZ',
  ASSIGNMENT = 'ASSIGNMENT',
}

export const LESSON_ICON: Record<LessonType, string> = {
  [LessonType.VIDEO]: 'play_circle',
  [LessonType.READING]: 'menu_book',
  [LessonType.QUIZ]: 'quiz',
  [LessonType.ASSIGNMENT]: 'assignment',
};

/** Schedule event "track" — drives the colour stripe on the calendar event card */
export enum SubjectTrack {
  SCIENCE = 'SCIENCE',
  HUMANITIES = 'HUMANITIES',
  MATH = 'MATH',
  ARTS = 'ARTS',
}

// ────────────────────────────────────────────────────────────────────────
//  Lightweight DTOs (kept minimal — concrete entity types live in the api)
// ────────────────────────────────────────────────────────────────────────

export interface IStudentRow {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  studentId: string;
  grade: number;
  enrolledAt: string;
  status: EnrollmentStatus;
  avatarUrl?: string | null;
}

export interface IInvoiceRow {
  id: string;
  invoiceNumber: string;
  accountName: string;
  accountEmail: string;
  amount: number;
  dueDate: string;
  status: InvoiceStatus;
}

export interface ILesson {
  id: string;
  title: string;
  type: LessonType;
  durationMin: number;
}

export interface IModule {
  id: string;
  index: number;
  title: string;
  lessons: ILesson[];
}

export interface IScheduleEvent {
  id: string;
  title: string;
  location: string;
  teacherName: string;
  teacherInitials: string;
  /** Day-of-week index, 0 = Mon … 4 = Fri */
  day: number;
  /** Minutes since 00:00. e.g. 8:30 = 510 */
  startMinutes: number;
  durationMin: number;
  track: SubjectTrack;
  hasConflict?: boolean;
}

// ────────────────────────────────────────────────────────────────────────
//  Student-management domain (v7) — extends IStudentRow with profile data
// ────────────────────────────────────────────────────────────────────────

export enum Gender {
  FEMALE = 'FEMALE',
  MALE = 'MALE',
  OTHER = 'OTHER',
  UNDISCLOSED = 'UNDISCLOSED',
}

export const GENDER_LABEL: Record<Gender, string> = {
  [Gender.FEMALE]: 'Female',
  [Gender.MALE]: 'Male',
  [Gender.OTHER]: 'Other',
  [Gender.UNDISCLOSED]: 'Prefer not to say',
};

export enum GuardianRelationship {
  MOTHER = 'MOTHER',
  FATHER = 'FATHER',
  GUARDIAN = 'GUARDIAN',
  OTHER = 'OTHER',
}

export const GUARDIAN_RELATIONSHIP_LABEL: Record<GuardianRelationship, string> = {
  [GuardianRelationship.MOTHER]: 'Mother',
  [GuardianRelationship.FATHER]: 'Father',
  [GuardianRelationship.GUARDIAN]: 'Legal guardian',
  [GuardianRelationship.OTHER]: 'Other',
};

export interface IGuardian {
  id: string;
  fullName: string;
  relationship: GuardianRelationship;
  phoneNumber: string;
  email?: string | null;
  isPrimary: boolean;
}

/**
 * Full student profile shape for the dashboard. Extends IStudentRow
 * with demographics, denormalized KPIs, and guardian list.
 */
export interface IStudentProfile {
  id: string;                 // StudentProfile ID
  userId: string;             // User ID (auth)
  studentId: string;          // institutional code (e.g. "STU-2024-8901")
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl?: string | null;

  /** Demographics */
  dateOfBirth?: string | null; // ISO date "YYYY-MM-DD"
  gender?: Gender | null;
  homeAddress?: string | null;

  /** Enrollment */
  grade: number;              // 9..12
  cohortYear: number;         // e.g. 2025 for "Class of 2025"
  enrolledAt: string;         // ISO datetime
  startDate?: string | null;
  status: EnrollmentStatus;

  /** Denormalized KPIs (refreshed by jobs) */
  cumulativeGpa: number;      // 0..4
  attendanceRate: number;     // 0..100 (percentage)
  daysAbsent: number;
  questsCompleted: number;
  cohortPercentile?: string | null;
  honorRoll: boolean;

  /** Relations */
  guardians: IGuardian[];

  createdAt: string;
  updatedAt: string;
}

/** Slimmed guardian payload — server defaults `isPrimary` if omitted */
export interface IGuardianInput {
  fullName: string;
  relationship: GuardianRelationship;
  phoneNumber: string;
  email?: string;
  isPrimary?: boolean;
}

/** POST /api/students payload */
export interface ICreateStudentPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  studentId?: string;         // auto-generated server-side if absent
  dateOfBirth?: string;
  gender?: Gender;
  homeAddress?: string;
  grade: number;
  cohortYear?: number;
  startDate?: string;
  status?: EnrollmentStatus;
  guardians?: IGuardianInput[];
}

/** Subject grade for the academic-performance bar chart on the profile dashboard */
export interface ISubjectGrade {
  subject: string;
  percentage: number;
}
