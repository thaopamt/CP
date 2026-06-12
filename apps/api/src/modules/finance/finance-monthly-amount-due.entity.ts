import { Column, Entity, Index, JoinColumn, ManyToOne, Unique } from 'typeorm';

import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../users/user.entity';

@Entity({ name: 'finance_monthly_amount_due_overrides' })
@Unique('UQ_finance_monthly_amount_due_student_month', ['studentId', 'month'])
export class FinanceMonthlyAmountDue extends BaseEntity {
  @Index()
  @Column({ type: 'uuid', name: 'student_id' })
  studentId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id' })
  student!: User;

  @Index()
  @Column({ type: 'varchar', length: 7 })
  month!: string;

  @Column({ type: 'int', name: 'amount_due', default: 0 })
  amountDue!: number;
}
