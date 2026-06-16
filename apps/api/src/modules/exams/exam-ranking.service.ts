import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import {
  ExamParticipantState,
  ExamRankingRule,
  ExamTieMode,
  IExamRankingRow,
  IExamSettings,
  SubmissionStatus,
} from '@cp/shared';
import { Submission } from '../submissions/submission.entity';
import { Exam } from './exam.entity';
import { ExamParticipant } from './exam-participant.entity';
import {
  ExamScoringService,
  ParticipantAggregate,
  ScoringProblem,
  ScoringSubmission,
} from './exam-scoring.service';
import { SystemCacheService } from '../../common/cache/system-cache.service';

const CACHE_TTL_MS = 4000;

/**
 * Ranking + live leaderboard. Pure rank/tie computation plus an N+1-free DB
 * aggregation (one GROUP-able pass over `submissions`, using the persisted
 * `exam_score`). Freeze is a time cutoff; a short distributed cache absorbs
 * leaderboard polling and is invalidated on every new exam submission.
 */
@Injectable()
export class ExamRankingService {
  constructor(
    @InjectRepository(Submission) private readonly submissions: Repository<Submission>,
    @InjectRepository(ExamParticipant) private readonly participants: Repository<ExamParticipant>,
    private readonly scoring: ExamScoringService,
    private readonly cache: SystemCacheService,
  ) {}

  invalidate(examId: string): void {
    void this.cache.bumpTags([`exam:${examId}:ranking`]);
  }

  // ── Pure ranking ───────────────────────────────────────────────────────────

  /** Sort + assign rank/displayRank. Names/avatars are filled in by the caller. */
  rank(
    aggregates: ParticipantAggregate[],
    rule: ExamRankingRule,
    tieMode: ExamTieMode,
    settings: IExamSettings | null,
  ): IExamRankingRow[] {
    const sorted = aggregates.slice().sort((a, b) => {
      const byRule = this.compareByRule(a, b, rule, settings);
      if (byRule !== 0) return byRule;
      return a.userId < b.userId ? -1 : a.userId > b.userId ? 1 : 0;
    });

    const rows: IExamRankingRow[] = [];
    let prevDisplay = 0;
    for (let i = 0; i < sorted.length; i++) {
      const agg = sorted[i];
      const tiedWithPrev = i > 0 && this.compareByRule(agg, sorted[i - 1], rule, settings) === 0;

      let displayRank: number;
      if (i === 0) displayRank = 1;
      else if (tieMode === ExamTieMode.UNIQUE) displayRank = i + 1;
      else if (tiedWithPrev) displayRank = prevDisplay;
      else if (tieMode === ExamTieMode.DENSE) displayRank = prevDisplay + 1;
      else displayRank = i + 1; // COMPETITION
      prevDisplay = displayRank;

      rows.push({
        rank: i + 1,
        displayRank,
        userId: agg.userId,
        name: '',
        username: null,
        avatarUrl: null,
        totalScore: agg.totalScore,
        solvedCount: agg.solvedCount,
        penalty: agg.penalty,
        lastSolveTimeMs: agg.lastSolveTimeMs,
        problemResults: agg.problemResults,
      });
    }
    return rows;
  }

  private compareByRule(
    a: ParticipantAggregate,
    b: ParticipantAggregate,
    rule: ExamRankingRule,
    settings: IExamSettings | null,
  ): number {
    const timeAsc = (x: number | null, y: number | null) => {
      const xv = x ?? Number.POSITIVE_INFINITY;
      const yv = y ?? Number.POSITIVE_INFINITY;
      return xv - yv;
    };
    switch (rule) {
      case ExamRankingRule.ICPC:
        if (b.solvedCount !== a.solvedCount) return b.solvedCount - a.solvedCount;
        if (a.penalty !== b.penalty) return a.penalty - b.penalty;
        return timeAsc(a.lastSolveTimeMs, b.lastSolveTimeMs);
      case ExamRankingRule.SCORE_ONLY:
        return b.totalScore - a.totalScore;
      case ExamRankingRule.OI:
      case ExamRankingRule.SCORE_THEN_TIME:
        if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
        return timeAsc(a.lastSolveTimeMs, b.lastSolveTimeMs);
      case ExamRankingRule.CUSTOM: {
        const keys = settings?.customRanking?.keys;
        if (keys && keys.length) {
          for (const k of keys) {
            const av = (a as unknown as Record<string, number>)[k.field] ?? 0;
            const bv = (b as unknown as Record<string, number>)[k.field] ?? 0;
            if (av !== bv) return k.dir === 'ASC' ? av - bv : bv - av;
          }
          return 0;
        }
        if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
        return timeAsc(a.lastSolveTimeMs, b.lastSolveTimeMs);
      }
      default:
        return b.totalScore - a.totalScore;
    }
  }

  // ── DB aggregation (live leaderboard) ────────────────────────────────────────

  /**
   * Compute aggregates from the DB. `asOf` (ms-since-epoch) hides submissions
   * created after it (freeze). Banned participants are excluded. When
   * `recompute` is set, scores are recomputed authoritatively from each
   * submission's testResults rather than the persisted `exam_score` (used by
   * finalize).
   */
  async computeAggregates(
    exam: Exam,
    problems: ScoringProblem[],
    opts: { asOf?: number | null; recompute?: boolean } = {},
  ): Promise<ParticipantAggregate[]> {
    const parts = await this.participants.find({ where: { examId: exam.id } });
    const active = parts.filter(
      (p) => p.state !== ExamParticipantState.BANNED && p.state !== ExamParticipantState.DISQUALIFIED,
    );
    const examStartMs = new Date(exam.startAt).getTime();
    const examEndMs = new Date(exam.endAt).getTime();
    const durMs = exam.durationMinutes ? exam.durationMinutes * 60000 : null;

    const windowByUser = new Map<string, { startMs: number; endMs: number }>();
    for (const p of active) {
      const startMs = durMs && p.joinedAt ? new Date(p.joinedAt).getTime() : examStartMs;
      const endMs = durMs ? Math.min(examEndMs, startMs + durMs) : examEndMs;
      windowByUser.set(p.userId, { startMs, endMs });
    }

    const assignmentIds = problems.map((p) => p.assignmentId);
    if (assignmentIds.length === 0) {
      return active.map((p) => ({
        userId: p.userId,
        totalScore: 0,
        solvedCount: 0,
        penalty: 0,
        lastSolveTimeMs: null,
        problemResults: [],
      }));
    }

    const rows = opts.recompute
      ? await this.submissions.find({
          where: { examId: exam.id, assignmentId: In(assignmentIds) },
          relations: ['testResults'],
          order: { createdAt: 'ASC' },
        })
      : await this.submissions.find({
          where: { examId: exam.id, assignmentId: In(assignmentIds) },
          select: ['id', 'userId', 'assignmentId', 'status', 'examScore', 'createdAt'],
          order: { createdAt: 'ASC' },
        });

    const problemByAssignment = new Map(problems.map((p) => [p.assignmentId, p]));
    const scoringSubs: ScoringSubmission[] = [];
    for (const r of rows) {
      const win = windowByUser.get(r.userId);
      if (!win) continue; // not an active participant
      const createdAtMs = new Date(r.createdAt).getTime();
      if (createdAtMs < win.startMs || createdAtMs > win.endMs) continue;
      if (opts.asOf != null && createdAtMs > opts.asOf) continue;
      let score = r.examScore ?? 0;
      if (opts.recompute) {
        const problem = problemByAssignment.get(r.assignmentId);
        score = problem
          ? this.scoring.computeSubmissionScore(
              (r.testResults ?? []).map((t) => ({ testCaseIndex: t.testCaseIndex, status: t.status })),
              problem,
            )
          : 0;
      }
      scoringSubs.push({
        id: r.id,
        userId: r.userId,
        assignmentId: r.assignmentId,
        status: r.status,
        createdAtMs,
        score,
      });
    }

    return this.scoring.aggregate({
      format: exam.format,
      rankingRule: exam.rankingRule,
      settings: exam.settings,
      problems,
      submissions: scoringSubs,
      participantIds: active.map((p) => p.userId),
      getStartMs: (userId) => windowByUser.get(userId)?.startMs ?? examStartMs,
    });
  }

  /** Cached live ranking (rows without names). */
  async rankedLive(
    exam: Exam,
    problems: ScoringProblem[],
    opts: { asOf?: number | null } = {},
  ): Promise<IExamRankingRow[]> {
    return this.cache.remember(
      {
        namespace: 'exam-ranking-live',
        parts: [
          exam.id,
          opts.asOf ?? 'live',
          exam.rankingRule,
          exam.tieMode,
          exam.settings,
          problems.map((problem) => ({
            examProblemId: problem.examProblemId,
            assignmentId: problem.assignmentId,
            points: problem.points,
            scoringMode: problem.scoringMode,
            subtaskConfig: problem.subtaskConfig,
          })),
        ],
        tags: [`exam:${exam.id}:ranking`],
        ttlMs: CACHE_TTL_MS,
      },
      async () => {
        const aggregates = await this.computeAggregates(exam, problems, opts);
        return this.rank(aggregates, exam.rankingRule, exam.tieMode, exam.settings);
      },
    );
  }
}
