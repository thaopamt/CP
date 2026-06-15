import { UserRole } from './user-role.enum';
import { PublishStatus } from './curriculum.types';

export interface IBlogAuthor {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string | null;
  role: UserRole;
}

export interface IBlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverUrl?: string | null;
  tags: string[];
  status: PublishStatus;
  publishedAt?: string | null;
  authorId: string;
  author?: IBlogAuthor | null;
  createdAt: string;
  updatedAt: string;
}

export interface ICreateBlogPostPayload {
  title: string;
  slug?: string;
  excerpt?: string;
  content: string;
  coverUrl?: string | null;
  tags?: string[];
  status?: PublishStatus;
}

export type IUpdateBlogPostPayload = Partial<ICreateBlogPostPayload>;

export interface BlogListParams {
  page?: number;
  limit?: number;
  search?: string;
  tag?: string;
  status?: PublishStatus | 'all';
}

export interface IBlogListResponse {
  items: IBlogPost[];
  total: number;
  page: number;
  pageCount: number;
}

/** Number of published posts the current user has not opened yet. */
export interface IBlogUnreadCount {
  count: number;
}
