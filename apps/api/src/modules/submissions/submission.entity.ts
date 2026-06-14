import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { SubmissionStatus } from '@cp/shared';
import { User } from '../users/user.entity';
import { Assignment } from '../assignments/assignment.entity';

@Entity('submissions')
export class Submission {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  userId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column({ type: 'uuid' })
  assignmentId!: string;

  @ManyToOne(() => Assignment, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'assignmentId' })
  assignment!: Assignment;

  /**
   * Set when this submission belongs to an exam. Nullable so the regular
   * (non-exam) submission flow is unaffected.
   */
  @Column({ type: 'uuid', nullable: true, name: 'exam_id' })
  examId!: string | null;

  /**
   * Exam-relevant score (0..ExamProblem.points) computed by ExamScoringService
   * at submit/rejudge time. Lets the live leaderboard aggregate without
   * re-reading testResults. Null for non-exam submissions.
   */
  @Column({ type: 'int', nullable: true, name: 'exam_score' })
  examScore!: number | null;

  @Column({ type: 'varchar' })
  language!: string;

  @Column({ type: 'text' })
  code!: string;

  @Column({
    type: 'enum',
    enum: SubmissionStatus,
    default: SubmissionStatus.PENDING,
  })
  status!: SubmissionStatus;

  @Column({ type: 'int', nullable: true })
  totalExecutionTimeMs!: number | null;

  @Column({ type: 'int', nullable: true })
  maxMemoryBytes!: number | null;

  @Column({ type: 'int', default: 0 })
  passedCount!: number;

  @Column({ type: 'int', default: 0 })
  totalCount!: number;

  @OneToMany(() => SubmissionTestResult, (result) => result.submission, {
    cascade: true,
  })
  testResults!: SubmissionTestResult[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

@Entity('submission_test_results')
export class SubmissionTestResult {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  submissionId!: string;

  @ManyToOne(() => Submission, (sub) => sub.testResults, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'submissionId' })
  submission!: Submission;

  @Column({ type: 'int' })
  testCaseIndex!: number;

  @Column({
    type: 'enum',
    enum: SubmissionStatus,
  })
  status!: SubmissionStatus;

  @Column({ type: 'text', nullable: true })
  input!: string | null;

  @Column({ type: 'text' })
  expectedOutput!: string;

  @Column({ type: 'text' })
  actualOutput!: string;

  @Column({ type: 'int', nullable: true })
  executionTimeMs!: number | null;

  @Column({ type: 'int', nullable: true })
  memoryBytes!: number | null;

  @Column({ type: 'text', nullable: true })
  errorMessage!: string | null;
}
