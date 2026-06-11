import { CourseSpec } from './types';
import course01 from './courses/01-dp-1d';
import course02 from './courses/02-array';
import course03 from './courses/03-grid';
import course04 from './courses/04-string';
import course05 from './courses/05-knapsack';

/**
 * The full DP BASIC (Quy hoạch động cơ bản) curriculum, in syllabus order. The
 * array index drives each course's orderIndex inside the class; the course
 * `code` is the upsert key.
 */
export const DP_BASIC_COURSES: CourseSpec[] = [
  course01,
  course02,
  course03,
  course04,
  course05,
];

export { CourseSpec } from './types';
export type { ProblemSpec } from './types';
