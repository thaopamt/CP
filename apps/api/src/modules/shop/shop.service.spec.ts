import { ShopItemCategory } from '@cp/shared';
import { ShopItem } from './shop-item.entity';
import { StudentInventory } from './student-inventory.entity';
import { StudentProfile } from '../students/student-profile.entity';
import { User } from '../users/user.entity';
import { ShopService } from './shop.service';

function makeService(
  profile: Partial<StudentProfile> | null,
  user: Partial<User> | null = { id: 'user-1', avatarUrl: 'some-avatar-url' },
) {
  const itemsRepo = {
    find: jest.fn().mockResolvedValue([]),
    findOne: jest.fn().mockResolvedValue(null),
    save: jest.fn().mockImplementation(async (x) => x),
    remove: jest.fn().mockResolvedValue(undefined),
  };

  const inventoryRepo = {
    find: jest.fn().mockResolvedValue([]),
    findOne: jest.fn().mockResolvedValue(null),
    save: jest.fn().mockImplementation(async (x) => x),
    remove: jest.fn().mockResolvedValue(undefined),
  };

  const profilesRepo = {
    findOne: jest.fn().mockResolvedValue(profile),
    save: jest.fn().mockImplementation(async (x) => x),
  };

  const usersRepo = {
    findOne: jest.fn().mockResolvedValue(user),
    save: jest.fn().mockImplementation(async (x) => x),
  };

  const badgesService = {
    awardBadgeIfNeeded: jest.fn().mockResolvedValue(undefined),
  };

  const repos = new Map<unknown, any>([
    [ShopItem, itemsRepo],
    [StudentInventory, inventoryRepo],
    [StudentProfile, profilesRepo],
    [User, usersRepo],
  ]);

  const tx = {
    getRepository: jest.fn((entity) => repos.get(entity)),
  };

  const ds = {
    transaction: jest.fn((fn) => fn(tx)),
  };

  const cache = {
    bumpTags: jest.fn().mockResolvedValue(undefined),
    remember: jest.fn().mockImplementation((opts, fn) => fn()),
  };

  const service = new ShopService(
    itemsRepo as any,
    inventoryRepo as any,
    profilesRepo as any,
    usersRepo as any,
    badgesService as any,
    ds as any,
    cache as any,
  );

  return {
    service,
    itemsRepo,
    inventoryRepo,
    profilesRepo,
    usersRepo,
    badgesService,
    tx,
    ds,
    cache,
  };
}

describe('ShopService.cleanupExpiredInventory', () => {
  it('does nothing if no expired items exist', async () => {
    const ctx = makeService({ id: 'profile-1', userId: 'user-1' });
    
    // Simulate no expired items returned
    const invRepoMock = {
      find: jest.fn().mockResolvedValue([]),
    };
    ctx.tx.getRepository = jest.fn((entity) => {
      if (entity === StudentInventory) return invRepoMock;
      return ctx.tx.getRepository(entity);
    });

    await ctx.service.cleanupExpiredInventory('user-1');

    expect(invRepoMock.find).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId: 'user-1',
          expiresAt: expect.any(Object),
        }),
        lock: { mode: 'pessimistic_write' },
      })
    );
    expect(ctx.cache.bumpTags).not.toHaveBeenCalled();
  });

  it('cleans up expired items and updates profile/user when items are equipped', async () => {
    const profile = {
      id: 'profile-1',
      userId: 'user-1',
      equippedTheme: 'some-theme',
      nameColor: '#ffffff',
      equippedTitle: 'some-title',
    };
    const user = {
      id: 'user-1',
      avatarUrl: 'some-avatar-url',
    };
    const ctx = makeService(profile, user);

    const expiredItems = [
      {
        id: 'inv-1',
        userId: 'user-1',
        equipped: true,
        item: {
          category: ShopItemCategory.PROFILE_THEME,
        },
      },
      {
        id: 'inv-2',
        userId: 'user-1',
        equipped: true,
        item: {
          category: ShopItemCategory.CHARACTER,
        },
      },
    ];

    const invRepoMock = {
      find: jest.fn().mockResolvedValue(expiredItems),
      remove: jest.fn(),
    };
    const profileRepoMock = {
      findOne: jest.fn().mockResolvedValue(profile),
      save: jest.fn().mockResolvedValue(profile),
    };
    const userRepoMock = {
      findOne: jest.fn().mockResolvedValue(user),
      save: jest.fn().mockResolvedValue(user),
    };

    ctx.tx.getRepository = jest.fn((entity) => {
      if (entity === StudentInventory) return invRepoMock;
      if (entity === StudentProfile) return profileRepoMock;
      if (entity === User) return userRepoMock;
      return null;
    });

    await ctx.service.cleanupExpiredInventory('user-1');

    expect(invRepoMock.find).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId: 'user-1',
          expiresAt: expect.any(Object),
        }),
        lock: { mode: 'pessimistic_write' },
      })
    );

    expect(invRepoMock.remove).toHaveBeenCalledTimes(2);
    expect(invRepoMock.remove).toHaveBeenNthCalledWith(1, expiredItems[0]);
    expect(invRepoMock.remove).toHaveBeenNthCalledWith(2, expiredItems[1]);

    expect(profile.equippedTheme).toBeNull();
    expect(user.avatarUrl).toBeNull();
    expect(profileRepoMock.save).toHaveBeenCalledWith(profile);
    expect(userRepoMock.save).toHaveBeenCalledWith(user);
    expect(ctx.cache.bumpTags).toHaveBeenCalledWith(
      expect.arrayContaining([
        'student:user-1:shop',
        'student:user-1:profile',
        'student:user-1:dashboard',
        'student:user-1:badges',
        'leaderboard:global',
      ])
    );
  });
});
