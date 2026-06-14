import {
  BlogListParams,
  IBlogListResponse,
  IBlogPost,
  ICreateBlogPostPayload,
  IUpdateBlogPostPayload,
  PublishStatus,
} from '@cp/shared';

import { apiClient } from '../lib/api-client';

function buildParams(params: BlogListParams): Record<string, unknown> {
  return {
    page: params.page ?? 1,
    limit: params.limit ?? 10,
    ...(params.search?.trim() ? { search: params.search.trim() } : {}),
    ...(params.tag?.trim() ? { tag: params.tag.trim() } : {}),
    ...(params.status && params.status !== 'all' ? { status: params.status } : {}),
  };
}

export const blogApi = {
  async listPublished(params: BlogListParams = {}): Promise<IBlogListResponse> {
    const { data } = await apiClient.get<IBlogListResponse>('/blog-posts', {
      params: buildParams(params),
    });
    return data;
  },

  async getPublishedBySlug(slug: string): Promise<IBlogPost> {
    const { data } = await apiClient.get<IBlogPost>(`/blog-posts/slug/${slug}`);
    return data;
  },

  async listManage(params: BlogListParams = {}): Promise<IBlogListResponse> {
    const { data } = await apiClient.get<IBlogListResponse>('/blog-posts/manage', {
      params: buildParams(params),
    });
    return data;
  },

  async getManage(id: string): Promise<IBlogPost> {
    const { data } = await apiClient.get<IBlogPost>(`/blog-posts/manage/${id}`);
    return data;
  },

  async create(payload: ICreateBlogPostPayload): Promise<IBlogPost> {
    const { data } = await apiClient.post<IBlogPost>('/blog-posts', payload);
    return data;
  },

  async update(id: string, payload: IUpdateBlogPostPayload): Promise<IBlogPost> {
    const { data } = await apiClient.patch<IBlogPost>(`/blog-posts/${id}`, payload);
    return data;
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete(`/blog-posts/${id}`);
  },
};

export const BLOG_STATUS_OPTIONS: Array<PublishStatus | 'all'> = [
  'all',
  PublishStatus.DRAFT,
  PublishStatus.PUBLISHED,
  PublishStatus.ARCHIVED,
];
