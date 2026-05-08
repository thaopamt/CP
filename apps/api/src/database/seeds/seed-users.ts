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
  ClassDepartment,
  ClassStatus,
  DayOfWeek,
  EnrollmentLifecycle,
  PaymentStatus,
  UserRole,
} from '@cp/shared';

import { AppDataSource } from '../data-source';
import { User } from '../../modules/users/user.entity';
import { ClassEntity } from '../../modules/classes/class.entity';
import { ClassSession } from '../../modules/classes/class-session.entity';
import { Enrollment } from '../../modules/classes/enrollment.entity';

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

  // eslint-disable-next-line no-console
  console.log(`\nAll seeded. Password for every user: "${PASSWORD}"`);
  await AppDataSource.destroy();
}

run().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
