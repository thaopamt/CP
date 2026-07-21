import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';

import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../users/user.entity';
import { ChatConversation } from './chat-conversation.entity';

/**
 * A single chat message within a conversation.
 *
 * Indexed on (conversation_id, created_at DESC) so history queries
 * are fast with cursor-based pagination.
 */
@Entity({ name: 'chat_messages' })
@Index('IDX_chat_msg_conv_created', ['conversationId', 'createdAt'])
export class ChatMessage extends BaseEntity {
  @Column({ type: 'uuid', name: 'conversation_id' })
  conversationId!: string;

  @ManyToOne(() => ChatConversation, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'conversation_id' })
  conversation!: ChatConversation;

  @Index()
  @Column({ type: 'uuid', name: 'sender_id' })
  senderId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sender_id' })
  sender!: User;

  @Column({ type: 'text' })
  content!: string;

  @Column({ type: 'varchar', length: 20, default: 'normal' })
  type!: string;

  @Column({ type: 'text', name: 'image_url', nullable: true })
  imageUrl!: string | null;

  @Column({ type: 'varchar', length: 50, name: 'context_type', nullable: true })
  contextType!: string | null;

  @Column({ type: 'varchar', length: 100, name: 'context_id', nullable: true })
  contextId!: string | null;

  @Column({ type: 'text', name: 'context_title', nullable: true })
  contextTitle!: string | null;

  @Column({ type: 'text', name: 'context_meta', nullable: true })
  contextMeta!: string | null;

  @Column({ type: 'timestamptz', name: 'read_at', nullable: true })
  readAt!: Date | null;
}
