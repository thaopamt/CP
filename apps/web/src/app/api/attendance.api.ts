/**
 * API client for attendance endpoints (admin only).
 */
import {
  AttendanceStatus,
  IBulkAttendancePayload,
  IClassDateAttendance,
  IAttendanceClassSummary,
  IStudentScheduleSession,
  IStudentAttendanceHistory,
  DayOfWeek,
} from '@cp/shared';

import { apiClient } from '../lib/api-client';

export interface ScheduleSlotAttendanceParams {
  date: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
}

export interface ScheduleSlotAttendanceStudent {
  studentId: string;
  studentName: string;
  status: AttendanceStatus;
  note?: string | null;
}

export interface ScheduleSlotAttendance {
  date: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  cancelled: boolean;
  students: ScheduleSlotAttendanceStudent[];
}

export interface ScheduleSlotSummary extends ScheduleSlotAttendanceParams {
  presentCount: number;
  totalCount: number;
  cancelled: boolean;
}

export interface BulkScheduleSlotAttendancePayload extends ScheduleSlotAttendanceParams {
  records: Array<{
    studentId: string;
    status: AttendanceStatus;
    note?: string | null;
  }>;
}

export interface SetScheduleSlotCancellationPayload extends ScheduleSlotAttendanceParams {
  cancelled: boolean;
  note?: string | null;
}

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

  async getScheduleSlotAttendance(params: ScheduleSlotAttendanceParams): Promise<ScheduleSlotAttendance> {
    const { data } = await apiClient.get<ScheduleSlotAttendance>('/attendance/schedule-slots', {
      params,
    });
    return data;
  },

  async getScheduleSlotSummaries(params: { from: string; to: string }): Promise<ScheduleSlotSummary[]> {
    const { data } = await apiClient.get<ScheduleSlotSummary[]>('/attendance/schedule-slots/summaries', {
      params,
    });
    return data;
  },

  async bulkUpsertScheduleSlotAttendance(payload: BulkScheduleSlotAttendancePayload): Promise<void> {
    await apiClient.post('/attendance/schedule-slots', payload);
  },

  async setScheduleSlotCancellation(payload: SetScheduleSlotCancellationPayload): Promise<{ cancelled: boolean }> {
    const { data } = await apiClient.post<{ cancelled: boolean }>('/attendance/schedule-slots/cancel', payload);
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
  ): Promise<IStudentAttendanceHistory> {
    const { data } = await apiClient.get<IStudentAttendanceHistory>(`/attendance/students/${studentId}`, { params });
    return data;
  },
};
