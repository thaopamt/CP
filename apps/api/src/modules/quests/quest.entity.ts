import { Column, Entity, Index, OneToMany } from 'typeorm';
import { QuestType } from '@cp/shared';
import { BaseEntity } from '../../common/entities/base.entity';
import { StudentQuest } from './student-quest.entity';

@Entity({ name: 'quests' })
export class Quest extends BaseEntity {
  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ type: 'text', default: '' })
  description!: string;

  @Index()
  @Column({ type: 'enum', enum: QuestType, default: QuestType.DAILY })
  type!: QuestType;

  @Column({ type: 'int', default: 1 })
  targetCount!: number;

  @Column({ type: 'int', default: 50 })
  rewardXp!: number;

  @Column({ type: 'int', default: 10 })
  rewardGems!: number;

  @Column({ type: 'varchar', length: 50, default: 'military_tech' })
  icon!: string;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @OneToMany(() => StudentQuest, (sq) => sq.quest)
  studentQuests!: StudentQuest[];
}
