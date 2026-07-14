import { In } from 'typeorm';
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
        userId: 'student-1',
        xp: 1000,
        gems: 100,
        level: 1,
        weeklyXp: 500,
        weekKey: prevWeekKey,
        user: { firstName: 'RankOne', lastName: 'Student', avatarUrl: 'avatar-1' },
      },
      {
        userId: 'student-2',
        xp: 800,
        gems: 50,
        level: 1,
        weeklyXp: 400,
        weekKey: prevWeekKey,
        user: { firstName: 'RankTwo', lastName: 'Student', avatarUrl: 'avatar-2' },
      },
      {
        userId: 'student-3',
        xp: 600,
        gems: 10,
        level: 1,
        weeklyXp: 300,
        weekKey: prevWeekKey,
        user: { firstName: 'RankThree', lastName: 'Student', avatarUrl: 'avatar-3' },
      },
      {
        userId: 'student-4',
        xp: 400,
        gems: 0,
        level: 1,
        weeklyXp: 200,
        weekKey: prevWeekKey,
        user: { firstName: 'RankFour', lastName: 'Student', avatarUrl: 'avatar-4' },
      },
    ];

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
        userId: 'student-1',
        weeklyXp: 100,
        xp: 1000,
        gems: 100,
        level: 10,
        weekKey: prevWeekKey,
        user: { firstName: 'John', lastName: 'Doe', avatarUrl: 'avatar' },
      },
    ];

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
});
