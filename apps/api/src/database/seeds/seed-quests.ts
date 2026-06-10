import 'reflect-metadata';
import { AppDataSource } from '../data-source';
import { Quest } from '../../modules/quests/quest.entity';
import { Badge } from '../../modules/quests/badge.entity';
import {
  BadgeCriteriaType,
  BadgeRarity,
  IQuestObjectiveConfig,
  QuestObjectiveType,
  QuestRecurrence,
  QuestStatus,
  QuestType,
} from '@cp/shared';

// ── Badge catalog (idempotent by `code`) ──────────────────────────────────────
interface BadgeSeed {
  code: string;
  title: string;
  description: string;
  icon: string;
  rarity: BadgeRarity;
  criteriaType: BadgeCriteriaType;
  threshold: number;
  rewardXp: number;
  rewardGems: number;
}

const BADGES: BadgeSeed[] = [
  { code: 'FIRST_BLOOD', title: 'First Blood', description: 'Giải bài đầu tiên của bạn.', icon: 'bolt', rarity: BadgeRarity.COMMON, criteriaType: BadgeCriteriaType.PROBLEMS_SOLVED, threshold: 1, rewardXp: 50, rewardGems: 5 },
  { code: 'PROBLEM_SLAYER', title: 'Problem Slayer', description: 'Giải 25 bài lập trình.', icon: 'swords', rarity: BadgeRarity.RARE, criteriaType: BadgeCriteriaType.PROBLEMS_SOLVED, threshold: 25, rewardXp: 200, rewardGems: 20 },
  { code: 'CENTURION', title: 'Centurion', description: 'Giải 100 bài lập trình.', icon: 'military_tech', rarity: BadgeRarity.EPIC, criteriaType: BadgeCriteriaType.PROBLEMS_SOLVED, threshold: 100, rewardXp: 500, rewardGems: 50 },
  { code: 'MAZE_RUNNER', title: 'Maze Runner', description: 'Vượt 10 màn mê cung.', icon: 'extension', rarity: BadgeRarity.RARE, criteriaType: BadgeCriteriaType.MAZE_SOLVED, threshold: 10, rewardXp: 150, rewardGems: 15 },
  { code: 'STREAK_7', title: 'On Fire', description: 'Duy trì chuỗi 7 ngày.', icon: 'local_fire_department', rarity: BadgeRarity.RARE, criteriaType: BadgeCriteriaType.STREAK_DAYS, threshold: 7, rewardXp: 150, rewardGems: 15 },
  { code: 'STREAK_30', title: 'Unstoppable', description: 'Duy trì chuỗi 30 ngày.', icon: 'whatshot', rarity: BadgeRarity.LEGENDARY, criteriaType: BadgeCriteriaType.STREAK_DAYS, threshold: 30, rewardXp: 1000, rewardGems: 100 },
  { code: 'QUEST_MASTER', title: 'Quest Master', description: 'Hoàn thành 20 nhiệm vụ.', icon: 'verified', rarity: BadgeRarity.EPIC, criteriaType: BadgeCriteriaType.QUESTS_COMPLETED, threshold: 20, rewardXp: 400, rewardGems: 40 },
  { code: 'LEVEL_10', title: 'Rising Star', description: 'Đạt cấp độ 10.', icon: 'trending_up', rarity: BadgeRarity.EPIC, criteriaType: BadgeCriteriaType.REACH_LEVEL, threshold: 10, rewardXp: 0, rewardGems: 50 },
  { code: 'RICH_KID', title: 'Gem Hoarder', description: 'Tích lũy 500 đá quý.', icon: 'diamond', rarity: BadgeRarity.RARE, criteriaType: BadgeCriteriaType.EARN_GEMS, threshold: 500, rewardXp: 0, rewardGems: 0 },
  { code: 'SCHOLAR', title: 'Scholar', description: 'Đạt 10.000 XP.', icon: 'school', rarity: BadgeRarity.LEGENDARY, criteriaType: BadgeCriteriaType.EARN_XP, threshold: 10000, rewardXp: 0, rewardGems: 100 },
];

// ── Quest catalog (idempotent by `title`) ─────────────────────────────────────
interface QuestSeed {
  title: string;
  description: string;
  type: QuestType;
  objectiveType: QuestObjectiveType;
  objectiveConfig?: IQuestObjectiveConfig | null;
  targetCount: number;
  rewardXp: number;
  rewardGems: number;
  icon: string;
  recurrence: QuestRecurrence;
  sortOrder: number;
  category?: string;
  /** Resolved at insert time from a previously-seeded quest title. */
  prerequisiteTitle?: string;
  /** Resolved at insert time from a badge code. */
  rewardBadgeCode?: string;
  daysWindow?: number; // for EVENT quests
}

const QUESTS: QuestSeed[] = [
  // Daily
  { title: 'Khởi động ngày mới', description: 'Nộp đúng 1 bài bất kỳ hôm nay.', type: QuestType.DAILY, objectiveType: QuestObjectiveType.SUBMIT_ACCEPTED, targetCount: 1, rewardXp: 30, rewardGems: 5, icon: 'wb_sunny', recurrence: QuestRecurrence.DAILY, sortOrder: 1, category: 'Daily' },
  { title: 'Cày ngày', description: 'Giải 3 bài lập trình trong ngày.', type: QuestType.DAILY, objectiveType: QuestObjectiveType.SOLVE_CODING, targetCount: 3, rewardXp: 80, rewardGems: 10, icon: 'today', recurrence: QuestRecurrence.DAILY, sortOrder: 2, category: 'Daily' },
  { title: 'Thử thách khó', description: 'Giải 1 bài độ khó HARD hôm nay.', type: QuestType.DAILY, objectiveType: QuestObjectiveType.SOLVE_BY_DIFFICULTY, objectiveConfig: { difficulty: 'HARD' }, targetCount: 1, rewardXp: 120, rewardGems: 15, icon: 'whatshot', recurrence: QuestRecurrence.DAILY, sortOrder: 3, category: 'Daily' },

  // Weekly
  { title: 'Tuần năng suất', description: 'Giải 15 bài trong tuần này.', type: QuestType.WEEKLY, objectiveType: QuestObjectiveType.SOLVE_CODING, targetCount: 15, rewardXp: 300, rewardGems: 40, icon: 'date_range', recurrence: QuestRecurrence.WEEKLY, sortOrder: 1, category: 'Weekly' },
  { title: 'Nhà thám hiểm mê cung', description: 'Vượt 5 màn mê cung trong tuần.', type: QuestType.WEEKLY, objectiveType: QuestObjectiveType.SOLVE_MAZE, targetCount: 5, rewardXp: 250, rewardGems: 30, icon: 'extension', recurrence: QuestRecurrence.WEEKLY, sortOrder: 2, category: 'Weekly' },

  // Main story (prerequisite chain)
  { title: 'Bước chân đầu tiên', description: 'Giải bài lập trình đầu tiên.', type: QuestType.MAIN, objectiveType: QuestObjectiveType.SOLVE_CODING, targetCount: 1, rewardXp: 100, rewardGems: 10, icon: 'footprint', recurrence: QuestRecurrence.NONE, sortOrder: 1, category: 'Story' },
  { title: 'Vững vàng cơ bản', description: 'Giải 10 bài lập trình.', type: QuestType.MAIN, objectiveType: QuestObjectiveType.SOLVE_CODING, targetCount: 10, rewardXp: 300, rewardGems: 30, icon: 'fitness_center', recurrence: QuestRecurrence.NONE, sortOrder: 2, category: 'Story', prerequisiteTitle: 'Bước chân đầu tiên' },
  { title: 'Bậc thầy giải thuật', description: 'Giải 5 bài độ khó HARD.', type: QuestType.MAIN, objectiveType: QuestObjectiveType.SOLVE_BY_DIFFICULTY, objectiveConfig: { difficulty: 'HARD' }, targetCount: 5, rewardXp: 600, rewardGems: 60, icon: 'psychology', recurrence: QuestRecurrence.NONE, sortOrder: 3, category: 'Story', prerequisiteTitle: 'Vững vàng cơ bản', rewardBadgeCode: 'PROBLEM_SLAYER' },
  { title: 'Vươn tới cấp 5', description: 'Đạt cấp độ 5.', type: QuestType.MAIN, objectiveType: QuestObjectiveType.REACH_LEVEL, targetCount: 5, rewardXp: 0, rewardGems: 50, icon: 'stars', recurrence: QuestRecurrence.NONE, sortOrder: 4, category: 'Story' },

  // Bounties
  { title: 'Săn điểm', description: 'Tích lũy 500 điểm từ các bài tập.', type: QuestType.BOUNTY, objectiveType: QuestObjectiveType.EARN_POINTS, targetCount: 500, rewardXp: 200, rewardGems: 25, icon: 'paid', recurrence: QuestRecurrence.NONE, sortOrder: 1, category: 'Bounty' },
  { title: 'Chuỗi 7 ngày', description: 'Giữ chuỗi hoạt động 7 ngày liên tiếp.', type: QuestType.BOUNTY, objectiveType: QuestObjectiveType.STREAK_DAYS, targetCount: 7, rewardXp: 250, rewardGems: 30, icon: 'local_fire_department', recurrence: QuestRecurrence.NONE, sortOrder: 2, category: 'Bounty' },

  // Event (time-boxed)
  { title: 'Sự kiện cuối tuần', description: 'Nộp đúng 10 bài trong thời gian sự kiện.', type: QuestType.EVENT, objectiveType: QuestObjectiveType.SUBMIT_ACCEPTED, targetCount: 10, rewardXp: 500, rewardGems: 50, icon: 'celebration', recurrence: QuestRecurrence.NONE, sortOrder: 1, category: 'Event', daysWindow: 14 },
];

async function run() {
  console.log('🚀 Seeding quests & badges…');
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
    console.log('📂 Database connected.');
  }

  const badgeRepo = AppDataSource.getRepository(Badge);
  const questRepo = AppDataSource.getRepository(Quest);

  // 1. Badges
  const badgeIdByCode = new Map<string, string>();
  for (const b of BADGES) {
    let badge = await badgeRepo.findOne({ where: { code: b.code } });
    if (!badge) {
      badge = await badgeRepo.save(
        badgeRepo.create({
          code: b.code,
          title: b.title,
          description: b.description,
          icon: b.icon,
          rarity: b.rarity,
          criteria: { type: b.criteriaType, threshold: b.threshold },
          rewardXp: b.rewardXp,
          rewardGems: b.rewardGems,
          isActive: true,
        }),
      );
      console.log(`  🏅 Badge created: ${b.code}`);
    }
    badgeIdByCode.set(b.code, badge.id);
  }

  // 2. Quests (two passes: insert, then wire prerequisites)
  const questIdByTitle = new Map<string, string>();
  const now = new Date();

  for (const q of QUESTS) {
    let quest = await questRepo.findOne({ where: { title: q.title } });
    if (!quest) {
      quest = await questRepo.save(
        questRepo.create({
          title: q.title,
          description: q.description,
          type: q.type,
          status: QuestStatus.PUBLISHED,
          objectiveType: q.objectiveType,
          objectiveConfig: q.objectiveConfig ?? null,
          targetCount: q.targetCount,
          rewardXp: q.rewardXp,
          rewardGems: q.rewardGems,
          rewardBadgeId: q.rewardBadgeCode ? badgeIdByCode.get(q.rewardBadgeCode) ?? null : null,
          icon: q.icon,
          category: q.category ?? null,
          sortOrder: q.sortOrder,
          recurrence: q.recurrence,
          startsAt: q.daysWindow ? now : null,
          endsAt: q.daysWindow ? new Date(now.getTime() + q.daysWindow * 86400000) : null,
          classIds: null,
          isActive: true,
        }),
      );
      console.log(`  ⚔️  Quest created: ${q.title}`);
    }
    questIdByTitle.set(q.title, quest.id);
  }

  // 3. Wire prerequisites now that all quest ids exist.
  for (const q of QUESTS) {
    if (!q.prerequisiteTitle) continue;
    const id = questIdByTitle.get(q.title);
    const prereqId = questIdByTitle.get(q.prerequisiteTitle);
    if (id && prereqId) {
      await questRepo.update({ id }, { prerequisiteQuestId: prereqId });
    }
  }

  console.log(`✅ Seeded ${BADGES.length} badges and ${QUESTS.length} quests.`);
  await AppDataSource.destroy();
}

run().catch((err) => {
  console.error('❌ Error during quests seed:', err);
  process.exit(1);
});
