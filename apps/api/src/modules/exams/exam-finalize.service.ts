import { BadRequestException, ConflictException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ExamAuditAction, ExamStatus, IExam, SubmissionStatus } from '@cp/shared';
import { Submission } from '../submissions/submission.entity';
import { Exam } from './exam.entity';
import { ExamRankingSnapshot } from './exam-ranking-snapshot.entity';
import { ExamsService } from './exams.service';
import { ExamRankingService } from './exam-ranking.service';
import { ExamRewardService } from './exam-reward.service';
import { ExamAuditService } from './exam-audit.service';
import { ExamEventsGateway } from './exam-events.gateway';

@Injectable()
export class ExamFinalizeService {
  private readonly logger = new Logger(ExamFinalizeService.name);

  constructor(
    @InjectRepository(Exam) private readonly exams: Repository<Exam>,
    @InjectRepository(Submission) private readonly submissions: Repository<Submission>,
    @InjectRepository(ExamRankingSnapshot) private readonly snapshots: Repository<ExamRankingSnapshot>,
    private readonly ds: DataSource,
    private readonly examsService: ExamsService,
    private readonly ranking: ExamRankingService,
    private readonly rewards: ExamRewardService,
    private readonly audit: ExamAuditService,
    private readonly gateway: ExamEventsGateway,
  ) {}

  /**
   * Finalize an exam: lock, recompute official standings from testResults,
   * write an immutable snapshot, grant rewards (if auto), audit. Idempotent —
   * a CAS flip guards against concurrent/lazy double-finalize and re-calling a
   * FINALIZED exam is a no-op.
   */
  async finalize(examId: string, actorId: string | null, opts: { force?: boolean } = {}): Promise<IExam> {
    const exam = await this.examsService.loadExamOrThrow(examId);
    if (exam.status === ExamStatus.FINALIZED) return this.examsService.toDto(exam);
    if (exam.status !== ExamStatus.PUBLISHED && exam.status !== ExamStatus.FINALIZING) {
      throw new BadRequestException(`Cannot finalize an exam in status ${exam.status}`);
    }

    const ended = Date.now() > new Date(exam.endAt).getTime();
    if (!ended && !opts.force) {
      throw new BadRequestException('Exam has not ended yet (use force to override)');
    }

    // CAS: exactly one caller flips PUBLISHED -> FINALIZING.
    const cas = await this.exams.update({ id: examId, status: ExamStatus.PUBLISHED }, { status: ExamStatus.FINALIZING });
    if (cas.affected === 0) {
      const fresh = await this.examsService.loadExamOrThrow(examId);
      if (fresh.status === ExamStatus.FINALIZED) return this.examsService.toDto(fresh);
      throw new ConflictException('Exam is already being finalized');
    }

    try {
      // Pending policy: synchronous judge means PENDING is rare (orphans are
      // swept to INTERNAL_ERROR on boot). Block unless forced.
      const pending = await this.submissions.count({ where: { examId, status: SubmissionStatus.PENDING } });
      if (pending > 0 && !opts.force) {
        await this.exams.update({ id: examId }, { status: ExamStatus.PUBLISHED });
        throw new ConflictException(`${pending} submission(s) are still pending; retry shortly or force finalize`);
      }

      const newVersion = await this.buildSnapshot(exam, actorId);

      const reloaded = await this.examsService.loadExamOrThrow(examId);
      if (reloaded.autoGrantReward) {
        await this.rewards.grantAll(examId, newVersion, actorId);
      }

      this.ranking.invalidate(examId);
      this.gateway.emitStatusChanged(examId, ExamStatus.FINALIZED);
      this.gateway.emitLeaderboardChanged(examId);
      return this.examsService.toDto(reloaded);
    } catch (err) {
      // Roll the status back so the exam isn't stuck in FINALIZING.
      const cur = await this.exams.findOne({ where: { id: examId } });
      if (cur && cur.status === ExamStatus.FINALIZING) {
        await this.exams.update({ id: examId }, { status: ExamStatus.PUBLISHED });
      }
      throw err;
    }
  }

  /** Recompute the official snapshot for an already-finalized exam (admin). Does
   *  NOT auto-grant rewards — grants reference the old snapshot version. */
  async recalculate(examId: string, actorId: string | null): Promise<IExam> {
    const exam = await this.examsService.loadExamOrThrow(examId);
    if (exam.status !== ExamStatus.FINALIZED) {
      throw new BadRequestException('Only finalized exams can be recalculated');
    }
    await this.buildSnapshot(exam, actorId, { keepFinalized: true });
    this.ranking.invalidate(examId);
    this.gateway.emitLeaderboardChanged(examId);
    const reloaded = await this.examsService.loadExamOrThrow(examId);
    await this.audit.log(examId, actorId, ExamAuditAction.RANKING_RECALCULATED, { version: reloaded.snapshotVersion });
    return this.examsService.toDto(reloaded);
  }

  /** Recompute + persist a new snapshot version; returns the new version. */
  private async buildSnapshot(
    exam: Exam,
    actorId: string | null,
    opts: { keepFinalized?: boolean } = {},
  ): Promise<number> {
    const problems = await this.examsService.getScoringProblems(exam.id);
    const aggregates = await this.ranking.computeAggregates(exam, problems, { recompute: true });
    const rows = this.ranking.rank(aggregates, exam.rankingRule, exam.tieMode, exam.settings);
    const newVersion = exam.snapshotVersion + 1;

    await this.ds.transaction(async (tx) => {
      const snapRepo = tx.getRepository(ExamRankingSnapshot);
      const examRepo = tx.getRepository(Exam);

      if (rows.length > 0) {
        await snapRepo
          .createQueryBuilder()
          .insert()
          .into(ExamRankingSnapshot)
          .values(
            rows.map((r) => ({
              examId: exam.id,
              version: newVersion,
              userId: r.userId,
              rank: r.rank,
              displayRank: r.displayRank,
              totalScore: r.totalScore,
              solvedCount: r.solvedCount,
              penalty: r.penalty,
              lastSolveTimeMs: r.lastSolveTimeMs,
              perProblem: r.problemResults,
            })),
          )
          .orIgnore()
          .execute();
      }

      const patch: {
        snapshotVersion: number;
        status?: ExamStatus;
        finalizedAt?: Date;
        finalizedBy?: string | null;
      } = { snapshotVersion: newVersion };
      if (!opts.keepFinalized) {
        patch.status = ExamStatus.FINALIZED;
        patch.finalizedAt = new Date();
        patch.finalizedBy = actorId;
      }
      await examRepo.update({ id: exam.id }, patch);

      await this.audit.log(
        exam.id,
        actorId,
        opts.keepFinalized ? ExamAuditAction.SNAPSHOT_CREATED : ExamAuditAction.FINALIZED,
        { version: newVersion, participants: rows.length },
        tx,
      );
    });

    return newVersion;
  }
}
