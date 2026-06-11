/**
 * Teacher ⇄ student assignment endpoints (many-to-many).
 *
 *   GET  /students/:id/teachers      → teachers assigned to a student
 *   PUT  /students/:id/teachers      → replace that student's teacher set
 *   GET  /teachers/:id/students      → students assigned to a teacher
 *   PUT  /teachers/:id/students      → replace that teacher's student set
 */
import { IUser } from '@cp/shared';

import { apiClient } from '../lib/api-client';

/** Lightweight student shape returned by the teacher→students endpoint. */
export interface AssignedStudent {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  username: string | null;
  grade: number;
}

interface ApiStudentProfile {
  id: string;
  grade: number;
  user: { firstName: string; lastName: string; email: string; username?: string | null };
}

function toAssignedStudent(s: ApiStudentProfile): AssignedStudent {
  return {
    id: s.id,
    firstName: s.user.firstName,
    lastName: s.user.lastName,
    email: s.user.email,
    username: s.user.username ?? null,
    grade: s.grade,
  };
}

export const teacherAssignmentsApi = {
  async getStudentTeachers(studentId: string): Promise<IUser[]> {
    const { data } = await apiClient.get<IUser[]>(`/students/${studentId}/teachers`);
    return data;
  },

  async setStudentTeachers(studentId: string, teacherIds: string[]): Promise<IUser[]> {
    const { data } = await apiClient.put<IUser[]>(`/students/${studentId}/teachers`, { teacherIds });
    return data;
  },

  async getTeacherStudents(teacherId: string): Promise<AssignedStudent[]> {
    const { data } = await apiClient.get<ApiStudentProfile[]>(`/teachers/${teacherId}/students`);
    return data.map(toAssignedStudent);
  },

  async setTeacherStudents(teacherId: string, studentIds: string[]): Promise<AssignedStudent[]> {
    const { data } = await apiClient.put<ApiStudentProfile[]>(`/teachers/${teacherId}/students`, {
      studentIds,
    });
    return data.map(toAssignedStudent);
  },
};
