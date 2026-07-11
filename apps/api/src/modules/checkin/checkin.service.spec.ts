import { CheckinState } from './checkin-state.entity';
import { DailyCheckin } from './daily-checkin.entity';
import { StudentProfile } from '../students/student-profile.entity';
import { CheckinService } from './checkin.service';

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

  const service = new CheckinService(
    stateRepo as never,
    dailyRepo as never,
    profileRepo as never,
    ds as never,
    cache as never,
    gateway as never,
  );
  return { service, tx, cache, gateway, stateRepo, dailyRepo, profileRepo };
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
  });

  it('gap > 1 (missed days): streak resets to 1 (no freeze in Phase 1)', async () => {
    const ctx = makeService({
      state: { userId: 'u1', currentStreak: 6, longestStreak: 6, lastCheckinDate: '2026-07-08', totalCheckins: 6, monthKey: '2026-07', monthlyCheckins: 6, freezeTokens: 3 },
      profile: { userId: 'u1', gems: 0, xp: 0, level: 1, weekKey: null, monthKey: null, weeklyXp: 0, monthlyXp: 0 },
    });
    const res = await ctx.service.checkIn('u1', NOW);
    expect(res.status.currentStreak).toBe(1);
    expect(res.reward).toEqual({ gems: 5, xp: 20 });
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
});

describe('CheckinService.getMe board', () => {
  it('builds a full-month board: checked past + today + future + missed', async () => {
    const ctx = makeService({
      state: { userId: 'u1', currentStreak: 1, longestStreak: 1, lastCheckinDate: '2026-07-11', totalCheckins: 1, monthKey: '2026-07', monthlyCheckins: 1 },
      dailyRows: [{ dayKey: '2026-07-09', source: 'checkin' }, { dayKey: '2026-07-11', source: 'checkin' }],
    });
    const status = await ctx.service.getMe('u1', NOW);
    expect(status.board).toHaveLength(31); // July has 31 days
    const cell = (d: string) => status.board.find((c) => c.dayKey === d)!;
    expect(cell('2026-07-09').status).toBe('checked');
    expect(cell('2026-07-10').status).toBe('missed'); // past, no row
    expect(cell('2026-07-11').status).toBe('checked'); // today but checked wins
    expect(cell('2026-07-12').status).toBe('future');
    expect(status.checkedInToday).toBe(true);
    // Phase-1 enrichment fields are literal zeros:
    expect(status.freezeTokens).toBe(0);
    expect(status.pendingWheelSpins).toBe(0);
    expect(status.makeupRemaining).toBe(0);
    expect(status.makeupCost).toBe(0);
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
