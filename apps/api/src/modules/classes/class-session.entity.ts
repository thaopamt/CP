import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { DayOfWeek } from '@cp/shared';

import { BaseEntity } from '../../common/entities/base.entity';
import { ClassEntity } from './class.entity';

@Entity({ name: 'class_sessions' })
export class ClassSession extends BaseEntity {
  @Column({ type: 'uuid', name: 'class_id' })
  classId!: string;

  @ManyToOne(() => ClassEntity, (c) => c.sessions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'class_id' })
  class!: ClassEntity;

  @Column({ type: 'enum', enum: DayOfWeek, name: 'day_of_week' })
  dayOfWeek!: DayOfWeek;

  @Column({ type: 'time', name: 'start_time' })
  startTime!: string;

  @Column({ type: 'time', name: 'end_time' })
  endTime!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  room!: string | null;
}
