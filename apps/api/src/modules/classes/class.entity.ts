import { Column, Entity, Index, OneToMany } from 'typeorm';
import { ClassStatus } from '@cp/shared';

import { BaseEntity } from '../../common/entities/base.entity';
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

  @Column({ type: 'int', default: 0, name: 'enrolled_count' })
  enrolledCount!: number;

  @Column({ type: 'enum', enum: ClassStatus, default: ClassStatus.UPCOMING })
  status!: ClassStatus;

  /** 0..100 — denormalized snapshot, refreshed by a job/trigger */
  @Column({ type: 'float', default: 0, name: 'attendance_rate' })
  attendanceRate!: number;

  @OneToMany(() => Enrollment, (e) => e.class, { cascade: ['soft-remove'] })
  enrollments!: Enrollment[];
}
