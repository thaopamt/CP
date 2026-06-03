import 'reflect-metadata';
import { config as loadEnv } from 'dotenv';
import { DataSource } from 'typeorm';
import { join } from 'node:path';

import { User } from '../modules/users/user.entity';
import { ClassEntity } from '../modules/classes/class.entity';
import { ClassSession } from '../modules/classes/class-session.entity';
import { Enrollment } from '../modules/classes/enrollment.entity';
import { StudentProfile } from '../modules/students/student-profile.entity';
import { Guardian } from '../modules/students/guardian.entity';
import { StudentSchedule } from '../modules/students/student-schedule.entity';
import { AttendanceRecord } from '../modules/attendance/attendance.entity';
import { Assignment } from '../modules/assignments/assignment.entity';
import { Course } from '../modules/courses/course.entity';
import { CourseAssignment } from '../modules/courses/course-assignment.entity';
import { ClassCourse } from '../modules/classes/class-course.entity';
import { Submission, SubmissionTestResult } from '../modules/submissions/submission.entity';
import { AuditLogEntity } from '../modules/global-chat/entities/audit-log.entity';
import { GlobalChatMessageEntity } from '../modules/global-chat/entities/global-chat-message.entity';
import { GlobalChatMessageReadEntity } from '../modules/global-chat/entities/global-chat-message-read.entity';
import { NotificationEntity } from '../modules/global-chat/entities/global-chat-notification.entity';
import { Quest } from '../modules/quests/quest.entity';
import { StudentQuest } from '../modules/quests/student-quest.entity';
import { MazeLevel } from '../modules/maze/maze-level.entity';
import { MazeSubmission } from '../modules/maze/maze-submission.entity';

// Load env in CLI context (TypeORM CLI doesn't go through ConfigModule)
loadEnv({ path: join(process.cwd(), 'apps/api/.env') });
loadEnv({ path: join(process.cwd(), '.env') });

/**
 * Standalone DataSource for the typeorm CLI:
 *   - migration:generate
 *   - migration:run
 *   - migration:revert
 * Mirrors apps/api/src/config/typeorm.config.ts but exports a DataSource
 * instance (which the CLI requires).
 */
export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL ?? 'postgresql://cp:cp@127.0.0.1:5432/cp',
  ssl: process.env.DATABASE_URL?.includes('amazonaws.com') ? { rejectUnauthorized: false } : undefined,
  entities: [
    User,
    ClassEntity,
    ClassSession,
    Enrollment,
    StudentProfile,
    Guardian,
    StudentSchedule,
    AttendanceRecord,
    Assignment,
    Course,
    CourseAssignment,
    ClassCourse,
    Submission,
    SubmissionTestResult,
    GlobalChatMessageEntity,
    GlobalChatMessageReadEntity,
    NotificationEntity,
    AuditLogEntity,
    Quest,
    StudentQuest,
    MazeLevel,
    MazeSubmission,
  ],
  migrations: [join(__dirname, 'migrations/*.{ts,js}')],
  synchronize: false,
  logging: ['error', 'warn'],
});

