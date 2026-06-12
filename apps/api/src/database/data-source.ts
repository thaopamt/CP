import 'reflect-metadata';
import { config as loadEnv } from 'dotenv';
import { DataSource } from 'typeorm';
import { join } from 'node:path';

import { User } from '../modules/users/user.entity';
import { ClassEntity } from '../modules/classes/class.entity';
import { Enrollment } from '../modules/classes/enrollment.entity';
import { StudentProfile } from '../modules/students/student-profile.entity';
import { Guardian } from '../modules/students/guardian.entity';
import { StudentSchedule } from '../modules/students/student-schedule.entity';
import { AttendanceRecord } from '../modules/attendance/attendance.entity';
import { ScheduleSlotAttendanceRecord } from '../modules/attendance/schedule-slot-attendance.entity';
import { ScheduleSlotCancellation } from '../modules/attendance/schedule-slot-cancellation.entity';
import { Assignment } from '../modules/assignments/assignment.entity';
import { Course } from '../modules/courses/course.entity';
import { CourseAssignment } from '../modules/courses/course-assignment.entity';
import { ClassCourse } from '../modules/classes/class-course.entity';
import { Submission, SubmissionTestResult } from '../modules/submissions/submission.entity';
import { StudentAssignmentProgress } from '../modules/submissions/student-assignment-progress.entity';
import { AuditLogEntity } from '../modules/global-chat/entities/audit-log.entity';
import { GlobalChatMessageEntity } from '../modules/global-chat/entities/global-chat-message.entity';
import { GlobalChatMessageReadEntity } from '../modules/global-chat/entities/global-chat-message-read.entity';
import { NotificationEntity } from '../modules/global-chat/entities/global-chat-notification.entity';
import { Quest } from '../modules/quests/quest.entity';
import { StudentQuest } from '../modules/quests/student-quest.entity';
import { Badge } from '../modules/quests/badge.entity';
import { StudentBadge } from '../modules/quests/student-badge.entity';
import { MazeLevel } from '../modules/maze/maze-level.entity';
import { MazeSubmission } from '../modules/maze/maze-submission.entity';
import { ShopItem } from '../modules/shop/shop-item.entity';
import { StudentInventory } from '../modules/shop/student-inventory.entity';
import { FinanceMonthlyAmountDue } from '../modules/finance/finance-monthly-amount-due.entity';
import { FinanceMonthlyStatus } from '../modules/finance/finance-monthly-status.entity';

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
    Enrollment,
    StudentProfile,
    Guardian,
    StudentSchedule,
    AttendanceRecord,
    ScheduleSlotAttendanceRecord,
    ScheduleSlotCancellation,
    Assignment,
    Course,
    CourseAssignment,
    ClassCourse,
    Submission,
    SubmissionTestResult,
    StudentAssignmentProgress,
    GlobalChatMessageEntity,
    GlobalChatMessageReadEntity,
    NotificationEntity,
    AuditLogEntity,
    Quest,
    StudentQuest,
    Badge,
    StudentBadge,
    MazeLevel,
    MazeSubmission,
    FinanceMonthlyAmountDue,
    FinanceMonthlyStatus,
    ShopItem,
    StudentInventory,
  ],
  migrations: [join(__dirname, 'migrations/*.{ts,js}')],
  synchronize: true,
  logging: ['error', 'warn'],
});
