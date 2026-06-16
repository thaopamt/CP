/**
 * react-query hooks for attendance management (admin only).
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { IBulkAttendancePayload } from '@cp/shared';

import { attendanceApi } from './attendance.api';
import { financeKeys, teacherFinanceKeys } from './finance.queries';
import { queryStaleTime } from './query-cache';
import type {
  BulkScheduleSlotAttendancePayload,
  ScheduleSlotAttendanceParams,
  SetScheduleSlotCancellationPayload,
} from './attendance.api';

export const attendanceKeys = {
  classDate: (classId: string, date: string) => ['attendance', classId, date] as const,
  classSummary: (classId: string) => ['attendanceSummary', classId] as const,
  studentHistory: (studentId: string, params: { classId?: string; from?: string; to?: string }) =>
    ['attendanceHistory', studentId, params] as const,
  allCustom: () => ['attendanceAllCustom'] as const,
  scheduleSlot: (params: ScheduleSlotAttendanceParams) => ['attendanceScheduleSlot', params] as const,
  scheduleSlotSummaries: (params: { from: string; to: string }) => ['attendanceScheduleSlotSummaries', params] as const,
};

export function useClassDateAttendance(classId: string | undefined, date: string) {
  return useQuery({
    queryKey: classId ? attendanceKeys.classDate(classId, date) : ['attendance', 'noop'],
    queryFn: () => attendanceApi.getClassDateAttendance(classId as string, date),
    enabled: !!classId,
    staleTime: queryStaleTime.attendance,
  });
}

export function useBulkUpsertAttendance(classId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: IBulkAttendancePayload) =>
      attendanceApi.bulkUpsert(classId, payload),
    onSuccess: (_data, vars) => {
      void qc.invalidateQueries({ queryKey: attendanceKeys.classDate(classId, vars.date) });
      void qc.invalidateQueries({ queryKey: attendanceKeys.classSummary(classId) });
      void qc.invalidateQueries({ queryKey: financeKeys.all });
      void qc.invalidateQueries({ queryKey: teacherFinanceKeys.all });
    },
  });
}

export function useClassAttendanceSummary(classId: string | undefined) {
  return useQuery({
    queryKey: classId ? attendanceKeys.classSummary(classId) : ['attendanceSummary', 'noop'],
    queryFn: () => attendanceApi.getClassSummary(classId as string),
    enabled: !!classId,
    staleTime: queryStaleTime.attendance,
  });
}

export function useStudentAttendanceHistory(
  studentId: string | undefined,
  params: { classId?: string; from?: string; to?: string },
) {
  return useQuery({
    queryKey: studentId ? attendanceKeys.studentHistory(studentId, params) : ['attendanceHistory', 'noop'],
    queryFn: () => attendanceApi.getStudentHistory(studentId as string, params),
    enabled: !!studentId,
    staleTime: queryStaleTime.attendance,
  });
}

export function useAllCustomSchedules() {
  return useQuery({
    queryKey: attendanceKeys.allCustom(),
    queryFn: () => attendanceApi.getAllCustomSchedules(),
    staleTime: queryStaleTime.attendance,
  });
}

export function useScheduleSlotAttendance(params: ScheduleSlotAttendanceParams | null) {
  return useQuery({
    queryKey: params ? attendanceKeys.scheduleSlot(params) : ['attendanceScheduleSlot', 'noop'],
    queryFn: () => attendanceApi.getScheduleSlotAttendance(params as ScheduleSlotAttendanceParams),
    enabled: !!params,
    staleTime: queryStaleTime.attendance,
  });
}

export function useScheduleSlotSummaries(params: { from: string; to: string }) {
  return useQuery({
    queryKey: attendanceKeys.scheduleSlotSummaries(params),
    queryFn: () => attendanceApi.getScheduleSlotSummaries(params),
    staleTime: queryStaleTime.attendance,
  });
}

export function useBulkUpsertScheduleSlotAttendance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: BulkScheduleSlotAttendancePayload) =>
      attendanceApi.bulkUpsertScheduleSlotAttendance(payload),
    onSuccess: (_data, vars) => {
      void qc.invalidateQueries({
        queryKey: attendanceKeys.scheduleSlot({
          date: vars.date,
          dayOfWeek: vars.dayOfWeek,
          startTime: vars.startTime,
          endTime: vars.endTime,
        }),
      });
      void qc.invalidateQueries({ queryKey: ['attendanceScheduleSlotSummaries'] });
      void qc.invalidateQueries({ queryKey: financeKeys.all });
      void qc.invalidateQueries({ queryKey: teacherFinanceKeys.all });
    },
  });
}

export function useSetScheduleSlotCancellation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: SetScheduleSlotCancellationPayload) =>
      attendanceApi.setScheduleSlotCancellation(payload),
    onSuccess: (_data, vars) => {
      void qc.invalidateQueries({
        queryKey: attendanceKeys.scheduleSlot({
          date: vars.date,
          dayOfWeek: vars.dayOfWeek,
          startTime: vars.startTime,
          endTime: vars.endTime,
        }),
      });
      void qc.invalidateQueries({ queryKey: ['attendanceScheduleSlotSummaries'] });
      void qc.invalidateQueries({ queryKey: financeKeys.all });
      void qc.invalidateQueries({ queryKey: teacherFinanceKeys.all });
    },
  });
}
