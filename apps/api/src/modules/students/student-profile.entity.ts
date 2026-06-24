import {
  Column,
  Entity,
  Index,
  JoinColumn,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { EnrollmentStatus } from '@cp/shared';

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

  @Column({ type: 'text', name: 'home_address', nullable: true })
  homeAddress!: string | null;

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

  @Column({ type: 'int', default: 0, name: 'monthly_tuition' })
  monthlyTuition!: number;

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

  /** XP earned in the current ISO week; lazily reset when `weekKey` rolls over. */
  @Column({ type: 'int', default: 0, name: 'weekly_xp' })
  weeklyXp!: number;

  @Column({ type: 'varchar', length: 8, nullable: true, name: 'week_key' })
  weekKey!: string | null;

  /** XP earned in the current calendar month; lazily reset with `monthKey`. */
  @Column({ type: 'int', default: 0, name: 'monthly_xp' })
  monthlyXp!: number;

  @Column({ type: 'varchar', length: 7, nullable: true, name: 'month_key' })
  monthKey!: string | null;

  @Column({ type: 'int', default: 0 })
  gems!: number;

  // ── Equipped cosmetics (bought in the gem shop) ──────────────────────

  /** Code of the equipped profile theme, or null. */
  @Column({ type: 'varchar', length: 80, nullable: true, name: 'equipped_theme' })
  equippedTheme!: string | null;

  /** Hex color (e.g. `#f59e0b`) applied to the student's display name, or null. */
  @Column({ type: 'varchar', length: 16, nullable: true, name: 'name_color' })
  nameColor!: string | null;

  /** Cosmetic title shown next to the name (e.g. "Huyền thoại"), or null. */
  @Column({ type: 'varchar', length: 60, nullable: true, name: 'equipped_title' })
  equippedTitle!: string | null;

  @Column({ type: 'int', default: 0 })
  streak!: number;

  /** Last day (UTC) the student had an accepted submission — drives streak. */
  @Column({ type: 'date', nullable: true, name: 'streak_last_date' })
  streakLastDate!: string | null;

  /** Denormalized lifetime counters used by quests & badges. */
  @Column({ type: 'int', default: 0, name: 'problems_solved' })
  problemsSolved!: number;

  @Column({ type: 'int', default: 0, name: 'mazes_solved' })
  mazesSolved!: number;

  @Column({ type: 'int', default: 0, name: 'badges_earned' })
  badgesEarned!: number;

  @Column({ type: 'varchar', length: 20, default: 'cpp', name: 'default_language' })
  defaultLanguage!: string;

  @Column({ type: 'varchar', length: 64, nullable: true, name: 'cohort_percentile' })
  cohortPercentile!: string | null;

  @Column({ type: 'boolean', default: false, name: 'honor_roll' })
  honorRoll!: boolean;

  @OneToMany(() => Guardian, (g) => g.studentProfile, { cascade: true, eager: true })
  guardians!: Guardian[];
}
