import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ExamAuditAction, ExamRewardGrantStatus, ExamRewardType } from '@cp/shared';
import { ExamRewardRule } from './exam-reward-rule.entity';
import { ExamRewardGrant } from './exam-reward-grant.entity';
import { ExamRankingSnapshot } from './exam-ranking-snapshot.entity';
import { ExamProblem } from './exam-problem.entity';
import { ExamAuditService } from './exam-audit.service';
import { StudentProfile } from '../students/student-profile.entity';
import { Badge } from '../quests/badge.entity';
import { StudentBadge } from '../quests/student-badge.entity';
import { GamificationGateway } from '../quests/gamification.gateway';
import { applyXpGain } from '../quests/period-keys';

const XP_PER_LEVEL = 1000;

interface EvalContext {
  maxTotalScore: number;
  problemCount: number;
  firstSolvers: Set<string>;
}

/**
 * Evaluates reward rules against the official snapshot and grants gems/xp/badges
 * idempotently. The unique (exam,user,rule) constraint + the status state-machine
 * make grantAll safe to run repeatedly (copies QuestsService.applyRewardTx).
 */
@Injectable()
export class ExamRewardService {
  private readonly logger = new Logger(ExamRewardService.name);

  constructor(
    @InjectRepository(ExamRewardRule) private readonly rules: Repository<ExamRewardRule>,
    @InjectRepository(ExamRewardGrant) private readonly grants: Repository<ExamRewardGrant>,
    @InjectRepository(ExamRankingSnapshot) private readonly snapshots: Repository<ExamRankingSnapshot>,
    @InjectRepository(ExamProblem) private readonly examProblems: Repository<ExamProblem>,
    private readonly ds: DataSource,
    private readonly audit: ExamAuditService,
    private readonly gamification: GamificationGateway,
  ) {}

  async grantAll(examId: string, snapshotVersion: number, actorId: string | null): Promise<{ granted: number }> {
    const rules = await this.rules.find({ where: { examId, isActive: true }, order: { priority: 'ASC' } });
    if (rules.length === 0) return { granted: 0 };

    const snaps = await this.snapshots.find({ where: { examId, version: snapshotVersion } });
    if (snaps.length === 0) return { granted: 0 };

    const problems = await this.examProblems.find({ where: { examId } });
    const maxTotalScore = problems.reduce((sum, p) => sum + p.points, 0);
    const ctx: EvalContext = {
      maxTotalScore,
      problemCount: problems.length,
      firstSolvers: this.computeFirstSolvers(snaps),
    };

    let granted = 0;
    for (const rule of rules) {
      const winners = snaps.filter((s) => this.matches(rule, s, ctx));
      for (const snap of winners) {
        const ok = await this.grantOne(examId, snap.userId, rule, snapshotVersion);
        if (ok) granted += 1;
      }
    }

    await this.audit.log(examId, actorId, ExamAuditAction.REWARD_GRANTED, { granted });
    return { granted };
  }

  private computeFirstSolvers(snaps: ExamRankingSnapshot[]): Set<string> {
    const bestByProblem = new Map<string, { userId: string; time: number }>();
    for (const s of snaps) {
      for (const pr of s.perProblem ?? []) {
        if (!pr.solved || pr.solveTimeMs == null) continue;
        const cur = bestByProblem.get(pr.examProblemId);
        if (!cur || pr.solveTimeMs < cur.time) {
          bestByProblem.set(pr.examProblemId, { userId: s.userId, time: pr.solveTimeMs });
        }
      }
    }
    return new Set([...bestByProblem.values()].map((v) => v.userId));
  }

  private matches(rule: ExamRewardRule, snap: ExamRankingSnapshot, ctx: EvalContext): boolean {
    if (rule.type === ExamRewardType.PARTICIPATION) return true;
    if (rule.type === ExamRewardType.FIRST_SOLVE) return ctx.firstSolvers.has(snap.userId);

    const c = rule.condition ?? {};
    let ok = true;
    if (c.rankFrom != null || c.rankTo != null) {
      const from = c.rankFrom ?? 1;
      const to = c.rankTo ?? c.rankFrom ?? from;
      ok = ok && snap.displayRank >= from && snap.displayRank <= to;
    }
    if (c.minScore != null) ok = ok && snap.totalScore >= c.minScore;
    if (c.minScoreRatio != null) ok = ok && snap.totalScore >= c.minScoreRatio * ctx.maxTotalScore;
    if (c.minSolved != null) ok = ok && snap.solvedCount >= c.minSolved;
    return ok;
  }

  /** Idempotent single grant. Returns true if it credited this call. */
  private async grantOne(
    examId: string,
    userId: string,
    rule: ExamRewardRule,
    snapshotVersion: number,
  ): Promise<boolean> {
    // Claim a ledger row (no-op on conflict).
    await this.grants
      .createQueryBuilder()
      .insert()
      .into(ExamRewardGrant)
      .values({ examId, userId, rewardRuleId: rule.id, status: ExamRewardGrantStatus.PENDING, snapshotVersion })
      .orIgnore()
      .execute();

    const grant = await this.grants.findOne({ where: { examId, userId, rewardRuleId: rule.id } });
    if (!grant) return false;
    if (grant.status === ExamRewardGrantStatus.GRANTED || grant.status === ExamRewardGrantStatus.REVOKED) {
      return false; // already settled
    }

    return this.creditGrant(grant.id, rule, snapshotVersion, userId);
  }

  private async creditGrant(
    grantId: string,
    rule: ExamRewardRule,
    snapshotVersion: number,
    userId: string,
  ): Promise<boolean> {
    const gems = rule.reward?.gems ?? 0;
    const xp = rule.reward?.xp ?? 0;
    const badgeId = rule.reward?.badgeId ?? null;
    try {
      await this.ds.transaction(async (tx) => {
        const profileRepo = tx.getRepository(StudentProfile);
        const grantRepo = tx.getRepository(ExamRewardGrant);
        const badgeRepo = tx.getRepository(Badge);
        const studentBadgeRepo = tx.getRepository(StudentBadge);

        const profile = await profileRepo.findOne({ where: { userId } });
        if (profile) {
          const now = new Date();
          if (xp > 0) applyXpGain(profile, xp, now);
          if (gems > 0) profile.gems += gems;
          while (profile.xp >= (profile.level + 1) * XP_PER_LEVEL) profile.level += 1;
          if (badgeId) {
            const owned = await studentBadgeRepo.findOne({ where: { userId, badgeId } });
            if (!owned) {
              const badge = await badgeRepo.findOne({ where: { id: badgeId } });
              if (badge) {
                await studentBadgeRepo.save(studentBadgeRepo.create({ userId, badgeId }));
                badge.earnedCount += 1;
                await badgeRepo.save(badge);
                profile.badgesEarned += 1;
              }
            }
          }
          await profileRepo.save(profile);
        }

        await grantRepo.update(grantId, {
          status: ExamRewardGrantStatus.GRANTED,
          grantedGems: gems,
          grantedXp: xp,
          grantedBadgeId: badgeId,
          snapshotVersion,
          errorMessage: null,
        });
      });

      this.notify(userId, gems, xp, badgeId, rule.label);
      return true;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'reward grant failed';
      this.logger.error(`Reward grant failed for user ${userId}: ${message}`);
      await this.grants.update(grantId, { status: ExamRewardGrantStatus.FAILED, errorMessage: message });
      return false;
    }
  }

  private notify(userId: string, gems: number, xp: number, badgeId: string | null, label: string | null): void {
    this.gamification.publish(userId, {
      type: badgeId ? 'badge:earned' : 'quest:completed',
      title: label ?? 'Exam reward',
      message: `You earned${gems ? ` +${gems} gems` : ''}${xp ? ` +${xp} XP` : ''}`.trim() || 'Reward granted',
      icon: 'emoji_events',
      badgeId: badgeId ?? undefined,
      rewardXp: xp || undefined,
      rewardGems: gems || undefined,
      at: new Date().toISOString(),
    });
  }

  // ── Admin ops ──────────────────────────────────────────────────────────────

  async listGrants(examId: string): Promise<ExamRewardGrant[]> {
    return this.grants.find({ where: { examId }, relations: ['rule', 'user'], order: { createdAt: 'DESC' } });
  }

  async retryFailed(examId: string, actorId: string | null): Promise<{ retried: number }> {
    const failed = await this.grants.find({
      where: { examId, status: ExamRewardGrantStatus.FAILED },
      relations: ['rule'],
    });
    let retried = 0;
    for (const g of failed) {
      if (!g.rule) continue;
      const ok = await this.creditGrant(g.id, g.rule, g.snapshotVersion, g.userId);
      if (ok) retried += 1;
    }
    await this.audit.log(examId, actorId, ExamAuditAction.REWARD_RETRIED, { retried });
    return { retried };
  }

  async revokeGrant(examId: string, grantId: string, actorId: string | null): Promise<void> {
    const grant = await this.grants.findOne({ where: { id: grantId, examId } });
    if (!grant || grant.status !== ExamRewardGrantStatus.GRANTED) return;
    await this.ds.transaction(async (tx) => {
      const profileRepo = tx.getRepository(StudentProfile);
      const grantRepo = tx.getRepository(ExamRewardGrant);
      const studentBadgeRepo = tx.getRepository(StudentBadge);
      const badgeRepo = tx.getRepository(Badge);

      const profile = await profileRepo.findOne({ where: { userId: grant.userId } });
      if (profile) {
        // Best-effort: gems/lifetime-xp clamp at 0; weekly/monthly buckets not rolled back.
        profile.gems = Math.max(0, profile.gems - grant.grantedGems);
        profile.xp = Math.max(0, profile.xp - grant.grantedXp);
        if (grant.grantedBadgeId) {
          const owned = await studentBadgeRepo.findOne({ where: { userId: grant.userId, badgeId: grant.grantedBadgeId } });
          if (owned) {
            await studentBadgeRepo.delete({ id: owned.id });
            profile.badgesEarned = Math.max(0, profile.badgesEarned - 1);
            const badge = await badgeRepo.findOne({ where: { id: grant.grantedBadgeId } });
            if (badge) {
              badge.earnedCount = Math.max(0, badge.earnedCount - 1);
              await badgeRepo.save(badge);
            }
          }
        }
        await profileRepo.save(profile);
      }
      await grantRepo.update(grant.id, { status: ExamRewardGrantStatus.REVOKED });
    });
    await this.audit.log(examId, actorId, ExamAuditAction.REWARD_REVOKED, { grantId, userId: grant.userId });
  }
}
