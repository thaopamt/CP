import { Column, Entity, Index, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { ExamRewardGrantStatus } from '@cp/shared';
import { BaseEntity } from '../../common/entities/base.entity';
import { Exam } from './exam.entity';
import { User } from '../users/user.entity';
import { ExamRewardRule } from './exam-reward-rule.entity';

/**
 * Idempotent reward ledger. The unique (exam, user, rule) constraint is the
 * dedup gate that makes finalize/grant safe to run repeatedly.
 */
@Entity({ name: 'exam_reward_grants' })
@Unique('UQ_exam_reward_grant', ['examId', 'userId', 'rewardRuleId'])
export class ExamRewardGrant extends BaseEntity {
  @Index()
  @Column({ type: 'uuid', name: 'exam_id' })
  examId!: string;

  @ManyToOne(() => Exam, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'exam_id' })
  exam!: Exam;

  @Index()
  @Column({ type: 'uuid', name: 'user_id' })
  userId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ type: 'uuid', name: 'reward_rule_id' })
  rewardRuleId!: string;

  @ManyToOne(() => ExamRewardRule, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'reward_rule_id' })
  rule!: ExamRewardRule;

  @Index()
  @Column({ type: 'enum', enum: ExamRewardGrantStatus, default: ExamRewardGrantStatus.PENDING })
  status!: ExamRewardGrantStatus;

  @Column({ type: 'int', default: 0, name: 'granted_gems' })
  grantedGems!: number;

  @Column({ type: 'int', default: 0, name: 'granted_xp' })
  grantedXp!: number;

  @Column({ type: 'uuid', nullable: true, name: 'granted_badge_id' })
  grantedBadgeId!: string | null;

  /** Which snapshot version drove this grant. */
  @Column({ type: 'int', default: 0, name: 'snapshot_version' })
  snapshotVersion!: number;

  @Column({ type: 'text', nullable: true, name: 'error_message' })
  errorMessage!: string | null;
}
