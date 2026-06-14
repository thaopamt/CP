import { Column, Entity, Index, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { IExamProblemResult } from '@cp/shared';
import { BaseEntity } from '../../common/entities/base.entity';
import { Exam } from './exam.entity';

/**
 * Immutable official standings, written at finalize time. One row per
 * (exam, version, user). `version` matches Exam.snapshotVersion so a
 * post-finalize recalculation produces a new version without mutating the old.
 */
@Entity({ name: 'exam_ranking_snapshots' })
@Unique('UQ_exam_snapshot_row', ['examId', 'version', 'userId'])
@Index('IDX_exam_snapshot_rank', ['examId', 'version', 'rank'])
export class ExamRankingSnapshot extends BaseEntity {
  @Index()
  @Column({ type: 'uuid', name: 'exam_id' })
  examId!: string;

  @ManyToOne(() => Exam, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'exam_id' })
  exam!: Exam;

  @Column({ type: 'int' })
  version!: number;

  @Index()
  @Column({ type: 'uuid', name: 'user_id' })
  userId!: string;

  @Column({ type: 'int' })
  rank!: number;

  @Column({ type: 'int', name: 'display_rank' })
  displayRank!: number;

  @Column({ type: 'int', default: 0, name: 'total_score' })
  totalScore!: number;

  @Column({ type: 'int', default: 0, name: 'solved_count' })
  solvedCount!: number;

  @Column({ type: 'int', default: 0 })
  penalty!: number;

  @Column({ type: 'bigint', nullable: true, name: 'last_solve_time_ms' })
  lastSolveTimeMs!: number | null;

  @Column({ type: 'jsonb', name: 'per_problem' })
  perProblem!: IExamProblemResult[];
}
