import { DataSource, Repository } from 'typeorm';
import {
  QuestObjectiveType,
  QuestRecurrence,
  QuestStatus,
  QuestType,
  StudentQuestStatus,
} from '@cp/shared';
import { SystemCacheService } from '../../common/cache/system-cache.service';
import { Enrollment } from '../classes/enrollment.entity';
import { StudentProfile } from '../students/student-profile.entity';
import { BadgesService } from './badges.service';
import { GamificationGateway } from './gamification.gateway';
import { Quest } from './quest.entity';
import { QuestsService } from './quests.service';
import { StudentQuest } from './student-quest.entity';

function crudMetadata(targetName: string) {
  return {
    connection: { options: { type: 'postgres' } },
    targetName,
    columns: [],
    relations: [],
  };
}

function baseQuest(overrides: Partial<Quest> = {}): Quest {
  return {
    id: 'quest-1',
    title: 'Quest',
    description: '',
    type: QuestType.DAILY,
    status: QuestStatus.PUBLISHED,
    objectiveType: QuestObjectiveType.SOLVE_CODING,
    objectiveConfig: null,
    targetCount: 1,
    rewardXp: 10,
    rewardGems: 1,
    rewardBadgeId: null,
    icon: 'military_tech',
    category: null,
    sortOrder: 0,
    recurrence: QuestRecurrence.DAILY,
    startsAt: null,
    endsAt: null,
    prerequisiteQuestId: null,
    classIds: null,
    isActive: true,
    ...overrides,
  } as Quest;
}

function studentQuest(overrides: Partial<StudentQuest> = {}): StudentQuest {
  const quest = overrides.quest ?? baseQuest({ id: overrides.questId ?? 'quest-1' });
  return {
    id: 'sq-1',
    userId: 'student-1',
    questId: quest.id,
    quest,
    progress: 0,
    status: StudentQuestStatus.IN_PROGRESS,
    progressData: { countedIds: [], pointsAccrued: 0 },
    periodKey: '2026-07-13',
    startedAt: new Date('2026-07-13T00:00:00Z'),
    completedAt: null,
    claimedAt: null,
    ...overrides,
  } as StudentQuest;
}

function makeInsertBuilder(capture: { values: Partial<StudentQuest>[]; builder?: any }) {
  return {
    insert: jest.fn().mockReturnThis(),
    into: jest.fn().mockReturnThis(),
    values: jest.fn((values: Partial<StudentQuest>[]) => {
      capture.values = values;
      return capture.builder;
    }),
    orIgnore: jest.fn().mockReturnThis(),
    execute: jest.fn().mockResolvedValue({}),
  } as any;
}

describe('QuestsService recurrence and duplicate-solve behavior', () => {
  let service: QuestsService;
  let questRepo: jest.Mocked<Repository<Quest>>;
  let studentQuestRepo: jest.Mocked<Repository<StudentQuest>>;
  let profileRepo: jest.Mocked<Repository<StudentProfile>>;
  let enrollmentRepo: jest.Mocked<Repository<Enrollment>>;
  let cache: { bumpTags: jest.Mock; remember: jest.Mock };
  let badges: { evaluateAndAward: jest.Mock };
  let gateway: { publish: jest.Mock };
  let insertCapture: { values: Partial<StudentQuest>[]; builder?: any };

  beforeEach(async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-07-13T08:00:00Z'));
    insertCapture = { values: [] };
    insertCapture.builder = makeInsertBuilder(insertCapture);

    questRepo = {
      metadata: crudMetadata('Quest'),
      find: jest.fn(),
    } as any;
    studentQuestRepo = {
      find: jest.fn(),
      save: jest.fn(async (row) => row),
      update: jest.fn().mockResolvedValue({ affected: 1 }),
      createQueryBuilder: jest.fn(() => insertCapture.builder),
    } as any;
    profileRepo = {
      findOne: jest.fn(),
      save: jest.fn(async (row) => row),
    } as any;
    enrollmentRepo = {
      find: jest.fn().mockResolvedValue([]),
    } as any;
    cache = {
      bumpTags: jest.fn().mockResolvedValue(undefined),
      remember: jest.fn((_opts, fn) => fn()),
    };
    badges = { evaluateAndAward: jest.fn().mockResolvedValue(undefined) };
    gateway = { publish: jest.fn() };

    service = new QuestsService(
      questRepo,
      studentQuestRepo,
      profileRepo,
      enrollmentRepo,
      { transaction: jest.fn() } as unknown as DataSource,
      badges as unknown as BadgesService,
      gateway as unknown as GamificationGateway,
      cache as unknown as SystemCacheService,
    );
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('creates a new BIWEEKLY quest row for the current global two-week period and expires the stale row', async () => {
    const quest = baseQuest({
      id: 'quest-biweekly',
      recurrence: QuestRecurrence.BIWEEKLY,
      type: QuestType.BOUNTY,
    });
    const stale = studentQuest({
      id: 'sq-old',
      questId: quest.id,
      quest,
      periodKey: '2026-B14',
    });
    questRepo.find.mockResolvedValue([quest]);
    studentQuestRepo.find.mockResolvedValue([stale]);

    await service.ensureQuestsAssigned('student-1');

    expect(insertCapture.values).toEqual([
      expect.objectContaining({
        userId: 'student-1',
        questId: 'quest-biweekly',
        periodKey: '2026-B15',
        progress: 0,
        status: StudentQuestStatus.IN_PROGRESS,
      }),
    ]);
    const [criteria, patch] = studentQuestRepo.update.mock.calls[0];
    expect((criteria as any).id._value).toEqual(['sq-old']);
    expect(patch).toEqual({ status: StudentQuestStatus.EXPIRED });
    expect(cache.bumpTags).toHaveBeenCalledWith(['student:student-1:quests', 'student:student-1:dashboard']);
  });

  it('does not advance coding quest progress or profile counters for an already-solved assignment', async () => {
    const profile = {
      userId: 'student-1',
      streak: 4,
      streakLastDate: '2026-07-12',
      problemsSolved: 7,
      mazesSolved: 2,
    } as StudentProfile;
    const quest = baseQuest({
      id: 'coding-quest',
      objectiveType: QuestObjectiveType.SOLVE_CODING,
      targetCount: 1,
    });
    const row = studentQuest({ id: 'sq-coding', questId: quest.id, quest });

    questRepo.find.mockResolvedValue([quest]);
    profileRepo.findOne.mockResolvedValue(profile);
    studentQuestRepo.find.mockImplementation(async (opts?: any) => {
      if (!opts?.where?.status) return [];
      if (opts.where.status === StudentQuestStatus.IN_PROGRESS && !opts.where.quest) return [row];
      return [];
    });

    await service.handleCodingAccepted('student-1', {
      assignmentId: 'assignment-1',
      difficulty: 'HARD',
      tags: ['graphs'],
      points: 100,
      alreadySolved: true,
    });

    expect(studentQuestRepo.save).not.toHaveBeenCalled();
    expect(profileRepo.save).not.toHaveBeenCalled();
    expect(profile.problemsSolved).toBe(7);
    expect(profile.streak).toBe(4);
  });

  it('does not advance maze quest progress or profile counters for an already-solved maze level', async () => {
    const profile = {
      userId: 'student-1',
      streak: 4,
      streakLastDate: '2026-07-12',
      problemsSolved: 7,
      mazesSolved: 2,
    } as StudentProfile;
    const quest = baseQuest({
      id: 'maze-quest',
      objectiveType: QuestObjectiveType.SOLVE_MAZE,
      targetCount: 1,
    });
    const row = studentQuest({ id: 'sq-maze', questId: quest.id, quest });

    questRepo.find.mockResolvedValue([quest]);
    profileRepo.findOne.mockResolvedValue(profile);
    studentQuestRepo.find.mockImplementation(async (opts?: any) => {
      if (!opts?.where?.status) return [];
      if (opts.where.status === StudentQuestStatus.IN_PROGRESS && !opts.where.quest) return [row];
      return [];
    });

    await service.handleMazeAccepted('student-1', {
      mazeLevelId: 'maze-1',
      alreadySolved: true,
    });

    expect(studentQuestRepo.save).not.toHaveBeenCalled();
    expect(profileRepo.save).not.toHaveBeenCalled();
    expect(profile.mazesSolved).toBe(2);
    expect(profile.streak).toBe(4);
  });
});
