import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { PublishStatus } from '@cp/shared';

import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../users/user.entity';

@Entity({ name: 'blog_posts' })
@Index('IDX_blog_posts_slug_unique_active', ['slug'], { unique: true, where: 'deleted_at IS NULL' })
export class BlogPost extends BaseEntity {
  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ type: 'varchar', length: 255 })
  slug!: string;

  @Column({ type: 'text', default: '' })
  excerpt!: string;

  @Column({ type: 'text', default: '' })
  content!: string;

  @Column({ type: 'text', nullable: true, name: 'cover_url' })
  coverUrl!: string | null;

  @Column({ type: 'jsonb', default: '[]' })
  tags!: string[];

  @Index('IDX_blog_posts_status')
  @Column({ type: 'enum', enum: PublishStatus, default: PublishStatus.DRAFT })
  status!: PublishStatus;

  @Index('IDX_blog_posts_published_at')
  @Column({ type: 'timestamptz', nullable: true, name: 'published_at' })
  publishedAt!: Date | null;

  @Index('IDX_blog_posts_author_id')
  @Column({ type: 'uuid', name: 'author_id' })
  authorId!: string;

  @ManyToOne(() => User, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'author_id' })
  author!: User;
}
