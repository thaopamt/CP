import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BlogListParams, ICreateBlogPostPayload, IUpdateBlogPostPayload } from '@cp/shared';

import { blogApi } from './blog.api';

export const blogKeys = {
  publishedList: (params: BlogListParams) => ['blog-posts', 'published', 'list', params] as const,
  publishedDetail: (slug: string) => ['blog-posts', 'published', 'detail', slug] as const,
  manageList: (params: BlogListParams) => ['blog-posts', 'manage', 'list', params] as const,
  manageDetail: (id: string) => ['blog-posts', 'manage', 'detail', id] as const,
};

export function usePublishedBlogPosts(params: BlogListParams) {
  return useQuery({
    queryKey: blogKeys.publishedList(params),
    queryFn: () => blogApi.listPublished(params),
    placeholderData: keepPreviousData,
    staleTime: 15_000,
  });
}

export function usePublishedBlogPost(slug: string | undefined) {
  return useQuery({
    queryKey: slug ? blogKeys.publishedDetail(slug) : ['blog-posts', 'published', 'detail', 'noop'],
    queryFn: () => blogApi.getPublishedBySlug(slug as string),
    enabled: !!slug,
  });
}

export function useManageBlogPosts(params: BlogListParams) {
  return useQuery({
    queryKey: blogKeys.manageList(params),
    queryFn: () => blogApi.listManage(params),
    placeholderData: keepPreviousData,
    staleTime: 15_000,
  });
}

export function useManageBlogPost(id: string | undefined) {
  return useQuery({
    queryKey: id ? blogKeys.manageDetail(id) : ['blog-posts', 'manage', 'detail', 'noop'],
    queryFn: () => blogApi.getManage(id as string),
    enabled: !!id,
  });
}

export function useCreateBlogPost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: ICreateBlogPostPayload) => blogApi.create(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['blog-posts'] });
    },
  });
}

export function useUpdateBlogPost(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: IUpdateBlogPostPayload) => blogApi.update(id, payload),
    onSuccess: (post) => {
      qc.setQueryData(blogKeys.manageDetail(id), post);
      void qc.invalidateQueries({ queryKey: ['blog-posts'] });
    },
  });
}

export function useDeleteBlogPost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => blogApi.remove(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['blog-posts'] });
    },
  });
}
