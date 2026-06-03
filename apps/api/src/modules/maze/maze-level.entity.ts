import { Column, Entity, Index } from 'typeorm';
import { BlockType, GridConfig, PublishStatus } from '@cp/shared';

import { BaseEntity } from '../../common/entities/base.entity';

/**
 * A drag-and-drop maze level (Code.org style). Mirrors the Assignment entity's
 * `classIds` direct-assignment shape so the student-visibility query can be
 * reused. The maze playfield + block constraints live in JSONB columns.
 */
@Entity({ name: 'maze_levels' })
export class MazeLevel extends BaseEntity {
  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ type: 'text', default: '' })
  description!: string;

  /** Grid, walls, start cell + direction, goal cell. */
  @Column({ type: 'jsonb', name: 'grid_config' })
  gridConfig!: GridConfig;

  /** Which Blockly block kinds the student may use on this level. */
  @Column({ type: 'jsonb', name: 'allowed_blocks', default: '[]' })
  allowedBlocks!: BlockType[];

  /** Maximum total blocks allowed; null = unlimited. */
  @Column({ type: 'int', nullable: true, name: 'max_blocks' })
  maxBlocks!: number | null;

  @Index()
  @Column({ type: 'enum', enum: ['EASY', 'MEDIUM', 'HARD'], default: 'MEDIUM' })
  difficulty!: 'EASY' | 'MEDIUM' | 'HARD';

  @Index()
  @Column({ type: 'enum', enum: PublishStatus, default: PublishStatus.DRAFT })
  status!: PublishStatus;

  /** Optional grouping under a Course ("khóa học"). */
  @Index()
  @Column({ type: 'uuid', nullable: true, name: 'course_id' })
  courseId!: string | null;

  /** Order within the course. */
  @Column({ type: 'int', default: 0 })
  order!: number;

  /** Classes this level is directly assigned to. Null/empty = visible to all. */
  @Column({ type: 'uuid', array: true, nullable: true, name: 'class_ids' })
  classIds!: string[] | null;
}
