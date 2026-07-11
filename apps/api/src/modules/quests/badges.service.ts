import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TypeOrmCrudService } from '@dataui/crud-typeorm';
import { DataSource, Repository } from 'typeorm';
import {
  BadgeCriteriaType,
  IBadge,
  IStudentBadgeProgress,
} from '@cp/shared';
import { Badge } from './badge.entity';
import { StudentBadge } from './student-badge.entity';
import { StudentProfile } from '../students/student-profile.entity';
import { GamificationGateway } from './gamification.gateway';
import { applyXpGain } from './period-keys';
import { advanceLevel } from '../../common/gamification.constants';
import { SystemCacheService } from '../../common/cache/system-cache.service';

@Injectable()
export class BadgesService extends TypeOrmCrudService<Badge> {
  constructor(
    @InjectRepository(Badge) private readonly badges: Repository<Badge>,
    @InjectRepository(StudentBadge) private readonly studentBadges: Repository<StudentBadge>,
    @InjectRepository(StudentProfile) private readonly profiles: Repository<StudentProfile>,
    private readonly ds: DataSource,
    private readonly gateway: GamificationGateway,
    private readonly cache: SystemCacheService,
  ) {
    super(badges);
  }

  /** Aggregate KPI stats for the admin badges list page. */
  async getStats(): Promise<{ total: number; active: number; totalEarned: number; legendary: number }> {
    return this.cache.remember(
      {
        namespace: 'badge-stats',
        tags: ['badges:catalog'],
        ttlMs: 30_000,
      },
      async () => {
        const raw = await this.badges
          .createQueryBuilder('b')
          .select('COUNT(*)::int', 'total')
          .addSelect('COUNT(*) FILTER (WHERE b.is_active = true)::int', 'active')
          .addSelect('COALESCE(SUM(b.earned_count), 0)::int', 'totalEarned')
          .addSelect("COUNT(*) FILTER (WHERE b.rarity = 'LEGENDARY')::int", 'legendary')
          .getRawOne();
        return {
          total: raw.total,
          active: raw.active,
          totalEarned: raw.totalEarned,
          legendary: raw.legendary,
        };
      },
    );
  }

  private statValue(profile: StudentProfile, type: BadgeCriteriaType): number {
    switch (type) {
      case BadgeCriteriaType.QUESTS_COMPLETED:
        return profile.questsCompleted;
      case BadgeCriteriaType.PROBLEMS_SOLVED:
        return profile.problemsSolved;
      case BadgeCriteriaType.MAZE_SOLVED:
        return profile.mazesSolved;
      case BadgeCriteriaType.STREAK_DAYS:
        return profile.streak;
      case BadgeCriteriaType.REACH_LEVEL:
        return profile.level;
      case BadgeCriteriaType.EARN_XP:
        return profile.xp;
      case BadgeCriteriaType.EARN_GEMS:
        return profile.gems;
      default:
        return 0;
    }
  }

  /**
   * Re-evaluate every active badge against the student's current stats and
   * award any that newly qualify. Returns the badges granted in this pass.
   */
  async evaluateAndAward(userId: string, profile?: StudentProfile): Promise<Badge[]> {
    const prof = profile ?? (await this.profiles.findOne({ where: { userId } }));
    if (!prof) return [];

    const [active, owned] = await Promise.all([
      this.badges.find({ where: { isActive: true } }),
      this.studentBadges.find({ where: { userId } }),
    ]);
    const ownedIds = new Set(owned.map((sb) => sb.badgeId));

    const eligible = active.filter(
      (b) => !ownedIds.has(b.id) && b.criteria && this.statValue(prof, b.criteria.type) >= b.criteria.threshold,
    );
    if (eligible.length === 0) return [];

    const awarded: Badge[] = [];
    await this.ds.transaction(async (tx) => {
      const sbRepo = tx.getRepository(StudentBadge);
      const badgeRepo = tx.getRepository(Badge);
      const profRepo = tx.getRepository(StudentProfile);
      const fresh = await profRepo.findOne({ where: { userId } });
      if (!fresh) return;
      const now = new Date();

      for (const badge of eligible) {
        // Guard against races: skip if already owned.
        const exists = await sbRepo.findOne({ where: { userId, badgeId: badge.id } });
        if (exists) continue;
        await sbRepo.save(sbRepo.create({ userId, badgeId: badge.id }));
        badge.earnedCount += 1;
        await badgeRepo.save(badge);
        applyXpGain(fresh, badge.rewardXp, now);
        fresh.gems += badge.rewardGems;
        fresh.badgesEarned += 1;
        advanceLevel(fresh);
        awarded.push(badge);
      }
      if (awarded.length > 0) await profRepo.save(fresh);
    });

    for (const badge of awarded) {
      this.gateway.publish(userId, {
        type: 'badge:earned',
        title: badge.title,
        message: badge.description,
        icon: badge.icon,
        badgeId: badge.id,
        rewardXp: badge.rewardXp,
        rewardGems: badge.rewardGems,
        at: new Date().toISOString(),
      });
    }
    if (awarded.length > 0) {
      await this.cache.bumpTags([
        `student:${userId}:badges`,
        `student:${userId}:dashboard`,
        `student:${userId}:profile`,
        'leaderboard:global',
      ]);
    }
    return awarded;
  }

  /**
   * Award a specific active badge by `code` (e.g. a check-in milestone badge
   * that never auto-fires via `evaluateAndAward`'s criteria scan). Mirrors
   * `evaluateAndAward`'s transactional award block exactly: same repos,
   * same XP/gems/level/earnedCount bookkeeping, same gateway + cache bump.
   * Returns the awarded `Badge`, or `null` if the code doesn't resolve to
   * an active badge or the student already owns it.
   */
  async awardByCode(userId: string, code: string, now: Date = new Date()): Promise<Badge | null> {
    const badge = await this.badges.findOne({ where: { code, isActive: true } });
    if (!badge) return null;

    const alreadyOwned = await this.studentBadges.findOne({ where: { userId, badgeId: badge.id } });
    if (alreadyOwned) return null;

    const awarded = await this.ds.transaction<Badge | null>(async (tx) => {
      const sbRepo = tx.getRepository(StudentBadge);
      const badgeRepo = tx.getRepository(Badge);
      const profRepo = tx.getRepository(StudentProfile);

      // Guard against races: skip if already owned (UQ_student_badge backstop).
      const exists = await sbRepo.findOne({ where: { userId, badgeId: badge.id } });
      if (exists) return null;

      const fresh = await profRepo.findOne({ where: { userId } });
      if (!fresh) return null;

      await sbRepo.save(sbRepo.create({ userId, badgeId: badge.id }));
      badge.earnedCount += 1;
      await badgeRepo.save(badge);
      applyXpGain(fresh, badge.rewardXp, now);
      fresh.gems += badge.rewardGems;
      fresh.badgesEarned += 1;
      advanceLevel(fresh);
      await profRepo.save(fresh);
      return badge;
    });

    if (awarded) {
      this.gateway.publish(userId, {
        type: 'badge:earned',
        title: awarded.title,
        message: awarded.description,
        icon: awarded.icon,
        badgeId: awarded.id,
        rewardXp: awarded.rewardXp,
        rewardGems: awarded.rewardGems,
        at: new Date().toISOString(),
      });
      await this.cache.bumpTags([
        `student:${userId}:badges`,
        `student:${userId}:dashboard`,
        `student:${userId}:profile`,
        'leaderboard:global',
      ]);
    }
    return awarded;
  }

  async getMyBadges(userId: string): Promise<StudentBadge[]> {
    return this.cache.remember(
      {
        namespace: 'student-badges',
        parts: [userId],
        tags: [`student:${userId}:badges`, 'badges:catalog'],
        ttlMs: 30_000,
      },
      () => this.studentBadges.find({ where: { userId }, order: { earnedAt: 'DESC' } }),
    );
  }

  /** Full catalog flagged earned/locked with progress for the badge wall. */
  async getCatalogWithProgress(userId: string): Promise<IStudentBadgeProgress[]> {
    return this.cache.remember(
      {
        namespace: 'student-badge-catalog',
        parts: [userId],
        tags: [`student:${userId}:badges`, `student:${userId}:profile`, 'badges:catalog'],
        ttlMs: 30_000,
      },
      async () => {
        const [active, owned, profile] = await Promise.all([
          this.badges.find({ where: { isActive: true }, order: { rarity: 'ASC', createdAt: 'ASC' } }),
          this.studentBadges.find({ where: { userId } }),
          this.profiles.findOne({ where: { userId } }),
        ]);
        const ownedMap = new Map(owned.map((sb) => [sb.badgeId, sb]));

        return active.map((badge) => {
          const earnedRow = ownedMap.get(badge.id);
          const current = profile ? this.statValue(profile, badge.criteria.type) : 0;
          const threshold = badge.criteria.threshold;
          return {
            badge: badge as unknown as IBadge,
            earned: !!earnedRow,
            earnedAt: earnedRow ? earnedRow.earnedAt.toISOString() : null,
            current,
            threshold,
            percent: earnedRow ? 100 : Math.min(100, Math.round((current / Math.max(1, threshold)) * 100)),
          };
        });
      },
    );
  }
}
