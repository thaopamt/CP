import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { DayOfWeek } from '@cp/shared';

import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../users/user.entity';
import { ClassEntity } from '../classes/class.entity';

/**
 * Admin-managed custom schedule session for a student.
 *
 * These rows are the source of truth for a student's effective schedule.
 */
@Entity({ name: 'student_schedules' })
export class StudentSchedule extends BaseEntity {
  @Index()
  @Column({ type: 'uuid', name: 'student_id' })
  studentId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id' })
  student!: User;

  /** Optional — link this session to a specific class */
  @Column({ type: 'uuid', name: 'class_id', nullable: true })
  classId!: string | null;

  @ManyToOne(() => ClassEntity, { onDelete: 'SET NULL', nullable: true, eager: true })
  @JoinColumn({ name: 'class_id' })
  class!: ClassEntity | null;

  @Column({ type: 'enum', enum: DayOfWeek, name: 'day_of_week' })
  dayOfWeek!: DayOfWeek;

  @Column({ type: 'time', name: 'start_time' })
  startTime!: string;

  @Column({ type: 'time', name: 'end_time' })
  endTime!: string;



  /** Free-text note visible only to admins */
  @Column({ type: 'text', nullable: true })
  note!: string | null;
}
