import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';

import { User } from '../users/user.entity';
import { BlogPost } from './blog-post.entity';

/** One row per (user, post) the user has opened — drives the unread counter. */
@Entity({ name: 'blog_post_reads' })
@Unique('UQ_blog_post_reads_user_post', ['userId', 'postId'])
export class BlogPostRead {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index('IDX_blog_post_reads_user')
  @Column({ type: 'uuid', name: 'user_id' })
  userId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Index('IDX_blog_post_reads_post')
  @Column({ type: 'uuid', name: 'post_id' })
  postId!: string;

  @ManyToOne(() => BlogPost, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'post_id' })
  post!: BlogPost;

  @CreateDateColumn({ type: 'timestamptz', name: 'read_at' })
  readAt!: Date;
}
