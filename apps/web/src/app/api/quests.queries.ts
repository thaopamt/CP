import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ICreateQuestPayload, IUpdateQuestPayload } from '@cp/shared';
import { questsApi } from './quests.api';
import { queryStaleTime } from './query-cache';

export const questQueryKeys = {
  all: ['quests'] as const,
  list: (params?: Record<string, unknown>) => ['quests', 'list', params] as const,
  detail: (id: string) => ['quests', 'detail', id] as const,
  options: () => ['quests', 'options'] as const,
  stats: () => ['quests', 'stats'] as const,
  studentQuests: () => ['student-quests'] as const,
};

export function useQuests(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: questQueryKeys.list(params),
    queryFn: () => questsApi.list(params).then((res) => res.data),
    placeholderData: keepPreviousData,
    staleTime: queryStaleTime.reference,
  });
}

export function useQuestStats() {
  return useQuery({
    queryKey: questQueryKeys.stats(),
    queryFn: () => questsApi.stats().then((res) => res.data),
    staleTime: queryStaleTime.reference,
  });
}

export function useQuest(id: string) {
  return useQuery({
    queryKey: questQueryKeys.detail(id),
    queryFn: () => questsApi.get(id).then((res) => res.data),
    enabled: !!id,
    staleTime: queryStaleTime.reference,
  });
}

export function useQuestOptions() {
  return useQuery({
    queryKey: questQueryKeys.options(),
    queryFn: () => questsApi.options().then((res) => res.data),
    staleTime: queryStaleTime.reference,
  });
}

export function useCreateQuest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: ICreateQuestPayload) => questsApi.create(payload).then((res) => res.data),
    onSuccess: () => void qc.invalidateQueries({ queryKey: questQueryKeys.all }),
  });
}

export function useUpdateQuest(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: IUpdateQuestPayload) => questsApi.update(id, payload).then((res) => res.data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: questQueryKeys.all });
      void qc.invalidateQueries({ queryKey: questQueryKeys.detail(id) });
    },
  });
}

export function useDeleteQuest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => questsApi.remove(id).then((res) => res.data),
    onSuccess: () => void qc.invalidateQueries({ queryKey: questQueryKeys.all }),
  });
}

export function useMyQuests() {
  return useQuery({
    queryKey: questQueryKeys.studentQuests(),
    queryFn: () => questsApi.getMyQuests().then((res) => res.data),
    staleTime: queryStaleTime.dashboard,
  });
}

export function useClaimQuestReward() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (studentQuestId: string) => questsApi.claimReward(studentQuestId).then((res) => res.data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: questQueryKeys.studentQuests() });
      void qc.invalidateQueries({ queryKey: ['students', 'dashboard'] });
      void qc.invalidateQueries({ queryKey: ['student-badges'] });
      void qc.invalidateQueries({ queryKey: ['leaderboard'] });
      void qc.invalidateQueries({ queryKey: ['shop'] });
    },
  });
}
