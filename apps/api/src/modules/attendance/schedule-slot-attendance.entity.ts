import { Column, Entity, Index, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { AttendanceStatus, DayOfWeek } from '@cp/shared';

import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../users/user.entity';

@Entity({ name: 'schedule_slot_attendance_records' })
@Unique('UQ_schedule_slot_attendance', ['studentId', 'date', 'dayOfWeek', 'startTime', 'endTime'])
export class ScheduleSlotAttendanceRecord extends BaseEntity {
  @Index()
  @Column({ type: 'uuid', name: 'student_id' })
  studentId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id' })
  student!: User;

  @Index()
  @Column({ type: 'date' })
  date!: string;

  @Column({ type: 'enum', enum: DayOfWeek, name: 'day_of_week' })
  dayOfWeek!: DayOfWeek;

  @Column({ type: 'time', name: 'start_time' })
  startTime!: string;

  @Column({ type: 'time', name: 'end_time' })
  endTime!: string;

  @Column({ type: 'enum', enum: AttendanceStatus, default: AttendanceStatus.UNMARKED })
  status!: AttendanceStatus;

  @Column({ type: 'text', nullable: true })
  note!: string | null;

  @Column({ type: 'uuid', name: 'marked_by', nullable: true })
  markedBy!: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'marked_by' })
  marker!: User | null;
}
