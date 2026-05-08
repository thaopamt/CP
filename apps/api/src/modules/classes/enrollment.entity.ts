import { Column, Entity, Index, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { EnrollmentLifecycle, PaymentStatus } from '@cp/shared';

import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../users/user.entity';
import { ClassEntity } from './class.entity';

@Entity({ name: 'enrollments' })
@Unique('UQ_enrollment_class_student', ['classId', 'studentId'])
export class Enrollment extends BaseEntity {
  @Index()
  @Column({ type: 'uuid', name: 'class_id' })
  classId!: string;

  @ManyToOne(() => ClassEntity, (c) => c.enrollments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'class_id' })
  class!: ClassEntity;

  @Index()
  @Column({ type: 'uuid', name: 'student_id' })
  studentId!: string;

  @ManyToOne(() => User, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id' })
  student!: User;

  @Column({ type: 'enum', enum: EnrollmentLifecycle, default: EnrollmentLifecycle.ACTIVE })
  status!: EnrollmentLifecycle;

  /** 0..100 — student's running attendance % for this class */
  @Column({ type: 'float', default: 0, name: 'attendance_percentage' })
  attendancePercentage!: number;

  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.PENDING, name: 'payment_status' })
  paymentStatus!: PaymentStatus;
}
