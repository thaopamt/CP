/**
 * react-query hooks for attendance management (admin only).
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { IBulkAttendancePayload } from '@cp/shared';

import { attendanceApi } from './attendance.api';

export const attendanceKeys = {
  classDate: (classId: string, date: string) => ['attendance', classId, date] as const,
  classSummary: (classId: string) => ['attendanceSummary', classId] as const,
  studentHistory: (studentId: string) => ['attendanceHistory', studentId] as const,
  allCustom: () => ['attendanceAllCustom'] as const,
};

export function useClassDateAttendance(classId: string | undefined, date: string) {
  return useQuery({
    queryKey: classId ? attendanceKeys.classDate(classId, date) : ['attendance', 'noop'],
    queryFn: () => attendanceApi.getClassDateAttendance(classId as string, date),
    enabled: !!classId,
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
    },
  });
}

export function useClassAttendanceSummary(classId: string | undefined) {
  return useQuery({
    queryKey: classId ? attendanceKeys.classSummary(classId) : ['attendanceSummary', 'noop'],
    queryFn: () => attendanceApi.getClassSummary(classId as string),
    enabled: !!classId,
  });
}

export function useAllCustomSchedules() {
  return useQuery({
    queryKey: attendanceKeys.allCustom(),
    queryFn: () => attendanceApi.getAllCustomSchedules(),
  });
}
