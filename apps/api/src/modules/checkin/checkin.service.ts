import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import {
  ICheckinBoardCell,
  ICheckinLeaderboardRow,
  ICheckinResult,
  ICheckinStatus,
  ICheckinWheelResult,
} from '@cp/shared';

import { CheckinState } from './checkin-state.entity';
import { DailyCheckin } from './daily-checkin.entity';
import { StudentProfile } from '../students/student-profile.entity';
import { User } from '../users/user.entity';
import { GamificationGateway } from '../quests/gamification.gateway';
import { BadgesService } from '../quests/badges.service';
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
  CHECKIN_ALLTIME_MILESTONES,
  CHECKIN_MILESTONE_SHOP_ITEM_AT,
  CHECKIN_MILESTONE_ITEM_FALLBACK_GEMS,
  CHECKIN_BADGE_CODES,
  CHECKIN_LEADERBOARD_DEFAULT_LIMIT,
  CHECKIN_PERFECT_MONTH_GEMS,
  CHECKIN_PERFECT_MONTH_XP,
  CHECKIN_PERFECT_MONTH_SPINS,
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

/**
 * Map raw leaderboard rows (already ordered by the query) to ICheckinLeaderboardRow,
 * composing displayName and assigning 1-based rank. Pure — unit-tested directly.
 */
export function toCheckinLeaderboard(
  rows: {
    userId: string;
    firstName: string | null;
    lastName: string | null;
    avatarUrl: string | null;
    currentStreak: number;
    longestStreak: number;
    totalCheckins: number;
  }[],
): ICheckinLeaderboardRow[] {
  return rows.map((r, i) => ({
    userId: r.userId,
    displayName: `${r.firstName ?? ''} ${r.lastName ?? ''}`.trim(),
    avatarUrl: r.avatarUrl ?? null,
    currentStreak: r.currentStreak,
    longestStreak: r.longestStreak,
    totalCheckins: r.totalCheckins,
    rank: i + 1,
  }));
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
    private readonly badges: BadgesService,
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

  /**
   * Attendance leaderboard: ranks students by currentStreak then totalCheckins.
   * checkin_states has no ManyToOne to User, so join manually (mirrors
   * leaderboard.service.ts's QueryBuilder pattern). limit clamped to [1,100].
   */
  async getLeaderboard(limit = CHECKIN_LEADERBOARD_DEFAULT_LIMIT): Promise<ICheckinLeaderboardRow[]> {
    const safeLimit = Math.min(Math.max(1, Math.trunc(limit) || CHECKIN_LEADERBOARD_DEFAULT_LIMIT), 100);
    const rows = await this.states
      .createQueryBuilder('s')
      .leftJoin(User, 'u', 'u.id = s.userId')
      .select('s.userId', 'userId')
      .addSelect('s.currentStreak', 'currentStreak')
      .addSelect('s.longestStreak', 'longestStreak')
      .addSelect('s.totalCheckins', 'totalCheckins')
      .addSelect('u.firstName', 'firstName')
      .addSelect('u.lastName', 'lastName')
      .addSelect('u.avatarUrl', 'avatarUrl')
      .where('s.totalCheckins > 0')
      .orderBy('s.currentStreak', 'DESC')
      .addOrderBy('s.totalCheckins', 'DESC')
      .limit(safeLimit)
      .getRawMany();
    return toCheckinLeaderboard(rows);
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
            allTimeMilestone: null as number | null,
            milestoneCodes: [] as string[],
            perfectMonth: false,
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

        // All-time streak milestones (7/30/100) — once-ever, gated by
        // state.highestMilestoneAwarded so a streak reset + rebuild does NOT
        // re-grant the spin/badge/gems (anti-farm; spec §4.4/§5).
        const milestoneCodes: string[] = [];
        let allTimeMilestone: number | null = null;
        for (const M of CHECKIN_ALLTIME_MILESTONES) {
          if (state.currentStreak >= M && state.highestMilestoneAwarded < M) {
            state.highestMilestoneAwarded = M; // once-ever gate (anti-farm)
            allTimeMilestone = M;
            spinsGranted += 1;
            state.pendingWheelSpins += 1;
            const code =
              M === 7 ? CHECKIN_BADGE_CODES.STREAK_7 :
              M === 30 ? CHECKIN_BADGE_CODES.STREAK_30 : CHECKIN_BADGE_CODES.STREAK_100;
            milestoneCodes.push(code);
            if ((CHECKIN_MILESTONE_SHOP_ITEM_AT as readonly number[]).includes(M)) {
              gems += CHECKIN_MILESTONE_ITEM_FALLBACK_GEMS;
            }
          }
        }

        // Daily insert must land before the perfect-month COUNT below so the
        // new row is included (a month reaches "perfect" only on the fill
        // that completes it).
        await dailyRepo.save(
          dailyRepo.create({ userId, dayKey: today, monthKey: monthNow, source: 'checkin' }),
        );

        // Perfect-month (Task 14): real COUNT of persisted daily rows for the
        // month, authoritative over the denormalized monthlyCheckins. The
        // monetary reward is repeatable (folded into the running gems/xp/
        // spinsGranted below); the badge is once-ever via the post-commit
        // awardByCode loop over milestoneCodes.
        const filledDays = await dailyRepo.count({ where: { userId, monthKey: monthNow } });
        const perfectMonth = filledDays === daysInMonth(monthNow);
        if (perfectMonth) {
          gems += CHECKIN_PERFECT_MONTH_GEMS;
          xp += CHECKIN_PERFECT_MONTH_XP;
          spinsGranted += CHECKIN_PERFECT_MONTH_SPINS;
          state.pendingWheelSpins += CHECKIN_PERFECT_MONTH_SPINS;
          milestoneCodes.push(CHECKIN_BADGE_CODES.PERFECT_MONTH);
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
        return {
          gems, xp, leveledUp, newLevel, alreadyCheckedIn: false as const, weeklyMilestone, spinsGranted,
          allTimeMilestone, milestoneCodes, perfectMonth, state,
        };
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

    // Post-commit badge awards for any all-time milestones just crossed
    // (checkin-streak-7/30/100 — never auto-fire via evaluateAndAward).
    const badgesEarned: string[] = [];
    if (!outcome.alreadyCheckedIn) {
      for (const code of outcome.milestoneCodes) {
        const b = await this.badges.awardByCode(userId, code, now);
        if (b) badgesEarned.push(b.code);
      }
    }

    // Build status-after-action from the committed in-memory state object
    // (equals the persisted row), NOT a second DB read (see Global Constraints).
    const rows = await this.dailies.find({ where: { userId, monthKey: monthNow } });
    const status = this.toStatus(outcome.state, rows, today, monthNow);
    return this.result(
      status, outcome.gems, outcome.xp, outcome.leveledUp, outcome.alreadyCheckedIn,
      outcome.weeklyMilestone, outcome.spinsGranted, outcome.allTimeMilestone, outcome.perfectMonth, badgesEarned,
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

    const outcome = await this.ds.transaction(async (tx) => {
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

      state.makeupUsedThisMonth += 1;
      state.monthlyCheckins += 1;

      // Daily insert must land before the perfect-month COUNT below so the
      // new row is included.
      await dailyRepo.save(
        dailyRepo.create({ userId, dayKey: date, monthKey: monthNow, source: 'makeup' }),
      );

      // Perfect-month (Task 14): real COUNT of persisted daily rows, same
      // rule as checkIn. Fold the (repeatable) monetary reward into the same
      // profile object as the makeup cost deduction below — exactly one
      // profile save. The badge (once-ever) is awarded post-commit.
      const filledDays = await dailyRepo.count({ where: { userId, monthKey: monthNow } });
      const perfectMonth = filledDays === daysInMonth(monthNow);
      let leveledUp = false;
      if (perfectMonth) {
        profile.gems += CHECKIN_PERFECT_MONTH_GEMS;
        applyXpGain(profile, CHECKIN_PERFECT_MONTH_XP, now);
        leveledUp = advanceLevel(profile);
        state.pendingWheelSpins += CHECKIN_PERFECT_MONTH_SPINS;
      }

      await profileRepo.save(profile);
      await stateRepo.save(state);

      return { state, perfectMonth, leveledUp };
    });

    await this.bumpCaches(userId);

    // Post-commit badge award for the once-ever perfect-month badge (the
    // monetary reward above is NOT gated on this — money repeats, badge doesn't).
    const badgesEarned: string[] = [];
    if (outcome.perfectMonth) {
      const b = await this.badges.awardByCode(userId, CHECKIN_BADGE_CODES.PERFECT_MONTH, now);
      if (b) badgesEarned.push(b.code);
    }

    const rows = await this.dailies.find({ where: { userId, monthKey: monthNow } });
    const status = this.toStatus(outcome.state, rows, today, monthNow);
    return outcome.perfectMonth
      ? this.result(
          status, CHECKIN_PERFECT_MONTH_GEMS, CHECKIN_PERFECT_MONTH_XP, outcome.leveledUp, false,
          false, CHECKIN_PERFECT_MONTH_SPINS, null, true, badgesEarned,
        )
      : this.result(status, 0, 0, false, false);
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
