import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ICreateBadgePayload, IUpdateBadgePayload } from '@cp/shared';
import { badgesApi } from './badges.api';
import { queryStaleTime } from './query-cache';

export const badgeQueryKeys = {
  all: ['badges'] as const,
  list: (params?: Record<string, unknown>) => ['badges', 'list', params] as const,
  detail: (id: string) => ['badges', 'detail', id] as const,
  myBadges: () => ['student-badges', 'me'] as const,
  catalog: () => ['student-badges', 'catalog'] as const,
};

export function useBadges(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: badgeQueryKeys.list(params),
    queryFn: () => badgesApi.list(params).then((res) => res.data),
    staleTime: queryStaleTime.reference,
  });
}

export function useBadge(id: string) {
  return useQuery({
    queryKey: badgeQueryKeys.detail(id),
    queryFn: () => badgesApi.get(id).then((res) => res.data),
    enabled: !!id,
    staleTime: queryStaleTime.reference,
  });
}

export function useCreateBadge() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: ICreateBadgePayload) => badgesApi.create(payload).then((res) => res.data),
    onSuccess: () => void qc.invalidateQueries({ queryKey: badgeQueryKeys.all }),
  });
}

export function useUpdateBadge(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: IUpdateBadgePayload) => badgesApi.update(id, payload).then((res) => res.data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: badgeQueryKeys.all });
      void qc.invalidateQueries({ queryKey: badgeQueryKeys.detail(id) });
    },
  });
}

export function useDeleteBadge() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => badgesApi.remove(id).then((res) => res.data),
    onSuccess: () => void qc.invalidateQueries({ queryKey: badgeQueryKeys.all }),
  });
}

export function useMyBadges() {
  return useQuery({
    queryKey: badgeQueryKeys.myBadges(),
    queryFn: () => badgesApi.getMyBadges().then((res) => res.data),
    staleTime: queryStaleTime.userScoped,
  });
}

export function useBadgeCatalog() {
  return useQuery({
    queryKey: badgeQueryKeys.catalog(),
    queryFn: () => badgesApi.getCatalog().then((res) => res.data),
    staleTime: queryStaleTime.userScoped,
  });
}
