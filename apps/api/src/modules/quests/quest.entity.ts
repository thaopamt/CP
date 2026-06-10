import { Column, Entity, Index, OneToMany } from 'typeorm';
import {
  IQuestObjectiveConfig,
  QuestObjectiveType,
  QuestRecurrence,
  QuestStatus,
  QuestType,
} from '@cp/shared';
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

  @Index()
  @Column({ type: 'enum', enum: QuestStatus, default: QuestStatus.PUBLISHED })
  status!: QuestStatus;

  // ── Objective ──────────────────────────────────────────────────────────────
  @Index()
  @Column({
    type: 'enum',
    enum: QuestObjectiveType,
    default: QuestObjectiveType.SUBMIT_ACCEPTED,
    name: 'objective_type',
  })
  objectiveType!: QuestObjectiveType;

  @Column({ type: 'jsonb', nullable: true, name: 'objective_config' })
  objectiveConfig!: IQuestObjectiveConfig | null;

  @Column({ type: 'int', default: 1, name: 'target_count' })
  targetCount!: number;

  // ── Rewards ────────────────────────────────────────────────────────────────
  @Column({ type: 'int', default: 50, name: 'reward_xp' })
  rewardXp!: number;

  @Column({ type: 'int', default: 10, name: 'reward_gems' })
  rewardGems!: number;

  @Column({ type: 'uuid', nullable: true, name: 'reward_badge_id' })
  rewardBadgeId!: string | null;

  // ── Presentation ───────────────────────────────────────────────────────────
  @Column({ type: 'varchar', length: 50, default: 'military_tech' })
  icon!: string;

  @Column({ type: 'varchar', length: 80, nullable: true })
  category!: string | null;

  @Column({ type: 'int', default: 0, name: 'sort_order' })
  sortOrder!: number;

  // ── Scheduling ─────────────────────────────────────────────────────────────
  @Column({ type: 'enum', enum: QuestRecurrence, default: QuestRecurrence.NONE })
  recurrence!: QuestRecurrence;

  @Column({ type: 'timestamptz', nullable: true, name: 'starts_at' })
  startsAt!: Date | null;

  @Column({ type: 'timestamptz', nullable: true, name: 'ends_at' })
  endsAt!: Date | null;

  // ── Gating & targeting ─────────────────────────────────────────────────────
  @Column({ type: 'uuid', nullable: true, name: 'prerequisite_quest_id' })
  prerequisiteQuestId!: string | null;

  @Column({ type: 'uuid', array: true, nullable: true, name: 'class_ids' })
  classIds!: string[] | null;

  @Index()
  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive!: boolean;

  @OneToMany(() => StudentQuest, (sq) => sq.quest)
  studentQuests!: StudentQuest[];
}
