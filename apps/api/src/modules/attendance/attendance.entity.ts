import { Column, Entity, Index, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { AttendanceStatus } from '@cp/shared';

import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../users/user.entity';
import { ClassEntity } from '../classes/class.entity';
import { ClassSession } from '../classes/class-session.entity';

/**
 * Stores one attendance mark per student, per class, per session, per date.
 *
 * If the class has multiple sessions on the same day (e.g. morning + afternoon),
 * each session gets its own attendance row.
 */
@Entity({ name: 'attendance_records' })
@Unique('UQ_attendance', ['studentId', 'classId', 'sessionId', 'date'])
export class AttendanceRecord extends BaseEntity {
  @Index()
  @Column({ type: 'uuid', name: 'student_id' })
  studentId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id' })
  student!: User;

  @Index()
  @Column({ type: 'uuid', name: 'class_id' })
  classId!: string;

  @ManyToOne(() => ClassEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'class_id' })
  class!: ClassEntity;

  /** The class session this attendance relates to. Null for ad-hoc attendance. */
  @Column({ type: 'uuid', name: 'session_id', nullable: true })
  sessionId!: string | null;

  @ManyToOne(() => ClassSession, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'session_id' })
  session!: ClassSession | null;

  /** The calendar date (YYYY-MM-DD) for this attendance record. */
  @Index()
  @Column({ type: 'date' })
  date!: string;

  @Column({ type: 'enum', enum: AttendanceStatus, default: AttendanceStatus.UNMARKED })
  status!: AttendanceStatus;

  /** Free-text note by the admin/teacher who marked this. */
  @Column({ type: 'text', nullable: true })
  note!: string | null;

  /** The admin/teacher who last set this record. */
  @Column({ type: 'uuid', name: 'marked_by', nullable: true })
  markedBy!: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'marked_by' })
  marker!: User | null;
}
