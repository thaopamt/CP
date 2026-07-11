import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ICheckinBoardCell, ICheckinResult, ICheckinStatus, ICheckinWheelResult } from '@cp/shared';

import { CheckinState } from './checkin-state.entity';
import { DailyCheckin } from './daily-checkin.entity';
import { StudentProfile } from '../students/student-profile.entity';
import { GamificationGateway } from '../quests/gamification.gateway';
import { checkinDayKey, daysBetweenDayKeys, applyXpGain } from '../quests/period-keys';
import { advanceLevel } from '../../common/gamification.constants';
import { SystemCacheService } from '../../common/cache/system-cache.service';
import {
  CHECKIN_BASE_GEMS,
  CHECKIN_BASE_XP,
  streakBonusGems,
  CHECKIN_WEEKLY_PERIOD,
  CHECKIN_WEEKLY_GEMS,
  CHECKIN_WEEKLY_XP,
  CHECKIN_WEEKLY_SPINS,
  CHECKIN_WEEKLY_FREEZE,
  CHECKIN_FREEZE_CAP,
  CHECKIN_MAKEUP_COST_GEMS,
  CHECKIN_MAKEUP_MAX_PER_MONTH,
  CHECKIN_WHEEL_SEGMENTS,
} from './checkin.constants';

/** Number of calendar days in a 'YYYY-MM' month. */
function daysInMonth(monthKey: string): number {
  const [y, m] = monthKey.split('-').map(Number);
  return new Date(y, m, 0).getDate();
}

/**
 * Pure board builder for a month. The board is always the current month, so
 * every past empty in-month day is makeup-eligible → 'missable' ('missed' is
 * no longer emitted for the current-month board; Phase 2, spec §6b).
 * Precedence: checked > makeup > today > future > missable. Exported for
 * direct unit testing.
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
    const source = filled.get(dayKey);
    let status: ICheckinBoardCell['status'];
    if (source === 'checkin') status = 'checked';
    else if (source === 'makeup') status = 'makeup';
    else if (dayKey === today) status = 'today';
    else if (dayKey > today) status = 'future';
    else status = 'missable';
    cells.push({ dayKey, status });
  }
  return cells;
}

/** Weighted-random wheel segment. rand() in [0,1). Server-authoritative. */
export function pickWheelSegment(rand: () => number = Math.random) {
  const total = CHECKIN_WHEEL_SEGMENTS.reduce((s, seg) => s + seg.weight, 0);
  let r = rand() * total;
  for (const seg of CHECKIN_WHEEL_SEGMENTS) {
    r -= seg.weight;
    if (r < 0) return seg;
  }
  return CHECKIN_WHEEL_SEGMENTS[CHECKIN_WHEEL_SEGMENTS.length - 1];
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
      freezeTokens: state?.freezeTokens ?? 0,
      pendingWheelSpins: state?.pendingWheelSpins ?? 0,
      // Phase-2: real makeup quota remaining + cost (spec §6b). Read-only
      // on-the-fly month rollover for GET, consistent with the no-write policy.
      makeupRemaining: CHECKIN_MAKEUP_MAX_PER_MONTH - (sameMonth ? state!.makeupUsedThisMonth : 0),
      makeupCost: CHECKIN_MAKEUP_COST_GEMS,
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
          state.makeupUsedThisMonth = 0; // Phase-2: makeup quota also resets on rollover.
        }

        // Idempotent fast-path — no reward, no insert. Return the (already
        // today-stamped) state so the caller builds status-after-action from it.
        if (state.lastCheckinDate === today) {
          return {
            gems: 0,
            xp: 0,
            leveledUp: false,
            newLevel: profile?.level ?? 1,
            alreadyCheckedIn: true as const,
            weeklyMilestone: false,
            spinsGranted: 0,
            state,
          };
        }

        // Streak update (Phase 2: gaps bridged by freeze tokens auto-consume; spec §6a).
        if (state.lastCheckinDate == null) {
          state.currentStreak = 1;
        } else {
          const gap = daysBetweenDayKeys(state.lastCheckinDate, today);
          if (gap === 1) {
            state.currentStreak += 1;
          } else {
            const missed = gap - 1;
            if (state.freezeTokens >= missed) {
              state.freezeTokens -= missed; // auto-consume freeze (spec §6a)
              state.currentStreak += 1;
            } else {
              state.currentStreak = 1; // reset; tokens untouched
            }
          }
        }
        state.longestStreak = Math.max(state.longestStreak, state.currentStreak);
        state.lastCheckinDate = today;
        state.totalCheckins += 1;
        state.monthlyCheckins += 1;

        let gems = CHECKIN_BASE_GEMS + streakBonusGems(state.currentStreak);
        let xp = CHECKIN_BASE_XP;

        let weeklyMilestone = false;
        let spinsGranted = 0;
        if (state.currentStreak % CHECKIN_WEEKLY_PERIOD === 0) {
          weeklyMilestone = true;
          gems += CHECKIN_WEEKLY_GEMS;
          xp += CHECKIN_WEEKLY_XP;
          spinsGranted += CHECKIN_WEEKLY_SPINS;
          state.pendingWheelSpins += CHECKIN_WEEKLY_SPINS;
          state.freezeTokens = Math.min(CHECKIN_FREEZE_CAP, state.freezeTokens + CHECKIN_WEEKLY_FREEZE);
        }

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
        return { gems, xp, leveledUp, newLevel, alreadyCheckedIn: false as const, weeklyMilestone, spinsGranted, state };
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
    return this.result(
      status, outcome.gems, outcome.xp, outcome.leveledUp, outcome.alreadyCheckedIn,
      outcome.weeklyMilestone, outcome.spinsGranted,
    );
  }

  /**
   * Paid makeup: fills a past empty in-month day for gems. Not a check-in —
   * grants no gems/xp and does not touch streak/lastCheckinDate/totalCheckins.
   * Guarded atomically: quota cap CHECKIN_MAKEUP_MAX_PER_MONTH, cost
   * CHECKIN_MAKEUP_COST_GEMS (spec §6b).
   */
  async makeup(userId: string, date: string, now: Date = new Date()): Promise<ICheckinResult> {
    const today = checkinDayKey(now);
    const monthNow = today.slice(0, 7);

    if (!(date < today && date.slice(0, 7) === monthNow)) {
      throw new BadRequestException('date must be a past day in the current month');
    }

    const mutatedState = await this.ds.transaction(async (tx) => {
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
        state.makeupUsedThisMonth = 0;
      }

      const existing = await dailyRepo.findOne({ where: { userId, dayKey: date } });
      if (existing) {
        throw new ConflictException('day already filled');
      }

      if (state.makeupUsedThisMonth >= CHECKIN_MAKEUP_MAX_PER_MONTH) {
        throw new ConflictException('makeup quota exhausted');
      }

      if (!profile || profile.gems < CHECKIN_MAKEUP_COST_GEMS) {
        throw new BadRequestException('insufficient gems');
      }

      profile.gems -= CHECKIN_MAKEUP_COST_GEMS;
      await profileRepo.save(profile);

      state.makeupUsedThisMonth += 1;
      state.monthlyCheckins += 1;
      await stateRepo.save(state);

      await dailyRepo.save(
        dailyRepo.create({ userId, dayKey: date, monthKey: monthNow, source: 'makeup' }),
      );
      // perfect-month check added in Task 14

      return state;
    });

    await this.bumpCaches(userId);
    const rows = await this.dailies.find({ where: { userId, monthKey: monthNow } });
    const status = this.toStatus(mutatedState, rows, today, monthNow);
    return this.result(status, 0, 0, false, false);
  }

  /**
   * Server-authoritative lucky wheel spin. Atomically spends one
   * pendingWheelSpins (FOR UPDATE lock on checkin_states so concurrent spins
   * can't double-grant), picks a weighted segment, and grants the gems/xp
   * prize onto the profile — all inside one transaction (spec §5/§6c).
   */
  async spinWheel(
    userId: string,
    now: Date = new Date(),
    rand: () => number = Math.random,
  ): Promise<ICheckinWheelResult> {
    const today = checkinDayKey(now);
    const monthNow = today.slice(0, 7);

    const outcome = await this.ds.transaction(async (tx) => {
      const stateRepo = tx.getRepository(CheckinState);
      const profileRepo = tx.getRepository(StudentProfile);

      const state = await stateRepo.findOne({
        where: { userId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!state || state.pendingWheelSpins <= 0) {
        throw new ConflictException('NO_SPINS');
      }
      state.pendingWheelSpins -= 1;

      const seg = pickWheelSegment(rand);

      const profile = await profileRepo.findOne({
        where: { userId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!profile) {
        throw new ConflictException('NO_PROFILE');
      }

      let leveledUp = false;
      let newLevel = profile.level;
      if (seg.kind === 'gems') {
        profile.gems += seg.amount;
      } else if (seg.kind === 'xp') {
        applyXpGain(profile, seg.amount, now);
        leveledUp = advanceLevel(profile);
        newLevel = profile.level;
      }
      await profileRepo.save(profile);
      await stateRepo.save(state);

      return {
        segmentIndex: seg.index,
        prize: { kind: seg.kind, amount: seg.amount },
        state,
        leveledUp,
        newLevel,
      };
    });

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

    const rows = await this.dailies.find({ where: { userId, monthKey: monthNow } });
    const status = this.toStatus(outcome.state, rows, today, monthNow);
    return { segmentIndex: outcome.segmentIndex, prize: outcome.prize, status };
  }

  private result(
    status: ICheckinStatus,
    gems: number,
    xp: number,
    leveledUp: boolean,
    alreadyCheckedIn: boolean,
    weeklyMilestone = false,
    spinsGranted = 0,
    allTimeMilestone: number | null = null,
    perfectMonth = false,
    badgesEarned: string[] = [],
  ): ICheckinResult {
    return {
      status,
      reward: { gems, xp },
      weeklyMilestone,
      allTimeMilestone,
      perfectMonth,
      badgesEarned,
      spinsGranted,
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
