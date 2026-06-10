import { Column, Entity, Index, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../users/user.entity';
import { Badge } from './badge.entity';

@Entity({ name: 'student_badges' })
@Unique('UQ_student_badge', ['userId', 'badgeId'])
export class StudentBadge extends BaseEntity {
  @Index()
  @Column({ type: 'uuid', name: 'user_id' })
  userId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Index()
  @Column({ type: 'uuid', name: 'badge_id' })
  badgeId!: string;

  @ManyToOne(() => Badge, (b) => b.studentBadges, { onDelete: 'CASCADE', eager: true })
  @JoinColumn({ name: 'badge_id' })
  badge!: Badge;

  @Column({ type: 'timestamptz', name: 'earned_at', default: () => 'CURRENT_TIMESTAMP' })
  earnedAt!: Date;
}
