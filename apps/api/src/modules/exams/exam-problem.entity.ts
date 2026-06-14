import { Column, Entity, Index, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { ExamScoringMode, ISubtaskConfig } from '@cp/shared';
import { BaseEntity } from '../../common/entities/base.entity';
import { Exam } from './exam.entity';
import { Assignment } from '../assignments/assignment.entity';

@Entity({ name: 'exam_problems' })
@Unique('UQ_exam_problem', ['examId', 'assignmentId'])
export class ExamProblem extends BaseEntity {
  @Index()
  @Column({ type: 'uuid', name: 'exam_id' })
  examId!: string;

  @ManyToOne(() => Exam, (e) => e.problems, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'exam_id' })
  exam!: Exam;

  @Index()
  @Column({ type: 'uuid', name: 'assignment_id' })
  assignmentId!: string;

  // RESTRICT: an assignment used by an exam cannot be hard-deleted out from under it.
  @ManyToOne(() => Assignment, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'assignment_id' })
  assignment!: Assignment;

  @Column({ type: 'int', default: 0, name: 'order_index' })
  orderIndex!: number;

  /** ICPC-style short label ("A", "B"…); falls back to order_index in UI. */
  @Column({ type: 'varchar', length: 8, nullable: true })
  label!: string | null;

  @Column({ type: 'int', default: 100 })
  points!: number;

  @Column({ type: 'enum', enum: ExamScoringMode, default: ExamScoringMode.PARTIAL_TESTCASE, name: 'scoring_mode' })
  scoringMode!: ExamScoringMode;

  @Column({ type: 'jsonb', nullable: true, name: 'subtask_config' })
  subtaskConfig!: ISubtaskConfig[] | null;
}
