import { BadRequestException, ConflictException } from '@nestjs/common';
import { CheckinState } from './checkin-state.entity';
import { DailyCheckin } from './daily-checkin.entity';
import { StudentProfile } from '../students/student-profile.entity';
import { CheckinService, buildCheckinBoard, pickWheelSegment } from './checkin.service';

function makeService(
  seed: {
    state?: Partial<CheckinState>;
    profile?: Partial<StudentProfile> | null;
    dailyRows?: { dayKey: string; source: string }[];
  } = {},
) {
  const stateRow = seed.state ?? null;
  const stateRepo = {
    findOne: jest.fn().mockResolvedValue(stateRow),
    save: jest.fn(async (x: unknown) => x),
    create: jest.fn((x: unknown) => x),
  };
  const dailyRepo = {
    findOne: jest.fn().mockResolvedValue(null),
    save: jest.fn(async (x: unknown) => x),
    create: jest.fn((x: unknown) => x),
    find: jest.fn().mockResolvedValue(seed.dailyRows ?? []),
  };
  const profileRepo = {
    findOne: jest.fn().mockResolvedValue(
      seed.profile === null ? null : seed.profile ?? { userId: 'u1', gems: 0, xp: 0, level: 1, weekKey: null, monthKey: null, weeklyXp: 0, monthlyXp: 0 },
    ),
    save: jest.fn(async (x: unknown) => x),
  };

  const repos = new Map<unknown, unknown>([
    [CheckinState, stateRepo],
    [DailyCheckin, dailyRepo],
    [StudentProfile, profileRepo],
  ]);
  const tx = { getRepository: jest.fn((e: unknown) => repos.get(e)) };
  const ds = { transaction: jest.fn((fn: (t: unknown) => unknown) => fn(tx)) };
  const cache = { bumpTags: jest.fn().mockResolvedValue(undefined) };
  const gateway = { publish: jest.fn() };
  const badges = { awardByCode: jest.fn().mockResolvedValue(null) };

  const service = new CheckinService(
    stateRepo as never,
    dailyRepo as never,
    profileRepo as never,
    ds as never,
    cache as never,
    gateway as never,
    badges as never,
  );
  return { service, tx, cache, gateway, badges, stateRepo, dailyRepo, profileRepo };
}

const NOW = new Date('2026-07-11T03:00:00Z'); // 2026-07-11 10:00 VN → dayKey 2026-07-11

describe('CheckinService.checkIn', () => {
  it('first-ever check-in: streak=1, grants base gems/xp, no bonus', async () => {
    const ctx = makeService({ profile: { userId: 'u1', gems: 0, xp: 0, level: 1, weekKey: null, monthKey: null, weeklyXp: 0, monthlyXp: 0 } });
    const res = await ctx.service.checkIn('u1', NOW);

    expect(res.alreadyCheckedIn).toBeUndefined();
    expect(res.reward).toEqual({ gems: 5, xp: 20 });
    expect(res.status.currentStreak).toBe(1);
    expect(res.status.checkedInToday).toBe(true);
    expect(ctx.dailyRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'u1', dayKey: '2026-07-11', monthKey: '2026-07', source: 'checkin' }),
    );
    expect(ctx.cache.bumpTags).toHaveBeenCalled();
    expect(ctx.gateway.publish).not.toHaveBeenCalled();
  });

  it('consecutive day (gap === 1): streak increments and bonus applies', async () => {
    const ctx = makeService({
      state: { userId: 'u1', currentStreak: 3, longestStreak: 3, lastCheckinDate: '2026-07-10', totalCheckins: 3, monthKey: '2026-07', monthlyCheckins: 3 },
      profile: { userId: 'u1', gems: 0, xp: 0, level: 1, weekKey: null, monthKey: null, weeklyXp: 0, monthlyXp: 0 },
    });
    const res = await ctx.service.checkIn('u1', NOW);
    // new streak = 4 → bonus = (4-1)*2 = 6 → gems = 5 + 6 = 11
    expect(res.status.currentStreak).toBe(4);
    expect(res.reward).toEqual({ gems: 11, xp: 20 });
    expect(res.status.longestStreak).toBe(4);
  });

  it('gap > 1 (missed days) with no freeze tokens available: streak resets to 1', async () => {
    const ctx = makeService({
      state: { userId: 'u1', currentStreak: 6, longestStreak: 6, lastCheckinDate: '2026-07-08', totalCheckins: 6, monthKey: '2026-07', monthlyCheckins: 6, freezeTokens: 0 },
      profile: { userId: 'u1', gems: 0, xp: 0, level: 1, weekKey: null, monthKey: null, weeklyXp: 0, monthlyXp: 0 },
    });
    const res = await ctx.service.checkIn('u1', NOW);
    expect(res.status.currentStreak).toBe(1);
    expect(res.reward).toEqual({ gems: 5, xp: 20 });
    expect(res.status.longestStreak).toBe(6); // Math.max keeps the prior max
  });

  it('idempotent double check-in: same day → alreadyCheckedIn, reward {0,0}, no daily insert', async () => {
    const ctx = makeService({
      state: { userId: 'u1', currentStreak: 2, longestStreak: 2, lastCheckinDate: '2026-07-11', totalCheckins: 2, monthKey: '2026-07', monthlyCheckins: 2 },
      profile: { userId: 'u1', gems: 100, xp: 0, level: 1, weekKey: null, monthKey: null, weeklyXp: 0, monthlyXp: 0 },
    });
    const res = await ctx.service.checkIn('u1', NOW);
    expect(res.alreadyCheckedIn).toBe(true);
    expect(res.reward).toEqual({ gems: 0, xp: 0 });
    expect(res.status.currentStreak).toBe(2);
    expect(res.status.checkedInToday).toBe(true);
    expect(ctx.dailyRepo.save).not.toHaveBeenCalled();
    expect(ctx.profileRepo.save).not.toHaveBeenCalled();
  });

  it('month rollover: old monthKey resets monthlyCheckins before counting', async () => {
    const ctx = makeService({
      state: { userId: 'u1', currentStreak: 1, longestStreak: 5, lastCheckinDate: '2026-06-30', totalCheckins: 20, monthKey: '2026-06', monthlyCheckins: 18, makeupUsedThisMonth: 2 },
      profile: { userId: 'u1', gems: 0, xp: 0, level: 1, weekKey: null, monthKey: null, weeklyXp: 0, monthlyXp: 0 },
    });
    const res = await ctx.service.checkIn('u1', NOW);
    // gap from 2026-06-30 to 2026-07-11 > 1 → streak resets to 1; monthly reset then +1
    expect(res.status.monthKey).toBe('2026-07');
    expect(res.status.monthlyCheckins).toBe(1);
    expect(res.status.currentStreak).toBe(1);
    // makeupUsedThisMonth (2 from last month) must also reset on rollover.
    expect(res.status.makeupRemaining).toBe(2);
  });

  it('publishes a level:up event when the check-in crosses a level', async () => {
    const ctx = makeService({
      profile: { userId: 'u1', gems: 0, xp: 19990, level: 1, weekKey: null, monthKey: null, weeklyXp: 0, monthlyXp: 0 },
    });
    const res = await ctx.service.checkIn('u1', NOW);
    // level 1 → 2 threshold = (1+1)*10000 = 20000; 19990 + 20 = 20010 ≥ 20000 → level up
    expect(res.leveledUp).toBe(true);
    expect(ctx.gateway.publish).toHaveBeenCalledWith('u1', expect.objectContaining({ type: 'level:up', level: 2 }));
  });

  it('23505 unique-violation backstop: transaction rolls back, re-read reports alreadyCheckedIn with zero reward', async () => {
    const ctx = makeService({
      state: { userId: 'u1', currentStreak: 3, longestStreak: 3, lastCheckinDate: '2026-07-10', totalCheckins: 3, monthKey: '2026-07', monthlyCheckins: 3 },
      profile: { userId: 'u1', gems: 0, xp: 0, level: 1, weekKey: null, monthKey: null, weeklyXp: 0, monthlyXp: 0 },
    });
    // Simulate a concurrent request winning the race: the daily-checkin insert
    // hits the unique (userId, dayKey) constraint after state/profile were
    // already mutated in-memory for this attempt.
    ctx.dailyRepo.save.mockRejectedValueOnce({ code: '23505' });

    const res = await ctx.service.checkIn('u1', NOW);

    expect(res.alreadyCheckedIn).toBe(true);
    expect(res.reward).toEqual({ gems: 0, xp: 0 });
  });
});

describe('CheckinService.getMe board', () => {
  it('builds a full-month board: checked past + today + future + missable', async () => {
    const ctx = makeService({
      state: { userId: 'u1', currentStreak: 1, longestStreak: 1, lastCheckinDate: '2026-07-11', totalCheckins: 1, monthKey: '2026-07', monthlyCheckins: 1, makeupUsedThisMonth: 0 },
      dailyRows: [{ dayKey: '2026-07-09', source: 'checkin' }, { dayKey: '2026-07-11', source: 'checkin' }],
    });
    const status = await ctx.service.getMe('u1', NOW);
    expect(status.board).toHaveLength(31); // July has 31 days
    const cell = (d: string) => status.board.find((c) => c.dayKey === d)!;
    expect(cell('2026-07-09').status).toBe('checked');
    expect(cell('2026-07-10').status).toBe('missable'); // past, no row — makeup-eligible (Phase 2)
    expect(cell('2026-07-11').status).toBe('checked'); // today but checked wins
    expect(cell('2026-07-12').status).toBe('future');
    expect(status.checkedInToday).toBe(true);
    // Phase-1 enrichment fields are literal zeros:
    expect(status.freezeTokens).toBe(0);
    expect(status.pendingWheelSpins).toBe(0);
    // Phase-2: real makeup quota/cost (spec §6b):
    expect(status.makeupRemaining).toBe(2);
    expect(status.makeupCost).toBe(20);
  });

  it("marks the current day 'today' when not yet checked in", async () => {
    const ctx = makeService({ state: null as never, dailyRows: [] });
    const status = await ctx.service.getMe('u1', NOW);
    const today = status.board.find((c) => c.dayKey === '2026-07-11')!;
    expect(today.status).toBe('today');
    expect(status.checkedInToday).toBe(false);
    expect(status.currentStreak).toBe(0);
  });
});

describe('CheckinService.checkIn — Phase 2 weekly milestone + freeze (Task 9)', () => {
  const NOW_711 = new Date('2026-07-11T03:00:00Z'); // VN 10:00 2026-07-11
  const NOW_704 = new Date('2026-07-04T03:00:00Z'); // VN 10:00 2026-07-04
  const baseProfile = { userId: 'u1', gems: 0, xp: 0, level: 1, weekKey: null, monthKey: null, weeklyXp: 0, monthlyXp: 0 };

  it('grants the weekly milestone when the streak reaches a multiple of 7', async () => {
    const ctx = makeService({
      state: { userId: 'u1', currentStreak: 6, longestStreak: 6, lastCheckinDate: '2026-07-10', totalCheckins: 6, monthKey: '2026-07', monthlyCheckins: 6, freezeTokens: 0, pendingWheelSpins: 0 },
      profile: { ...baseProfile },
    });
    const res = await ctx.service.checkIn('u1', NOW_711);
    expect(res.status.currentStreak).toBe(7);
    expect(res.weeklyMilestone).toBe(true);
    expect(res.spinsGranted).toBe(1);
    expect(res.status.freezeTokens).toBe(1);        // 0 + 1 weekly, cap 3
    expect(res.status.pendingWheelSpins).toBe(1);
    expect(res.reward.gems).toBe(5 + 12 + 30);       // base 5 + bonus min(20,(7-1)*2)=12 + weekly 30
    expect(res.reward.xp).toBe(20 + 100);            // base 20 + weekly 100
  });

  it('bridges a gap with freeze tokens then earns one back on the weekly (worked example §4.2)', async () => {
    const ctx = makeService({
      state: { userId: 'u1', currentStreak: 6, longestStreak: 6, lastCheckinDate: '2026-07-01', totalCheckins: 6, monthKey: '2026-07', monthlyCheckins: 6, freezeTokens: 2, pendingWheelSpins: 0 },
      profile: { ...baseProfile },
    });
    const res = await ctx.service.checkIn('u1', NOW_704); // gap 3 → missed 2
    expect(res.status.currentStreak).toBe(7);        // 6 + 1 (bridged)
    expect(res.weeklyMilestone).toBe(true);
    expect(res.status.freezeTokens).toBe(1);         // 2 - 2 = 0, then + 1 weekly
  });

  it('resets the streak to 1 when freeze tokens are insufficient (tokens untouched)', async () => {
    const ctx = makeService({
      state: { userId: 'u1', currentStreak: 6, longestStreak: 6, lastCheckinDate: '2026-07-01', totalCheckins: 6, monthKey: '2026-07', monthlyCheckins: 6, freezeTokens: 1, pendingWheelSpins: 0 },
      profile: { ...baseProfile },
    });
    const res = await ctx.service.checkIn('u1', NOW_704); // gap 3 → missed 2 > 1 token
    expect(res.status.currentStreak).toBe(1);
    expect(res.status.freezeTokens).toBe(1);         // untouched on reset
    expect(res.weeklyMilestone).toBe(false);
  });
});

describe('CheckinService.makeup (Task 10)', () => {
  const NOW_711 = new Date('2026-07-11T03:00:00Z'); // VN 10:00 2026-07-11
  const baseState = {
    userId: 'u1',
    monthKey: '2026-07',
    monthlyCheckins: 5,
    makeupUsedThisMonth: 0,
    currentStreak: 3,
    longestStreak: 3,
    lastCheckinDate: '2026-07-09',
    totalCheckins: 5,
  };
  const baseProfile = { userId: 'u1', gems: 50, xp: 0, level: 1, weekKey: null, monthKey: null, weeklyXp: 0, monthlyXp: 0 };

  it('valid makeup: fills a past empty day, deducts gems, no gems/xp/streak change', async () => {
    const ctx = makeService({ state: { ...baseState }, profile: { ...baseProfile } });
    const res = await ctx.service.makeup('u1', '2026-07-05', NOW_711);

    expect(ctx.profileRepo.save).toHaveBeenCalledWith(expect.objectContaining({ gems: 30 }));
    expect(ctx.dailyRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'u1', dayKey: '2026-07-05', monthKey: '2026-07', source: 'makeup' }),
    );
    expect(res.reward).toEqual({ gems: 0, xp: 0 });
    expect(res.status.currentStreak).toBe(3); // unchanged
    expect(res.status.makeupRemaining).toBe(1); // cap 2 - 1 used
    expect(ctx.cache.bumpTags).toHaveBeenCalled();
  });

  it('rejects a future date', async () => {
    const ctx = makeService({ state: { ...baseState }, profile: { ...baseProfile } });
    await expect(ctx.service.makeup('u1', '2026-07-20', NOW_711)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects date === today', async () => {
    const ctx = makeService({ state: { ...baseState }, profile: { ...baseProfile } });
    await expect(ctx.service.makeup('u1', '2026-07-11', NOW_711)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects a date in a different month', async () => {
    const ctx = makeService({ state: { ...baseState }, profile: { ...baseProfile } });
    await expect(ctx.service.makeup('u1', '2026-06-30', NOW_711)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects when the day is already filled', async () => {
    const ctx = makeService({ state: { ...baseState }, profile: { ...baseProfile } });
    ctx.dailyRepo.findOne.mockResolvedValue({ dayKey: '2026-07-05', source: 'checkin' });
    await expect(ctx.service.makeup('u1', '2026-07-05', NOW_711)).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects when the monthly makeup quota is exhausted; no gem deduction', async () => {
    const ctx = makeService({ state: { ...baseState, makeupUsedThisMonth: 2 }, profile: { ...baseProfile } });
    await expect(ctx.service.makeup('u1', '2026-07-05', NOW_711)).rejects.toBeInstanceOf(ConflictException);
    expect(ctx.profileRepo.save).not.toHaveBeenCalled();
  });

  it('rejects when the student has insufficient gems', async () => {
    const ctx = makeService({ state: { ...baseState }, profile: { ...baseProfile, gems: 10 } });
    await expect(ctx.service.makeup('u1', '2026-07-05', NOW_711)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('board status: makeup/checked/missable/today/future precedence', () => {
    const cells = buildCheckinBoard('2026-07', '2026-07-11', [
      { dayKey: '2026-07-05', source: 'makeup' },
      { dayKey: '2026-07-09', source: 'checkin' },
    ]);
    const cell = (d: string) => cells.find((c) => c.dayKey === d)!;
    expect(cell('2026-07-05').status).toBe('makeup');
    expect(cell('2026-07-09').status).toBe('checked');
    expect(cell('2026-07-10').status).toBe('missable');
    expect(cell('2026-07-11').status).toBe('today');
    expect(cell('2026-07-12').status).toBe('future');
  });
});

describe('pickWheelSegment (Task 11)', () => {
  it('is deterministic under an injected rand and honors weights', () => {
    // total weight 100. r = rand()*100.
    expect(pickWheelSegment(() => 0).index).toBe(0);        // r=0 → first bucket (weight 30)
    expect(pickWheelSegment(() => 0.5).index).toBe(1);      // r=50 → 50-30=20, 20-25<0 → seg 1
    expect(pickWheelSegment(() => 0.999).index).toBe(5);    // r≈99.9 → last bucket (weight 5)
  });
});

describe('CheckinService.spinWheel (Task 11)', () => {
  const NOW = new Date('2026-07-11T03:00:00Z');
  const baseProfile = { userId: 'u1', gems: 0, xp: 0, level: 1, weekKey: null, monthKey: null, weeklyXp: 0, monthlyXp: 0 };

  it('spends a spin and grants an xp segment', async () => {
    const ctx = makeService({
      state: { userId: 'u1', monthKey: '2026-07', pendingWheelSpins: 2 },
      profile: { ...baseProfile },
    });
    const res = await ctx.service.spinWheel('u1', NOW, () => 0.5); // → seg 1 (xp 50)
    expect(res.segmentIndex).toBe(1);
    expect(res.prize).toEqual({ kind: 'xp', amount: 50 });
    expect(res.status.pendingWheelSpins).toBe(1);
    expect(ctx.profileRepo.save).toHaveBeenCalled();
    expect(ctx.cache.bumpTags).toHaveBeenCalled();
  });

  it('grants a gems segment onto the profile', async () => {
    const ctx = makeService({
      state: { userId: 'u1', monthKey: '2026-07', pendingWheelSpins: 1 },
      profile: { ...baseProfile, gems: 100 },
    });
    const res = await ctx.service.spinWheel('u1', NOW, () => 0); // → seg 0 (gems 10)
    expect(res.segmentIndex).toBe(0);
    expect(res.prize).toEqual({ kind: 'gems', amount: 10 });
    expect(ctx.profileRepo.save).toHaveBeenCalledWith(expect.objectContaining({ gems: 110 }));
    expect(res.status.pendingWheelSpins).toBe(0);
  });

  it('rejects when there are no spins', async () => {
    const ctx = makeService({ state: { userId: 'u1', monthKey: '2026-07', pendingWheelSpins: 0 }, profile: { ...baseProfile } });
    await expect(ctx.service.spinWheel('u1', NOW, () => 0.5)).rejects.toThrow();
    expect(ctx.profileRepo.save).not.toHaveBeenCalled();
  });
});

describe('CheckinService.checkIn — all-time milestone (Task 12)', () => {
  const NOW_711 = new Date('2026-07-11T03:00:00Z');
  const baseProfile = { userId: 'u1', gems: 0, xp: 0, level: 1, weekKey: null, monthKey: null, weeklyXp: 0, monthlyXp: 0 };

  it('awards the 7-day all-time milestone the first time streak reaches 7', async () => {
    const ctx = makeService({
      state: { userId: 'u1', currentStreak: 6, longestStreak: 6, lastCheckinDate: '2026-07-10', totalCheckins: 6, monthKey: '2026-07', monthlyCheckins: 6, highestMilestoneAwarded: 0, pendingWheelSpins: 0 },
      profile: { ...baseProfile },
    });
    const res = await ctx.service.checkIn('u1', NOW_711);
    expect(res.allTimeMilestone).toBe(7);
    expect(ctx.badges.awardByCode).toHaveBeenCalledWith('u1', 'checkin-streak-7', expect.any(Date));
    // day-7 stacks weekly + all-time-7 → 2 spins
    expect(res.spinsGranted).toBe(2);
    expect(res.status.pendingWheelSpins).toBe(2);
  });

  it('does NOT re-award the 7 milestone after a reset+rebuild (highestMilestoneAwarded gate)', async () => {
    const ctx = makeService({
      state: { userId: 'u1', currentStreak: 6, longestStreak: 30, lastCheckinDate: '2026-07-10', totalCheckins: 40, monthKey: '2026-07', monthlyCheckins: 6, highestMilestoneAwarded: 7, pendingWheelSpins: 0 },
      profile: { ...baseProfile },
    });
    const res = await ctx.service.checkIn('u1', NOW_711); // streak → 7 again
    expect(res.allTimeMilestone).toBeNull();
    // weekly still fires (streak 7) but all-time-7 does not → only the weekly spin
    expect(res.spinsGranted).toBe(1);
    expect(ctx.badges.awardByCode).not.toHaveBeenCalled();
  });

  it('grants the gems-fallback bundle and awards checkin-streak-30 at the 30-day milestone', async () => {
    const ctx = makeService({
      state: { userId: 'u1', currentStreak: 29, longestStreak: 29, lastCheckinDate: '2026-07-10', totalCheckins: 29, monthKey: '2026-07', monthlyCheckins: 29, highestMilestoneAwarded: 7, pendingWheelSpins: 0 },
      profile: { ...baseProfile },
    });
    const res = await ctx.service.checkIn('u1', NOW_711);
    expect(res.status.currentStreak).toBe(30);
    expect(res.allTimeMilestone).toBe(30);
    expect(ctx.badges.awardByCode).toHaveBeenCalledWith('u1', 'checkin-streak-30', expect.any(Date));
    // base 5 + streak bonus cap 20 + gems-fallback 100 (no weekly milestone at streak 30)
    expect(res.reward.gems).toBe(5 + 20 + 100);
    // highestMilestoneAwarded is internal (not on ICheckinStatus) — assert via the persisted state row.
    expect(ctx.stateRepo.save).toHaveBeenCalledWith(expect.objectContaining({ highestMilestoneAwarded: 30 }));
  });

  it('threads the awarded badge code into badgesEarned when awardByCode returns a badge', async () => {
    const ctx = makeService({
      state: { userId: 'u1', currentStreak: 6, longestStreak: 6, lastCheckinDate: '2026-07-10', totalCheckins: 6, monthKey: '2026-07', monthlyCheckins: 6, highestMilestoneAwarded: 0, pendingWheelSpins: 0 },
      profile: { ...baseProfile },
    });
    ctx.badges.awardByCode.mockResolvedValueOnce({ code: 'checkin-streak-7' });
    const res = await ctx.service.checkIn('u1', NOW_711);
    expect(res.badgesEarned).toEqual(['checkin-streak-7']);
  });

  it('does not run the badge-award loop on the idempotent (alreadyCheckedIn) fast path', async () => {
    const ctx = makeService({
      state: { userId: 'u1', currentStreak: 6, longestStreak: 6, lastCheckinDate: '2026-07-11', totalCheckins: 6, monthKey: '2026-07', monthlyCheckins: 6, highestMilestoneAwarded: 0, pendingWheelSpins: 0 },
      profile: { ...baseProfile },
    });
    const res = await ctx.service.checkIn('u1', NOW_711);
    expect(res.alreadyCheckedIn).toBe(true);
    expect(res.allTimeMilestone).toBeNull();
    expect(res.badgesEarned).toEqual([]);
    expect(ctx.badges.awardByCode).not.toHaveBeenCalled();
  });
});
