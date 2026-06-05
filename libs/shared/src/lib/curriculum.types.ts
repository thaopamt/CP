/**
 * Domain shapes for the assign-assignments-to-course-to-class hierarchy.
 *
 *   Assignment  ─┐
 *                ├─ CourseAssignment (junction, ordered) ──> Course
 *                │
 *                └─ Standalone tasks reusable across courses
 *
 *   Course ─── ClassCourse (junction, ordered) ──> Class
 *
 * Naming note: the older `IModule`/`ILesson` curriculum-builder types in
 * admin.types.ts are a *visual demo* layer. The shapes here are the
 * canonical, persisted entities.
 */


export enum PublishStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
}

export interface ICodingTestCase {
  input: string;
  output: string;
  explanation?: string;
  isHidden: boolean;
}

export interface ICodingConfig {
  /** Seconds, as entered in the admin UI. */
  timeLimit?: number;
  /** Megabytes, as entered in the admin UI. */
  memoryLimit?: number;
  /** Megabytes, as entered in the admin UI. */
  outputLimit?: number;
  checkerType?: 'standard' | 'exact' | 'custom';
  allowedLanguages?: string[];
  /**
   * Inline test cases stored in the DB. Small, typically the visible samples
   * shown to students. Heavy grading test cases live on disk instead — see
   * {@link hiddenTestCount}.
   */
  testCases?: ICodingTestCase[];
  /**
   * Number of disk-backed hidden grading test cases for this assignment.
   * Their content is NOT stored in the DB; the judge reads the `.inp`/`.out`
   * files from the testcase storage directory keyed by assignment id. These
   * are graded after the inline {@link testCases}, so their effective indices
   * are `testCases.length .. testCases.length + hiddenTestCount - 1`.
   */
  hiddenTestCount?: number;
  allowViewHiddenTestCases?: boolean;
}


// ── Assignment definition (admin-managed library entry) ──────────────────
//
// Distinct from `IAssignment` in student.types which is the per-student
// in-flight instance (with progress, xpReward, status TODO/IN_REVIEW/…).
// This shape is the reusable template that admins define and attach to
// courses via the CourseAssignment junction.

export interface IAssignmentDef {
  id: string;
  title: string;
  description: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  points: number;
  estimatedMinutes?: number;
  slug?: string | null;
  tags?: string[];
  codingConfig?: ICodingConfig | null;
  classIds?: string[] | null;
  status: PublishStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ICreateAssignmentDefPayload {
  title: string;
  description?: string;
  difficulty: IAssignmentDef['difficulty'];
  points: number;
  estimatedMinutes?: number;
  slug?: string;
  tags?: string[];
  codingConfig?: ICodingConfig;
  classIds?: string[] | null;
  status?: PublishStatus;
}

// ── Course ────────────────────────────────────────────────────────────────

/** Reusable course unit — distinct from a Class (which is a scheduled offering). */
export interface ICourse {
  id: string;
  code: string;            // e.g. "MATH-301A"
  title: string;
  description?: string | null;
  coverUrl?: string | null;
  status: PublishStatus;
  /** Number of assignments attached, denormalized */
  assignmentCount: number;
  /** Sum of all assignment.points, denormalized */
  totalPoints: number;
  createdAt: string;
  updatedAt: string;
}

export interface ICreateCoursePayload {
  code: string;
  title: string;
  description?: string;
  status?: PublishStatus;
}

/**
 * Assignment as it appears inside a course's sequence — enriched with the
 * junction-row order and any per-course overrides.
 */
export interface ICourseAssignment {
  id: string;             // junction row id
  courseId: string;
  order: number;
  /** When set, this assignment unlocks only after the named one is complete */
  prerequisiteAssignmentId?: string | null;
  assignment: IAssignmentDef;
}

// ── ClassCourse junction ──────────────────────────────────────────────────

/**
 * Course-as-attached-to-a-class. Order is what determines syllabus
 * sequencing on the Class Curriculum management page.
 */
export interface IClassCourseLink {
  id: string;             // junction row id
  classId: string;
  order: number;
  isRequired: boolean;
  course: ICourse;
}

/** Body for `PATCH /api/classes/:classId/courses/reorder` */
export interface IReorderPayload {
  /** Junction row ids in the new desired order — order index = position in array */
  ids: string[];
}
