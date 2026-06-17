import 'reflect-metadata';
import { AppDataSource } from '../data-source';
import { User } from '../../modules/users/user.entity';
import { ClassEntity } from '../../modules/classes/class.entity';
import { Course } from '../../modules/courses/course.entity';
import { Assignment } from '../../modules/assignments/assignment.entity';
import { ClassCourse } from '../../modules/classes/class-course.entity';
import { CourseAssignment } from '../../modules/courses/course-assignment.entity';
import { ClassStatus, PublishStatus } from '@cp/shared';
import { CPP_ADVANCED_COURSES } from './cpp-advanced';
import { CoverageTag, ProblemSpec } from './cpp-advanced/types';

const CLASS_CODE = 'CPP-ADVANCED';
const COURSE_CODE_PREFIX = 'CPP-ADV-';
const ASSIGNMENT_SLUG_PREFIX = 'cppadv-';

const POINTS_BY_DIFFICULTY: Record<ProblemSpec['difficulty'], number> = {
  EASY: 20,
  MEDIUM: 40,
  HARD: 60,
};

const MINUTES_BY_DIFFICULTY: Record<ProblemSpec['difficulty'], number> = {
  EASY: 20,
  MEDIUM: 35,
  HARD: 55,
};

const REQUIRED_COVERAGE_TAGS: CoverageTag[] = [
  'smallest',
  'largest',
  'all_negative',
  'all_positive',
  'has_zero',
  'duplicates',
  'query_start',
  'query_end',
  'whole_range',
  'index_trap',
];

const ALLOWED_LANGUAGES = ['cpp'];

function buildDescription(p: ProblemSpec, sampleInput: string, sampleOutput: string): string {
  const showInput = sampleInput.replace(/\n+$/, '');
  const showOutput = sampleOutput.replace(/\n+$/, '');
  return [
    p.story.trim(),
    `\n**Input**\n${p.inputDesc.trim()}`,
    `\n**Output**\n${p.outputDesc.trim()}`,
    `\n**Ràng buộc**\n${p.constraints.trim()}`,
    '\n### Ví dụ',
    `\n**Input**\n\`\`\`\n${showInput}\n\`\`\``,
    `\n**Output**\n\`\`\`\n${showOutput}\n\`\`\``,
  ]
    .join('\n')
    .trim();
}

function buildTestCases(p: ProblemSpec): { input: string; output: string; isHidden: boolean }[] {
  return p.inputs.map(({ input }, i) => {
    let output: string;
    try {
      output = p.solve(input);
    } catch (err: any) {
      throw new Error(
        `Solver for ${p.key} (${p.title}) threw on input ${JSON.stringify(input)}: ${err?.message ?? err}`,
      );
    }
    if (typeof output !== 'string') {
      throw new Error(`Solver for ${p.key} (${p.title}) returned a non-string.`);
    }
    return {
      input,
      output: output.endsWith('\n') ? output : `${output}\n`,
      isHidden: i >= 3,
    };
  });
}

function validateProblem(p: ProblemSpec): void {
  if (!/^\d{2}$/.test(p.key)) {
    throw new Error(`Problem "${p.title}" has invalid key "${p.key}". Expected two digits.`);
  }
  if (p.inputs.length !== 10) {
    throw new Error(`Problem ${p.key} (${p.title}) must have exactly 10 testcases.`);
  }
  const coverage = new Set(p.inputs.flatMap((tc) => tc.tags));
  const missing = REQUIRED_COVERAGE_TAGS.filter((tag) => !coverage.has(tag));
  if (missing.length) {
    throw new Error(`Problem ${p.key} (${p.title}) is missing coverage tags: ${missing.join(', ')}`);
  }
  const e = p.editorial;
  if (
    !e ||
    e.sampleCodeLanguage !== 'cpp17' ||
    !e.solutionIdea.trim() ||
    !e.timeComplexity.trim() ||
    !e.memoryComplexity.trim() ||
    !e.sampleCode.trim()
  ) {
    throw new Error(`Problem ${p.key} (${p.title}) is missing C++17 editorial/sample code.`);
  }
}

function validateCurriculum(): void {
  if (CPP_ADVANCED_COURSES.length !== 1) {
    throw new Error(`CPP advanced seed must contain exactly 1 course; got ${CPP_ADVANCED_COURSES.length}.`);
  }
  const totalProblems = CPP_ADVANCED_COURSES.reduce((sum, course) => sum + course.problems.length, 0);
  if (totalProblems !== 30) {
    throw new Error(
      `CPP advanced prefix sum chapter must contain exactly 30 problems; got ${totalProblems}.`,
    );
  }
  for (const course of CPP_ADVANCED_COURSES) {
    const keys = new Set<string>();
    for (const p of course.problems) {
      validateProblem(p);
      if (keys.has(p.key)) {
        throw new Error(`Duplicate problem key ${p.key} in ${course.code}.`);
      }
      keys.add(p.key);
    }
  }
}

async function run() {
  console.log('🚀 Starting Seed Script for C++ NÂNG CAO...');
  validateCurriculum();
  console.log('✅ Curriculum definition validated: 1 course, 30 problems, 10 testcases each.');

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

  let cppClass = await classRepo.findOneBy({ code: CLASS_CODE });
  if (!cppClass) {
    cppClass = new ClassEntity();
    cppClass.code = CLASS_CODE;
    cppClass.enrolledCount = 0;
  }
  cppClass.name = 'C++ nâng cao';
  cppClass.description =
    'Khóa học C++ nâng cao cho lập trình thi đấu, tập trung vào kỹ thuật tối ưu dữ liệu và thuật toán qua C++17.';
  cppClass.status = ClassStatus.ACTIVE;
  cppClass = await classRepo.save(cppClass);
  console.log(`✅ Class "C++ nâng cao" ready (${cppClass.id}).`);

  const existingCourses = await courseRepo
    .createQueryBuilder('course')
    .where('course.code LIKE :prefix', { prefix: `${COURSE_CODE_PREFIX}%` })
    .getMany();
  const courseByCode = new Map(existingCourses.map((course) => [course.code, course]));

  const existingAssignments = await assignmentRepo
    .createQueryBuilder('assignment')
    .where('assignment.slug LIKE :prefix', { prefix: `${ASSIGNMENT_SLUG_PREFIX}%` })
    .getMany();
  const assignmentBySlug = new Map(
    existingAssignments.map((assignment) => [assignment.slug as string, assignment]),
  );

  const seededCourseCodes = new Set<string>();
  const seededSlugs = new Set<string>();

  for (let c = 0; c < CPP_ADVANCED_COURSES.length; c++) {
    const spec = CPP_ADVANCED_COURSES[c];
    const courseNum = c + 1;
    console.log(`\n📖 Course ${courseNum}: ${spec.title} (${spec.problems.length} problems)`);

    const course = courseByCode.get(spec.code) ?? new Course();
    course.code = spec.code;
    course.title = spec.title;
    course.description = spec.description;
    course.status = PublishStatus.PUBLISHED;
    const savedCourse = await courseRepo.save(course);
    seededCourseCodes.add(spec.code);

    let classCourse = await classCourseRepo.findOne({
      where: { classId: cppClass.id, courseId: savedCourse.id },
    });
    if (!classCourse) classCourse = new ClassCourse();
    classCourse.classId = cppClass.id;
    classCourse.courseId = savedCourse.id;
    classCourse.orderIndex = courseNum;
    classCourse.isRequired = true;
    await classCourseRepo.save(classCourse);

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
        timeLimit: 2,
        memoryLimit: 256,
        checkerType: 'exact' as const,
        ioMode: 'stdio' as const,
        allowedLanguages: ALLOWED_LANGUAGES,
        testCases,
      };
      assignment.editorial = p.editorial;
      assignment.status = PublishStatus.PUBLISHED;

      const savedAssignment = await assignmentRepo.save(assignment);
      seededSlugs.add(slug);

      let courseAssignment = await courseAssignmentRepo.findOne({
        where: { courseId: savedCourse.id, assignmentId: savedAssignment.id },
      });
      if (!courseAssignment) courseAssignment = new CourseAssignment();
      courseAssignment.courseId = savedCourse.id;
      courseAssignment.assignmentId = savedAssignment.id;
      courseAssignment.orderIndex = i + 1;
      courseAssignment.prerequisiteAssignmentId = null;
      await courseAssignmentRepo.save(courseAssignment);

      coursePoints += points;
      console.log(`  📝 ${slug}: ${p.title} (${testCases.length} testcases)`);
    }

    savedCourse.assignmentCount = spec.problems.length;
    savedCourse.totalPoints = coursePoints;
    await courseRepo.save(savedCourse);
    console.log(`   ✅ ${spec.problems.length} problems, ${coursePoints} points.`);
  }

  const obsoleteAssignments = existingAssignments.filter(
    (assignment) => !seededSlugs.has(assignment.slug as string),
  );
  if (obsoleteAssignments.length) {
    await assignmentRepo.remove(obsoleteAssignments);
    console.log(`🗑️ Removed ${obsoleteAssignments.length} obsolete C++ advanced assignments.`);
  }

  const obsoleteCourses = existingCourses.filter((course) => !seededCourseCodes.has(course.code));
  if (obsoleteCourses.length) {
    await courseRepo.remove(obsoleteCourses);
    console.log(`🗑️ Removed ${obsoleteCourses.length} obsolete C++ advanced courses.`);
  }

  const totalProblems = CPP_ADVANCED_COURSES.reduce((sum, course) => sum + course.problems.length, 0);
  console.log(`\n🎉 C++ NÂNG CAO seeded: ${CPP_ADVANCED_COURSES.length} course, ${totalProblems} problems.`);
  await AppDataSource.destroy();
}

run().catch((err) => {
  console.error('❌ Error during C++ NÂNG CAO seed:', err);
  process.exit(1);
});
