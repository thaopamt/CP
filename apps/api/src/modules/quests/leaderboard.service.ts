import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import {
  ILeaderboardRankEntry,
  ILeaderboardParams,
  ILeaderboardResponse,
  LeaderboardScope,
  LeaderboardWindow,
} from '@cp/shared';
import { StudentProfile } from '../students/student-profile.entity';
import { StudentBadge } from './student-badge.entity';
import { currentMonthlyXp, currentWeeklyXp, monthKey, weekKey, applyXpGain } from './period-keys';
import { SystemCacheService } from '../../common/cache/system-cache.service';
import { LeaderboardFinalizedWeek } from './leaderboard-finalized-week.entity';
import { StudentInventory } from '../shop/student-inventory.entity';
import { ShopItem } from '../shop/shop-item.entity';
import { advanceLevel } from '../../common/gamification.constants';

const SCOPE_COLUMN: Record<LeaderboardScope, string> = {
  xp: 'p.xp',
  level: 'p.level',
  gems: 'p.gems',
  questsCompleted: 'p.quests_completed',
  streak: 'p.streak',
};

@Injectable()
export class LeaderboardService {
  constructor(
    @InjectRepository(StudentProfile) private readonly profiles: Repository<StudentProfile>,
    @InjectRepository(StudentBadge) private readonly studentBadges: Repository<StudentBadge>,
    private readonly cache: SystemCacheService,
  ) {}

  private scopeValue(p: StudentProfile, scope: LeaderboardScope): number {
    switch (scope) {
      case 'xp':
        return p.xp;
      case 'level':
        return p.level;
      case 'gems':
        return p.gems;
      case 'questsCompleted':
        return p.questsCompleted;
      case 'streak':
        return p.streak;
    }
  }

  /**
   * Windowed ranking value. `weekly`/`monthly` rank by XP earned in the current
   * period (stale buckets count as 0 — the season has effectively reset);
   * `all_time` uses the chosen scope column.
   */
  private windowValue(
    p: StudentProfile,
    scope: LeaderboardScope,
    window: LeaderboardWindow,
    now: Date,
  ): number {
    if (window === 'weekly') return currentWeeklyXp(p, now);
    if (window === 'monthly') return currentMonthlyXp(p, now);
    return this.scopeValue(p, scope);
  }

  private async badgeCounts(userIds: string[]): Promise<Map<string, number>> {
    if (userIds.length === 0) return new Map();
    const rows = await this.studentBadges
      .createQueryBuilder('sb')
      .select('sb.user_id', 'userId')
      .addSelect('COUNT(*)', 'cnt')
      .where('sb.user_id IN (:...ids)', { ids: userIds })
      .groupBy('sb.user_id')
      .getRawMany<{ userId: string; cnt: string }>();
    return new Map(rows.map((r) => [r.userId, Number(r.cnt)]));
  }

  async getLeaderboard(params: ILeaderboardParams, currentUserId?: string): Promise<ILeaderboardResponse> {
    await this.checkAndFinalizeWeeklyLeaderboard();
    return this.cache.remember(
      {
        namespace: 'leaderboard',
        parts: [params, currentUserId ?? null],
        tags: ['leaderboard:global', ...(params.classId ? [`class:${params.classId}:leaderboard`] : [])],
        ttlMs: 10_000,
      },
      () => this.buildLeaderboard(params, currentUserId),
    );
  }

  async checkAndFinalizeWeeklyLeaderboard(now: Date = new Date()): Promise<void> {
    const prevWeekTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const prevWeek = weekKey(prevWeekTime);

    const finalizedRepo = this.profiles.manager.getRepository(LeaderboardFinalizedWeek);
    const exists = await finalizedRepo.findOne({ where: { weekKey: prevWeek } });
    if (exists) return;

    // Chạy trong transaction để đảm bảo tính toàn vẹn dữ liệu
    await this.profiles.manager.transaction(async (tx) => {
      const txFinalizedRepo = tx.getRepository(LeaderboardFinalizedWeek);
      const profRepo = tx.getRepository(StudentProfile);
      const invRepo = tx.getRepository(StudentInventory);
      const itemRepo = tx.getRepository(ShopItem);

      // Lock double-check
      const doubleCheck = await txFinalizedRepo.findOne({ where: { weekKey: prevWeek } });
      if (doubleCheck) return;

      // Query top 10 có week_key = prevWeek, sắp xếp theo weekly_xp desc
      const topProfiles = await profRepo
        .createQueryBuilder('p')
        .leftJoinAndSelect('p.user', 'u')
        .where('u.is_active = :active', { active: true })
        .andWhere('u.role = :role', { role: 'STUDENT' })
        .andWhere('p.week_key = :prevWeek', { prevWeek })
        .andWhere('p.weekly_xp > 0')
        .orderBy('p.weekly_xp', 'DESC')
        .addOrderBy('p.xp', 'DESC')
        .limit(10)
        .getMany();

      if (topProfiles.length === 0) {
        // Không có ai hoạt động tuần trước, lưu bản ghi trống
        await txFinalizedRepo.save(txFinalizedRepo.create({ weekKey: prevWeek, winners: [] }));
        return;
      }

      const avatarCodes = ['CHAR_WEEKLY_CHAMPION', 'CHAR_WEEKLY_ELITE', 'CHAR_WEEKLY_CHALLENGER'];
      const rewardItems = await itemRepo.find({ where: { code: In(avatarCodes) } });
      const itemMap = new Map(rewardItems.map((i) => [i.code, i]));

      const winnersData: LeaderboardFinalizedWeek['winners'] = [];

      for (let i = 0; i < topProfiles.length; i++) {
        const p = topProfiles[i];
        const rank = i + 1;
        let xpReward = 200;
        let gemsReward = 100;
        let avatarCode = 'CHAR_WEEKLY_CHALLENGER';

        if (rank === 1) {
          xpReward = 1000;
          gemsReward = 500;
          avatarCode = 'CHAR_WEEKLY_CHAMPION';
        } else if (rank === 2 || rank === 3) {
          xpReward = 500;
          gemsReward = 300;
          avatarCode = 'CHAR_WEEKLY_ELITE';
        }

        // 1. Cộng Gems & XP
        p.gems += gemsReward;
        applyXpGain(p, xpReward, now);
        advanceLevel(p);
        await profRepo.save(p);

        // 2. Trao avatar hết hạn sau 7 ngày
        const item = itemMap.get(avatarCode);
        if (item) {
          const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
          // Xóa avatar cũ cùng loại trong kho đồ nếu có trước khi insert mới
          await invRepo.delete({ userId: p.userId, itemId: item.id });
          await invRepo.save(invRepo.create({
            userId: p.userId,
            itemId: item.id,
            expiresAt,
            equipped: false
          }));
        }

        winnersData.push({
          userId: p.userId,
          name: p.user ? `${p.user.firstName} ${p.user.lastName}`.trim() : '—',
          avatarUrl: p.user?.avatarUrl ?? null,
          rank,
          weeklyXp: p.weeklyXp,
          rewards: { xp: xpReward, gems: gemsReward, avatarCode }
        });
      }

      await txFinalizedRepo.save(txFinalizedRepo.create({
        weekKey: prevWeek,
        winners: winnersData
      }));
    });
  }

  private async buildLeaderboard(params: ILeaderboardParams, currentUserId?: string): Promise<ILeaderboardResponse> {
    const scope: LeaderboardScope = params.scope ?? 'xp';
    const window: LeaderboardWindow = params.window ?? 'all_time';
    const limit = Math.min(100, Math.max(1, params.limit ?? 20));
    const now = new Date();

    // Windowed leaderboards rank by XP earned in the live period; a stale bucket
    // (key from a previous week/month) is treated as 0 via the CASE guard.
    const curWeek = weekKey(now);
    const curMonth = monthKey(now);
    const orderCol =
      window === 'weekly'
        ? `(CASE WHEN p.week_key = :curWeek THEN p.weekly_xp ELSE 0 END)`
        : window === 'monthly'
          ? `(CASE WHEN p.month_key = :curMonth THEN p.monthly_xp ELSE 0 END)`
          : SCOPE_COLUMN[scope];
    const periodParams = { curWeek, curMonth };

    const baseQb = this.profiles
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.user', 'u')
      .where('u.is_active = :active', { active: true })
      .andWhere('u.role = :role', { role: 'STUDENT' });

    if (params.classId) {
      baseQb.andWhere(
        'EXISTS (SELECT 1 FROM enrollments e WHERE e.student_id = p.user_id AND e.class_id = :classId)',
        { classId: params.classId },
      );
    }

    const total = await baseQb.clone().getCount();

    const topProfiles = await baseQb
      .clone()
      .orderBy(orderCol, 'DESC')
      .addOrderBy('p.xp', 'DESC')
      .addOrderBy('p.level', 'DESC')
      .setParameters(periodParams)
      .limit(limit)
      .getMany();

    // Resolve caller profile (for the "me" row) even if outside the top N.
    const myProfile = currentUserId
      ? await this.profiles.findOne({ where: { userId: currentUserId }, relations: ['user'] })
      : null;

    const idsForBadges = [...topProfiles.map((p) => p.userId)];
    if (myProfile) idsForBadges.push(myProfile.userId);
    const badgeMap = await this.badgeCounts([...new Set(idsForBadges)]);

    const toEntry = (p: StudentProfile, rank: number): ILeaderboardRankEntry => ({
      rank,
      userId: p.userId,
      name: p.user ? `${p.user.firstName} ${p.user.lastName}`.trim() : '—',
      avatarUrl: p.user?.avatarUrl ?? null,
      level: p.level,
      xp: p.xp,
      gems: p.gems,
      streak: p.streak,
      questsCompleted: p.questsCompleted,
      badgeCount: badgeMap.get(p.userId) ?? 0,
      value: this.windowValue(p, scope, window, now),
      nameColor: p.nameColor ?? null,
      title: p.equippedTitle ?? null,
      isMe: currentUserId ? p.userId === currentUserId : false,
    });

    const entries = topProfiles.map((p, i) => toEntry(p, i + 1));

    let me: ILeaderboardRankEntry | null = null;
    if (myProfile) {
      const myValue = this.windowValue(myProfile, scope, window, now);
      const ahead = await baseQb
        .clone()
        .andWhere(`${orderCol} > :myValue`, { myValue })
        .setParameters(periodParams)
        .getCount();
      me = toEntry(myProfile, ahead + 1);
    }

    return { scope, window, entries, me, total };
  }
}
