import { Column, Entity, Index } from 'typeorm';
import { AssignmentType, ICodingConfig, PublishStatus } from '@cp/shared';

import { BaseEntity } from '../../common/entities/base.entity';

@Entity({ name: 'assignments' })
export class Assignment extends BaseEntity {
  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ type: 'text', default: '' })
  description!: string;

  @Index()
  @Column({ type: 'enum', enum: AssignmentType })
  type!: AssignmentType;

  @Index()
  @Column({ type: 'enum', enum: ['EASY', 'MEDIUM', 'HARD'], default: 'MEDIUM' })
  difficulty!: 'EASY' | 'MEDIUM' | 'HARD';

  @Index()
  @Column({ type: 'varchar', length: 100 })
  subject!: string;

  @Column({ type: 'int', default: 10 })
  points!: number;

  @Column({ type: 'int', nullable: true, name: 'estimated_minutes' })
  estimatedMinutes!: number | null;

  @Index({ unique: true, where: 'slug IS NOT NULL' })
  @Column({ type: 'varchar', length: 255, nullable: true })
  slug!: string | null;

  @Column({ type: 'jsonb', nullable: true, default: '[]' })
  tags!: string[];

  @Column({ type: 'jsonb', nullable: true, name: 'coding_config' })
  codingConfig!: ICodingConfig | null;

  @Index()
  @Column({ type: 'enum', enum: PublishStatus, default: PublishStatus.DRAFT })
  status!: PublishStatus;

  @Column({ type: 'uuid', array: true, nullable: true, name: 'class_ids' })
  classIds!: string[] | null;
}
