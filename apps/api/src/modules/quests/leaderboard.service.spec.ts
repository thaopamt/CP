import 'reflect-metadata';
import { In } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { UserRole } from '@cp/shared';
import { ROLES_KEY } from '../../common/decorators/roles.decorator';
import { LeaderboardController } from './leaderboard.controller';
import { LeaderboardService } from './leaderboard.service';
import { LeaderboardFinalizedWeek } from './leaderboard-finalized-week.entity';
import { StudentProfile } from '../students/student-profile.entity';
import { StudentInventory } from '../shop/student-inventory.entity';
import { ShopItem } from '../shop/shop-item.entity';
import { weekKey } from './period-keys';

describe('LeaderboardService.checkAndFinalizeWeeklyLeaderboard', () => {
  let service: LeaderboardService;
  let profilesRepoMock: any;
  let studentBadgesRepoMock: any;
  let cacheMock: any;

  let finalizedRepoMock: any;
  let invRepoMock: any;
  let itemRepoMock: any;
  let txMock: any;

  const mockDate = new Date('2026-07-15T00:00:00Z');
  const prevWeekKey = weekKey(new Date(mockDate.getTime() - 7 * 24 * 60 * 60 * 1000)); // prev week

  beforeEach(() => {
    finalizedRepoMock = {
      findOne: jest.fn(),
      create: jest.fn((x) => x),
      save: jest.fn(async (x) => x),
    };

    invRepoMock = {
      findOne: jest.fn(),
      delete: jest.fn(),
      create: jest.fn((x) => x),
      save: jest.fn(async (x) => x),
    };

    itemRepoMock = {
      find: jest.fn().mockResolvedValue([
        { id: 'item-champion-id', code: 'CHAR_WEEKLY_CHAMPION' },
        { id: 'item-elite-id', code: 'CHAR_WEEKLY_ELITE' },
        { id: 'item-challenger-id', code: 'CHAR_WEEKLY_CHALLENGER' },
      ]),
    };

    profilesRepoMock = {
      findOne: jest.fn(),
      save: jest.fn(async (x) => x),
      createQueryBuilder: jest.fn(),
    };

    txMock = {
      getRepository: jest.fn((entity) => {
        if (entity === LeaderboardFinalizedWeek) return finalizedRepoMock;
        if (entity === StudentProfile) return profilesRepoMock;
        if (entity === StudentInventory) return invRepoMock;
        if (entity === ShopItem) return itemRepoMock;
        return null;
      }),
    };

    profilesRepoMock.manager = {
      getRepository: jest.fn((entity) => {
        if (entity === LeaderboardFinalizedWeek) return finalizedRepoMock;
        if (entity === StudentProfile) return profilesRepoMock;
        if (entity === StudentInventory) return invRepoMock;
        if (entity === ShopItem) return itemRepoMock;
        return null;
      }),
      transaction: jest.fn(async (callback) => callback(txMock)),
    };

    studentBadgesRepoMock = {};
    cacheMock = {
      remember: jest.fn(),
      bumpTags: jest.fn().mockResolvedValue(undefined),
    };

    service = new LeaderboardService(
      profilesRepoMock,
      studentBadgesRepoMock,
      finalizedRepoMock,
      cacheMock,
    );
  });

  it('should return early if the week has already been finalized', async () => {
    finalizedRepoMock.findOne.mockResolvedValue({ id: 'finalized-id' });

    await service.checkAndFinalizeWeeklyLeaderboard(mockDate);

    expect(finalizedRepoMock.findOne).toHaveBeenCalledWith({ where: { weekKey: prevWeekKey } });
    expect(profilesRepoMock.manager.transaction).not.toHaveBeenCalled();
  });

  it('should save a blank finalized week record if no active profiles are found', async () => {
    finalizedRepoMock.findOne.mockResolvedValue(null); // not finalized yet (outside tx)
    
    // Within transaction
    let firstCall = true;
    finalizedRepoMock.findOne.mockImplementation(() => {
      if (firstCall) {
        firstCall = false;
        return null;
      }
      return null; // double check inside tx
    });

    const queryBuilderMock = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
    };
    profilesRepoMock.createQueryBuilder.mockReturnValue(queryBuilderMock);

    await service.checkAndFinalizeWeeklyLeaderboard(mockDate);

    expect(profilesRepoMock.manager.transaction).toHaveBeenCalled();
    expect(finalizedRepoMock.save).toHaveBeenCalledWith(
      expect.objectContaining({
        weekKey: prevWeekKey,
        winners: [],
      }),
    );
  });

  it('should award rewards (+XP, +Gems, and weekly avatars) to top 10 profiles correctly', async () => {
    finalizedRepoMock.findOne.mockResolvedValue(null);

    const mockProfiles = [
      {
        id: 'prof-1',
        userId: 'student-1',
        xp: 1000,
        gems: 100,
        level: 1,
        weeklyXp: 500,
        weekKey: prevWeekKey,
        user: { firstName: 'RankOne', lastName: 'Student', avatarUrl: 'avatar-1' },
      },
      {
        id: 'prof-2',
        userId: 'student-2',
        xp: 800,
        gems: 50,
        level: 1,
        weeklyXp: 400,
        weekKey: prevWeekKey,
        user: { firstName: 'RankTwo', lastName: 'Student', avatarUrl: 'avatar-2' },
      },
      {
        id: 'prof-3',
        userId: 'student-3',
        xp: 600,
        gems: 10,
        level: 1,
        weeklyXp: 300,
        weekKey: prevWeekKey,
        user: { firstName: 'RankThree', lastName: 'Student', avatarUrl: 'avatar-3' },
      },
      {
        id: 'prof-4',
        userId: 'student-4',
        xp: 400,
        gems: 0,
        level: 1,
        weeklyXp: 200,
        weekKey: prevWeekKey,
        user: { firstName: 'RankFour', lastName: 'Student', avatarUrl: 'avatar-4' },
      },
    ];

    profilesRepoMock.findOne.mockImplementation(({ where }) => {
      const match = mockProfiles.find((p) => p.id === where.id);
      return Promise.resolve(match || null);
    });

    const queryBuilderMock = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue(mockProfiles),
    };
    profilesRepoMock.createQueryBuilder.mockReturnValue(queryBuilderMock);

    await service.checkAndFinalizeWeeklyLeaderboard(mockDate);

    // Assert profiles are updated and saved
    expect(profilesRepoMock.save).toHaveBeenCalledTimes(4);

    // Student 1 (Rank 1): +1000 XP, +500 Gems, champion avatar
    const s1 = mockProfiles[0];
    expect(s1.gems).toBe(600); // 100 + 500
    expect(s1.xp).toBe(2000); // 1000 + 1000
    expect(invRepoMock.findOne).toHaveBeenCalledWith({ where: { userId: 'student-1', itemId: 'item-champion-id' } });
    expect(invRepoMock.save).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'student-1',
        itemId: 'item-champion-id',
        equipped: false,
      }),
    );

    // Student 2 (Rank 2): +500 XP, +300 Gems, elite avatar
    const s2 = mockProfiles[1];
    expect(s2.gems).toBe(350); // 50 + 300
    expect(s2.xp).toBe(1300); // 800 + 500
    expect(invRepoMock.findOne).toHaveBeenCalledWith({ where: { userId: 'student-2', itemId: 'item-elite-id' } });

    // Student 4 (Rank 4): +200 XP, +100 Gems, challenger avatar
    const s4 = mockProfiles[3];
    expect(s4.gems).toBe(100); // 0 + 100
    expect(s4.xp).toBe(600); // 400 + 200
    expect(invRepoMock.findOne).toHaveBeenCalledWith({ where: { userId: 'student-4', itemId: 'item-challenger-id' } });

    // Assert finalized record is saved
    expect(finalizedRepoMock.save).toHaveBeenCalledWith(
      expect.objectContaining({
        weekKey: prevWeekKey,
        winners: expect.arrayContaining([
          expect.objectContaining({
            userId: 'student-1',
            rank: 1,
            rewards: { xp: 1000, gems: 500, avatarCode: 'CHAR_WEEKLY_CHAMPION' },
          }),
          expect.objectContaining({
            userId: 'student-2',
            rank: 2,
            rewards: { xp: 500, gems: 300, avatarCode: 'CHAR_WEEKLY_ELITE' },
          }),
          expect.objectContaining({
            userId: 'student-3',
            rank: 3,
            rewards: { xp: 500, gems: 300, avatarCode: 'CHAR_WEEKLY_ELITE' },
          }),
          expect.objectContaining({
            userId: 'student-4',
            rank: 4,
            rewards: { xp: 200, gems: 100, avatarCode: 'CHAR_WEEKLY_CHALLENGER' },
          }),
        ]),
      }),
    );
  });

  it('should extend expiresAt and preserve equipped status if the student already owns the weekly avatar', async () => {
    finalizedRepoMock.findOne.mockResolvedValue(null);

    const mockProfiles = [
      {
        id: 'prof-1',
        userId: 'student-1',
        weeklyXp: 100,
        xp: 1000,
        gems: 100,
        level: 10,
        weekKey: prevWeekKey,
        user: { firstName: 'John', lastName: 'Doe', avatarUrl: 'avatar' },
      },
    ];

    profilesRepoMock.findOne.mockImplementation(({ where }) => {
      const match = mockProfiles.find((p) => p.id === where.id);
      return Promise.resolve(match || null);
    });

    const queryBuilderMock = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue(mockProfiles),
    };

    profilesRepoMock.createQueryBuilder.mockReturnValue(queryBuilderMock);

    // Simulate already owning the avatar and having it equipped: true
    const existingInventoryRow = {
      userId: 'student-1',
      itemId: 'item-champion-id',
      expiresAt: new Date(),
      equipped: true,
    };
    invRepoMock.findOne.mockResolvedValue(existingInventoryRow);

    await service.checkAndFinalizeWeeklyLeaderboard(mockDate);

    // Assert findOne was called
    expect(invRepoMock.findOne).toHaveBeenCalledWith({
      where: { userId: 'student-1', itemId: 'item-champion-id' },
    });

    // Assert that it did NOT delete, but updated the existing row with new expiresAt and saved
    expect(invRepoMock.delete).not.toHaveBeenCalled();
    expect(invRepoMock.save).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'student-1',
        itemId: 'item-champion-id',
        equipped: true,
        expiresAt: expect.any(Date),
      }),
    );
  });

  describe('catch-up logic when multiple weeks are missed', () => {
    it('should chronologically finalize all missed weeks when multiple weeks are missed', async () => {
      const mockLastFinalized = { weekKey: '2026-W25' };

      finalizedRepoMock.findOne.mockImplementation(({ where, order }) => {
        if (where?.weekKey === prevWeekKey) {
          return Promise.resolve(null);
        }
        if (order?.weekKey === 'DESC') {
          return Promise.resolve(mockLastFinalized);
        }
        return Promise.resolve(null); // double-check inside loop
      });

      const finalizeSpy = jest.spyOn(service as any, 'finalizeSingleWeek').mockResolvedValue(undefined);

      await service.checkAndFinalizeWeeklyLeaderboard(mockDate);

      // Verify that it identifies the missed weeks and calls finalizeSingleWeek in order
      expect(finalizeSpy).toHaveBeenCalledTimes(3);
      expect(finalizeSpy.mock.calls[0][0]).toBe('2026-W26');
      expect(finalizeSpy.mock.calls[1][0]).toBe('2026-W27');
      expect(finalizeSpy.mock.calls[2][0]).toBe('2026-W28');

      finalizeSpy.mockRestore();
    });

    it('should terminate the loop correctly and not roll over past the current previous week', async () => {
      const mockLastFinalized = { weekKey: '2026-W25' };

      finalizedRepoMock.findOne.mockImplementation(({ where, order }) => {
        if (where?.weekKey === prevWeekKey) {
          return Promise.resolve(null);
        }
        if (order?.weekKey === 'DESC') {
          return Promise.resolve(mockLastFinalized);
        }
        return Promise.resolve(null);
      });

      const finalizeSpy = jest.spyOn(service as any, 'finalizeSingleWeek').mockResolvedValue(undefined);

      await service.checkAndFinalizeWeeklyLeaderboard(mockDate);

      // Verify that it stops exactly at 2026-W28 (prevWeekKey) and does not call for 2026-W29 (current week)
      expect(finalizeSpy).toHaveBeenCalledTimes(3);
      const calls = finalizeSpy.mock.calls.map((c) => c[0]);
      expect(calls).not.toContain('2026-W29');

      finalizeSpy.mockRestore();
    });

    it('should correctly handle year roll-over (e.g. 2025-W51 to 2026-W02)', async () => {
      const jan2026Date = new Date('2026-01-15T00:00:00Z');
      const janPrevWeekKey = weekKey(new Date(jan2026Date.getTime() - 7 * 24 * 60 * 60 * 1000)); // 2026-W02

      finalizedRepoMock.findOne.mockImplementation(({ where, order }) => {
        if (where?.weekKey === janPrevWeekKey) {
          return Promise.resolve(null);
        }
        if (order?.weekKey === 'DESC') {
          return Promise.resolve({ weekKey: '2025-W51' });
        }
        return Promise.resolve(null);
      });

      const finalizeSpy = jest.spyOn(service as any, 'finalizeSingleWeek').mockResolvedValue(undefined);

      await service.checkAndFinalizeWeeklyLeaderboard(jan2026Date);

      expect(finalizeSpy).toHaveBeenCalled();
      const calls = finalizeSpy.mock.calls.map((c) => c[0]);
      expect(calls[0]).toBe('2025-W52');
      expect(calls[calls.length - 1]).toBe('2026-W02');

      finalizeSpy.mockRestore();
    });
  });
});

describe('LeaderboardService - Weekly Reward popup and history methods', () => {
  let service: LeaderboardService;
  let profilesRepoMock: any;
  let studentBadgesRepoMock: any;
  let cacheMock: any;
  let finalizedRepoMock: any;

  beforeEach(() => {
    finalizedRepoMock = {
      find: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(async (x) => x),
    };

    profilesRepoMock = {
      findOne: jest.fn(),
      save: jest.fn(async (x) => x),
    };

    profilesRepoMock.manager = {
      getRepository: jest.fn((entity) => {
        if (entity === LeaderboardFinalizedWeek) return finalizedRepoMock;
        if (entity === StudentProfile) return profilesRepoMock;
        return null;
      }),
    };

    studentBadgesRepoMock = {};
    cacheMock = {
      remember: jest.fn(),
      bumpTags: jest.fn().mockResolvedValue(undefined),
    };

    service = new LeaderboardService(
      profilesRepoMock,
      studentBadgesRepoMock,
      finalizedRepoMock,
      cacheMock,
    );
  });

  describe('getFinalizedWeeks', () => {
    it('should retrieve all finalized weeks ordered by weekKey DESC', async () => {
      const mockWeeks = [{ weekKey: '2026-W28' }, { weekKey: '2026-W27' }];
      finalizedRepoMock.find.mockResolvedValue(mockWeeks);

      const result = await service.getFinalizedWeeks();

      expect(finalizedRepoMock.find).toHaveBeenCalledWith({
        order: { weekKey: 'DESC' },
      });
      expect(result).toEqual(mockWeeks);
    });
  });

  describe('getPendingReward', () => {
    it('should return null if there is no finalized week', async () => {
      finalizedRepoMock.findOne.mockResolvedValue(null);

      const result = await service.getPendingReward('user-1');

      expect(result).toBeNull();
    });

    it('should return null if the student profile is not found', async () => {
      finalizedRepoMock.findOne.mockResolvedValue({ weekKey: '2026-W28' });
      profilesRepoMock.findOne.mockResolvedValue(null);

      const result = await service.getPendingReward('user-1');

      expect(result).toBeNull();
    });

    it('should return null if the user has already seen/claimed the latest finalized week', async () => {
      finalizedRepoMock.findOne.mockResolvedValue({ weekKey: '2026-W28' });
      profilesRepoMock.findOne.mockResolvedValue({
        userId: 'user-1',
        lastSeenWeeklyRewardWeek: '2026-W28',
      });

      const result = await service.getPendingReward('user-1');

      expect(result).toBeNull();
    });

    it('should return null if the user is not in the winners array of the latest finalized week', async () => {
      finalizedRepoMock.findOne.mockResolvedValue({
        weekKey: '2026-W28',
        winners: [{ userId: 'user-2', rank: 1, weeklyXp: 100, rewards: { xp: 1000, gems: 500 } }],
      });
      profilesRepoMock.findOne.mockResolvedValue({
        userId: 'user-1',
        lastSeenWeeklyRewardWeek: '2026-W27',
      });

      const result = await service.getPendingReward('user-1');

      expect(result).toBeNull();
    });

    it('should return reward details if the user is a winner and has not seen the reward week yet', async () => {
      const winnerReward = { xp: 1000, gems: 500 };
      finalizedRepoMock.findOne.mockResolvedValue({
        weekKey: '2026-W28',
        winners: [{ userId: 'user-1', rank: 1, weeklyXp: 150, rewards: winnerReward }],
      });
      profilesRepoMock.findOne.mockResolvedValue({
        userId: 'user-1',
        lastSeenWeeklyRewardWeek: '2026-W27',
      });

      const result = await service.getPendingReward('user-1');

      expect(result).toEqual({
        weekKey: '2026-W28',
        rank: 1,
        weeklyXp: 150,
        rewards: winnerReward,
      });
    });
  });

  describe('claimReward', () => {
    it('should throw NotFoundException if there is no finalized week', async () => {
      finalizedRepoMock.findOne.mockResolvedValue(null);

      await expect(service.claimReward('user-1')).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if the student profile is not found', async () => {
      finalizedRepoMock.findOne.mockResolvedValue({ weekKey: '2026-W28' });
      profilesRepoMock.findOne.mockResolvedValue(null);

      await expect(service.claimReward('user-1')).rejects.toThrow(NotFoundException);
    });

    it('should update the student profile lastSeenWeeklyRewardWeek to last finalized week key, save it, and invalidate profile cache', async () => {
      finalizedRepoMock.findOne.mockResolvedValue({ weekKey: '2026-W28' });
      const mockProfile = {
        userId: 'user-1',
        lastSeenWeeklyRewardWeek: '2026-W27',
      };
      profilesRepoMock.findOne.mockResolvedValue(mockProfile);

      const result = await service.claimReward('user-1');

      expect(mockProfile.lastSeenWeeklyRewardWeek).toBe('2026-W28');
      expect(profilesRepoMock.save).toHaveBeenCalledWith(mockProfile);
      expect(cacheMock.bumpTags).toHaveBeenCalledWith(['student:user-1:profile']);
      expect(result).toEqual(mockProfile);
    });
  });
});

describe('LeaderboardController', () => {
  let controller: LeaderboardController;
  let serviceMock: any;

  beforeEach(() => {
    serviceMock = {
      getLeaderboard: jest.fn(),
      getFinalizedWeeks: jest.fn(),
      getPendingReward: jest.fn(),
      claimReward: jest.fn(),
    };
    controller = new LeaderboardController(serviceMock);
  });

  describe('getFinalizedWeeks', () => {
    it('delegates to LeaderboardService.getFinalizedWeeks', async () => {
      const mockWeeks = [{ weekKey: '2026-W28' }];
      serviceMock.getFinalizedWeeks.mockResolvedValue(mockWeeks);

      const result = await controller.getFinalizedWeeks();

      expect(serviceMock.getFinalizedWeeks).toHaveBeenCalled();
      expect(result).toEqual(mockWeeks);
    });
  });

  describe('getPendingReward', () => {
    it('delegates to LeaderboardService.getPendingReward', async () => {
      const user = { sub: 'user-1' } as any;
      const mockReward = { rank: 1, weeklyXp: 100, rewards: { xp: 1000 } };
      serviceMock.getPendingReward.mockResolvedValue(mockReward);

      const result = await controller.getPendingReward(user);

      expect(serviceMock.getPendingReward).toHaveBeenCalledWith('user-1');
      expect(result).toEqual(mockReward);
    });
  });

  describe('claimReward', () => {
    it('delegates to LeaderboardService.claimReward and is decorated with Roles(UserRole.STUDENT)', async () => {
      const user = { sub: 'user-1' } as any;
      const mockProfile = { userId: 'user-1', lastSeenWeeklyRewardWeek: '2026-W28' };
      serviceMock.claimReward.mockResolvedValue(mockProfile);

      const result = await controller.claimReward(user);

      expect(serviceMock.claimReward).toHaveBeenCalledWith('user-1');
      expect(result).toEqual(mockProfile);

      // Verify roles decorator metadata
      const roles = Reflect.getMetadata(ROLES_KEY, LeaderboardController.prototype.claimReward);
      expect(roles).toEqual([UserRole.STUDENT]);
    });
  });
});
