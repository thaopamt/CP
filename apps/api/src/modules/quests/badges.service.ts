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
