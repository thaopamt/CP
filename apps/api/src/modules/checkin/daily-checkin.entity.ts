import { Column, Entity, Index, Unique } from 'typeorm';

import { BaseEntity } from '../../common/entities/base.entity';

/**
 * One row per (user, dayKey). `source` distinguishes real check-ins from
 * Phase-2 makeup fills; Phase-1 only ever writes 'checkin'. The UNIQUE
 * constraint is the double-check-in backstop (design §10).
 */
@Entity({ name: 'daily_checkins' })
@Unique('UQ_daily_checkin_user_day', ['userId', 'dayKey'])
@Index('IDX_daily_checkin_user_month', ['userId', 'monthKey'])
export class DailyCheckin extends BaseEntity {
  @Column({ type: 'uuid', name: 'user_id' })
  userId!: string;

  /** 'YYYY-MM-DD' in VN time. */
  @Column({ type: 'date', name: 'day_key' })
  dayKey!: string;

  /** 'YYYY-MM', used to build the monthly board fast. */
  @Column({ type: 'varchar', length: 7, name: 'month_key' })
  monthKey!: string;

  /** 'checkin' | 'makeup' — Phase 1 only writes 'checkin'. */
  @Column({ type: 'varchar', length: 16, default: 'checkin' })
  source!: string;
}
