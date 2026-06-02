import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { ClassStatus } from '@cp/shared';

import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../users/user.entity';
import { ClassSession } from './class-session.entity';
import { Enrollment } from './enrollment.entity';

@Entity({ name: 'classes' })
export class ClassEntity extends BaseEntity {
  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 50 })
  code!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'int', default: 30 })
  capacity!: number;

  @Column({ type: 'int', default: 0, name: 'enrolled_count' })
  enrolledCount!: number;

  @Column({ type: 'enum', enum: ClassStatus, default: ClassStatus.UPCOMING })
  status!: ClassStatus;

  @Column({ type: 'varchar', length: 100 })
  term!: string;

  /** 0..100 — denormalized snapshot, refreshed by a job/trigger */
  @Column({ type: 'float', default: 0, name: 'attendance_rate' })
  attendanceRate!: number;

  @OneToMany(() => ClassSession, (s) => s.class, { cascade: true, eager: true })
  sessions!: ClassSession[];

  @OneToMany(() => Enrollment, (e) => e.class, { cascade: ['soft-remove'] })
  enrollments!: Enrollment[];
}
