import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';

import { BaseEntity } from '../../../common/entities/base.entity';
import { User } from '../../users/user.entity';

@Entity({ name: 'audit_logs' })
@Index(['actorId', 'createdAt'])
@Index(['action', 'createdAt'])
@Index(['targetType', 'targetId'])
export class AuditLogEntity extends BaseEntity {
  @Column({ type: 'uuid', name: 'actor_id', nullable: true })
  actorId!: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'actor_id' })
  actor?: User | null;

  @Column({ type: 'varchar', length: 80 })
  action!: string;

  @Column({ type: 'varchar', length: 80, name: 'target_type' })
  targetType!: string;

  @Column({ type: 'uuid', name: 'target_id', nullable: true })
  targetId!: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata!: Record<string, unknown> | null;

  @Column({ type: 'inet', name: 'ip_address', nullable: true })
  ipAddress!: string | null;

  @Column({ type: 'text', name: 'user_agent', nullable: true })
  userAgent!: string | null;
}
