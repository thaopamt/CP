import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  Unique,
} from 'typeorm';

import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../users/user.entity';

/**
 * A chat "thread" belonging to a single student.
 *
 * All teachers and admins can view and reply to any thread.
 * Constraint: one thread per student (UNIQUE on student_id).
 */
@Entity({ name: 'chat_conversations' })
@Unique('UQ_chat_student', ['studentId'])
export class ChatConversation extends BaseEntity {
  @Index()
  @Column({ type: 'uuid', name: 'student_id' })
  studentId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id' })
  student!: User;

  /** Denormalized for fast list queries. */
  @Column({ type: 'text', nullable: true, name: 'last_message' })
  lastMessage!: string | null;

  @Column({
    type: 'timestamptz',
    nullable: true,
    name: 'last_message_at',
  })
  lastMessageAt!: Date | null;
}
