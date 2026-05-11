/**
 * One-shot seed: creates one admin / one teacher / one student so the web
 * app's RBAC flows can be exercised end-to-end. Now also seeds 3 demo
 * classes (with sessions + enrollments) so /admin/classes is populated.
 *
 * Idempotent — re-running after the rows already exist is a no-op.
 *
 *     pnpm exec nx run api:seed
 */
import 'reflect-metadata';
import * as bcrypt from 'bcryptjs';
import {
  AssignmentType,
  ClassDepartment,
  ClassStatus,
  DayOfWeek,
  EnrollmentLifecycle,
  EnrollmentStatus,
  Gender,
  GuardianRelationship,
  PaymentStatus,
  PublishStatus,
  UserRole,
} from '@cp/shared';

import { AppDataSource } from '../data-source';
import { User } from '../../modules/users/user.entity';
import { ClassEntity } from '../../modules/classes/class.entity';
import { ClassSession } from '../../modules/classes/class-session.entity';
import { Enrollment } from '../../modules/classes/enrollment.entity';
import { StudentProfile } from '../../modules/students/student-profile.entity';
import { Guardian } from '../../modules/students/guardian.entity';
import { Assignment } from '../../modules/assignments/assignment.entity';
import { Course } from '../../modules/courses/course.entity';
import { CourseAssignment } from '../../modules/courses/course-assignment.entity';
import { ClassCourse } from '../../modules/classes/class-course.entity';

const SEED_USERS = [
  { email: 'admin@cp.local', firstName: 'Ada', lastName: 'Admin', role: UserRole.ADMIN },
  { email: 'teacher@cp.local', firstName: 'Theo', lastName: 'Teacher', role: UserRole.TEACHER },
  { email: 'student@cp.local', firstName: 'Stella', lastName: 'Student', role: UserRole.STUDENT },
  // Extra demo users so the class roster has someone to enroll
  { email: 'teacher.smith@cp.local', firstName: 'Sarah', lastName: 'Smith', role: UserRole.TEACHER },
  { email: 'teacher.johnson@cp.local', firstName: 'Aaron', lastName: 'Johnson', role: UserRole.TEACHER },
  { email: 'student.alex@cp.local', firstName: 'Alex', lastName: 'Johnson', role: UserRole.STUDENT },
  { email: 'student.maria@cp.local', firstName: 'Maria', lastName: 'Sanchez', role: UserRole.STUDENT },
  { email: 'student.tyler@cp.local', firstName: 'Tyler', lastName: 'Chen', role: UserRole.STUDENT },
] as const;

const PASSWORD = 'password123';

async function run() {
  await AppDataSource.initialize();
  const userRepo = AppDataSource.getRepository(User);
  const classRepo = AppDataSource.getRepository(ClassEntity);
  const sessionRepo = AppDataSource.getRepository(ClassSession);
  const enrollmentRepo = AppDataSource.getRepository(Enrollment);
  const passwordHash = await bcrypt.hash(PASSWORD, 10);

  // ── Users ──────────────────────────────────────────────────────────────
  for (const seed of SEED_USERS) {
    const existing = await userRepo.findOne({ where: { email: seed.email } });
    if (existing) {
      // eslint-disable-next-line no-console
      console.log(`✓  user ${seed.email} already exists`);
      continue;
    }
    const entity = userRepo.create({ ...seed, passwordHash, isActive: true, avatarUrl: null });
    await userRepo.save(entity);
    // eslint-disable-next-line no-console
    console.log(`+  user ${seed.email} (${seed.role})`);
  }

  // ── Classes (lookup instructors + students by email) ───────────────────
  const teacherSmith = await userRepo.findOneOrFail({ where: { email: 'teacher.smith@cp.local' } });
  const teacherJohnson = await userRepo.findOneOrFail({ where: { email: 'teacher.johnson@cp.local' } });
  const teacherDefault = await userRepo.findOneOrFail({ where: { email: 'teacher@cp.local' } });
  const studentAlex = await userRepo.findOneOrFail({ where: { email: 'student.alex@cp.local' } });
  const studentMaria = await userRepo.findOneOrFail({ where: { email: 'student.maria@cp.local' } });
  const studentTyler = await userRepo.findOneOrFail({ where: { email: 'student.tyler@cp.local' } });
  const studentStella = await userRepo.findOneOrFail({ where: { email: 'student@cp.local' } });

  const SEED_CLASSES = [
    {
      code: 'MATH-301',
      name: 'Advanced Calculus',
      department: ClassDepartment.MATHEMATICS,
      capacity: 35,
      term: 'Fall 2024',
      room: 'Room 402',
      status: ClassStatus.ACTIVE,
      instructorId: teacherSmith.id,
      sessions: [
        { dayOfWeek: DayOfWeek.MON, startTime: '10:00', endTime: '11:30' },
        { dayOfWeek: DayOfWeek.WED, startTime: '10:00', endTime: '11:30' },
      ],
      students: [studentAlex, studentMaria, studentTyler, studentStella],
    },
    {
      code: 'PHY-101',
      name: 'Intro to Physics',
      department: ClassDepartment.SCIENCE,
      capacity: 20,
      term: 'Fall 2024',
      room: 'Lab B',
      status: ClassStatus.FULL,
      instructorId: teacherJohnson.id,
      sessions: [
        { dayOfWeek: DayOfWeek.TUE, startTime: '13:00', endTime: '14:30' },
        { dayOfWeek: DayOfWeek.THU, startTime: '13:00', endTime: '14:30' },
      ],
      students: [studentAlex, studentMaria],
    },
    {
      code: 'HIST-204',
      name: 'European History',
      department: ClassDepartment.HUMANITIES,
      capacity: 25,
      term: 'Spring 2025',
      room: 'Room 105',
      status: ClassStatus.UPCOMING,
      instructorId: teacherDefault.id,
      sessions: [{ dayOfWeek: DayOfWeek.FRI, startTime: '09:00', endTime: '10:30' }],
      students: [],
    },
  ];

  for (const seed of SEED_CLASSES) {
    const existing = await classRepo.findOne({ where: { code: seed.code } });
    if (existing) {
      // eslint-disable-next-line no-console
      console.log(`✓  class ${seed.code} already exists`);
      continue;
    }
    const cls = classRepo.create({
      name: seed.name,
      code: seed.code,
      department: seed.department,
      capacity: seed.capacity,
      term: seed.term,
      room: seed.room,
      status: seed.status,
      instructorId: seed.instructorId,
      enrolledCount: seed.students.length,
      attendanceRate: seed.students.length > 0 ? 92 : 0,
    });
    const saved = await classRepo.save(cls);
    await sessionRepo.save(
      seed.sessions.map((s) => sessionRepo.create({ classId: saved.id, ...s, room: null })),
    );
    if (seed.students.length > 0) {
      await enrollmentRepo.save(
        seed.students.map((stu, idx) =>
          enrollmentRepo.create({
            classId: saved.id,
            studentId: stu.id,
            status: EnrollmentLifecycle.ACTIVE,
            attendancePercentage: [98, 85, 100, 92][idx % 4],
            paymentStatus: idx % 2 === 0 ? PaymentStatus.PAID : PaymentStatus.PENDING,
          }),
        ),
      );
    }
    // eslint-disable-next-line no-console
    console.log(`+  class ${seed.code} — ${seed.name} (${seed.students.length} enrolled)`);
  }

  // ── Student profiles (1-1 with User) ─────────────────────────────────────
  const profileRepo = AppDataSource.getRepository(StudentProfile);
  const guardianRepo = AppDataSource.getRepository(Guardian);

  const STUDENT_SEED: Array<{
    email: string;
    studentId: string;
    grade: number;
    gender: Gender;
    dateOfBirth: string;
    homeAddress: string;
    cumulativeGpa: number;
    attendanceRate: number;
    daysAbsent: number;
    questsCompleted: number;
    cohortPercentile: string;
    honorRoll: boolean;
    guardians: Array<{
      fullName: string;
      relationship: GuardianRelationship;
      phoneNumber: string;
      email?: string;
      isPrimary?: boolean;
    }>;
  }> = [
    {
      email: 'student.alex@cp.local',
      studentId: 'STU-2024-8901',
      grade: 11,
      gender: Gender.MALE,
      dateOfBirth: '2007-03-14',
      homeAddress: '4287 Oakwood Dr, Springfield, IL 62704',
      cumulativeGpa: 3.84,
      attendanceRate: 96.5,
      daysAbsent: 12,
      questsCompleted: 42,
      cohortPercentile: 'Top 15%',
      honorRoll: true,
      guardians: [
        { fullName: 'David Johnson', relationship: GuardianRelationship.FATHER, phoneNumber: '+1 555-0192', email: 'david.j@example.com', isPrimary: true },
        { fullName: 'Sarah Johnson', relationship: GuardianRelationship.MOTHER, phoneNumber: '+1 555-0193' },
      ],
    },
    {
      email: 'student.maria@cp.local',
      studentId: 'STU-2024-8902',
      grade: 12,
      gender: Gender.FEMALE,
      dateOfBirth: '2006-08-22',
      homeAddress: '128 Cherry Ave, Apt 4B, Chicago, IL 60601',
      cumulativeGpa: 3.62,
      attendanceRate: 88.2,
      daysAbsent: 24,
      questsCompleted: 28,
      cohortPercentile: 'Top 25%',
      honorRoll: false,
      guardians: [
        { fullName: 'Elena Sanchez', relationship: GuardianRelationship.MOTHER, phoneNumber: '+1 555-0210', isPrimary: true },
      ],
    },
    {
      email: 'student.tyler@cp.local',
      studentId: 'STU-2024-8903',
      grade: 10,
      gender: Gender.MALE,
      dateOfBirth: '2008-11-03',
      homeAddress: '901 Lakeshore Blvd, Naperville, IL 60540',
      cumulativeGpa: 3.91,
      attendanceRate: 99.1,
      daysAbsent: 2,
      questsCompleted: 56,
      cohortPercentile: 'Top 5%',
      honorRoll: true,
      guardians: [
        { fullName: 'Mei Chen', relationship: GuardianRelationship.MOTHER, phoneNumber: '+1 555-0234', email: 'mei.c@example.com', isPrimary: true },
      ],
    },
    {
      email: 'student@cp.local',
      studentId: 'STU-2024-9000',
      grade: 9,
      gender: Gender.FEMALE,
      dateOfBirth: '2009-05-18',
      homeAddress: '23 Maplewood Ln, Evanston, IL 60201',
      cumulativeGpa: 3.50,
      attendanceRate: 92.0,
      daysAbsent: 14,
      questsCompleted: 19,
      cohortPercentile: 'Top 35%',
      honorRoll: false,
      guardians: [
        { fullName: 'Jordan Student', relationship: GuardianRelationship.GUARDIAN, phoneNumber: '+1 555-0001', isPrimary: true },
      ],
    },
  ];

  for (const seed of STUDENT_SEED) {
    const user = await userRepo.findOne({ where: { email: seed.email } });
    if (!user) continue;
    const existing = await profileRepo.findOne({ where: { userId: user.id } });
    if (existing) {
      // eslint-disable-next-line no-console
      console.log(`✓  profile for ${seed.email} already exists`);
      continue;
    }
    const profile = await profileRepo.save(
      profileRepo.create({
        userId: user.id,
        studentId: seed.studentId,
        grade: seed.grade,
        cohortYear: new Date().getFullYear() + (12 - seed.grade),
        gender: seed.gender,
        dateOfBirth: seed.dateOfBirth,
        homeAddress: seed.homeAddress,
        startDate: '2024-09-01',
        status: EnrollmentStatus.ACTIVE,
        cumulativeGpa: seed.cumulativeGpa,
        attendanceRate: seed.attendanceRate,
        daysAbsent: seed.daysAbsent,
        questsCompleted: seed.questsCompleted,
        cohortPercentile: seed.cohortPercentile,
        honorRoll: seed.honorRoll,
      }),
    );
    await guardianRepo.save(
      seed.guardians.map((g, idx) =>
        guardianRepo.create({
          studentProfileId: profile.id,
          fullName: g.fullName,
          relationship: g.relationship,
          phoneNumber: g.phoneNumber,
          email: g.email ?? null,
          isPrimary: g.isPrimary ?? idx === 0,
        }),
      ),
    );
    // eslint-disable-next-line no-console
    console.log(`+  profile ${seed.studentId} for ${seed.email} (${seed.guardians.length} guardian(s))`);
  }

  // ── Assignments + Courses + Class curriculum links ───────────────────────
  const assignmentRepo = AppDataSource.getRepository(Assignment);
  const courseRepo = AppDataSource.getRepository(Course);
  const courseAssignmentRepo = AppDataSource.getRepository(CourseAssignment);
  const classCourseRepo = AppDataSource.getRepository(ClassCourse);

  const ASSIGNMENT_SEED: Array<{
    title: string;
    description: string;
    type: AssignmentType;
    difficulty: 'EASY' | 'MEDIUM' | 'HARD';
    subject: string;
    points: number;
    estimatedMinutes: number;
  }> = [
    {
      title: 'Binary Search Tree Implementation',
      description: 'Implement insertion, search, and traversal on a Binary Search Tree.',
      type: AssignmentType.CODING,
      difficulty: 'MEDIUM',
      subject: 'Computer Science',
      points: 50,
      estimatedMinutes: 90,
    },
    {
      title: 'Big-O Notation Quiz',
      description: 'Multiple-choice quiz covering time and space complexity basics.',
      type: AssignmentType.QUIZ,
      difficulty: 'EASY',
      subject: 'Computer Science',
      points: 20,
      estimatedMinutes: 30,
    },
    {
      title: 'Sorting Algorithms Comparison',
      description: 'Comparative essay on Quick Sort vs Merge Sort efficiency.',
      type: AssignmentType.WRITING,
      difficulty: 'HARD',
      subject: 'Computer Science',
      points: 80,
      estimatedMinutes: 180,
    },
    {
      title: 'Multivariable Calculus Problem Set',
      description: 'Practice problems on partial derivatives and gradient vectors.',
      type: AssignmentType.PROJECT,
      difficulty: 'HARD',
      subject: 'Mathematics',
      points: 100,
      estimatedMinutes: 240,
    },
    {
      title: 'Vector Field Reading',
      description: 'Read chapters 4-5 of the textbook on vector fields and line integrals.',
      type: AssignmentType.READING,
      difficulty: 'MEDIUM',
      subject: 'Mathematics',
      points: 15,
      estimatedMinutes: 60,
    },
  ];

  const assignmentsByTitle = new Map<string, Assignment>();
  for (const seed of ASSIGNMENT_SEED) {
    const existing = await assignmentRepo.findOne({ where: { title: seed.title } });
    if (existing) {
      assignmentsByTitle.set(seed.title, existing);
      continue;
    }
    const saved = await assignmentRepo.save(
      assignmentRepo.create({ ...seed, status: PublishStatus.PUBLISHED }),
    );
    assignmentsByTitle.set(seed.title, saved);
    // eslint-disable-next-line no-console
    console.log(`+  assignment "${seed.title}" (${seed.type}, ${seed.points}pts)`);
  }

  const COURSE_SEED: Array<{
    code: string;
    title: string;
    description: string;
    credits: number;
    durationWeeks: number;
    subject: string;
    assignments: string[];
  }> = [
    {
      code: 'CS-DS-01',
      title: 'Advanced Data Structures',
      description: 'A deep dive into trees, heaps, graphs, and their algorithms.',
      credits: 3.0,
      durationWeeks: 8,
      subject: 'Computer Science',
      assignments: [
        'Big-O Notation Quiz',
        'Binary Search Tree Implementation',
        'Sorting Algorithms Comparison',
      ],
    },
    {
      code: 'MATH-301A',
      title: 'Multivariable Calculus Foundations',
      description: 'Foundations of vector calculus, partial derivatives, and integrals.',
      credits: 3.0,
      durationWeeks: 16,
      subject: 'Mathematics',
      assignments: ['Vector Field Reading', 'Multivariable Calculus Problem Set'],
    },
  ];

  const coursesByCode = new Map<string, Course>();
  for (const seed of COURSE_SEED) {
    const existing = await courseRepo.findOne({ where: { code: seed.code } });
    let course = existing;
    if (!course) {
      course = await courseRepo.save(
        courseRepo.create({
          code: seed.code,
          title: seed.title,
          description: seed.description,
          credits: seed.credits,
          durationWeeks: seed.durationWeeks,
          subject: seed.subject,
          status: PublishStatus.PUBLISHED,
        }),
      );
      // eslint-disable-next-line no-console
      console.log(`+  course ${seed.code} — ${seed.title}`);
    }
    coursesByCode.set(seed.code, course);

    // Attach assignments in order
    let order = 1;
    let totalPoints = 0;
    for (const title of seed.assignments) {
      const a = assignmentsByTitle.get(title);
      if (!a) continue;
      const link = await courseAssignmentRepo.findOne({
        where: { courseId: course.id, assignmentId: a.id },
      });
      if (!link) {
        await courseAssignmentRepo.save(
          courseAssignmentRepo.create({
            courseId: course.id,
            assignmentId: a.id,
            orderIndex: order,
          }),
        );
      }
      order++;
      totalPoints += a.points;
    }
    await courseRepo.update(
      { id: course.id },
      { assignmentCount: seed.assignments.length, totalPoints },
    );
  }

  // Attach courses to seeded classes (MATH-301 gets MATH-301A; PHY-101 gets CS-DS-01)
  const CLASS_COURSE_SEED: Array<{ classCode: string; courseCodes: string[] }> = [
    { classCode: 'MATH-301', courseCodes: ['MATH-301A'] },
    { classCode: 'PHY-101', courseCodes: ['CS-DS-01'] },
  ];
  for (const seed of CLASS_COURSE_SEED) {
    const cls = await classRepo.findOne({ where: { code: seed.classCode } });
    if (!cls) continue;
    let order = 1;
    for (const code of seed.courseCodes) {
      const course = coursesByCode.get(code);
      if (!course) continue;
      const link = await classCourseRepo.findOne({
        where: { classId: cls.id, courseId: course.id },
      });
      if (!link) {
        await classCourseRepo.save(
          classCourseRepo.create({
            classId: cls.id,
            courseId: course.id,
            orderIndex: order,
            isRequired: true,
          }),
        );
        // eslint-disable-next-line no-console
        console.log(`+  attached course ${code} to class ${seed.classCode}`);
      }
      order++;
    }
  }

  // eslint-disable-next-line no-console
  console.log(`\nAll seeded. Password for every user: "${PASSWORD}"`);
  await AppDataSource.destroy();
}

run().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
