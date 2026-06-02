/**
 * Wraps `/api/students` (StudentProfile entity, 1-1 with User) and adapts
 * the eager-loaded TypeORM shape to the wire `IStudentProfile`.
 *
 * @dataui/crud filter syntax — same as `classes.api.ts`:
 *   ?s={"$and":[{"grade":11},{"$or":[…]}]}
 *   ?page=1&limit=10
 *   ?sort=createdAt,DESC
 */
import {
  EnrollmentStatus,
  GuardianRelationship,
  ICreateStudentPayload,
  IGuardian,
  IStudentProfile,
  IStudentDashboardData,
} from '@cp/shared';

import { apiClient } from '../lib/api-client';

interface CrudListResponse<T> {
  data: T[];
  count: number;
  total: number;
  page: number;
  pageCount: number;
}

interface ApiUser {
  id: string;
  email: string;
  username?: string | null;
  firstName: string;
  lastName: string;
  avatarUrl?: string | null;
}

interface ApiGuardian {
  id: string;
  fullName: string;
  relationship: GuardianRelationship;
  phoneNumber: string;
  isPrimary: boolean;
}

interface ApiStudentProfile {
  id: string;
  userId: string;
  user: ApiUser;
  homeAddress: string | null;
  grade: number;
  cohortYear: number;
  enrolledAt: string;
  startDate: string | null;
  status: EnrollmentStatus;
  cumulativeGpa: number;
  attendanceRate: number;
  daysAbsent: number;
  questsCompleted: number;
  cohortPercentile: string | null;
  honorRoll: boolean;
  guardians: ApiGuardian[];
  createdAt: string;
  updatedAt: string;
}

export interface UpdateMyStudentPayload {
  firstName?: string;
  lastName?: string;
  username?: string | null;
  avatarUrl?: string | null;
  homeAddress?: string | null;
}

// ── Adapters ──────────────────────────────────────────────────────────────

function toGuardian(g: ApiGuardian): IGuardian {
  return {
    id: g.id,
    fullName: g.fullName,
    relationship: g.relationship,
    phoneNumber: g.phoneNumber,
    isPrimary: g.isPrimary,
  };
}

function toStudent(s: ApiStudentProfile): IStudentProfile {
  return {
    id: s.id,
    userId: s.user.id,
    firstName: s.user.firstName,
    lastName: s.user.lastName,
    email: s.user.email,
    username: s.user.username ?? null,
    avatarUrl: s.user.avatarUrl ?? null,
    homeAddress: s.homeAddress,
    grade: s.grade,
    cohortYear: s.cohortYear,
    enrolledAt: s.enrolledAt,
    startDate: s.startDate,
    status: s.status,
    cumulativeGpa: s.cumulativeGpa ?? 0,
    attendanceRate: s.attendanceRate ?? 0,
    daysAbsent: s.daysAbsent ?? 0,
    questsCompleted: s.questsCompleted ?? 0,
    cohortPercentile: s.cohortPercentile,
    honorRoll: s.honorRoll,
    guardians: (s.guardians ?? []).map(toGuardian),
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
  };
}

// ── Filter helper ──────────────────────────────────────────────────────────

export interface StudentsListParams {
  page?: number;
  limit?: number;
  grade?: number | 'all';
  status?: EnrollmentStatus | 'all';
  search?: string;
}

function buildStudentsQuery(p: StudentsListParams): Record<string, unknown> {
  const conditions: Array<Record<string, unknown>> = [];
  if (p.grade && p.grade !== 'all') conditions.push({ grade: p.grade });
  if (p.status && p.status !== 'all') conditions.push({ status: p.status });
  if (p.search?.trim()) {
    const q = p.search.trim();
    conditions.push({
      $or: [
        { 'user.firstName': { $cont: q } },
        { 'user.lastName': { $cont: q } },
        { 'user.email': { $cont: q } },
      ],
    });
  }

  const search =
    conditions.length === 0 ? undefined : conditions.length === 1 ? conditions[0] : { $and: conditions };
  return {
    ...(search ? { s: JSON.stringify(search) } : {}),
    page: p.page ?? 1,
    limit: p.limit ?? 10,
    sort: 'createdAt,DESC',
  };
}

// ── Public API ────────────────────────────────────────────────────────────

export const studentsApi = {
  async list(params: StudentsListParams = {}): Promise<{
    items: IStudentProfile[];
    total: number;
    pageCount: number;
    page: number;
  }> {
    const { data } = await apiClient.get<CrudListResponse<ApiStudentProfile>>('/students', {
      params: buildStudentsQuery(params),
    });
    return {
      items: data.data.map(toStudent),
      total: data.total,
      pageCount: data.pageCount,
      page: data.page,
    };
  },

  async get(id: string): Promise<IStudentProfile> {
    const { data } = await apiClient.get<ApiStudentProfile>(`/students/${id}`);
    return toStudent(data);
  },

  async getMe(): Promise<IStudentProfile> {
    const { data } = await apiClient.get<ApiStudentProfile>('/students/me');
    return toStudent(data);
  },

  async create(payload: ICreateStudentPayload): Promise<IStudentProfile> {
    const { data } = await apiClient.post<ApiStudentProfile>('/students', payload);
    return toStudent(data);
  },

  async update(id: string, patch: Partial<ICreateStudentPayload>): Promise<IStudentProfile> {
    const { data } = await apiClient.patch<ApiStudentProfile>(`/students/${id}`, patch);
    return toStudent(data);
  },

  async updateMe(patch: UpdateMyStudentPayload): Promise<IStudentProfile> {
    const { data } = await apiClient.patch<ApiStudentProfile>('/students/me', patch);
    return toStudent(data);
  },

  async resetPassword(id: string, newPassword: string): Promise<void> {
    await apiClient.post(`/students/${id}/reset-password`, { newPassword });
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete(`/students/${id}`);
  },

  async getDashboard(): Promise<IStudentDashboardData> {
    const { data } = await apiClient.get<IStudentDashboardData>('/student-dashboard');
    return data;
  },

  async updatePreferences(prefs: { defaultLanguage: string }): Promise<{ defaultLanguage: string }> {
    const { data } = await apiClient.patch<{ defaultLanguage: string }>('/student-dashboard/preferences', prefs);
    return data;
  },
};
