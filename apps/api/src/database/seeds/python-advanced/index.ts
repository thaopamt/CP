import { CourseSpec } from '../python-basic/types';
import course01 from './courses/01-phuong';
import course02 from './courses/02-quan';
import course03 from './courses/03-huyen';
import course04 from './courses/04-thanhpho';

/**
 * The "Python Nâng Cao" curriculum for Tin học trẻ competition prep, ordered by
 * competition tier (easiest → hardest). Array index drives each course's
 * orderIndex; the course `code` is the upsert key.
 */
export const PYTHON_ADVANCED_COURSES: CourseSpec[] = [
  course01, // Cấp Phường
  course02, // Cấp Quận
  course03, // Cấp Huyện
  course04, // Cấp Thành phố
];
