/**
 * react-query hooks over `users.api.ts` — admin user/teacher management.
 *
 * Cache keys:
 *   ['users', 'list', params]
 */
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ICreateUserPayload, IUpdateUserPayload } from '@cp/shared';

import { UsersListParams, usersApi } from './users.api';
import { queryStaleTime } from './query-cache';

export const userQueryKeys = {
  list: (params: UsersListParams) => ['users', 'list', params] as const,
};

export function useUsersList(params: UsersListParams) {
  return useQuery({
    queryKey: userQueryKeys.list(params),
    queryFn: () => usersApi.list(params),
    placeholderData: keepPreviousData,
    staleTime: queryStaleTime.adminList,
  });
}

export function useCreateTeacher() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Omit<ICreateUserPayload, 'role'>) => usersApi.createTeacher(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

export function useUpdateTeacher(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: IUpdateUserPayload) => usersApi.updateTeacher(id, patch),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

export function useResetTeacherPassword(id: string) {
  return useMutation({
    mutationFn: (newPassword: string) => usersApi.resetPassword(id, newPassword),
  });
}

export function useDeleteTeacher() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => usersApi.remove(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['users'] });
    },
  });
}
