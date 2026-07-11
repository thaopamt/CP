import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ICheckinBoardCell, ICheckinResult, ICheckinStatus } from '@cp/shared';

import { CheckinState } from './checkin-state.entity';
import { DailyCheckin } from './daily-checkin.entity';
import { StudentProfile } from '../students/student-profile.entity';
import { GamificationGateway } from '../quests/gamification.gateway';
import { checkinDayKey, daysBetweenDayKeys, applyXpGain } from '../quests/period-keys';
import { advanceLevel } from '../../common/gamification.constants';
import { SystemCacheService } from '../../common/cache/system-cache.service';
import { CHECKIN_BASE_GEMS, CHECKIN_BASE_XP, streakBonusGems } from './checkin.constants';

/** Number of calendar days in a 'YYYY-MM' month. */
function daysInMonth(monthKey: string): number {
  const [y, m] = monthKey.split('-').map(Number);
  return new Date(y, m, 0).getDate();
}

/**
 * Pure board builder for a month. Phase-1 emits only checked | today | future
 * | missed (makeup/missable are Phase-2). Exported for direct unit testing.
 */
export function buildCheckinBoard(
  monthKey: string,
  today: string,
  rows: { dayKey: string; source: string }[],
): ICheckinBoardCell[] {
  const filled = new Map(rows.map((r) => [r.dayKey, r.source] as const));
  const total = daysInMonth(monthKey);
  const cells: ICheckinBoardCell[] = [];
  for (let d = 1; d <= total; d++) {
    const dayKey = `${monthKey}-${String(d).padStart(2, '0')}`;
    let status: ICheckinBoardCell['status'];
    if (filled.get(dayKey) === 'checkin') status = 'checked';
    else if (dayKey === today) status = 'today';
    else if (dayKey > today) status = 'future';
    else status = 'missed';
    cells.push({ dayKey, status });
  }
  return cells;
}

function isUniqueViolation(err: unknown): boolean {
  return typeof err === 'object' && err !== null && (err as { code?: string }).code === '23505';
}

@Injectable()
export class CheckinService {
  constructor(
    @InjectRepository(CheckinState) private readonly states: Repository<CheckinState>,
    @InjectRepository(DailyCheckin) private readonly dailies: Repository<DailyCheckin>,
    @InjectRepository(StudentProfile) private readonly profiles: Repository<StudentProfile>,
    private readonly ds: DataSource,
    private readonly cache: SystemCacheService,
    private readonly gateway: GamificationGateway,
  ) {}

  /** Read-only status; never writes. Month-scoped counters are figured on the fly. */
  async getMe(userId: string, now: Date = new Date()): Promise<ICheckinStatus> {
    const today = checkinDayKey(now);
    const monthNow = today.slice(0, 7);
    const state = await this.states.findOne({ where: { userId } });
    const rows = await this.dailies.find({ where: { userId, monthKey: monthNow } });
    return this.toStatus(state, rows, today, monthNow);
  }

  private toStatus(
    state: CheckinState | null,
    rows: { dayKey: string; source: string }[],
    today: string,
    monthNow: string,
  ): ICheckinStatus {
    const sameMonth = !!state && state.monthKey === monthNow;
    return {
      today,
      checkedInToday: state?.lastCheckinDate === today,
      monthKey: monthNow,
      board: buildCheckinBoard(monthNow, today, rows),
      currentStreak: state?.currentStreak ?? 0,
      longestStreak: state?.longestStreak ?? 0,
      totalCheckins: state?.totalCheckins ?? 0,
      monthlyCheckins: sameMonth ? state!.monthlyCheckins : 0,
      // Phase-1 boundary: enrichment/makeup fields are literal zeros (Phase 2 fills them).
      freezeTokens: 0,
      pendingWheelSpins: 0,
      makeupRemaining: 0,
      makeupCost: 0,
    };
  }

  async checkIn(userId: string, now: Date = new Date()): Promise<ICheckinResult> {
    const today = checkinDayKey(now);
    const monthNow = today.slice(0, 7);

    const outcome = await this.ds
      .transaction(async (tx) => {
        const stateRepo = tx.getRepository(CheckinState);
        const dailyRepo = tx.getRepository(DailyCheckin);
        const profileRepo = tx.getRepository(StudentProfile);

        const state =
          (await stateRepo.findOne({ where: { userId }, lock: { mode: 'pessimistic_write' } })) ??
          stateRepo.create({
            userId,
            currentStreak: 0,
            longestStreak: 0,
            lastCheckinDate: null,
            totalCheckins: 0,
            monthKey: null,
            monthlyCheckins: 0,
          });
        const profile = await profileRepo.findOne({
          where: { userId },
          lock: { mode: 'pessimistic_write' },
        });

        // Month rollover before reading monthly counters.
        if (state.monthKey !== monthNow) {
          state.monthKey = monthNow;
          state.monthlyCheckins = 0;
          // makeupUsedThisMonth reset is Phase-2 behaviour; not touched in Phase 1.
        }

        // Idempotent fast-path — no reward, no insert. Return the (already
        // today-stamped) state so the caller builds status-after-action from it.
        if (state.lastCheckinDate === today) {
          return { gems: 0, xp: 0, leveledUp: false, newLevel: profile?.level ?? 1, alreadyCheckedIn: true as const, state };
        }

        // Streak update (Phase 1: no freeze — any gap > 1 resets).
        if (state.lastCheckinDate == null) {
          state.currentStreak = 1;
        } else {
          const gap = daysBetweenDayKeys(state.lastCheckinDate, today);
          state.currentStreak = gap === 1 ? state.currentStreak + 1 : 1;
        }
        state.longestStreak = Math.max(state.longestStreak, state.currentStreak);
        state.lastCheckinDate = today;
        state.totalCheckins += 1;
        state.monthlyCheckins += 1;

        const gems = CHECKIN_BASE_GEMS + streakBonusGems(state.currentStreak);
        const xp = CHECKIN_BASE_XP;

        let leveledUp = false;
        let newLevel = profile?.level ?? 1;
        if (profile) {
          applyXpGain(profile, xp, now);
          profile.gems += gems;
          leveledUp = advanceLevel(profile);
          newLevel = profile.level;
          await profileRepo.save(profile);
        }
        await stateRepo.save(state);
        await dailyRepo.save(
          dailyRepo.create({ userId, dayKey: today, monthKey: monthNow, source: 'checkin' }),
        );
        return { gems, xp, leveledUp, newLevel, alreadyCheckedIn: false as const, state };
      })
      .catch((err) => {
        if (isUniqueViolation(err)) return null; // UNIQUE backstop → treat as already checked in
        throw err;
      });

    // 23505 backstop after full rollback: no in-memory state, so re-read.
    if (outcome === null) {
      const status = await this.getMe(userId, now);
      return this.result(status, 0, 0, false, true);
    }

    if (!outcome.alreadyCheckedIn) {
      await this.bumpCaches(userId);
      if (outcome.leveledUp) {
        this.gateway.publish(userId, {
          type: 'level:up',
          title: 'Level Up!',
          message: `You reached level ${outcome.newLevel}`,
          icon: 'trending_up',
          level: outcome.newLevel,
          at: new Date().toISOString(),
        });
      }
    }

    // Build status-after-action from the committed in-memory state object
    // (equals the persisted row), NOT a second DB read (see Global Constraints).
    const rows = await this.dailies.find({ where: { userId, monthKey: monthNow } });
    const status = this.toStatus(outcome.state, rows, today, monthNow);
    return this.result(status, outcome.gems, outcome.xp, outcome.leveledUp, outcome.alreadyCheckedIn);
  }

  private result(
    status: ICheckinStatus,
    gems: number,
    xp: number,
    leveledUp: boolean,
    alreadyCheckedIn: boolean,
  ): ICheckinResult {
    return {
      status,
      reward: { gems, xp },
      weeklyMilestone: false,
      allTimeMilestone: null,
      perfectMonth: false,
      badgesEarned: [],
      spinsGranted: 0,
      leveledUp,
      ...(alreadyCheckedIn ? { alreadyCheckedIn: true } : {}),
    };
  }

  private async bumpCaches(userId: string): Promise<void> {
    await this.cache.bumpTags([
      `student:${userId}:quests`,
      `student:${userId}:badges`,
      `student:${userId}:dashboard`,
      `student:${userId}:profile`,
      `student:${userId}:shop`,
      'leaderboard:global',
    ]);
  }
}
