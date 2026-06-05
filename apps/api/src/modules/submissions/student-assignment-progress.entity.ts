import { Column, Entity, Index, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { SubmissionStatus } from '@cp/shared';

import { BaseEntity } from '../../common/entities/base.entity';
import { Assignment } from '../assignments/assignment.entity';
import { User } from '../users/user.entity';
import { Submission } from './submission.entity';

@Entity({ name: 'student_assignment_progress' })
@Unique('UQ_student_assignment_progress_student_assignment', ['studentId', 'assignmentId'])
export class StudentAssignmentProgress extends BaseEntity {
  @Index()
  @Column({ type: 'uuid', name: 'student_id' })
  studentId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id' })
  student!: User;

  @Index()
  @Column({ type: 'uuid', name: 'assignment_id' })
  assignmentId!: string;

  @ManyToOne(() => Assignment, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'assignment_id' })
  assignment!: Assignment;

  @Column({ type: 'boolean', default: false })
  completed!: boolean;

  @Column({ type: 'timestamptz', nullable: true, name: 'completed_at' })
  completedAt!: Date | null;

  @Column({ type: 'uuid', nullable: true, name: 'best_submission_id' })
  bestSubmissionId!: string | null;

  @ManyToOne(() => Submission, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'best_submission_id' })
  bestSubmission!: Submission | null;

  @Column({ type: 'uuid', nullable: true, name: 'last_submission_id' })
  lastSubmissionId!: string | null;

  @ManyToOne(() => Submission, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'last_submission_id' })
  lastSubmission!: Submission | null;

  @Column({ type: 'timestamptz', nullable: true, name: 'last_submitted_at' })
  lastSubmittedAt!: Date | null;

  @Column({ type: 'int', default: 0, name: 'attempt_count' })
  attemptCount!: number;

  @Column({ type: 'int', default: 0, name: 'passed_count' })
  passedCount!: number;

  @Column({ type: 'int', default: 0, name: 'total_count' })
  totalCount!: number;

  @Column({ type: 'enum', enum: SubmissionStatus, nullable: true, name: 'last_status' })
  lastStatus!: SubmissionStatus | null;
}
