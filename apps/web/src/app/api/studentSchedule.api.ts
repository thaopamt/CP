/**
 * API client for student schedule endpoints (admin only).
 *
 * Endpoints:
 *   GET    /api/students/:id/schedule           — effective schedule
 *   GET    /api/students/:id/schedule/custom     — custom sessions
 *   GET    /api/students/:id/schedule/classes    — class-derived sessions
 *   POST   /api/students/:id/schedule/custom     — add custom session
 *   PATCH  /api/students/:id/schedule/custom/:sid — update custom session
 *   DELETE /api/students/:id/schedule/custom/:sid — delete one
 *   DELETE /api/students/:id/schedule/custom      — clear all custom
 */
import {
  ICreateStudentSchedulePayload,
  IStudentSchedule,
  IStudentScheduleSession,
} from '@cp/shared';

import { apiClient } from '../lib/api-client';

export const studentScheduleApi = {
  async getSchedule(studentId: string): Promise<IStudentSchedule> {
    const { data } = await apiClient.get<IStudentSchedule>(
      `/students/${studentId}/schedule`,
    );
    return data;
  },

  async getCustomSessions(studentId: string): Promise<IStudentScheduleSession[]> {
    const { data } = await apiClient.get<IStudentScheduleSession[]>(
      `/students/${studentId}/schedule/custom`,
    );
    return data;
  },

  async getClassSchedule(studentId: string): Promise<IStudentScheduleSession[]> {
    const { data } = await apiClient.get<IStudentScheduleSession[]>(
      `/students/${studentId}/schedule/classes`,
    );
    return data;
  },

  async addCustomSession(
    studentId: string,
    payload: ICreateStudentSchedulePayload,
  ): Promise<IStudentScheduleSession> {
    const { data } = await apiClient.post<IStudentScheduleSession>(
      `/students/${studentId}/schedule/custom`,
      payload,
    );
    return data;
  },

  async updateCustomSession(
    studentId: string,
    sessionId: string,
    payload: Partial<ICreateStudentSchedulePayload>,
  ): Promise<IStudentScheduleSession> {
    const { data } = await apiClient.patch<IStudentScheduleSession>(
      `/students/${studentId}/schedule/custom/${sessionId}`,
      payload,
    );
    return data;
  },

  async deleteCustomSession(studentId: string, sessionId: string): Promise<void> {
    await apiClient.delete(`/students/${studentId}/schedule/custom/${sessionId}`);
  },

  async clearAllCustom(studentId: string): Promise<void> {
    await apiClient.delete(`/students/${studentId}/schedule/custom`);
  },
};
