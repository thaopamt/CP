import { Injectable } from '@nestjs/common';
import {
  ContestFormat,
  ExamRankingRule,
  ExamScoringMode,
  IExamProblemResult,
  IExamSettings,
  ISubtaskConfig,
  SubmissionStatus,
} from '@cp/shared';

/** A testcase verdict used to compute a per-submission score. */
export interface ScoringTestResult {
  testCaseIndex: number;
  status: SubmissionStatus;
}

/** A submission reduced to what scoring needs (decouples from the entity). */
export interface ScoringSubmission {
  id: string;
  userId: string;
  assignmentId: string;
  status: SubmissionStatus;
  createdAtMs: number;
  /** Pre-computed exam score (0..points). Populated from exam_score or recompute. */
  score: number;
}

/** A problem reduced to what scoring needs. */
export interface ScoringProblem {
  examProblemId: string;
  assignmentId: string;
  label: string | null;
  points: number;
  scoringMode: ExamScoringMode;
  subtaskConfig: ISubtaskConfig[] | null;
}

export interface ParticipantAggregate {
  userId: string;
  totalScore: number;
  solvedCount: number;
  penalty: number;
  lastSolveTimeMs: number | null;
  problemResults: IExamProblemResult[];
}

export interface AggregateParams {
  format: ContestFormat;
  rankingRule: ExamRankingRule;
  settings: IExamSettings | null;
  problems: ScoringProblem[];
  submissions: ScoringSubmission[];
  /** ms-since-epoch the participant's window started (exam start or join). */
  getStartMs: (userId: string) => number;
  /** Participants to always include (even with no submissions). */
  participantIds?: string[];
}

const DEFAULT_PENALTY_PER_WRONG_MIN = 20;

/**
 * Pure scoring layer. Computes per-submission scores from testcase results and
 * aggregates them per participant for every contest format. No DB access — fully
 * unit-testable.
 */
@Injectable()
export class ExamScoringService {
  /** Score a single submission (0..problem.points) from its testcase results. */
  computeSubmissionScore(testResults: ScoringTestResult[], problem: ScoringProblem): number {
    const total = testResults.length;
    if (total === 0) return 0;
    const passed = testResults.filter((t) => t.status === SubmissionStatus.ACCEPTED).length;

    switch (problem.scoringMode) {
      case ExamScoringMode.BINARY:
        return passed === total ? problem.points : 0;
      case ExamScoringMode.SUBTASK: {
        const subtasks = problem.subtaskConfig;
        if (!subtasks || subtasks.length === 0) {
          return Math.round((problem.points * passed) / total);
        }
        const passedByIndex = new Map<number, boolean>();
        for (const t of testResults) passedByIndex.set(t.testCaseIndex, t.status === SubmissionStatus.ACCEPTED);
        let score = 0;
        for (const st of subtasks) {
          let allPass = true;
          for (let i = st.testIndexFrom; i <= st.testIndexTo; i++) {
            if (!passedByIndex.get(i)) {
              allPass = false;
              break;
            }
          }
          if (allPass) score += st.points;
        }
        return score;
      }
      case ExamScoringMode.PARTIAL_TESTCASE:
      default:
        return Math.round((problem.points * passed) / total);
    }
  }

  /** Whether this contest uses ICPC-style scoring (solved count + penalty). */
  private isIcpcStyle(format: ContestFormat, rankingRule: ExamRankingRule): boolean {
    return format === ContestFormat.ICPC || rankingRule === ExamRankingRule.ICPC;
  }

  /**
   * Aggregate submissions into per-participant standings. Submissions passed in
   * are assumed already validated (in-window, valid participant, problem in
   * exam) — this method does pure arithmetic.
   */
  aggregate(params: AggregateParams): ParticipantAggregate[] {
    const { problems, submissions, settings, getStartMs } = params;
    const icpc = this.isIcpcStyle(params.format, params.rankingRule);
    const penaltyPerWrong = settings?.penaltyPerWrongMinutes ?? DEFAULT_PENALTY_PER_WRONG_MIN;
    const countCe = settings?.penaltyCountsCompileError ?? false;
    const bestPolicy = settings?.oiBestPolicy ?? 'max';

    const problemByAssignment = new Map(problems.map((p) => [p.assignmentId, p]));

    // Group submissions: userId -> assignmentId -> submissions (sorted by time).
    const byUser = new Map<string, Map<string, ScoringSubmission[]>>();
    const ensureUser = (userId: string) => {
      let m = byUser.get(userId);
      if (!m) {
        m = new Map();
        byUser.set(userId, m);
      }
      return m;
    };
    for (const uid of params.participantIds ?? []) ensureUser(uid);
    for (const s of submissions) {
      if (!problemByAssignment.has(s.assignmentId)) continue;
      const m = ensureUser(s.userId);
      const list = m.get(s.assignmentId) ?? [];
      list.push(s);
      m.set(s.assignmentId, list);
    }

    const results: ParticipantAggregate[] = [];
    for (const [userId, byProblem] of byUser) {
      const startMs = getStartMs(userId);
      const problemResults: IExamProblemResult[] = [];
      let totalScore = 0;
      let solvedCount = 0;
      let penalty = 0;
      let lastSolveTimeMs: number | null = null;

      for (const problem of problems) {
        const subs = (byProblem.get(problem.assignmentId) ?? []).slice().sort((a, b) => a.createdAtMs - b.createdAtMs);
        const result = icpc
          ? this.scoreProblemIcpc(problem, subs, startMs, penaltyPerWrong, countCe)
          : this.scoreProblemBest(problem, subs, startMs, bestPolicy);
        problemResults.push(result);
        totalScore += result.score;
        if (result.solved) solvedCount += 1;
        penalty += result.penalty;
        if (result.solveTimeMs != null && result.score > 0) {
          lastSolveTimeMs = Math.max(lastSolveTimeMs ?? 0, result.solveTimeMs);
        }
      }

      results.push({ userId, totalScore, solvedCount, penalty, lastSolveTimeMs, problemResults });
    }
    return results;
  }

  private scoreProblemIcpc(
    problem: ScoringProblem,
    subs: ScoringSubmission[],
    startMs: number,
    penaltyPerWrong: number,
    countCe: boolean,
  ): IExamProblemResult {
    const firstAc = subs.find((s) => s.status === SubmissionStatus.ACCEPTED);
    let penalty = 0;
    let solveTimeMs: number | null = null;
    let bestSubmissionId: string | null = null;

    if (firstAc) {
      const wrongBefore = subs
        .filter((s) => s.createdAtMs < firstAc.createdAtMs)
        .filter((s) => s.status !== SubmissionStatus.ACCEPTED && s.status !== SubmissionStatus.PENDING)
        .filter((s) => countCe || s.status !== SubmissionStatus.COMPILATION_ERROR).length;
      solveTimeMs = Math.max(0, firstAc.createdAtMs - startMs);
      const solveMinutes = Math.floor(solveTimeMs / 60000);
      penalty = solveMinutes + wrongBefore * penaltyPerWrong;
      bestSubmissionId = firstAc.id;
    }

    return {
      examProblemId: problem.examProblemId,
      assignmentId: problem.assignmentId,
      label: problem.label,
      score: firstAc ? problem.points : 0,
      maxScore: problem.points,
      solved: !!firstAc,
      attempts: subs.length,
      penalty,
      solveTimeMs,
      bestSubmissionId,
    };
  }

  private scoreProblemBest(
    problem: ScoringProblem,
    subs: ScoringSubmission[],
    startMs: number,
    bestPolicy: 'max' | 'last',
  ): IExamProblemResult {
    let chosen: ScoringSubmission | null = null;

    if (bestPolicy === 'last') {
      chosen = subs.length ? subs[subs.length - 1] : null;
    } else {
      // Max score; tie-break to the earliest submission achieving it.
      for (const s of subs) {
        if (!chosen || s.score > chosen.score) chosen = s;
      }
    }

    const score = chosen?.score ?? 0;
    const solved = !!subs.find((s) => s.status === SubmissionStatus.ACCEPTED);
    const solveTimeMs = chosen && score > 0 ? Math.max(0, chosen.createdAtMs - startMs) : null;

    return {
      examProblemId: problem.examProblemId,
      assignmentId: problem.assignmentId,
      label: problem.label,
      score,
      maxScore: problem.points,
      solved,
      attempts: subs.length,
      penalty: 0,
      solveTimeMs,
      bestSubmissionId: chosen?.id ?? null,
    };
  }
}
