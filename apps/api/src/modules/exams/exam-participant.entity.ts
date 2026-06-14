import { Column, Entity, Index, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { ExamParticipantState } from '@cp/shared';
import { BaseEntity } from '../../common/entities/base.entity';
import { Exam } from './exam.entity';
import { User } from '../users/user.entity';

@Entity({ name: 'exam_participants' })
@Unique('UQ_exam_participant', ['examId', 'userId'])
export class ExamParticipant extends BaseEntity {
  @Index()
  @Column({ type: 'uuid', name: 'exam_id' })
  examId!: string;

  @ManyToOne(() => Exam, (e) => e.participants, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'exam_id' })
  exam!: Exam;

  @Index()
  @Column({ type: 'uuid', name: 'user_id' })
  userId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Index()
  @Column({ type: 'enum', enum: ExamParticipantState, default: ExamParticipantState.REGISTERED })
  state!: ExamParticipantState;

  /** First entry into the exam; anchors a per-participant duration window. */
  @Column({ type: 'timestamptz', nullable: true, name: 'joined_at' })
  joinedAt!: Date | null;

  @Column({ type: 'uuid', nullable: true, name: 'invited_by' })
  invitedBy!: string | null;

  @Column({ type: 'text', nullable: true, name: 'ban_reason' })
  banReason!: string | null;
}
