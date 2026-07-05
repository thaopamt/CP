import { NotFoundException } from '@nestjs/common';
import { ObjectLiteral, Repository } from 'typeorm';

import { MazeSubmission } from '../maze/maze-submission.entity';
import { StudentBadge } from '../quests/student-badge.entity';
import { StudentQuest } from '../quests/student-quest.entity';
import { StudentInventory } from '../shop/student-inventory.entity';
import { StudentAssignmentProgress } from '../submissions/student-assignment-progress.entity';
import { Submission } from '../submissions/submission.entity';
import { Guardian } from './guardian.entity';
import { StudentProfile } from './student-profile.entity';
import { StudentsService } from './students.service';

function crudRepo<T extends ObjectLiteral>() {
  return {
    metadata: {
      connection: { options: { type: 'postgres' } },
      targetName: 'StudentProfile',
      columns: [],
      relations: [],
    },
    findOne: jest.fn(),
    find: jest.fn(),
    count: jest.fn(),
  } as unknown as Repository<T>;
}

function deleteRepo(affected: number) {
  return {
    delete: jest.fn().mockResolvedValue({ affected }),
  };
}

function profileRepo(profile: Partial<StudentProfile> | null) {
  return {
    findOne: jest.fn().mockResolvedValue(profile),
    update: jest.fn().mockResolvedValue({ affected: profile ? 1 : 0 }),
  };
}

function makeService(profile: Partial<StudentProfile> | null) {
  const repos = new Map<unknown, any>();
  const profileRepository = profileRepo(profile);
  const progressRepository = deleteRepo(2);
  const submissionRepository = deleteRepo(3);
  const questRepository = deleteRepo(4);
  const badgeRepository = deleteRepo(5);
  const inventoryRepository = deleteRepo(6);
  const mazeRepository = deleteRepo(7);

  repos.set(StudentProfile, profileRepository);
  repos.set(StudentAssignmentProgress, progressRepository);
  repos.set(Submission, submissionRepository);
  repos.set(StudentQuest, questRepository);
  repos.set(StudentBadge, badgeRepository);
  repos.set(StudentInventory, inventoryRepository);
  repos.set(MazeSubmission, mazeRepository);

  const tx = {
    getRepository: jest.fn((entity) => repos.get(entity)),
    query: jest.fn().mockResolvedValue([]),
  };
  const ds = {
    transaction: jest.fn((fn) => fn(tx)),
  };
  const cache = {
    bumpTags: jest.fn().mockResolvedValue(undefined),
  };

  const service = new StudentsService(
    crudRepo<StudentProfile>(),
    {} as Repository<any>,
    {} as Repository<Guardian>,
    ds as any,
    cache as any,
  );

  return {
    service,
    tx,
    cache,
    profileRepository,
    progressRepository,
    submissionRepository,
    questRepository,
    badgeRepository,
    inventoryRepository,
    mazeRepository,
  };
}

describe('StudentsService.resetLearningData', () => {
  const resetAt = new Date('2026-07-05T03:04:05.000Z');

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(resetAt);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('deletes learning/game data and resets gamification counters without touching admin profile fields', async () => {
    const ctx = makeService({
      id: 'profile-1',
      userId: 'user-1',
      monthlyTuition: 800000,
      grade: 10,
      attendanceRate: 95,
      daysAbsent: 1,
    });

    const result = await ctx.service.resetLearningData('profile-1');

    expect(ctx.progressRepository.delete).toHaveBeenCalledWith({ studentId: 'user-1' });
    expect(ctx.submissionRepository.delete).toHaveBeenCalledWith({ userId: 'user-1' });
    expect(ctx.questRepository.delete).toHaveBeenCalledWith({ userId: 'user-1' });
    expect(ctx.badgeRepository.delete).toHaveBeenCalledWith({ userId: 'user-1' });
    expect(ctx.inventoryRepository.delete).toHaveBeenCalledWith({ userId: 'user-1' });
    expect(ctx.mazeRepository.delete).toHaveBeenCalledWith({ userId: 'user-1' });
    expect(ctx.tx.query).toHaveBeenCalledWith(expect.stringContaining('UPDATE badges'), ['user-1']);

    expect(ctx.profileRepository.update).toHaveBeenCalledWith(
      { id: 'profile-1' },
      {
        level: 1,
        xp: 0,
        weeklyXp: 0,
        weekKey: null,
        monthlyXp: 0,
        monthKey: null,
        gems: 0,
        streak: 0,
        streakLastDate: null,
        problemsSolved: 0,
        mazesSolved: 0,
        badgesEarned: 0,
        questsCompleted: 0,
        equippedTheme: null,
        nameColor: null,
        equippedTitle: null,
        learningResetAt: resetAt,
      },
    );
    expect(ctx.profileRepository.update.mock.calls[0][1]).not.toEqual(
      expect.objectContaining({
        monthlyTuition: expect.anything(),
        grade: expect.anything(),
        attendanceRate: expect.anything(),
        daysAbsent: expect.anything(),
      }),
    );
    expect(ctx.cache.bumpTags).toHaveBeenCalledWith(
      expect.arrayContaining([
        'student:user-1:profile',
        'student:user-1:dashboard',
        'student:user-1:quests',
        'student:user-1:badges',
        'student:user-1:shop',
        'student:user-1:maze',
        'leaderboard:global',
        'badges:catalog',
        'maze:progress',
      ]),
    );
    expect(result).toEqual({
      studentId: 'profile-1',
      userId: 'user-1',
      submissionsDeleted: 3,
      assignmentProgressDeleted: 2,
      questsDeleted: 4,
      badgesDeleted: 5,
      shopItemsDeleted: 6,
      mazeSubmissionsDeleted: 7,
      learningResetAt: resetAt.toISOString(),
    });
  });

  it('throws NotFoundException when the student profile does not exist', async () => {
    const ctx = makeService(null);

    await expect(ctx.service.resetLearningData('missing-profile')).rejects.toBeInstanceOf(NotFoundException);
    expect(ctx.submissionRepository.delete).not.toHaveBeenCalled();
    expect(ctx.cache.bumpTags).not.toHaveBeenCalled();
  });
});
