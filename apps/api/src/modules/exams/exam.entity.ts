import { Column, Entity, Index, OneToMany } from 'typeorm';
import {
  ContestFormat,
  ExamRankingRule,
  ExamStatus,
  ExamTieMode,
  ExamVisibility,
  IExamSettings,
} from '@cp/shared';
import { BaseEntity } from '../../common/entities/base.entity';
import { ExamProblem } from './exam-problem.entity';
import { ExamParticipant } from './exam-participant.entity';

@Entity({ name: 'exams' })
export class Exam extends BaseEntity {
  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Index({ unique: true, where: 'slug IS NOT NULL' })
  @Column({ type: 'varchar', length: 255, nullable: true })
  slug!: string | null;

  @Column({ type: 'text', default: '' })
  description!: string;

  @Index()
  @Column({ type: 'enum', enum: ContestFormat, default: ContestFormat.PRACTICE })
  format!: ContestFormat;

  @Column({ type: 'enum', enum: ExamRankingRule, default: ExamRankingRule.SCORE_THEN_TIME, name: 'ranking_rule' })
  rankingRule!: ExamRankingRule;

  @Column({ type: 'enum', enum: ExamTieMode, default: ExamTieMode.COMPETITION, name: 'tie_mode' })
  tieMode!: ExamTieMode;

  @Index()
  @Column({ type: 'enum', enum: ExamStatus, default: ExamStatus.DRAFT })
  status!: ExamStatus;

  @Index()
  @Column({ type: 'timestamptz', name: 'start_at' })
  startAt!: Date;

  @Index()
  @Column({ type: 'timestamptz', name: 'end_at' })
  endAt!: Date;

  /** When set, each participant gets a personal window of this length from join. */
  @Column({ type: 'int', nullable: true, name: 'duration_minutes' })
  durationMinutes!: number | null;

  /** Absolute freeze time; if null, derived from settings.freezeOffsetMinutes. */
  @Column({ type: 'timestamptz', nullable: true, name: 'freeze_at' })
  freezeAt!: Date | null;

  /** Manual freeze override (admin can freeze early). */
  @Column({ type: 'boolean', default: false, name: 'is_frozen' })
  isFrozen!: boolean;

  @Index()
  @Column({ type: 'enum', enum: ExamVisibility, default: ExamVisibility.CLASS })
  visibility!: ExamVisibility;

  @Column({ type: 'uuid', array: true, nullable: true, name: 'class_ids' })
  classIds!: string[] | null;

  @Index()
  @Column({ type: 'uuid', name: 'created_by' })
  createdBy!: string;

  @Column({ type: 'boolean', default: true, name: 'auto_finalize' })
  autoFinalize!: boolean;

  @Column({ type: 'boolean', default: false, name: 'auto_grant_reward' })
  autoGrantReward!: boolean;

  @Column({ type: 'timestamptz', nullable: true, name: 'finalized_at' })
  finalizedAt!: Date | null;

  @Column({ type: 'uuid', nullable: true, name: 'finalized_by' })
  finalizedBy!: string | null;

  /** Bumped on each finalize / post-finalize recalculation; selects the snapshot. */
  @Column({ type: 'int', default: 0, name: 'snapshot_version' })
  snapshotVersion!: number;

  @Column({ type: 'jsonb', nullable: true, name: 'settings_json' })
  settings!: IExamSettings | null;

  @OneToMany(() => ExamProblem, (p) => p.exam)
  problems!: ExamProblem[];

  @OneToMany(() => ExamParticipant, (p) => p.exam)
  participants!: ExamParticipant[];
}
