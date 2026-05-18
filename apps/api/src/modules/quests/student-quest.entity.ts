import { Column, Entity, Index, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { StudentQuestStatus } from '@cp/shared';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../users/user.entity';
import { Quest } from './quest.entity';

@Entity({ name: 'student_quests' })
@Unique('UQ_student_quest', ['userId', 'questId'])
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

  @Column({ type: 'enum', enum: StudentQuestStatus, default: StudentQuestStatus.IN_PROGRESS })
  status!: StudentQuestStatus;
}
