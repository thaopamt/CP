/**
 * react-query hooks over `students.api.ts`.
 *
 * Cache keys:
 *   ['students', 'list', params]   → directory page
 *   ['students', 'detail', id]     → profile dashboard
 */
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ICreateStudentPayload, IUpdateStudentPayload } from '@cp/shared';

import { StudentsListParams, UpdateMyStudentPayload, studentsApi } from './students.api';
import { assignmentsApi } from './curriculum.api';
import { queryStaleTime } from './query-cache';

export const studentQueryKeys = {
  list: (params: StudentsListParams) => ['students', 'list', params] as const,
  detail: (id: string) => ['students', 'detail', id] as const,
  byUserId: (userId: string) => ['students', 'byUserId', userId] as const,
  me: () => ['students', 'me'] as const,
  dashboard: () => ['students', 'dashboard'] as const,
  heatmap: () => ['students', 'heatmap'] as const,
  myTasks: (params: any) => ['students', 'myTasks', params] as const,
  myFeedback: () => ['students', 'myFeedback'] as const,
};

export function useStudentsList(params: StudentsListParams) {
  return useQuery({
    queryKey: studentQueryKeys.list(params),
    queryFn: () => studentsApi.list(params),
    placeholderData: keepPreviousData,
    staleTime: queryStaleTime.adminList,
  });
}

export function useStudent(id: string | undefined) {
  return useQuery({
    queryKey: id ? studentQueryKeys.detail(id) : ['students', 'detail', 'noop'],
    queryFn: () => studentsApi.get(id as string),
    enabled: !!id,
    staleTime: queryStaleTime.userScoped,
  });
}

export function useStudentByUserId(userId: string | undefined) {
  return useQuery({
    queryKey: userId ? studentQueryKeys.byUserId(userId) : ['students', 'byUserId', 'noop'],
    queryFn: () => studentsApi.getByUserId(userId as string),
    enabled: !!userId,
    staleTime: queryStaleTime.userScoped,
  });
}

export function useCurrentStudent() {
  return useQuery({
    queryKey: studentQueryKeys.me(),
    queryFn: () => studentsApi.getMe(),
    staleTime: queryStaleTime.userScoped,
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
    mutationFn: (patch: IUpdateStudentPayload) => studentsApi.update(id, patch),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: studentQueryKeys.detail(id) });
      void qc.invalidateQueries({ queryKey: ['students', 'list'] });
    },
  });
}

export function useUpdateCurrentStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: UpdateMyStudentPayload) => studentsApi.updateMe(patch),
    onSuccess: (student) => {
      void qc.invalidateQueries({ queryKey: studentQueryKeys.me() });
      void qc.invalidateQueries({ queryKey: studentQueryKeys.detail(student.id) });
      void qc.invalidateQueries({ queryKey: studentQueryKeys.dashboard() });
    },
  });
}

export function useResetPasswordStudent(id: string) {
  return useMutation({
    mutationFn: (newPassword: string) => studentsApi.resetPassword(id, newPassword),
  });
}

export function useResetStudentLearningData(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => studentsApi.resetLearningData(id),
    onSuccess: (result) => {
      void qc.invalidateQueries({ queryKey: ['students'] });
      void qc.invalidateQueries({ queryKey: studentQueryKeys.detail(id) });
      void qc.invalidateQueries({ queryKey: studentQueryKeys.byUserId(result.userId) });
      void qc.invalidateQueries({ queryKey: studentQueryKeys.me() });
      void qc.invalidateQueries({ queryKey: studentQueryKeys.dashboard() });
      void qc.invalidateQueries({ queryKey: ['submissions'] });
      void qc.invalidateQueries({ queryKey: ['submissions-all'] });
      void qc.invalidateQueries({ queryKey: ['submissions-all-my'] });
      void qc.invalidateQueries({ queryKey: ['leaderboard'] });
      void qc.invalidateQueries({ queryKey: ['student-quests'] });
      void qc.invalidateQueries({ queryKey: ['student-badges'] });
      void qc.invalidateQueries({ queryKey: ['shop'] });
      void qc.invalidateQueries({ queryKey: ['maze-levels'] });
    },
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
    staleTime: queryStaleTime.userScoped,
  });
}

export function useMyFeedback() {
  return useQuery({
    queryKey: studentQueryKeys.myFeedback(),
    queryFn: () => assignmentsApi.myFeedback(),
    staleTime: queryStaleTime.userScoped,
  });
}

export function useStudentDashboard() {
  return useQuery({
    queryKey: studentQueryKeys.dashboard(),
    queryFn: () => studentsApi.getDashboard(),
    staleTime: queryStaleTime.dashboard,
  });
}

export function useUpdateDefaultLanguage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (language: string) => studentsApi.updatePreferences({ defaultLanguage: language }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: studentQueryKeys.dashboard() });
    },
  });
}

export function useStudentHeatmap() {
  return useQuery({
    queryKey: studentQueryKeys.heatmap(),
    queryFn: () => studentsApi.getHeatmapData(),
    staleTime: queryStaleTime.dashboard,
  });
}

export function useStudentHeatmapAdmin(studentId: string) {
  return useQuery({
    queryKey: ['students', 'heatmap', studentId],
    queryFn: () => studentsApi.getStudentHeatmapAdmin(studentId),
    enabled: !!studentId,
    staleTime: queryStaleTime.dashboard,
  });
}
