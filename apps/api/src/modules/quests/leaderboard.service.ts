import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ILeaderboardRankEntry,
  ILeaderboardParams,
  ILeaderboardResponse,
  LeaderboardScope,
  LeaderboardWindow,
} from '@cp/shared';
import { StudentProfile } from '../students/student-profile.entity';
import { StudentBadge } from './student-badge.entity';

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
    const scope: LeaderboardScope = params.scope ?? 'xp';
    const window: LeaderboardWindow = params.window ?? 'all_time';
    const limit = Math.min(100, Math.max(1, params.limit ?? 20));
    const orderCol = SCOPE_COLUMN[scope];

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
      value: this.scopeValue(p, scope),
      isMe: currentUserId ? p.userId === currentUserId : false,
    });

    const entries = topProfiles.map((p, i) => toEntry(p, i + 1));

    let me: ILeaderboardRankEntry | null = null;
    if (myProfile) {
      const myValue = this.scopeValue(myProfile, scope);
      const ahead = await baseQb
        .clone()
        .andWhere(`${orderCol} > :myValue`, { myValue })
        .getCount();
      me = toEntry(myProfile, ahead + 1);
    }

    return { scope, window, entries, me, total };
  }
}
