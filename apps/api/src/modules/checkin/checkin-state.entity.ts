import { Column, Entity, Unique } from 'typeorm';

import { BaseEntity } from '../../common/entities/base.entity';

/**
 * One row per user. Enrichment columns (freezeTokens, pendingWheelSpins,
 * makeupUsedThisMonth, highestMilestoneAwarded) are created up-front as
 * default-0 for schema stability (design §3.2 tradeoff); NO Phase-1 code
 * reads or writes them.
 */
@Entity({ name: 'checkin_states' })
@Unique('UQ_checkin_state_user', ['userId'])
export class CheckinState extends BaseEntity {
  @Column({ type: 'uuid', name: 'user_id' })
  userId!: string;

  @Column({ type: 'int', default: 0, name: 'current_streak' })
  currentStreak!: number;

  @Column({ type: 'int', default: 0, name: 'longest_streak' })
  longestStreak!: number;

  @Column({ type: 'date', nullable: true, name: 'last_checkin_date' })
  lastCheckinDate!: string | null;

  @Column({ type: 'int', default: 0, name: 'total_checkins' })
  totalCheckins!: number;

  @Column({ type: 'varchar', length: 7, nullable: true, name: 'month_key' })
  monthKey!: string | null;

  @Column({ type: 'int', default: 0, name: 'monthly_checkins' })
  monthlyCheckins!: number;

  // ── Enrichment columns (Phase 2) — default-0, untouched in Phase 1 ──────────
  @Column({ type: 'int', default: 0, name: 'freeze_tokens' })
  freezeTokens!: number;

  @Column({ type: 'int', default: 0, name: 'pending_wheel_spins' })
  pendingWheelSpins!: number;

  @Column({ type: 'int', default: 0, name: 'makeup_used_this_month' })
  makeupUsedThisMonth!: number;

  @Column({ type: 'int', default: 0, name: 'highest_milestone_awarded' })
  highestMilestoneAwarded!: number;
}
