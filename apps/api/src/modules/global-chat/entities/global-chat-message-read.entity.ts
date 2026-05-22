import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';

import { BaseEntity } from '../../../common/entities/base.entity';
import { User } from '../../users/user.entity';
import { GlobalChatMessageEntity } from './global-chat-message.entity';

@Entity({ name: 'global_chat_message_reads' })
@Index(['userId'], { unique: true })
@Index(['lastReadAt'])
export class GlobalChatMessageReadEntity extends BaseEntity {
  @Column({ type: 'uuid', name: 'user_id' })
  userId!: string;

  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ type: 'uuid', name: 'last_read_message_id', nullable: true })
  lastReadMessageId!: string | null;

  @ManyToOne(() => GlobalChatMessageEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'last_read_message_id' })
  lastReadMessage?: GlobalChatMessageEntity | null;

  @Column({ type: 'timestamptz', name: 'last_read_at' })
  lastReadAt!: Date;
}
