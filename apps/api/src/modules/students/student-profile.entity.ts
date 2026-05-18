import {
  Column,
  Entity,
  Index,
  JoinColumn,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { EnrollmentStatus, Gender } from '@cp/shared';

import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../users/user.entity';
import { Guardian } from './guardian.entity';

/**
 * Student-specific profile data, kept off the `User` table so non-student
 * users (admins, teachers) don't carry nullable demographic columns.
 *
 * 1-to-1 with User on `userId`. Created atomically in StudentsService.create.
 */
@Entity({ name: 'student_profiles' })
export class StudentProfile extends BaseEntity {
  @Index({ unique: true })
  @Column({ type: 'uuid', name: 'user_id' })
  userId!: string;

  @OneToOne(() => User, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  /** Institutional ID (e.g. "STU-2024-8901") — distinct from the auth user.id UUID */
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 32, name: 'student_id' })
  studentId!: string;

  // ── Demographics ──────────────────────────────────────────────────
  @Column({ type: 'date', name: 'date_of_birth', nullable: true })
  dateOfBirth!: string | null;

  @Column({ type: 'enum', enum: Gender, nullable: true })
  gender!: Gender | null;

  @Column({ type: 'text', name: 'home_address', nullable: true })
  homeAddress!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  school!: string | null;

  // ── Enrollment ────────────────────────────────────────────────────
  @Index()
  @Column({ type: 'int' })
  grade!: number;

  @Column({ type: 'int', name: 'cohort_year' })
  cohortYear!: number;

  @Column({ type: 'timestamptz', name: 'enrolled_at', default: () => 'CURRENT_TIMESTAMP' })
  enrolledAt!: Date;

  @Column({ type: 'date', name: 'start_date', nullable: true })
  startDate!: string | null;

  @Index()
  @Column({ type: 'enum', enum: EnrollmentStatus, default: EnrollmentStatus.ACTIVE })
  status!: EnrollmentStatus;

  // ── Denormalized KPIs (refreshed by background jobs / triggers) ───
  @Column({ type: 'float', default: 0, name: 'cumulative_gpa' })
  cumulativeGpa!: number;

  @Column({ type: 'float', default: 0, name: 'attendance_rate' })
  attendanceRate!: number;

  @Column({ type: 'int', default: 0, name: 'days_absent' })
  daysAbsent!: number;

  @Column({ type: 'int', default: 0, name: 'quests_completed' })
  questsCompleted!: number;

  @Column({ type: 'int', default: 1 })
  level!: number;

  @Column({ type: 'int', default: 0 })
  xp!: number;

  @Column({ type: 'int', default: 0 })
  gems!: number;

  @Column({ type: 'int', default: 0 })
  streak!: number;

  @Column({ type: 'varchar', length: 64, nullable: true, name: 'cohort_percentile' })
  cohortPercentile!: string | null;

  @Column({ type: 'boolean', default: false, name: 'honor_roll' })
  honorRoll!: boolean;

  @OneToMany(() => Guardian, (g) => g.studentProfile, { cascade: true, eager: true })
  guardians!: Guardian[];
}
