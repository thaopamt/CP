/**
 * react-query hooks over `students.api.ts`.
 *
 * Cache keys:
 *   ['students', 'list', params]   → directory page
 *   ['students', 'detail', id]     → profile dashboard
 */
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ICreateStudentPayload } from '@cp/shared';

import { StudentsListParams, studentsApi } from './students.api';
import { assignmentsApi } from './curriculum.api';

export const studentQueryKeys = {
  list: (params: StudentsListParams) => ['students', 'list', params] as const,
  detail: (id: string) => ['students', 'detail', id] as const,
  myTasks: (params: any) => ['students', 'myTasks', params] as const,
  myFeedback: () => ['students', 'myFeedback'] as const,
};

export function useStudentsList(params: StudentsListParams) {
  return useQuery({
    queryKey: studentQueryKeys.list(params),
    queryFn: () => studentsApi.list(params),
    placeholderData: keepPreviousData,
    staleTime: 15_000,
  });
}

export function useStudent(id: string | undefined) {
  return useQuery({
    queryKey: id ? studentQueryKeys.detail(id) : ['students', 'detail', 'noop'],
    queryFn: () => studentsApi.get(id as string),
    enabled: !!id,
  });
}

export function useCreateStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: ICreateStudentPayload) => studentsApi.create(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['students'] });
    },
  });
}

export function useUpdateStudent(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: Partial<ICreateStudentPayload>) => studentsApi.update(id, patch),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: studentQueryKeys.detail(id) });
      void qc.invalidateQueries({ queryKey: ['students', 'list'] });
    },
  });
}

export function useResetPasswordStudent(id: string) {
  return useMutation({
    mutationFn: (newPassword: string) => studentsApi.resetPassword(id, newPassword),
  });
}

export function useDeleteStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => studentsApi.remove(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['students'] });
    },
  });
}

export function useMyTasks(params: { page?: number, limit?: number, search?: string, category?: string, difficulty?: string, status?: string }) {
  return useQuery({
    queryKey: studentQueryKeys.myTasks(params),
    queryFn: () => assignmentsApi.myTasks(params),
    placeholderData: keepPreviousData,
  });
}

export function useMyFeedback() {
  return useQuery({
    queryKey: studentQueryKeys.myFeedback(),
    queryFn: () => assignmentsApi.myFeedback(),
  });
}
