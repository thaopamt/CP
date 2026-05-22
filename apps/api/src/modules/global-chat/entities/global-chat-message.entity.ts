import { GlobalChatMessageStatus } from '@cp/shared';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';

import { BaseEntity } from '../../../common/entities/base.entity';
import { User } from '../../users/user.entity';

@Entity({ name: 'global_chat_messages' })
@Index(['createdAt', 'id'])
@Index(['senderId', 'createdAt'])
@Index(['status', 'createdAt'])
export class GlobalChatMessageEntity extends BaseEntity {
  @Column({ type: 'uuid', name: 'sender_id' })
  senderId!: string;

  @ManyToOne(() => User, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'sender_id' })
  sender!: User;

  @Column({ type: 'text' })
  content!: string;

  @Column({ type: 'text', name: 'content_plain' })
  contentPlain!: string;

  @Column({
    type: 'enum',
    enum: GlobalChatMessageStatus,
    default: GlobalChatMessageStatus.VISIBLE,
  })
  status!: GlobalChatMessageStatus;

  @Column({ type: 'timestamptz', name: 'hidden_at', nullable: true })
  hiddenAt!: Date | null;

  @Column({ type: 'uuid', name: 'hidden_by_id', nullable: true })
  hiddenById!: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'hidden_by_id' })
  hiddenBy?: User | null;

  @Column({ type: 'varchar', length: 255, name: 'hidden_reason', nullable: true })
  hiddenReason!: string | null;
}
