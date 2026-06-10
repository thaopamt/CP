import { CourseSpec } from './types';
import course01 from './courses/01-print';
import course02 from './courses/02-input';
import course03 from './courses/03-arithmetic';
import course04 from './courses/04-if';
import course05 from './courses/05-if-else';
import course06 from './courses/06-if-elif-else';
import course07 from './courses/07-for';
import course08 from './courses/08-while';
import course09 from './courses/09-strings';
import course10 from './courses/10-lists';
import course11 from './courses/11-algorithms';

/**
 * The full PYTHON BASIC curriculum, in syllabus order. The array index drives
 * each course's orderIndex inside the class; the course `code` is the upsert key.
 */
export const PYTHON_BASIC_COURSES: CourseSpec[] = [
  course01,
  course02,
  course03,
  course04,
  course05,
  course06,
  course07,
  course08,
  course09,
  course10,
  course11,
];

export { CourseSpec } from './types';
export type { ProblemSpec } from './types';
