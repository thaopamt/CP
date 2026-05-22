import { GlobalChatNotificationType } from '@cp/shared';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';

import { BaseEntity } from '../../../common/entities/base.entity';
import { User } from '../../users/user.entity';

@Entity({ name: 'notifications' })
@Index(['userId', 'readAt', 'createdAt'])
export class NotificationEntity extends BaseEntity {
  @Column({ type: 'uuid', name: 'user_id' })
  userId!: string;

  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ type: 'enum', enum: GlobalChatNotificationType })
  type!: GlobalChatNotificationType;

  @Column({ type: 'varchar', length: 160 })
  title!: string;

  @Column({ type: 'varchar', length: 500 })
  body!: string;

  @Column({ type: 'jsonb', nullable: true })
  data!: Record<string, unknown> | null;

  @Column({ type: 'timestamptz', name: 'read_at', nullable: true })
  readAt!: Date | null;
}
