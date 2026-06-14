import { ExamRankingRule, ExamTieMode } from '@cp/shared';
import { ExamRankingService } from './exam-ranking.service';
import { ExamScoringService, ParticipantAggregate } from './exam-scoring.service';

function agg(userId: string, over: Partial<ParticipantAggregate> = {}): ParticipantAggregate {
  return {
    userId,
    totalScore: 0,
    solvedCount: 0,
    penalty: 0,
    lastSolveTimeMs: null,
    problemResults: [],
    ...over,
  };
}

// rank() is pure — repos are never touched.
const svc = new ExamRankingService(null as never, null as never, new ExamScoringService());

describe('ExamRankingService.rank', () => {
  it('SCORE_THEN_TIME: higher score first, earlier time breaks ties', () => {
    const rows = svc.rank(
      [
        agg('u1', { totalScore: 100, lastSolveTimeMs: 5000 }),
        agg('u2', { totalScore: 100, lastSolveTimeMs: 2000 }),
        agg('u3', { totalScore: 120, lastSolveTimeMs: 9000 }),
      ],
      ExamRankingRule.SCORE_THEN_TIME,
      ExamTieMode.COMPETITION,
      null,
    );
    expect(rows.map((r) => r.userId)).toEqual(['u3', 'u2', 'u1']);
  });

  it('ICPC: more solved first, then lower penalty', () => {
    const rows = svc.rank(
      [
        agg('u1', { solvedCount: 2, penalty: 100 }),
        agg('u2', { solvedCount: 3, penalty: 300 }),
        agg('u3', { solvedCount: 2, penalty: 40 }),
      ],
      ExamRankingRule.ICPC,
      ExamTieMode.COMPETITION,
      null,
    );
    expect(rows.map((r) => r.userId)).toEqual(['u2', 'u3', 'u1']);
  });

  it('COMPETITION tie mode produces 1,1,3,3,5', () => {
    const rows = svc.rank(
      [
        agg('a', { totalScore: 100 }),
        agg('b', { totalScore: 100 }),
        agg('c', { totalScore: 90 }),
        agg('d', { totalScore: 90 }),
        agg('e', { totalScore: 80 }),
      ],
      ExamRankingRule.SCORE_ONLY,
      ExamTieMode.COMPETITION,
      null,
    );
    expect(rows.map((r) => r.displayRank)).toEqual([1, 1, 3, 3, 5]);
  });

  it('DENSE tie mode produces 1,1,2,2,3', () => {
    const rows = svc.rank(
      [
        agg('a', { totalScore: 100 }),
        agg('b', { totalScore: 100 }),
        agg('c', { totalScore: 90 }),
        agg('d', { totalScore: 90 }),
        agg('e', { totalScore: 80 }),
      ],
      ExamRankingRule.SCORE_ONLY,
      ExamTieMode.DENSE,
      null,
    );
    expect(rows.map((r) => r.displayRank)).toEqual([1, 1, 2, 2, 3]);
  });

  it('UNIQUE tie mode produces strictly increasing ranks', () => {
    const rows = svc.rank(
      [agg('a', { totalScore: 100 }), agg('b', { totalScore: 100 }), agg('c', { totalScore: 100 })],
      ExamRankingRule.SCORE_ONLY,
      ExamTieMode.UNIQUE,
      null,
    );
    expect(rows.map((r) => r.displayRank)).toEqual([1, 2, 3]);
  });

  it('is deterministic for full ties (stable by userId)', () => {
    const rows = svc.rank(
      [agg('b'), agg('a'), agg('c')],
      ExamRankingRule.SCORE_ONLY,
      ExamTieMode.UNIQUE,
      null,
    );
    expect(rows.map((r) => r.userId)).toEqual(['a', 'b', 'c']);
  });
});
