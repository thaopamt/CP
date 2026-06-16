import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TypeOrmCrudService } from '@dataui/crud-typeorm';
import { DataSource, In, Not, Repository } from 'typeorm';
import {
  QuestDifficulty,
  IClaimQuestResult,
  IStudentQuestProgressData,
  QuestObjectiveType,
  QuestRecurrence,
  QuestStatus,
  StudentQuestStatus,
} from '@cp/shared';
import { Quest } from './quest.entity';
import { StudentQuest } from './student-quest.entity';
import { Badge } from './badge.entity';
import { StudentBadge } from './student-badge.entity';
import { StudentProfile } from '../students/student-profile.entity';
import { Enrollment } from '../classes/enrollment.entity';
import { BadgesService } from './badges.service';
import { GamificationGateway } from './gamification.gateway';
import { applyXpGain } from './period-keys';
import { advanceLevel } from '../../common/gamification.constants';
import { SystemCacheService } from '../../common/cache/system-cache.service';

/** Context emitted by the submission/maze pipelines into the objective engine. */
export interface QuestEngineEvent {
  kind: 'CODING_ACCEPTED' | 'MAZE_ACCEPTED';
  assignmentId?: string;
  difficulty?: QuestDifficulty;
  tags?: string[];
  points?: number;
  mazeLevelId?: string;
}



@Injectable()
export class QuestsService extends TypeOrmCrudService<Quest> {
  constructor(
    @InjectRepository(Quest) repo: Repository<Quest>,
    @InjectRepository(StudentQuest) private readonly studentQuests: Repository<StudentQuest>,
    @InjectRepository(StudentProfile) private readonly profiles: Repository<StudentProfile>,
    @InjectRepository(Enrollment) private readonly enrollments: Repository<Enrollment>,
    private readonly ds: DataSource,
    private readonly badges: BadgesService,
    private readonly gateway: GamificationGateway,
    private readonly cache: SystemCacheService,
  ) {
    super(repo);
  }

  /** Compact list for prerequisite pickers in the admin quest form. */
  async listOptions(): Promise<Pick<Quest, 'id' | 'title' | 'type' | 'icon'>[]> {
    return this.cache.remember(
      {
        namespace: 'quest-options',
        tags: ['quests:catalog'],
        ttlMs: 120_000,
      },
      () =>
        this.repo.find({
          select: ['id', 'title', 'type', 'icon'],
          order: { sortOrder: 'ASC', createdAt: 'DESC' },
        }),
    );
  }

  // ── Scheduling helpers ─────────────────────────────────────────────────────

  private periodKeyFor(quest: Quest, now: Date): string {
    if (quest.recurrence === QuestRecurrence.DAILY) return this.dayKey(now);
    if (quest.recurrence === QuestRecurrence.WEEKLY) return this.weekKey(now);
    return 'static';
  }

  private dayKey(d: Date): string {
    return d.toISOString().slice(0, 10); // YYYY-MM-DD (UTC)
  }

  private weekKey(d: Date): string {
    // ISO week number.
    const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
    const dayNum = date.getUTCDay() || 7;
    date.setUTCDate(date.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    const week = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
    return `${date.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
  }

  private isWithinWindow(quest: Quest, now: Date): boolean {
    if (quest.startsAt && now < new Date(quest.startsAt)) return false;
    if (quest.endsAt && now > new Date(quest.endsAt)) return false;
    return true;
  }

  private async studentClassIds(userId: string): Promise<string[]> {
    const rows = await this.enrollments.find({ where: { studentId: userId }, select: ['classId'] });
    return rows.map((r) => r.classId);
  }

  private isVisibleTo(quest: Quest, classIds: string[]): boolean {
    if (!quest.classIds || quest.classIds.length === 0) return true;
    return quest.classIds.some((c) => classIds.includes(c));
  }

  // ── Assignment / refresh ───────────────────────────────────────────────────

  /**
   * Make sure the student has a {@link StudentQuest} row for every currently
   * visible, in-window, published quest — for the active recurrence window.
   * Handles prerequisite locking and expiring stale recurring attempts.
   */
  async ensureQuestsAssigned(userId: string): Promise<void> {
    const now = new Date();
    const [allActive, existing, myClasses] = await Promise.all([
      this.repo.find({ where: { isActive: true, status: QuestStatus.PUBLISHED } }),
      this.studentQuests.find({ where: { userId } }),
      this.studentClassIds(userId),
    ]);

    const visible = allActive.filter((q) => this.isWithinWindow(q, now) && this.isVisibleTo(q, myClasses));

    // Which quests has the student already CLAIMED (satisfies prerequisites)?
    const claimedQuestIds = new Set(
      existing.filter((sq) => sq.status === StudentQuestStatus.CLAIMED).map((sq) => sq.questId),
    );
    const existingKeys = new Set(existing.map((sq) => `${sq.questId}:${sq.periodKey}`));

    const toCreate: Partial<StudentQuest>[] = [];
    for (const quest of visible) {
      const periodKey = this.periodKeyFor(quest, now);
      if (existingKeys.has(`${quest.id}:${periodKey}`)) continue;

      const locked = !!quest.prerequisiteQuestId && !claimedQuestIds.has(quest.prerequisiteQuestId);
      toCreate.push({
        userId,
        questId: quest.id,
        periodKey,
        progress: 0,
        progressData: { countedIds: [], pointsAccrued: 0 },
        status: locked ? StudentQuestStatus.LOCKED : StudentQuestStatus.IN_PROGRESS,
        startedAt: locked ? null : now,
      });
    }

    if (toCreate.length > 0) {
      // Idempotent under concurrent /student-quests/me requests.
      await this.studentQuests
        .createQueryBuilder()
        .insert()
        .into(StudentQuest)
        .values(toCreate)
        .orIgnore()
        .execute();
    }

    // Expire stale recurring attempts from older windows — regardless of status.
    // COMPLETED/CLAIMED rows from a past day/week must also be retired, otherwise
    // they linger forever next to the fresh attempt and the page looks un-reset.
    const staleIds = existing
      .filter(
        (sq) =>
          sq.status !== StudentQuestStatus.EXPIRED &&
          sq.periodKey !== 'static' &&
          sq.periodKey !== this.dayKey(now) &&
          sq.periodKey !== this.weekKey(now),
      )
      .map((sq) => sq.id);
    if (staleIds.length > 0) {
      await this.studentQuests.update({ id: In(staleIds) }, { status: StudentQuestStatus.EXPIRED });
    }

    if (toCreate.length > 0 || staleIds.length > 0) {
      await this.cache.bumpTags([`student:${userId}:quests`, `student:${userId}:dashboard`]);
    }
  }

  async getMyQuests(userId: string): Promise<StudentQuest[]> {
    await this.ensureQuestsAssigned(userId);
    return this.cache.remember(
      {
        namespace: 'student-quests',
        parts: [userId],
        tags: [`student:${userId}:quests`, 'quests:catalog'],
        ttlMs: 20_000,
      },
      () =>
        this.studentQuests.find({
          where: { userId, status: Not(StudentQuestStatus.EXPIRED) },
          relations: ['quest'],
          order: { quest: { sortOrder: 'ASC' }, createdAt: 'DESC' },
        }),
    );
  }

  // ── Claiming / auto-reward ───────────────────────────────────────────────────

  /**
   * Transactional core: marks a COMPLETED quest CLAIMED and grants its rewards
   * (XP, gems, level-ups, an attached badge). Returns null if the quest isn't in
   * a claimable state (e.g. lost a race). No emits / side effects here.
   */
  private async applyRewardTx(
    userId: string,
    studentQuestId: string,
  ): Promise<{ sq: StudentQuest; leveledUp: boolean; newLevel: number; badgeAwarded: Badge | null } | null> {
    return this.ds.transaction(async (tx) => {
      const sqRepo = tx.getRepository(StudentQuest);
      const profileRepo = tx.getRepository(StudentProfile);
      const badgeRepo = tx.getRepository(Badge);
      const studentBadgeRepo = tx.getRepository(StudentBadge);

      const sq = await sqRepo.findOne({ where: { id: studentQuestId, userId }, relations: ['quest'] });
      if (!sq || sq.status !== StudentQuestStatus.COMPLETED) return null;

      sq.status = StudentQuestStatus.CLAIMED;
      sq.claimedAt = new Date();
      await sqRepo.save(sq);

      const profile = await profileRepo.findOne({ where: { userId } });
      let leveledUp = false;
      let newLevel = profile?.level ?? 1;
      let badgeAwarded: Badge | null = null;

      if (profile) {
        const now = new Date();
        const prevLevel = profile.level;
        applyXpGain(profile, sq.quest.rewardXp, now);
        profile.gems += sq.quest.rewardGems;
        profile.questsCompleted += 1;
        leveledUp = advanceLevel(profile);
        newLevel = profile.level;

        if (sq.quest.rewardBadgeId) {
          const owned = await studentBadgeRepo.findOne({ where: { userId, badgeId: sq.quest.rewardBadgeId } });
          if (!owned) {
            const badge = await badgeRepo.findOne({ where: { id: sq.quest.rewardBadgeId } });
            if (badge) {
              await studentBadgeRepo.save(studentBadgeRepo.create({ userId, badgeId: badge.id }));
              badge.earnedCount += 1;
              await badgeRepo.save(badge);
              applyXpGain(profile, badge.rewardXp, now);
              profile.gems += badge.rewardGems;
              profile.badgesEarned += 1;
              // Re-check level after badge XP
              advanceLevel(profile);
              badgeAwarded = badge;
            }
          }
        }
        await profileRepo.save(profile);
      }

      return { sq, leveledUp, newLevel, badgeAwarded };
    });
  }

  /** Emit level-up / badge toasts and unlock dependent quests after a grant. */
  private async afterReward(
    userId: string,
    r: { sq: StudentQuest; leveledUp: boolean; newLevel: number; badgeAwarded: Badge | null },
  ): Promise<void> {
    await this.unlockDependents(userId, r.sq.questId);
    if (r.leveledUp) {
      this.gateway.publish(userId, {
        type: 'level:up',
        title: 'Level Up!',
        message: `You reached level ${r.newLevel}`,
        icon: 'trending_up',
        level: r.newLevel,
        at: new Date().toISOString(),
      });
    }
    if (r.badgeAwarded) {
      this.gateway.publish(userId, {
        type: 'badge:earned',
        title: r.badgeAwarded.title,
        message: r.badgeAwarded.description,
        icon: r.badgeAwarded.icon,
        badgeId: r.badgeAwarded.id,
        at: new Date().toISOString(),
      });
    }
  }

  /**
   * Auto mode: grant rewards for every COMPLETED quest immediately, cascading
   * through stat-based quests (a reward may push XP/level and complete another).
   * Bounded loop — each quest can complete at most once.
   */
  private async autoClaimAll(userId: string): Promise<void> {
    for (let guard = 0; guard < 50; guard++) {
      // Mark any stat quests (streak/xp/level) that are now satisfied.
      const profile = await this.profiles.findOne({ where: { userId } });
      if (profile) await this.syncStatQuests(userId, profile);

      const completed = await this.studentQuests.find({
        where: { userId, status: StudentQuestStatus.COMPLETED },
        relations: ['quest'],
      });
      if (completed.length === 0) break;

      for (const sq of completed) {
        const r = await this.applyRewardTx(userId, sq.id);
        if (r) await this.afterReward(userId, r);
      }

      const fresh = await this.profiles.findOne({ where: { userId } });
      await this.badges.evaluateAndAward(userId, fresh ?? undefined);
    }
  }

  /**
   * Public claim endpoint. Rewards are auto-granted on completion, so this mainly
   * serves legacy COMPLETED rows; it grants the requested quest then drains any
   * other completed quests.
   */
  async claimReward(userId: string, studentQuestId: string): Promise<IClaimQuestResult> {
    const r = await this.applyRewardTx(userId, studentQuestId);
    if (!r) {
      const exists = await this.studentQuests.findOne({ where: { id: studentQuestId, userId } });
      if (!exists) throw new NotFoundException('Quest progress not found');
      throw new BadRequestException('Quest is not ready to be claimed');
    }
    await this.afterReward(userId, r);
    await this.autoClaimAll(userId);
    const profile = await this.profiles.findOne({ where: { userId } });
    await this.badges.evaluateAndAward(userId, profile ?? undefined);
    await this.bumpStudentGamificationCaches(userId);

    return {
      studentQuest: r.sq as unknown as IClaimQuestResult['studentQuest'],
      awardedXp: r.sq.quest.rewardXp,
      awardedGems: r.sq.quest.rewardGems,
      newLevel: r.newLevel,
      leveledUp: r.leveledUp,
      badgeAwarded: (r.badgeAwarded as unknown as IClaimQuestResult['badgeAwarded']) ?? null,
    };
  }

  private async unlockDependents(userId: string, claimedQuestId: string): Promise<void> {
    const dependents = await this.studentQuests.find({
      where: { userId, status: StudentQuestStatus.LOCKED },
      relations: ['quest'],
    });
    const now = new Date();
    for (const sq of dependents) {
      if (sq.quest.prerequisiteQuestId === claimedQuestId) {
        sq.status = StudentQuestStatus.IN_PROGRESS;
        sq.startedAt = now;
        await this.studentQuests.save(sq);
      }
    }
  }

  // ── Objective engine ───────────────────────────────────────────────────────

  /** Convenience wrappers used by the submission & maze pipelines. */
  async handleCodingAccepted(
    userId: string,
    ctx: { assignmentId: string; difficulty?: QuestDifficulty; tags?: string[]; points?: number },
  ): Promise<void> {
    await this.handleEvent(userId, { kind: 'CODING_ACCEPTED', ...ctx });
  }

  async handleMazeAccepted(userId: string, ctx: { mazeLevelId: string }): Promise<void> {
    await this.handleEvent(userId, { kind: 'MAZE_ACCEPTED', ...ctx });
  }

  /** Back-compat shim — treats the event as a generic accepted submission. */
  async handleSubmissionAccepted(userId: string): Promise<void> {
    await this.handleEvent(userId, { kind: 'CODING_ACCEPTED' });
  }

  async handleEvent(userId: string, event: QuestEngineEvent): Promise<void> {
    // 1. Streak + lifetime counters first (other quests/badges read these).
    await this.updateProfileCounters(userId, event);

    // 2. Make sure today's recurring quests exist.
    await this.ensureQuestsAssigned(userId);

    // 3. Advance event-driven quests.
    const inProgress = await this.studentQuests.find({
      where: { userId, status: StudentQuestStatus.IN_PROGRESS },
      relations: ['quest'],
    });

    for (const sq of inProgress) {
      const next = this.applyEvent(sq, event);
      if (!next) continue;
      sq.progress = next.progress;
      sq.progressData = next.data;
      if (sq.progress >= sq.quest.targetCount) {
        sq.progress = sq.quest.targetCount;
        sq.status = StudentQuestStatus.COMPLETED;
        sq.completedAt = new Date();
      }
      await this.studentQuests.save(sq);
      if (sq.status === StudentQuestStatus.COMPLETED) this.emitQuestCompleted(userId, sq);
    }

    // 4. Auto-grant rewards for every completed quest (cascades stat quests),
    //    then evaluate milestone badges even if nothing completed.
    await this.autoClaimAll(userId);
    const fresh = await this.profiles.findOne({ where: { userId } });
    await this.badges.evaluateAndAward(userId, fresh ?? undefined);
    await this.bumpStudentGamificationCaches(userId);
  }

  /** Returns updated {progress, data} or null if this event doesn't apply. */
  private applyEvent(
    sq: StudentQuest,
    event: QuestEngineEvent,
  ): { progress: number; data: IStudentQuestProgressData } | null {
    const quest = sq.quest;
    const cfg = quest.objectiveConfig ?? {};
    const data: IStudentQuestProgressData = {
      countedIds: [...(sq.progressData?.countedIds ?? [])],
      pointsAccrued: sq.progressData?.pointsAccrued ?? 0,
    };
    const isCoding = event.kind === 'CODING_ACCEPTED';
    const isMaze = event.kind === 'MAZE_ACCEPTED';
    const resourceId = event.assignmentId ?? event.mazeLevelId;

    const countDistinct = (): { progress: number; data: IStudentQuestProgressData } | null => {
      if (!resourceId) {
        // No id to dedupe by — count the action itself.
        return { progress: sq.progress + 1, data };
      }
      if (!cfg.allowRepeat && data.countedIds!.includes(resourceId)) return null;
      data.countedIds!.push(resourceId);
      return { progress: cfg.allowRepeat ? sq.progress + 1 : data.countedIds!.length, data };
    };

    switch (quest.objectiveType) {
      case QuestObjectiveType.SUBMIT_ACCEPTED:
        return countDistinct();
      case QuestObjectiveType.SOLVE_CODING:
        return isCoding ? countDistinct() : null;
      case QuestObjectiveType.SOLVE_BY_DIFFICULTY:
        return isCoding && event.difficulty && event.difficulty === cfg.difficulty ? countDistinct() : null;
      case QuestObjectiveType.SOLVE_BY_TAG:
        return isCoding && cfg.tag && (event.tags ?? []).includes(cfg.tag) ? countDistinct() : null;
      case QuestObjectiveType.COMPLETE_ASSIGNMENT:
        if (!isCoding) return null;
        if (cfg.assignmentIds && cfg.assignmentIds.length > 0 && !cfg.assignmentIds.includes(event.assignmentId!)) {
          return null;
        }
        return countDistinct();
      case QuestObjectiveType.SOLVE_MAZE:
        if (!isMaze) return null;
        if (cfg.mazeLevelIds && cfg.mazeLevelIds.length > 0 && !cfg.mazeLevelIds.includes(event.mazeLevelId!)) {
          return null;
        }
        return countDistinct();
      case QuestObjectiveType.EARN_POINTS: {
        if (!isCoding || !event.points) return null;
        // Points credited once per assignment to avoid farming resubmissions.
        if (event.assignmentId && data.countedIds!.includes(event.assignmentId)) return null;
        if (event.assignmentId) data.countedIds!.push(event.assignmentId);
        data.pointsAccrued = (data.pointsAccrued ?? 0) + event.points;
        return { progress: data.pointsAccrued, data };
      }
      // Stat-based — handled by syncStatQuests, not events.
      case QuestObjectiveType.STREAK_DAYS:
      case QuestObjectiveType.EARN_XP:
      case QuestObjectiveType.REACH_LEVEL:
        return null;
      default:
        return null;
    }
  }

  /** Mirror current profile stats onto stat-based quests (streak/xp/level). */
  private async syncStatQuests(userId: string, profile: StudentProfile): Promise<void> {
    const statQuests = await this.studentQuests.find({
      where: {
        userId,
        status: StudentQuestStatus.IN_PROGRESS,
        quest: {
          objectiveType: In([
            QuestObjectiveType.STREAK_DAYS,
            QuestObjectiveType.EARN_XP,
            QuestObjectiveType.REACH_LEVEL,
          ]),
        },
      },
      relations: ['quest'],
    });

    for (const sq of statQuests) {
      const value =
        sq.quest.objectiveType === QuestObjectiveType.STREAK_DAYS
          ? profile.streak
          : sq.quest.objectiveType === QuestObjectiveType.EARN_XP
            ? profile.xp
            : profile.level;
      if (value <= sq.progress) continue;
      sq.progress = Math.min(value, sq.quest.targetCount);
      if (sq.progress >= sq.quest.targetCount) {
        sq.status = StudentQuestStatus.COMPLETED;
        sq.completedAt = new Date();
      }
      await this.studentQuests.save(sq);
      if (sq.status === StudentQuestStatus.COMPLETED) this.emitQuestCompleted(userId, sq);
    }
  }

  /** Update streak + lifetime solve counters on the profile. */
  private async updateProfileCounters(userId: string, event: QuestEngineEvent): Promise<StudentProfile | null> {
    const profile = await this.profiles.findOne({ where: { userId } });
    if (!profile) return null;

    const today = this.dayKey(new Date());
    if (profile.streakLastDate !== today) {
      const yesterday = this.dayKey(new Date(Date.now() - 86400000));
      profile.streak = profile.streakLastDate === yesterday ? profile.streak + 1 : 1;
      profile.streakLastDate = today;
    }
    if (event.kind === 'CODING_ACCEPTED') profile.problemsSolved += 1;
    if (event.kind === 'MAZE_ACCEPTED') profile.mazesSolved += 1;

    await this.profiles.save(profile);
    return profile;
  }

  private emitQuestCompleted(userId: string, sq: StudentQuest): void {
    this.gateway.publish(userId, {
      type: 'quest:completed',
      title: sq.quest.title,
      message: `Quest completed! +${sq.quest.rewardXp} XP, +${sq.quest.rewardGems} gems`,
      icon: sq.quest.icon,
      questId: sq.questId,
      rewardXp: sq.quest.rewardXp,
      rewardGems: sq.quest.rewardGems,
      at: new Date().toISOString(),
    });
  }

  private async bumpStudentGamificationCaches(userId: string): Promise<void> {
    await this.cache.bumpTags([
      `student:${userId}:quests`,
      `student:${userId}:badges`,
      `student:${userId}:dashboard`,
      `student:${userId}:profile`,
      `student:${userId}:shop`,
      'leaderboard:global',
    ]);
  }
}
