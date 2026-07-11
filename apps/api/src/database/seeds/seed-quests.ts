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
  // ── Problems solved (ladder) ────────────────────────────────────────────────
  { code: 'FIRST_BLOOD', title: 'First Blood', description: 'Giải bài đầu tiên của bạn.', icon: 'bolt', rarity: BadgeRarity.COMMON, criteriaType: BadgeCriteriaType.PROBLEMS_SOLVED, threshold: 1, rewardXp: 50, rewardGems: 5 },
  { code: 'GETTING_STARTED', title: 'Getting Started', description: 'Giải 5 bài lập trình.', icon: 'rocket_launch', rarity: BadgeRarity.COMMON, criteriaType: BadgeCriteriaType.PROBLEMS_SOLVED, threshold: 5, rewardXp: 80, rewardGems: 8 },
  { code: 'TEN_DOWN', title: 'Ten Down', description: 'Giải 10 bài lập trình.', icon: 'looks_one', rarity: BadgeRarity.COMMON, criteriaType: BadgeCriteriaType.PROBLEMS_SOLVED, threshold: 10, rewardXp: 120, rewardGems: 12 },
  { code: 'PROBLEM_SLAYER', title: 'Problem Slayer', description: 'Giải 25 bài lập trình.', icon: 'swords', rarity: BadgeRarity.RARE, criteriaType: BadgeCriteriaType.PROBLEMS_SOLVED, threshold: 25, rewardXp: 200, rewardGems: 20 },
  { code: 'HALF_CENTURY', title: 'Half Century', description: 'Giải 50 bài lập trình.', icon: 'sports_score', rarity: BadgeRarity.RARE, criteriaType: BadgeCriteriaType.PROBLEMS_SOLVED, threshold: 50, rewardXp: 350, rewardGems: 35 },
  { code: 'CENTURION', title: 'Centurion', description: 'Giải 100 bài lập trình.', icon: 'military_tech', rarity: BadgeRarity.EPIC, criteriaType: BadgeCriteriaType.PROBLEMS_SOLVED, threshold: 100, rewardXp: 500, rewardGems: 50 },
  { code: 'GRANDMASTER_250', title: 'Grandmaster', description: 'Giải 250 bài lập trình.', icon: 'workspace_premium', rarity: BadgeRarity.EPIC, criteriaType: BadgeCriteriaType.PROBLEMS_SOLVED, threshold: 250, rewardXp: 900, rewardGems: 90 },
  { code: 'LEGEND_500', title: 'Living Legend', description: 'Giải 500 bài lập trình.', icon: 'auto_awesome', rarity: BadgeRarity.LEGENDARY, criteriaType: BadgeCriteriaType.PROBLEMS_SOLVED, threshold: 500, rewardXp: 2000, rewardGems: 200 },

  // ── Maze (ladder) ───────────────────────────────────────────────────────────
  { code: 'MAZE_NOVICE', title: 'Maze Novice', description: 'Vượt 3 màn mê cung.', icon: 'route', rarity: BadgeRarity.COMMON, criteriaType: BadgeCriteriaType.MAZE_SOLVED, threshold: 3, rewardXp: 60, rewardGems: 6 },
  { code: 'MAZE_RUNNER', title: 'Maze Runner', description: 'Vượt 10 màn mê cung.', icon: 'extension', rarity: BadgeRarity.RARE, criteriaType: BadgeCriteriaType.MAZE_SOLVED, threshold: 10, rewardXp: 150, rewardGems: 15 },
  { code: 'MAZE_MASTER', title: 'Maze Master', description: 'Vượt 25 màn mê cung.', icon: 'account_tree', rarity: BadgeRarity.EPIC, criteriaType: BadgeCriteriaType.MAZE_SOLVED, threshold: 25, rewardXp: 400, rewardGems: 40 },
  { code: 'MAZE_LORD', title: 'Labyrinth Lord', description: 'Vượt 50 màn mê cung.', icon: 'hub', rarity: BadgeRarity.LEGENDARY, criteriaType: BadgeCriteriaType.MAZE_SOLVED, threshold: 50, rewardXp: 1000, rewardGems: 100 },

  // ── Streak (ladder) ─────────────────────────────────────────────────────────
  { code: 'STREAK_3', title: 'Warming Up', description: 'Duy trì chuỗi 3 ngày.', icon: 'mode_heat', rarity: BadgeRarity.COMMON, criteriaType: BadgeCriteriaType.STREAK_DAYS, threshold: 3, rewardXp: 60, rewardGems: 6 },
  { code: 'STREAK_7', title: 'On Fire', description: 'Duy trì chuỗi 7 ngày.', icon: 'local_fire_department', rarity: BadgeRarity.RARE, criteriaType: BadgeCriteriaType.STREAK_DAYS, threshold: 7, rewardXp: 150, rewardGems: 15 },
  { code: 'STREAK_14', title: 'Fortnight Flame', description: 'Duy trì chuỗi 14 ngày.', icon: 'bonfire', rarity: BadgeRarity.EPIC, criteriaType: BadgeCriteriaType.STREAK_DAYS, threshold: 14, rewardXp: 400, rewardGems: 40 },
  { code: 'STREAK_30', title: 'Unstoppable', description: 'Duy trì chuỗi 30 ngày.', icon: 'whatshot', rarity: BadgeRarity.LEGENDARY, criteriaType: BadgeCriteriaType.STREAK_DAYS, threshold: 30, rewardXp: 1000, rewardGems: 100 },
  { code: 'STREAK_100', title: 'Eternal Flame', description: 'Duy trì chuỗi 100 ngày.', icon: 'volcano', rarity: BadgeRarity.LEGENDARY, criteriaType: BadgeCriteriaType.STREAK_DAYS, threshold: 100, rewardXp: 3000, rewardGems: 300 },

  // ── Quests completed (ladder) ───────────────────────────────────────────────
  { code: 'QUEST_ROOKIE', title: 'Quest Rookie', description: 'Hoàn thành 5 nhiệm vụ.', icon: 'task_alt', rarity: BadgeRarity.COMMON, criteriaType: BadgeCriteriaType.QUESTS_COMPLETED, threshold: 5, rewardXp: 100, rewardGems: 10 },
  { code: 'QUEST_ADEPT', title: 'Quest Adept', description: 'Hoàn thành 10 nhiệm vụ.', icon: 'checklist', rarity: BadgeRarity.RARE, criteriaType: BadgeCriteriaType.QUESTS_COMPLETED, threshold: 10, rewardXp: 200, rewardGems: 20 },
  { code: 'QUEST_MASTER', title: 'Quest Master', description: 'Hoàn thành 20 nhiệm vụ.', icon: 'verified', rarity: BadgeRarity.EPIC, criteriaType: BadgeCriteriaType.QUESTS_COMPLETED, threshold: 20, rewardXp: 400, rewardGems: 40 },
  { code: 'QUEST_LEGEND', title: 'Quest Legend', description: 'Hoàn thành 50 nhiệm vụ.', icon: 'emoji_events', rarity: BadgeRarity.LEGENDARY, criteriaType: BadgeCriteriaType.QUESTS_COMPLETED, threshold: 50, rewardXp: 1200, rewardGems: 120 },
  { code: 'QUEST_GOD', title: 'Quest Deity', description: 'Hoàn thành 100 nhiệm vụ.', icon: 'temple_buddhist', rarity: BadgeRarity.LEGENDARY, criteriaType: BadgeCriteriaType.QUESTS_COMPLETED, threshold: 100, rewardXp: 2500, rewardGems: 250 },

  // ── Level (ladder) ──────────────────────────────────────────────────────────
  { code: 'LEVEL_5', title: 'Apprentice', description: 'Đạt cấp độ 5.', icon: 'grade', rarity: BadgeRarity.COMMON, criteriaType: BadgeCriteriaType.REACH_LEVEL, threshold: 5, rewardXp: 0, rewardGems: 25 },
  { code: 'LEVEL_10', title: 'Rising Star', description: 'Đạt cấp độ 10.', icon: 'trending_up', rarity: BadgeRarity.EPIC, criteriaType: BadgeCriteriaType.REACH_LEVEL, threshold: 10, rewardXp: 0, rewardGems: 50 },
  { code: 'LEVEL_25', title: 'Veteran', description: 'Đạt cấp độ 25.', icon: 'shield', rarity: BadgeRarity.LEGENDARY, criteriaType: BadgeCriteriaType.REACH_LEVEL, threshold: 25, rewardXp: 0, rewardGems: 150 },
  { code: 'LEVEL_50', title: 'Champion', description: 'Đạt cấp độ 50.', icon: 'military_tech', rarity: BadgeRarity.LEGENDARY, criteriaType: BadgeCriteriaType.REACH_LEVEL, threshold: 50, rewardXp: 0, rewardGems: 400 },

  // ── Gems (ladder) ───────────────────────────────────────────────────────────
  { code: 'GEM_COLLECTOR', title: 'Gem Collector', description: 'Tích lũy 100 đá quý.', icon: 'toll', rarity: BadgeRarity.COMMON, criteriaType: BadgeCriteriaType.EARN_GEMS, threshold: 100, rewardXp: 50, rewardGems: 0 },
  { code: 'RICH_KID', title: 'Gem Hoarder', description: 'Tích lũy 500 đá quý.', icon: 'diamond', rarity: BadgeRarity.RARE, criteriaType: BadgeCriteriaType.EARN_GEMS, threshold: 500, rewardXp: 0, rewardGems: 0 },
  { code: 'GEM_BARON', title: 'Gem Baron', description: 'Tích lũy 1.000 đá quý.', icon: 'paid', rarity: BadgeRarity.EPIC, criteriaType: BadgeCriteriaType.EARN_GEMS, threshold: 1000, rewardXp: 200, rewardGems: 0 },
  { code: 'GEM_TYCOON', title: 'Gem Tycoon', description: 'Tích lũy 2.000 đá quý.', icon: 'savings', rarity: BadgeRarity.LEGENDARY, criteriaType: BadgeCriteriaType.EARN_GEMS, threshold: 2000, rewardXp: 500, rewardGems: 0 },

  // ── XP (ladder) ─────────────────────────────────────────────────────────────
  { code: 'XP_1K', title: 'Bright Mind', description: 'Đạt 1.000 XP.', icon: 'lightbulb', rarity: BadgeRarity.COMMON, criteriaType: BadgeCriteriaType.EARN_XP, threshold: 1000, rewardXp: 0, rewardGems: 20 },
  { code: 'SCHOLAR', title: 'Scholar', description: 'Đạt 10.000 XP.', icon: 'school', rarity: BadgeRarity.LEGENDARY, criteriaType: BadgeCriteriaType.EARN_XP, threshold: 10000, rewardXp: 0, rewardGems: 100 },
  { code: 'XP_25K', title: 'Sage', description: 'Đạt 25.000 XP.', icon: 'psychology_alt', rarity: BadgeRarity.LEGENDARY, criteriaType: BadgeCriteriaType.EARN_XP, threshold: 25000, rewardXp: 0, rewardGems: 250 },
  { code: 'XP_50K', title: 'Enlightened', description: 'Đạt 50.000 XP.', icon: 'self_improvement', rarity: BadgeRarity.LEGENDARY, criteriaType: BadgeCriteriaType.EARN_XP, threshold: 50000, rewardXp: 0, rewardGems: 500 },

  // ── Daily check-in (collectible only — awarded via BadgesService.awardByCode
  //    from CheckinService's all-time-milestone/perfect-month loops, never via
  //    evaluateAndAward's criteria scan; threshold is a never-auto-fire
  //    sentinel). Reward is kept at 0/0 — the tangible reward is the wheel
  //    spin + gems-fallback granted by CheckinService itself. ─────────────────
  { code: 'checkin-streak-7', title: 'Điểm danh 7 ngày', description: 'Duy trì chuỗi điểm danh 7 ngày liên tiếp.', icon: 'event_available', rarity: BadgeRarity.COMMON, criteriaType: BadgeCriteriaType.STREAK_DAYS, threshold: 999999, rewardXp: 0, rewardGems: 0 },
  { code: 'checkin-streak-30', title: 'Điểm danh 30 ngày', description: 'Duy trì chuỗi điểm danh 30 ngày liên tiếp.', icon: 'local_fire_department', rarity: BadgeRarity.RARE, criteriaType: BadgeCriteriaType.STREAK_DAYS, threshold: 999999, rewardXp: 0, rewardGems: 0 },
  { code: 'checkin-streak-100', title: 'Điểm danh 100 ngày', description: 'Duy trì chuỗi điểm danh 100 ngày liên tiếp.', icon: 'military_tech', rarity: BadgeRarity.EPIC, criteriaType: BadgeCriteriaType.STREAK_DAYS, threshold: 999999, rewardXp: 0, rewardGems: 0 },
  { code: 'checkin-perfect-month', title: 'Tháng điểm danh hoàn hảo', description: 'Điểm danh đủ tất cả các ngày trong một tháng.', icon: 'calendar_month', rarity: BadgeRarity.LEGENDARY, criteriaType: BadgeCriteriaType.STREAK_DAYS, threshold: 999999, rewardXp: 0, rewardGems: 0 },
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
  // ── Daily (reset mỗi ngày) ──────────────────────────────────────────────────
  { title: 'Khởi động ngày mới', description: 'Nộp đúng 1 bài bất kỳ hôm nay.', type: QuestType.DAILY, objectiveType: QuestObjectiveType.SUBMIT_ACCEPTED, targetCount: 1, rewardXp: 30, rewardGems: 5, icon: 'wb_sunny', recurrence: QuestRecurrence.DAILY, sortOrder: 1, category: 'Daily' },
  { title: 'Cày ngày', description: 'Giải 3 bài lập trình trong ngày.', type: QuestType.DAILY, objectiveType: QuestObjectiveType.SOLVE_CODING, targetCount: 3, rewardXp: 80, rewardGems: 10, icon: 'today', recurrence: QuestRecurrence.DAILY, sortOrder: 2, category: 'Daily' },
  { title: 'Thử thách khó', description: 'Giải 1 bài độ khó HARD hôm nay.', type: QuestType.DAILY, objectiveType: QuestObjectiveType.SOLVE_BY_DIFFICULTY, objectiveConfig: { difficulty: 'HARD' }, targetCount: 1, rewardXp: 120, rewardGems: 15, icon: 'whatshot', recurrence: QuestRecurrence.DAILY, sortOrder: 3, category: 'Daily' },
  { title: 'Hâm nóng dễ dàng', description: 'Giải 2 bài độ khó EASY hôm nay.', type: QuestType.DAILY, objectiveType: QuestObjectiveType.SOLVE_BY_DIFFICULTY, objectiveConfig: { difficulty: 'EASY' }, targetCount: 2, rewardXp: 50, rewardGems: 8, icon: 'spa', recurrence: QuestRecurrence.DAILY, sortOrder: 4, category: 'Daily' },
  { title: 'Một màn mê cung', description: 'Vượt 1 màn mê cung hôm nay.', type: QuestType.DAILY, objectiveType: QuestObjectiveType.SOLVE_MAZE, targetCount: 1, rewardXp: 60, rewardGems: 8, icon: 'route', recurrence: QuestRecurrence.DAILY, sortOrder: 5, category: 'Daily' },
  { title: 'Gặt điểm hôm nay', description: 'Kiếm 100 điểm trong ngày.', type: QuestType.DAILY, objectiveType: QuestObjectiveType.EARN_POINTS, targetCount: 100, rewardXp: 70, rewardGems: 10, icon: 'paid', recurrence: QuestRecurrence.DAILY, sortOrder: 6, category: 'Daily' },
  { title: 'Tích XP mỗi ngày', description: 'Kiếm 150 XP trong ngày.', type: QuestType.DAILY, objectiveType: QuestObjectiveType.EARN_XP, targetCount: 150, rewardXp: 40, rewardGems: 6, icon: 'auto_graph', recurrence: QuestRecurrence.DAILY, sortOrder: 7, category: 'Daily' },
  { title: 'Combo trung cấp', description: 'Giải 2 bài độ khó MEDIUM hôm nay.', type: QuestType.DAILY, objectiveType: QuestObjectiveType.SOLVE_BY_DIFFICULTY, objectiveConfig: { difficulty: 'MEDIUM' }, targetCount: 2, rewardXp: 90, rewardGems: 12, icon: 'bolt', recurrence: QuestRecurrence.DAILY, sortOrder: 8, category: 'Daily' },
  { title: 'Chăm chỉ vượt mức', description: 'Giải 5 bài lập trình trong ngày.', type: QuestType.DAILY, objectiveType: QuestObjectiveType.SOLVE_CODING, targetCount: 5, rewardXp: 150, rewardGems: 20, icon: 'rocket_launch', recurrence: QuestRecurrence.DAILY, sortOrder: 9, category: 'Daily' },

  // ── Weekly (reset mỗi tuần) ─────────────────────────────────────────────────
  { title: 'Tuần năng suất', description: 'Giải 15 bài trong tuần này.', type: QuestType.WEEKLY, objectiveType: QuestObjectiveType.SOLVE_CODING, targetCount: 15, rewardXp: 300, rewardGems: 40, icon: 'date_range', recurrence: QuestRecurrence.WEEKLY, sortOrder: 1, category: 'Weekly' },
  { title: 'Nhà thám hiểm mê cung', description: 'Vượt 5 màn mê cung trong tuần.', type: QuestType.WEEKLY, objectiveType: QuestObjectiveType.SOLVE_MAZE, targetCount: 5, rewardXp: 250, rewardGems: 30, icon: 'extension', recurrence: QuestRecurrence.WEEKLY, sortOrder: 2, category: 'Weekly' },
  { title: 'Đấu trường khó', description: 'Giải 5 bài độ khó HARD trong tuần.', type: QuestType.WEEKLY, objectiveType: QuestObjectiveType.SOLVE_BY_DIFFICULTY, objectiveConfig: { difficulty: 'HARD' }, targetCount: 5, rewardXp: 400, rewardGems: 50, icon: 'local_fire_department', recurrence: QuestRecurrence.WEEKLY, sortOrder: 3, category: 'Weekly' },
  { title: 'Chuyên gia trung cấp', description: 'Giải 8 bài độ khó MEDIUM trong tuần.', type: QuestType.WEEKLY, objectiveType: QuestObjectiveType.SOLVE_BY_DIFFICULTY, objectiveConfig: { difficulty: 'MEDIUM' }, targetCount: 8, rewardXp: 320, rewardGems: 40, icon: 'trending_up', recurrence: QuestRecurrence.WEEKLY, sortOrder: 4, category: 'Weekly' },
  { title: 'Thợ săn điểm tuần', description: 'Tích lũy 1.000 điểm trong tuần.', type: QuestType.WEEKLY, objectiveType: QuestObjectiveType.EARN_POINTS, targetCount: 1000, rewardXp: 350, rewardGems: 45, icon: 'monetization_on', recurrence: QuestRecurrence.WEEKLY, sortOrder: 5, category: 'Weekly' },
  { title: 'Chăm chỉ cả tuần', description: 'Nộp bài đủ 5 ngày trong tuần.', type: QuestType.WEEKLY, objectiveType: QuestObjectiveType.STREAK_DAYS, targetCount: 5, rewardXp: 280, rewardGems: 35, icon: 'event_available', recurrence: QuestRecurrence.WEEKLY, sortOrder: 6, category: 'Weekly' },

  // ── Main story (chuỗi cốt truyện có prerequisite) ───────────────────────────
  { title: 'Bước chân đầu tiên', description: 'Giải bài lập trình đầu tiên.', type: QuestType.MAIN, objectiveType: QuestObjectiveType.SOLVE_CODING, targetCount: 1, rewardXp: 100, rewardGems: 10, icon: 'footprint', recurrence: QuestRecurrence.NONE, sortOrder: 1, category: 'Story', rewardBadgeCode: 'FIRST_BLOOD' },
  { title: 'Vững vàng cơ bản', description: 'Giải 10 bài lập trình.', type: QuestType.MAIN, objectiveType: QuestObjectiveType.SOLVE_CODING, targetCount: 10, rewardXp: 300, rewardGems: 30, icon: 'fitness_center', recurrence: QuestRecurrence.NONE, sortOrder: 2, category: 'Story', prerequisiteTitle: 'Bước chân đầu tiên', rewardBadgeCode: 'TEN_DOWN' },
  { title: 'Bậc thầy giải thuật', description: 'Giải 5 bài độ khó HARD.', type: QuestType.MAIN, objectiveType: QuestObjectiveType.SOLVE_BY_DIFFICULTY, objectiveConfig: { difficulty: 'HARD' }, targetCount: 5, rewardXp: 600, rewardGems: 60, icon: 'psychology', recurrence: QuestRecurrence.NONE, sortOrder: 3, category: 'Story', prerequisiteTitle: 'Vững vàng cơ bản', rewardBadgeCode: 'PROBLEM_SLAYER' },
  { title: 'Chinh phục nửa thế kỷ', description: 'Giải 50 bài lập trình.', type: QuestType.MAIN, objectiveType: QuestObjectiveType.SOLVE_CODING, targetCount: 50, rewardXp: 900, rewardGems: 90, icon: 'emoji_events', recurrence: QuestRecurrence.NONE, sortOrder: 4, category: 'Story', prerequisiteTitle: 'Bậc thầy giải thuật', rewardBadgeCode: 'HALF_CENTURY' },
  { title: 'Huyền thoại trăm bài', description: 'Giải 100 bài lập trình.', type: QuestType.MAIN, objectiveType: QuestObjectiveType.SOLVE_CODING, targetCount: 100, rewardXp: 1500, rewardGems: 150, icon: 'workspace_premium', recurrence: QuestRecurrence.NONE, sortOrder: 5, category: 'Story', prerequisiteTitle: 'Chinh phục nửa thế kỷ', rewardBadgeCode: 'CENTURION' },
  { title: 'Vươn tới cấp 5', description: 'Đạt cấp độ 5.', type: QuestType.MAIN, objectiveType: QuestObjectiveType.REACH_LEVEL, targetCount: 5, rewardXp: 0, rewardGems: 50, icon: 'stars', recurrence: QuestRecurrence.NONE, sortOrder: 6, category: 'Story', rewardBadgeCode: 'LEVEL_5' },
  { title: 'Ngôi sao đang lên', description: 'Đạt cấp độ 10.', type: QuestType.MAIN, objectiveType: QuestObjectiveType.REACH_LEVEL, targetCount: 10, rewardXp: 0, rewardGems: 100, icon: 'auto_awesome', recurrence: QuestRecurrence.NONE, sortOrder: 7, category: 'Story', prerequisiteTitle: 'Vươn tới cấp 5', rewardBadgeCode: 'LEVEL_10' },

  // ── Skill tree theo chủ đề (SOLVE_BY_TAG) ───────────────────────────────────
  { title: 'Khởi đầu cấu trúc dữ liệu', description: 'Giải 5 bài thuộc chủ đề Cấu trúc dữ liệu.', type: QuestType.MAIN, objectiveType: QuestObjectiveType.SOLVE_BY_TAG, objectiveConfig: { tag: 'data-structures' }, targetCount: 5, rewardXp: 250, rewardGems: 25, icon: 'account_tree', recurrence: QuestRecurrence.NONE, sortOrder: 8, category: 'Skill' },
  { title: 'Pháp sư đồ thị', description: 'Giải 5 bài thuộc chủ đề Đồ thị.', type: QuestType.MAIN, objectiveType: QuestObjectiveType.SOLVE_BY_TAG, objectiveConfig: { tag: 'graphs' }, targetCount: 5, rewardXp: 300, rewardGems: 30, icon: 'hub', recurrence: QuestRecurrence.NONE, sortOrder: 9, category: 'Skill' },
  { title: 'Nhà quy hoạch động', description: 'Giải 5 bài thuộc chủ đề Quy hoạch động.', type: QuestType.MAIN, objectiveType: QuestObjectiveType.SOLVE_BY_TAG, objectiveConfig: { tag: 'dynamic-programming' }, targetCount: 5, rewardXp: 350, rewardGems: 35, icon: 'grid_on', recurrence: QuestRecurrence.NONE, sortOrder: 10, category: 'Skill' },
  { title: 'Thợ săn chuỗi', description: 'Giải 5 bài thuộc chủ đề Xâu ký tự.', type: QuestType.MAIN, objectiveType: QuestObjectiveType.SOLVE_BY_TAG, objectiveConfig: { tag: 'strings' }, targetCount: 5, rewardXp: 250, rewardGems: 25, icon: 'text_fields', recurrence: QuestRecurrence.NONE, sortOrder: 11, category: 'Skill' },
  { title: 'Chuyên gia toán học', description: 'Giải 5 bài thuộc chủ đề Toán.', type: QuestType.MAIN, objectiveType: QuestObjectiveType.SOLVE_BY_TAG, objectiveConfig: { tag: 'math' }, targetCount: 5, rewardXp: 250, rewardGems: 25, icon: 'calculate', recurrence: QuestRecurrence.NONE, sortOrder: 12, category: 'Skill' },
  { title: 'Bậc thầy tham lam', description: 'Giải 5 bài thuộc chủ đề Tham lam.', type: QuestType.MAIN, objectiveType: QuestObjectiveType.SOLVE_BY_TAG, objectiveConfig: { tag: 'greedy' }, targetCount: 5, rewardXp: 260, rewardGems: 26, icon: 'bolt', recurrence: QuestRecurrence.NONE, sortOrder: 13, category: 'Skill' },
  { title: 'Người tìm đường nhị phân', description: 'Giải 5 bài thuộc chủ đề Tìm kiếm nhị phân.', type: QuestType.MAIN, objectiveType: QuestObjectiveType.SOLVE_BY_TAG, objectiveConfig: { tag: 'binary-search' }, targetCount: 5, rewardXp: 270, rewardGems: 27, icon: 'manage_search', recurrence: QuestRecurrence.NONE, sortOrder: 14, category: 'Skill' },
  { title: 'Kiến trúc sư cây', description: 'Giải 5 bài thuộc chủ đề Cây.', type: QuestType.MAIN, objectiveType: QuestObjectiveType.SOLVE_BY_TAG, objectiveConfig: { tag: 'trees' }, targetCount: 5, rewardXp: 300, rewardGems: 30, icon: 'park', recurrence: QuestRecurrence.NONE, sortOrder: 15, category: 'Skill' },
  { title: 'Phù thủy hai con trỏ', description: 'Giải 5 bài thuộc chủ đề Hai con trỏ.', type: QuestType.MAIN, objectiveType: QuestObjectiveType.SOLVE_BY_TAG, objectiveConfig: { tag: 'two-pointers' }, targetCount: 5, rewardXp: 250, rewardGems: 25, icon: 'sync_alt', recurrence: QuestRecurrence.NONE, sortOrder: 16, category: 'Skill' },
  { title: 'Nghệ nhân sắp xếp', description: 'Giải 5 bài thuộc chủ đề Sắp xếp.', type: QuestType.MAIN, objectiveType: QuestObjectiveType.SOLVE_BY_TAG, objectiveConfig: { tag: 'sorting' }, targetCount: 5, rewardXp: 240, rewardGems: 24, icon: 'sort', recurrence: QuestRecurrence.NONE, sortOrder: 17, category: 'Skill' },
  { title: 'Thợ lật bit', description: 'Giải 5 bài thuộc chủ đề Thao tác bit.', type: QuestType.MAIN, objectiveType: QuestObjectiveType.SOLVE_BY_TAG, objectiveConfig: { tag: 'bit-manipulation' }, targetCount: 5, rewardXp: 280, rewardGems: 28, icon: 'memory', recurrence: QuestRecurrence.NONE, sortOrder: 18, category: 'Skill' },

  // ── Skill tree tầng 2 (chuyên sâu, mở khoá sau tầng 1) ───────────────────────
  { title: 'Đồ thị nâng cao', description: 'Giải 15 bài thuộc chủ đề Đồ thị.', type: QuestType.MAIN, objectiveType: QuestObjectiveType.SOLVE_BY_TAG, objectiveConfig: { tag: 'graphs' }, targetCount: 15, rewardXp: 700, rewardGems: 70, icon: 'hub', recurrence: QuestRecurrence.NONE, sortOrder: 19, category: 'Skill', prerequisiteTitle: 'Pháp sư đồ thị' },
  { title: 'Quy hoạch động bậc thầy', description: 'Giải 15 bài thuộc chủ đề Quy hoạch động.', type: QuestType.MAIN, objectiveType: QuestObjectiveType.SOLVE_BY_TAG, objectiveConfig: { tag: 'dynamic-programming' }, targetCount: 15, rewardXp: 800, rewardGems: 80, icon: 'grid_on', recurrence: QuestRecurrence.NONE, sortOrder: 20, category: 'Skill', prerequisiteTitle: 'Nhà quy hoạch động' },
  { title: 'Cấu trúc dữ liệu tinh thông', description: 'Giải 15 bài thuộc chủ đề Cấu trúc dữ liệu.', type: QuestType.MAIN, objectiveType: QuestObjectiveType.SOLVE_BY_TAG, objectiveConfig: { tag: 'data-structures' }, targetCount: 15, rewardXp: 700, rewardGems: 70, icon: 'account_tree', recurrence: QuestRecurrence.NONE, sortOrder: 21, category: 'Skill', prerequisiteTitle: 'Khởi đầu cấu trúc dữ liệu' },

  // ── Bounties (mục tiêu lớn, một lần) ────────────────────────────────────────
  { title: 'Săn điểm', description: 'Tích lũy 500 điểm từ các bài tập.', type: QuestType.BOUNTY, objectiveType: QuestObjectiveType.EARN_POINTS, targetCount: 500, rewardXp: 200, rewardGems: 25, icon: 'paid', recurrence: QuestRecurrence.NONE, sortOrder: 1, category: 'Bounty' },
  { title: 'Đại gia điểm số', description: 'Tích lũy 5.000 điểm từ các bài tập.', type: QuestType.BOUNTY, objectiveType: QuestObjectiveType.EARN_POINTS, targetCount: 5000, rewardXp: 800, rewardGems: 100, icon: 'savings', recurrence: QuestRecurrence.NONE, sortOrder: 2, category: 'Bounty' },
  { title: 'Chuỗi 7 ngày', description: 'Giữ chuỗi hoạt động 7 ngày liên tiếp.', type: QuestType.BOUNTY, objectiveType: QuestObjectiveType.STREAK_DAYS, targetCount: 7, rewardXp: 250, rewardGems: 30, icon: 'local_fire_department', recurrence: QuestRecurrence.NONE, sortOrder: 3, category: 'Bounty', rewardBadgeCode: 'STREAK_7' },
  { title: 'Chuỗi 30 ngày', description: 'Giữ chuỗi hoạt động 30 ngày liên tiếp.', type: QuestType.BOUNTY, objectiveType: QuestObjectiveType.STREAK_DAYS, targetCount: 30, rewardXp: 1500, rewardGems: 150, icon: 'whatshot', recurrence: QuestRecurrence.NONE, sortOrder: 4, category: 'Bounty', prerequisiteTitle: 'Chuỗi 7 ngày', rewardBadgeCode: 'STREAK_30' },
  { title: 'Kho báu XP', description: 'Tích lũy 5.000 XP.', type: QuestType.BOUNTY, objectiveType: QuestObjectiveType.EARN_XP, targetCount: 5000, rewardXp: 0, rewardGems: 80, icon: 'diamond', recurrence: QuestRecurrence.NONE, sortOrder: 5, category: 'Bounty' },
  { title: 'Học giả 10K', description: 'Tích lũy 10.000 XP.', type: QuestType.BOUNTY, objectiveType: QuestObjectiveType.EARN_XP, targetCount: 10000, rewardXp: 0, rewardGems: 150, icon: 'school', recurrence: QuestRecurrence.NONE, sortOrder: 6, category: 'Bounty', prerequisiteTitle: 'Kho báu XP', rewardBadgeCode: 'SCHOLAR' },
  { title: 'Vua mê cung', description: 'Vượt tổng cộng 25 màn mê cung.', type: QuestType.BOUNTY, objectiveType: QuestObjectiveType.SOLVE_MAZE, targetCount: 25, rewardXp: 700, rewardGems: 80, icon: 'account_tree', recurrence: QuestRecurrence.NONE, sortOrder: 7, category: 'Bounty', rewardBadgeCode: 'MAZE_MASTER' },

  // ── Event (giới hạn thời gian) ──────────────────────────────────────────────
  { title: 'Sự kiện cuối tuần', description: 'Nộp đúng 10 bài trong thời gian sự kiện.', type: QuestType.EVENT, objectiveType: QuestObjectiveType.SUBMIT_ACCEPTED, targetCount: 10, rewardXp: 500, rewardGems: 50, icon: 'celebration', recurrence: QuestRecurrence.NONE, sortOrder: 1, category: 'Event', daysWindow: 14 },
  { title: 'Lễ hội thuật toán', description: 'Giải 20 bài lập trình trong thời gian lễ hội.', type: QuestType.EVENT, objectiveType: QuestObjectiveType.SOLVE_CODING, targetCount: 20, rewardXp: 1000, rewardGems: 120, icon: 'festival', recurrence: QuestRecurrence.NONE, sortOrder: 2, category: 'Event', daysWindow: 30 },
  { title: 'Cơn bão HARD', description: 'Giải 10 bài độ khó HARD trong sự kiện.', type: QuestType.EVENT, objectiveType: QuestObjectiveType.SOLVE_BY_DIFFICULTY, objectiveConfig: { difficulty: 'HARD' }, targetCount: 10, rewardXp: 1200, rewardGems: 140, icon: 'thunderstorm', recurrence: QuestRecurrence.NONE, sortOrder: 3, category: 'Event', daysWindow: 21 },
  { title: 'Tuần lễ mê cung', description: 'Vượt 15 màn mê cung trong sự kiện.', type: QuestType.EVENT, objectiveType: QuestObjectiveType.SOLVE_MAZE, targetCount: 15, rewardXp: 900, rewardGems: 100, icon: 'explore', recurrence: QuestRecurrence.NONE, sortOrder: 4, category: 'Event', daysWindow: 7 },
  { title: 'Đua điểm mùa hè', description: 'Kiếm 3.000 điểm trong sự kiện mùa hè.', type: QuestType.EVENT, objectiveType: QuestObjectiveType.EARN_POINTS, targetCount: 3000, rewardXp: 1100, rewardGems: 130, icon: 'wb_sunny', recurrence: QuestRecurrence.NONE, sortOrder: 5, category: 'Event', daysWindow: 45 },
  { title: 'Marathon 7 ngày', description: 'Giữ chuỗi hoạt động xuyên suốt sự kiện 7 ngày.', type: QuestType.EVENT, objectiveType: QuestObjectiveType.STREAK_DAYS, targetCount: 7, rewardXp: 800, rewardGems: 90, icon: 'directions_run', recurrence: QuestRecurrence.NONE, sortOrder: 6, category: 'Event', daysWindow: 7 },
  { title: 'Vượt cấp tốc hành', description: 'Đạt cấp độ 15 trong thời gian sự kiện.', type: QuestType.EVENT, objectiveType: QuestObjectiveType.REACH_LEVEL, targetCount: 15, rewardXp: 1500, rewardGems: 160, icon: 'rocket', recurrence: QuestRecurrence.NONE, sortOrder: 7, category: 'Event', daysWindow: 60 },

  // ── Bounty bậc cao (đỉnh chuỗi, dành cho học sinh top) ───────────────────────
  { title: 'Người chinh phục', description: 'Giải 250 bài lập trình.', type: QuestType.BOUNTY, objectiveType: QuestObjectiveType.SOLVE_CODING, targetCount: 250, rewardXp: 3000, rewardGems: 300, icon: 'workspace_premium', recurrence: QuestRecurrence.NONE, sortOrder: 8, category: 'Bounty', prerequisiteTitle: 'Huyền thoại trăm bài', rewardBadgeCode: 'GRANDMASTER_250' },
  { title: 'Đỉnh cao 500', description: 'Giải 500 bài lập trình.', type: QuestType.BOUNTY, objectiveType: QuestObjectiveType.SOLVE_CODING, targetCount: 500, rewardXp: 6000, rewardGems: 600, icon: 'auto_awesome', recurrence: QuestRecurrence.NONE, sortOrder: 9, category: 'Bounty', prerequisiteTitle: 'Người chinh phục', rewardBadgeCode: 'LEGEND_500' },
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
