import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

@Entity({ name: 'leaderboard_finalized_weeks' })
export class LeaderboardFinalizedWeek extends BaseEntity {
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 8, name: 'week_key' })
  weekKey!: string;

  @Column({ type: 'timestamptz', name: 'finalized_at', default: () => 'CURRENT_TIMESTAMP' })
  finalizedAt!: Date;

  @Column({ type: 'jsonb' })
  winners!: {
    userId: string;
    name: string;
    avatarUrl: string | null;
    rank: number;
    weeklyXp: number;
    rewards: {
      xp: number;
      gems: number;
      avatarCode: string;
    };
  }[];
}
