import 'reflect-metadata';
import { AppDataSource } from '../data-source';
import { User } from '../../modules/users/user.entity';
import { ClassEntity } from '../../modules/classes/class.entity';
import { Course } from '../../modules/courses/course.entity';
import { Assignment } from '../../modules/assignments/assignment.entity';
import { ClassCourse } from '../../modules/classes/class-course.entity';
import { CourseAssignment } from '../../modules/courses/course-assignment.entity';
import { ClassStatus, PublishStatus } from '@cp/shared';
import { PYTHON_ADVANCED_COURSES } from './python-advanced';
import { ProblemSpec } from './python-basic/types';

const CLASS_CODE = 'PYTHON-ADVANCED';
const COURSE_CODE_PREFIX = 'PYTHON-ADV-';
const ASSIGNMENT_SLUG_PREFIX = 'pyadv-';

const POINTS_BY_DIFFICULTY: Record<ProblemSpec['difficulty'], number> = {
  EASY: 20,
  MEDIUM: 40,
  HARD: 60,
};
const MINUTES_BY_DIFFICULTY: Record<ProblemSpec['difficulty'], number> = {
  EASY: 20,
  MEDIUM: 35,
  HARD: 60,
};

/** Competition prep teaches Python, but the judge accepts all supported languages. */
const ALLOWED_LANGUAGES = ['python', 'cpp', 'java', 'javascript'];

/**
 * Build the full markdown statement: story + Input/Output spec + one worked
 * example taken from the FIRST test case (its output is the reference solver's
 * answer, so it is always correct).
 */
function buildDescription(p: ProblemSpec, sampleInput: string, sampleOutput: string): string {
  const parts: string[] = [];
  parts.push(p.story.trim());
  parts.push(`\n**Input**\n${p.inputDesc.trim()}`);
  parts.push(`\n**Output**\n${p.outputDesc.trim()}`);

  const showInput = sampleInput.replace(/\n+$/, '');
  const showOutput = sampleOutput.replace(/\n+$/, '');
  const example = [
    '\n### Ví dụ',
    showInput.length ? `\n**Input**\n\`\`\`\n${showInput}\n\`\`\`` : '\n**Input**\n```\n(không có)\n```',
    `\n**Output**\n\`\`\`\n${showOutput}\n\`\`\``,
  ].join('\n');
  parts.push(example);

  if (p.note && p.note.trim()) {
    parts.push(`\n**Gợi ý:** ${p.note.trim()}`);
  }
  return parts.join('\n').trim();
}

/**
 * Generate inline test cases by running the reference solver over every input.
 * First 3 are visible samples; the rest are hidden grading cases. Throws (fails
 * the seed loudly) if a solver errors, so a broken solver can never ship.
 */
function buildTestCases(p: ProblemSpec): { input: string; output: string; isHidden: boolean }[] {
  if (!p.inputs.length) {
    throw new Error(`Problem ${p.key} (${p.title}) has no inputs.`);
  }
  return p.inputs.map((input, i) => {
    let output: string;
    try {
      output = p.solve(input);
    } catch (err: any) {
      throw new Error(`Solver for problem ${p.key} (${p.title}) threw on input ${JSON.stringify(input)}: ${err?.message ?? err}`);
    }
    if (typeof output !== 'string') {
      throw new Error(`Solver for problem ${p.key} (${p.title}) returned a non-string on input ${JSON.stringify(input)}.`);
    }
    const normalised = output.endsWith('\n') ? output : output + '\n';
    return { input, output: normalised, isHidden: i >= 3 };
  });
}

async function run() {
  console.log('🏆 Starting Seed Script for PYTHON NÂNG CAO (Tin học trẻ)...');

  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
    console.log('📂 Database connected.');
  }

  const userRepo = AppDataSource.getRepository(User);
  const classRepo = AppDataSource.getRepository(ClassEntity);
  const courseRepo = AppDataSource.getRepository(Course);
  const assignmentRepo = AppDataSource.getRepository(Assignment);
  const classCourseRepo = AppDataSource.getRepository(ClassCourse);
  const courseAssignmentRepo = AppDataSource.getRepository(CourseAssignment);

  const admin = await userRepo.findOneBy({ email: 'admin@zenith.local' });
  if (!admin) {
    console.error('❌ Admin user not found! Please run the seed-admin script first.');
    await AppDataSource.destroy();
    process.exit(1);
  }

  // Upsert the class by its stable code so its id survives reseeds.
  let advClass = await classRepo.findOneBy({ code: CLASS_CODE });
  if (!advClass) {
    advClass = new ClassEntity();
    advClass.code = CLASS_CODE;
    advClass.enrolledCount = 0;
  }
  advClass.name = 'Python Nâng Cao';
  advClass.description =
    'Lớp Python nâng cao luyện thi Tin học trẻ, gồm 4 cấp tăng dần độ khó: ' +
    'Cấp Phường, Cấp Quận, Cấp Huyện và Cấp Thành phố. Bao quát thuật toán thi đấu: ' +
    'sắp xếp, tìm kiếm nhị phân, quy hoạch động, tham lam, lý thuyết số, đồ thị cơ bản.';
  advClass.status = ClassStatus.ACTIVE;
  advClass = await classRepo.save(advClass);
  console.log(`✅ Class "Python Nâng Cao" ready (${advClass.id}).`);

  // Preload existing PYTHON-ADV courses & assignments for in-place UPSERT.
  const existingCourses = await courseRepo
    .createQueryBuilder('course')
    .where('course.code LIKE :prefix', { prefix: `${COURSE_CODE_PREFIX}%` })
    .getMany();
  const courseByCode = new Map(existingCourses.map((c) => [c.code, c]));

  const existingAssignments = await assignmentRepo
    .createQueryBuilder('a')
    .where('a.slug LIKE :prefix', { prefix: `${ASSIGNMENT_SLUG_PREFIX}%` })
    .getMany();
  const assignmentBySlug = new Map(existingAssignments.map((a) => [a.slug as string, a]));

  const seededCourseCodes = new Set<string>();
  const seededSlugs = new Set<string>();

  for (let c = 0; c < PYTHON_ADVANCED_COURSES.length; c++) {
    const spec = PYTHON_ADVANCED_COURSES[c];
    const courseNum = c + 1;
    console.log(`\n📖 Course ${courseNum}: ${spec.title} (${spec.problems.length} problems)`);

    const course = courseByCode.get(spec.code) ?? new Course();
    course.code = spec.code;
    course.title = spec.title;
    course.description = spec.description;
    course.status = PublishStatus.PUBLISHED;
    const savedCourse = await courseRepo.save(course);
    seededCourseCodes.add(spec.code);

    let link = await classCourseRepo.findOne({ where: { classId: advClass.id, courseId: savedCourse.id } });
    if (!link) link = new ClassCourse();
    link.classId = advClass.id;
    link.courseId = savedCourse.id;
    link.orderIndex = courseNum;
    link.isRequired = true;
    await classCourseRepo.save(link);

    let coursePoints = 0;

    for (let i = 0; i < spec.problems.length; i++) {
      const p = spec.problems[i];
      const slug = `${ASSIGNMENT_SLUG_PREFIX}${String(courseNum).padStart(2, '0')}-${p.key}`;
      const testCases = buildTestCases(p);
      const description = buildDescription(p, testCases[0].input, testCases[0].output);
      const points = POINTS_BY_DIFFICULTY[p.difficulty];

      const assignment = assignmentBySlug.get(slug) ?? new Assignment();
      assignment.title = p.title;
      assignment.description = description;
      assignment.difficulty = p.difficulty;
      assignment.points = points;
      assignment.estimatedMinutes = MINUTES_BY_DIFFICULTY[p.difficulty];
      assignment.slug = slug;
      assignment.tags = spec.tags;
      assignment.codingConfig = {
        timeLimit: 5,
        memoryLimit: 256,
        checkerType: 'exact' as const,
        allowedLanguages: ALLOWED_LANGUAGES,
        testCases,
      };
      assignment.status = PublishStatus.PUBLISHED;

      const savedAssignment = await assignmentRepo.save(assignment);
      seededSlugs.add(slug);

      let caLink = await courseAssignmentRepo.findOne({
        where: { courseId: savedCourse.id, assignmentId: savedAssignment.id },
      });
      if (!caLink) caLink = new CourseAssignment();
      caLink.courseId = savedCourse.id;
      caLink.assignmentId = savedAssignment.id;
      caLink.orderIndex = i + 1;
      caLink.prerequisiteAssignmentId = null;
      await courseAssignmentRepo.save(caLink);

      coursePoints += points;
    }

    savedCourse.assignmentCount = spec.problems.length;
    savedCourse.totalPoints = coursePoints;
    await courseRepo.save(savedCourse);
    console.log(`   ✅ ${spec.problems.length} problems, ${coursePoints} points.`);
  }

  const obsoleteAssignments = existingAssignments.filter((a) => !seededSlugs.has(a.slug as string));
  if (obsoleteAssignments.length) {
    await assignmentRepo.remove(obsoleteAssignments);
    console.log(`🗑️ Removed ${obsoleteAssignments.length} obsolete assignments.`);
  }
  const obsoleteCourses = existingCourses.filter((c) => !seededCourseCodes.has(c.code));
  if (obsoleteCourses.length) {
    await courseRepo.remove(obsoleteCourses);
    console.log(`🗑️ Removed ${obsoleteCourses.length} obsolete courses.`);
  }

  const totalProblems = PYTHON_ADVANCED_COURSES.reduce((s, c) => s + c.problems.length, 0);
  console.log(`\n🎉 PYTHON NÂNG CAO seeded: ${PYTHON_ADVANCED_COURSES.length} courses, ${totalProblems} problems.`);
  await AppDataSource.destroy();
}

run().catch((err) => {
  console.error('❌ Error during PYTHON NÂNG CAO seed:', err);
  process.exit(1);
});
