import { Column, Entity, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { DayOfWeek } from '@cp/shared';

import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../users/user.entity';

@Entity({ name: 'schedule_slot_cancellations' })
@Unique('UQ_schedule_slot_cancellation', ['date', 'dayOfWeek', 'startTime', 'endTime'])
export class ScheduleSlotCancellation extends BaseEntity {
  @Column({ type: 'date' })
  date!: string;

  @Column({ type: 'enum', enum: DayOfWeek, name: 'day_of_week' })
  dayOfWeek!: DayOfWeek;

  @Column({ type: 'time', name: 'start_time' })
  startTime!: string;

  @Column({ type: 'time', name: 'end_time' })
  endTime!: string;

  @Column({ type: 'uuid', name: 'cancelled_by', nullable: true })
  cancelledBy!: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'cancelled_by' })
  canceller!: User | null;

  @Column({ type: 'text', nullable: true })
  note!: string | null;
}
