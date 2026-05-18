import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ICreateQuestPayload } from '@cp/shared';
import { questsApi } from './quests.api';

export const questQueryKeys = {
  all: ['quests'] as const,
  list: (params?: any) => ['quests', 'list', params] as const,
  detail: (id: string) => ['quests', 'detail', id] as const,
  studentQuests: () => ['student-quests'] as const,
};

export function useQuests(params?: any) {
  return useQuery({
    queryKey: questQueryKeys.list(params),
    queryFn: () => questsApi.list(params).then(res => res.data),
  });
}

export function useQuest(id: string) {
  return useQuery({
    queryKey: questQueryKeys.detail(id),
    queryFn: () => questsApi.get(id).then(res => res.data),
    enabled: !!id,
  });
}

export function useCreateQuest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: ICreateQuestPayload) => questsApi.create(payload).then(res => res.data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: questQueryKeys.all });
    },
  });
}

export function useUpdateQuest(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<ICreateQuestPayload>) => questsApi.update(id, payload).then(res => res.data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: questQueryKeys.all });
      void qc.invalidateQueries({ queryKey: questQueryKeys.detail(id) });
    },
  });
}

export function useDeleteQuest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => questsApi.remove(id).then(res => res.data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: questQueryKeys.all });
    },
  });
}

export function useMyQuests() {
  return useQuery({
    queryKey: questQueryKeys.studentQuests(),
    queryFn: () => questsApi.getMyQuests().then(res => res.data),
  });
}

export function useClaimQuestReward() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (studentQuestId: string) => questsApi.claimReward(studentQuestId).then(res => res.data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: questQueryKeys.studentQuests() });
      void qc.invalidateQueries({ queryKey: ['students', 'dashboard'] }); // Refresh dashboard stats
    },
  });
}
