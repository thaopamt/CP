import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Command, SimFailReason, SubmissionStatus } from '@cp/shared';

import { User } from '../users/user.entity';
import { MazeLevel } from './maze-level.entity';

/** One attempt by a student to solve a maze level. Latest row = current progress. */
@Entity('maze_submissions')
export class MazeSubmission {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'uuid' })
  userId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Index()
  @Column({ type: 'uuid' })
  levelId!: string;

  @ManyToOne(() => MazeLevel, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'levelId' })
  level!: MazeLevel;

  /** Blockly workspace serialized to XML, kept for replay/audit. */
  @Column({ type: 'text' })
  workspaceXml!: string;

  /** The parsed command tree that was graded. */
  @Column({ type: 'jsonb', name: 'command_tree' })
  commandTree!: Command[];

  @Column({ type: 'enum', enum: SubmissionStatus, default: SubmissionStatus.PENDING })
  status!: SubmissionStatus;

  @Column({ type: 'boolean', default: false, name: 'reached_goal' })
  reachedGoal!: boolean;

  @Column({ type: 'int', default: 0, name: 'blocks_used' })
  blocksUsed!: number;

  @Column({ type: 'int', default: 0, name: 'steps_count' })
  stepsCount!: number;

  @Column({ type: 'varchar', nullable: true, name: 'fail_reason' })
  failReason!: SimFailReason;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;
}
