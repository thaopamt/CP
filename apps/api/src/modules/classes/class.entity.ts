import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { ClassDepartment, ClassStatus } from '@cp/shared';

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

  @Column({ type: 'enum', enum: ClassDepartment })
  department!: ClassDepartment;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  room!: string | null;

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

  /**
   * Optional — a class can be created without a primary instructor and
   * have one assigned later. `onDelete: SET NULL` so deleting the user
   * leaves the class row intact (instead of blocking the delete).
   */
  @Column({ type: 'uuid', name: 'instructor_id', nullable: true })
  instructorId!: string | null;

  @ManyToOne(() => User, { eager: true, onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'instructor_id' })
  instructor!: User | null;

  @OneToMany(() => ClassSession, (s) => s.class, { cascade: true, eager: true })
  sessions!: ClassSession[];

  @OneToMany(() => Enrollment, (e) => e.class, { cascade: ['soft-remove'] })
  enrollments!: Enrollment[];
}
