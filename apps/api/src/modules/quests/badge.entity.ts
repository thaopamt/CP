import { Column, Entity, Index, OneToMany } from 'typeorm';
import { BadgeRarity, IBadgeCriteria } from '@cp/shared';
import { BaseEntity } from '../../common/entities/base.entity';
import { StudentBadge } from './student-badge.entity';

@Entity({ name: 'badges' })
export class Badge extends BaseEntity {
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 80 })
  code!: string;

  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ type: 'text', default: '' })
  description!: string;

  @Column({ type: 'varchar', length: 50, default: 'workspace_premium' })
  icon!: string;

  @Index()
  @Column({ type: 'enum', enum: BadgeRarity, default: BadgeRarity.COMMON })
  rarity!: BadgeRarity;

  @Column({ type: 'jsonb' })
  criteria!: IBadgeCriteria;

  @Column({ type: 'int', default: 0, name: 'reward_xp' })
  rewardXp!: number;

  @Column({ type: 'int', default: 0, name: 'reward_gems' })
  rewardGems!: number;

  @Index()
  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive!: boolean;

  /** Denormalized — bumped when a student earns it. */
  @Column({ type: 'int', default: 0, name: 'earned_count' })
  earnedCount!: number;

  @OneToMany(() => StudentBadge, (sb) => sb.badge)
  studentBadges!: StudentBadge[];
}
