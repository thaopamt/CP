import { Column, Entity, Index, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { IStudentQuestProgressData, StudentQuestStatus } from '@cp/shared';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../users/user.entity';
import { Quest } from './quest.entity';

@Entity({ name: 'student_quests' })
// One row per student, per quest, per recurrence window.
@Unique('UQ_student_quest', ['userId', 'questId', 'periodKey'])
export class StudentQuest extends BaseEntity {
  @Index()
  @Column({ type: 'uuid', name: 'user_id' })
  userId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Index()
  @Column({ type: 'uuid', name: 'quest_id' })
  questId!: string;

  @ManyToOne(() => Quest, (q) => q.studentQuests, { onDelete: 'CASCADE', eager: true })
  @JoinColumn({ name: 'quest_id' })
  quest!: Quest;

  @Column({ type: 'int', default: 0 })
  progress!: number;

  @Index()
  @Column({ type: 'enum', enum: StudentQuestStatus, default: StudentQuestStatus.IN_PROGRESS })
  status!: StudentQuestStatus;

  @Column({ type: 'jsonb', nullable: true, name: 'progress_data' })
  progressData!: IStudentQuestProgressData | null;

  /** 'static' for non-recurring quests, else e.g. '2026-06-09' / '2026-W23'. */
  @Column({ type: 'varchar', length: 20, default: 'static', name: 'period_key' })
  periodKey!: string;

  @Column({ type: 'timestamptz', nullable: true, name: 'started_at' })
  startedAt!: Date | null;

  @Column({ type: 'timestamptz', nullable: true, name: 'completed_at' })
  completedAt!: Date | null;

  @Column({ type: 'timestamptz', nullable: true, name: 'claimed_at' })
  claimedAt!: Date | null;
}
