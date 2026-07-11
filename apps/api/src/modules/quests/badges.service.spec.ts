import { BadgeRarity, BadgeCriteriaType } from '@cp/shared';
import { Badge } from './badge.entity';
import { StudentBadge } from './student-badge.entity';
import { StudentProfile } from '../students/student-profile.entity';
import { BadgesService } from './badges.service';

/** Minimal metadata shape TypeOrmCrudService's constructor reads (mirrors students.service.spec.ts). */
function crudMetadata(targetName: string) {
  return {
    connection: { options: { type: 'postgres' } },
    targetName,
    columns: [],
    relations: [],
  };
}

function makeService(
  opts: {
    badgeOverride?: Partial<Badge>;
    badgeMissing?: boolean;
    ownedBefore?: boolean;
    profile?: Partial<StudentProfile> | null;
  } = {},
) {
  const badge: Badge = {
    id: 'badge-1',
    code: 'checkin-streak-7',
    title: 'On Fire',
    description: 'Duy trì chuỗi điểm danh 7 ngày.',
    icon: 'local_fire_department',
    rarity: BadgeRarity.RARE,
    criteria: { type: BadgeCriteriaType.STREAK_DAYS, threshold: 999999 },
    rewardXp: 0,
    rewardGems: 0,
    isActive: true,
    earnedCount: 3,
    ...opts.badgeOverride,
  } as Badge;

  const badgesRepo = {
    metadata: crudMetadata('Badge'),
    findOne: jest.fn().mockResolvedValue(opts.badgeMissing ? null : badge),
    find: jest.fn().mockResolvedValue([]),
    save: jest.fn(async (x: unknown) => x),
  };

  const studentBadgesRepo = {
    findOne: jest.fn().mockResolvedValue(
      opts.ownedBefore ? { id: 'sb-1', userId: 'u1', badgeId: badge.id } : null,
    ),
    save: jest.fn(async (x: unknown) => x),
    create: jest.fn((x: unknown) => x),
    find: jest.fn().mockResolvedValue([]),
  };

  const profileRow: StudentProfile =
    opts.profile === null
      ? (null as never)
      : ({
          userId: 'u1',
          gems: 0,
          xp: 0,
          level: 1,
          badgesEarned: 0,
          weekKey: null,
          monthKey: null,
          weeklyXp: 0,
          monthlyXp: 0,
          ...opts.profile,
        } as StudentProfile);
  const profilesRepo = {
    findOne: jest.fn().mockResolvedValue(profileRow),
    save: jest.fn(async (x: unknown) => x),
  };

  const repos = new Map<unknown, unknown>([
    [Badge, badgesRepo],
    [StudentBadge, studentBadgesRepo],
    [StudentProfile, profilesRepo],
  ]);
  const tx = { getRepository: jest.fn((e: unknown) => repos.get(e)) };
  const ds = { transaction: jest.fn((fn: (t: unknown) => unknown) => fn(tx)) };
  const gateway = { publish: jest.fn() };
  const cache = { bumpTags: jest.fn().mockResolvedValue(undefined) };

  const service = new BadgesService(
    badgesRepo as never,
    studentBadgesRepo as never,
    profilesRepo as never,
    ds as never,
    gateway as never,
    cache as never,
  );

  return { service, badge, badgesRepo, studentBadgesRepo, profilesRepo, gateway, cache, tx };
}

describe('BadgesService.awardByCode (Task 12)', () => {
  const NOW = new Date('2026-07-11T03:00:00Z');

  it('awards a not-yet-owned active badge: inserts StudentBadge, bumps earnedCount, applies rewards, returns the badge', async () => {
    const ctx = makeService({ ownedBefore: false });

    const result = await ctx.service.awardByCode('u1', 'checkin-streak-7', NOW);

    expect(result).not.toBeNull();
    expect(result?.code).toBe('checkin-streak-7');
    expect(ctx.studentBadgesRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'u1', badgeId: ctx.badge.id }),
    );
    expect(ctx.badge.earnedCount).toBe(4); // 3 + 1
    expect(ctx.badgesRepo.save).toHaveBeenCalledWith(expect.objectContaining({ earnedCount: 4 }));
    expect(ctx.profilesRepo.save).toHaveBeenCalledWith(expect.objectContaining({ badgesEarned: 1 }));
    expect(ctx.gateway.publish).toHaveBeenCalledWith(
      'u1',
      expect.objectContaining({ type: 'badge:earned', badgeId: ctx.badge.id }),
    );
    expect(ctx.cache.bumpTags).toHaveBeenCalled();
  });

  it('returns null (no insert, no publish, no cache bump) when the badge is already owned', async () => {
    const ctx = makeService({ ownedBefore: true });

    const result = await ctx.service.awardByCode('u1', 'checkin-streak-7', NOW);

    expect(result).toBeNull();
    expect(ctx.studentBadgesRepo.save).not.toHaveBeenCalled();
    expect(ctx.badgesRepo.save).not.toHaveBeenCalled();
    expect(ctx.profilesRepo.save).not.toHaveBeenCalled();
    expect(ctx.gateway.publish).not.toHaveBeenCalled();
    expect(ctx.cache.bumpTags).not.toHaveBeenCalled();
  });

  it('returns null when no active badge matches the code', async () => {
    const ctx = makeService({ badgeMissing: true });

    const result = await ctx.service.awardByCode('u1', 'nonexistent-code', NOW);

    expect(result).toBeNull();
    expect(ctx.studentBadgesRepo.save).not.toHaveBeenCalled();
    expect(ctx.gateway.publish).not.toHaveBeenCalled();
  });
});
