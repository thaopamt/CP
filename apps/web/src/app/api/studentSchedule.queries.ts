/**
 * react-query hooks for student schedule management (admin only).
 *
 * Cache keys:
 *   ['studentSchedule', studentId]  — effective schedule
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ICreateStudentSchedulePayload } from '@cp/shared';

import { studentScheduleApi } from './studentSchedule.api';

export const scheduleQueryKeys = {
  schedule: (studentId: string) => ['studentSchedule', studentId] as const,
};

export function useStudentSchedule(studentId: string | undefined) {
  return useQuery({
    queryKey: studentId ? scheduleQueryKeys.schedule(studentId) : ['studentSchedule', 'noop'],
    queryFn: () => studentScheduleApi.getSchedule(studentId as string),
    enabled: !!studentId,
  });
}

export function useAddCustomSession(studentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: ICreateStudentSchedulePayload) =>
      studentScheduleApi.addCustomSession(studentId, payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: scheduleQueryKeys.schedule(studentId) });
    },
  });
}

export function useUpdateCustomSession(studentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { sessionId: string; payload: Partial<ICreateStudentSchedulePayload> }) =>
      studentScheduleApi.updateCustomSession(studentId, vars.sessionId, vars.payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: scheduleQueryKeys.schedule(studentId) });
    },
  });
}

export function useDeleteCustomSession(studentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (sessionId: string) =>
      studentScheduleApi.deleteCustomSession(studentId, sessionId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: scheduleQueryKeys.schedule(studentId) });
    },
  });
}

export function useClearCustomSchedule(studentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => studentScheduleApi.clearAllCustom(studentId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: scheduleQueryKeys.schedule(studentId) });
    },
  });
}
