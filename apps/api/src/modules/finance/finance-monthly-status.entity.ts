import { Column, Entity, Index, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { FinanceCollectionStatus } from '@cp/shared';

import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../users/user.entity';

@Entity({ name: 'finance_monthly_statuses' })
@Unique('UQ_finance_monthly_status_student_month', ['studentId', 'month'])
export class FinanceMonthlyStatus extends BaseEntity {
  @Index()
  @Column({ type: 'uuid', name: 'student_id' })
  studentId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id' })
  student!: User;

  @Index()
  @Column({ type: 'varchar', length: 7 })
  month!: string;

  @Index()
  @Column({ type: 'varchar', length: 16, default: 'PENDING' })
  status!: FinanceCollectionStatus;
}
