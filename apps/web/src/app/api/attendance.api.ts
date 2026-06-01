/**
 * API client for attendance endpoints (admin only).
 */
import {
  IBulkAttendancePayload,
  IClassDateAttendance,
  IAttendanceClassSummary,
  IStudentScheduleSession,
} from '@cp/shared';

import { apiClient } from '../lib/api-client';

export const attendanceApi = {
  async getClassDateAttendance(classId: string, date: string): Promise<IClassDateAttendance> {
    const { data } = await apiClient.get<IClassDateAttendance>(
      `/attendance/classes/${classId}`,
      { params: { date } },
    );
    return data;
  },

  async getAllCustomSchedules(): Promise<IStudentScheduleSession[]> {
    const { data } = await apiClient.get<IStudentScheduleSession[]>('/attendance/custom-schedules');
    return data;
  },

  async bulkUpsert(classId: string, payload: IBulkAttendancePayload): Promise<void> {
    await apiClient.post(`/attendance/classes/${classId}`, payload);
  },

  async getClassSummary(classId: string): Promise<IAttendanceClassSummary> {
    const { data } = await apiClient.get<IAttendanceClassSummary>(
      `/attendance/classes/${classId}/summary`,
    );
    return data;
  },

  async getStudentHistory(
    studentId: string,
    params?: { classId?: string; from?: string; to?: string },
  ) {
    const { data } = await apiClient.get(`/attendance/students/${studentId}`, { params });
    return data;
  },
};
