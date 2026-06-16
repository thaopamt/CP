/**
 * react-query hooks for student schedule management (admin only).
 *
 * Cache keys:
 *   ['studentSchedule', studentId]  — effective schedule
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ICreateStudentSchedulePayload } from '@cp/shared';

import { studentScheduleApi } from './studentSchedule.api';
import { attendanceKeys } from './attendance.queries';
import { financeKeys, teacherFinanceKeys } from './finance.queries';
import { queryStaleTime } from './query-cache';

export const scheduleQueryKeys = {
  schedule: (studentId: string) => ['studentSchedule', studentId] as const,
};

export function useStudentSchedule(studentId: string | undefined) {
  return useQuery({
    queryKey: studentId ? scheduleQueryKeys.schedule(studentId) : ['studentSchedule', 'noop'],
    queryFn: () => studentScheduleApi.getSchedule(studentId as string),
    enabled: !!studentId,
    staleTime: queryStaleTime.userScoped,
  });
}

export function useAddCustomSession(studentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: ICreateStudentSchedulePayload) =>
      studentScheduleApi.addCustomSession(studentId, payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: scheduleQueryKeys.schedule(studentId) });
      void qc.invalidateQueries({ queryKey: attendanceKeys.allCustom() });
      void qc.invalidateQueries({ queryKey: financeKeys.all });
      void qc.invalidateQueries({ queryKey: teacherFinanceKeys.all });
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
      void qc.invalidateQueries({ queryKey: attendanceKeys.allCustom() });
      void qc.invalidateQueries({ queryKey: financeKeys.all });
      void qc.invalidateQueries({ queryKey: teacherFinanceKeys.all });
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
      void qc.invalidateQueries({ queryKey: attendanceKeys.allCustom() });
      void qc.invalidateQueries({ queryKey: financeKeys.all });
      void qc.invalidateQueries({ queryKey: teacherFinanceKeys.all });
    },
  });
}

export function useClearCustomSchedule(studentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => studentScheduleApi.clearAllCustom(studentId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: scheduleQueryKeys.schedule(studentId) });
      void qc.invalidateQueries({ queryKey: attendanceKeys.allCustom() });
      void qc.invalidateQueries({ queryKey: financeKeys.all });
      void qc.invalidateQueries({ queryKey: teacherFinanceKeys.all });
    },
  });
}
