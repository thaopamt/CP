import { ContestFormat, ExamRankingRule, ExamScoringMode, SubmissionStatus } from '@cp/shared';
import {
  ExamScoringService,
  ScoringProblem,
  ScoringSubmission,
} from './exam-scoring.service';

const AC = SubmissionStatus.ACCEPTED;
const WA = SubmissionStatus.WRONG_ANSWER;
const CE = SubmissionStatus.COMPILATION_ERROR;

function tcs(statuses: SubmissionStatus[]) {
  return statuses.map((status, testCaseIndex) => ({ testCaseIndex, status }));
}

function problem(over: Partial<ScoringProblem> = {}): ScoringProblem {
  return {
    examProblemId: 'p1',
    assignmentId: 'a1',
    label: 'A',
    points: 100,
    scoringMode: ExamScoringMode.PARTIAL_TESTCASE,
    subtaskConfig: null,
    ...over,
  };
}

function sub(over: Partial<ScoringSubmission> = {}): ScoringSubmission {
  return {
    id: 's1',
    userId: 'u1',
    assignmentId: 'a1',
    status: AC,
    createdAtMs: 0,
    score: 0,
    ...over,
  };
}

describe('ExamScoringService.computeSubmissionScore', () => {
  const svc = new ExamScoringService();

  it('BINARY: full points only when all testcases pass', () => {
    const p = problem({ scoringMode: ExamScoringMode.BINARY });
    expect(svc.computeSubmissionScore(tcs([AC, AC, AC]), p)).toBe(100);
    expect(svc.computeSubmissionScore(tcs([AC, WA, AC]), p)).toBe(0);
  });

  it('PARTIAL_TESTCASE: proportional to passed ratio', () => {
    const p = problem({ scoringMode: ExamScoringMode.PARTIAL_TESTCASE, points: 100 });
    expect(svc.computeSubmissionScore(tcs([AC, AC, AC, AC, AC, AC, AC, AC, AC, WA]), p)).toBe(90);
    expect(svc.computeSubmissionScore(tcs([WA, WA]), p)).toBe(0);
  });

  it('SUBTASK: all-or-nothing per declared range', () => {
    const p = problem({
      scoringMode: ExamScoringMode.SUBTASK,
      points: 100,
      subtaskConfig: [
        { name: 's1', testIndexFrom: 0, testIndexTo: 1, points: 40 },
        { name: 's2', testIndexFrom: 2, testIndexTo: 3, points: 60 },
      ],
    });
    // subtask1 passes (0,1), subtask2 fails (3 is WA)
    expect(svc.computeSubmissionScore(tcs([AC, AC, AC, WA]), p)).toBe(40);
    // both pass
    expect(svc.computeSubmissionScore(tcs([AC, AC, AC, AC]), p)).toBe(100);
    // both fail
    expect(svc.computeSubmissionScore(tcs([WA, AC, AC, WA]), p)).toBe(0);
  });

  it('SUBTASK falls back to proportional when no config', () => {
    const p = problem({ scoringMode: ExamScoringMode.SUBTASK, subtaskConfig: null, points: 100 });
    expect(svc.computeSubmissionScore(tcs([AC, AC, WA, WA]), p)).toBe(50);
  });

  it('returns 0 when there are no testcases', () => {
    expect(svc.computeSubmissionScore([], problem())).toBe(0);
  });
});

describe('ExamScoringService.aggregate', () => {
  const svc = new ExamScoringService();
  const start = () => 0;

  it('OI: sums best score per problem, tie-break to earliest best', () => {
    const problems = [problem({ examProblemId: 'pA', assignmentId: 'A' }), problem({ examProblemId: 'pB', assignmentId: 'B' })];
    const submissions: ScoringSubmission[] = [
      sub({ id: 's1', assignmentId: 'A', status: WA, score: 50, createdAtMs: 1000 }),
      sub({ id: 's2', assignmentId: 'A', status: WA, score: 80, createdAtMs: 2000 }),
      sub({ id: 's3', assignmentId: 'B', status: AC, score: 100, createdAtMs: 3000 }),
    ];
    const [agg] = svc.aggregate({
      format: ContestFormat.OI,
      rankingRule: ExamRankingRule.OI,
      settings: null,
      problems,
      submissions,
      getStartMs: start,
    });
    expect(agg.totalScore).toBe(180); // 80 + 100
    expect(agg.solvedCount).toBe(1); // only B fully solved
    const a = agg.problemResults.find((r) => r.assignmentId === 'A')!;
    expect(a.score).toBe(80);
    expect(a.bestSubmissionId).toBe('s2');
  });

  it('OI last-policy takes the chronologically last submission', () => {
    const problems = [problem({ examProblemId: 'pA', assignmentId: 'A' })];
    const submissions = [
      sub({ id: 's1', assignmentId: 'A', status: WA, score: 80, createdAtMs: 1000 }),
      sub({ id: 's2', assignmentId: 'A', status: WA, score: 50, createdAtMs: 2000 }),
    ];
    const [agg] = svc.aggregate({
      format: ContestFormat.OI,
      rankingRule: ExamRankingRule.OI,
      settings: { oiBestPolicy: 'last' },
      problems,
      submissions,
      getStartMs: start,
    });
    expect(agg.totalScore).toBe(50); // last submission, not max
  });

  it('ICPC: penalty = solve minutes + wrong-before-AC * 20; CE excluded by default', () => {
    const problems = [problem({ examProblemId: 'pA', assignmentId: 'A', scoringMode: ExamScoringMode.BINARY })];
    const submissions = [
      sub({ id: 's1', assignmentId: 'A', status: CE, createdAtMs: 30_000 }), // not penalised
      sub({ id: 's2', assignmentId: 'A', status: WA, createdAtMs: 60_000 }), // 1 penalty attempt
      sub({ id: 's3', assignmentId: 'A', status: AC, createdAtMs: 300_000 }), // solved at 5 min
    ];
    const [agg] = svc.aggregate({
      format: ContestFormat.ICPC,
      rankingRule: ExamRankingRule.ICPC,
      settings: null,
      problems,
      submissions,
      getStartMs: start,
    });
    expect(agg.solvedCount).toBe(1);
    expect(agg.penalty).toBe(5 + 20); // 5 minutes + 1 wrong * 20
    const a = agg.problemResults[0];
    expect(a.solved).toBe(true);
    expect(a.solveTimeMs).toBe(300_000);
  });

  it('ICPC: unsolved problem contributes no penalty', () => {
    const problems = [problem({ assignmentId: 'A', scoringMode: ExamScoringMode.BINARY })];
    const submissions = [sub({ assignmentId: 'A', status: WA, createdAtMs: 60_000 })];
    const [agg] = svc.aggregate({
      format: ContestFormat.ICPC,
      rankingRule: ExamRankingRule.ICPC,
      settings: null,
      problems,
      submissions,
      getStartMs: start,
    });
    expect(agg.solvedCount).toBe(0);
    expect(agg.penalty).toBe(0);
  });

  it('includes zero-rows for participants with no submissions', () => {
    const problems = [problem({ assignmentId: 'A' })];
    const aggs = svc.aggregate({
      format: ContestFormat.OI,
      rankingRule: ExamRankingRule.OI,
      settings: null,
      problems,
      submissions: [],
      participantIds: ['u1', 'u2'],
      getStartMs: start,
    });
    expect(aggs).toHaveLength(2);
    expect(aggs.every((a) => a.totalScore === 0)).toBe(true);
  });
});
