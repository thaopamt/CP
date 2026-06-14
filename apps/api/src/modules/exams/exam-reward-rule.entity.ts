import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { ExamRewardType, IExamReward, IExamRewardCondition } from '@cp/shared';
import { BaseEntity } from '../../common/entities/base.entity';
import { Exam } from './exam.entity';

@Entity({ name: 'exam_reward_rules' })
export class ExamRewardRule extends BaseEntity {
  @Index()
  @Column({ type: 'uuid', name: 'exam_id' })
  examId!: string;

  @ManyToOne(() => Exam, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'exam_id' })
  exam!: Exam;

  @Column({ type: 'enum', enum: ExamRewardType })
  type!: ExamRewardType;

  @Column({ type: 'varchar', length: 120, nullable: true })
  label!: string | null;

  @Column({ type: 'jsonb', name: 'condition_json' })
  condition!: IExamRewardCondition;

  @Column({ type: 'jsonb', name: 'reward_json' })
  reward!: IExamReward;

  /** Lower number = evaluated first; first matching positional rule wins per user. */
  @Column({ type: 'int', default: 0 })
  priority!: number;

  @Index()
  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive!: boolean;
}
