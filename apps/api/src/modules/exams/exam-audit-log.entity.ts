import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { ExamAuditAction } from '@cp/shared';

/** Append-only audit trail. Intentionally NOT extending BaseEntity (no soft
 *  delete / version / updated_at needed for an immutable log). */
@Entity({ name: 'exam_audit_logs' })
export class ExamAuditLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'uuid', name: 'exam_id' })
  examId!: string;

  /** Null = system action (e.g. lazy auto-finalize). */
  @Column({ type: 'uuid', nullable: true, name: 'actor_id' })
  actorId!: string | null;

  @Index()
  @Column({ type: 'enum', enum: ExamAuditAction })
  action!: ExamAuditAction;

  @Column({ type: 'jsonb', nullable: true, name: 'meta_json' })
  meta!: Record<string, unknown> | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;
}
