/**
 * Wraps `/api/users` (the @dataui/crud User resource) plus the
 * `/api/users/teachers*` admin endpoints that hash passwords server-side.
 *
 * Listing uses the CRUD filter syntax:
 *   ?s={"$and":[{"role":"TEACHER"},{"$or":[…]}]}&page=1&limit=10&sort=createdAt,DESC
 */
import { ICreateUserPayload, IUpdateUserPayload, IUser, UserRole } from '@cp/shared';

import { apiClient } from '../lib/api-client';

interface CrudListResponse<T> {
  data: T[];
  count: number;
  total: number;
  page: number;
  pageCount: number;
}

export interface UsersListParams {
  page?: number;
  limit?: number;
  role?: UserRole;
  status?: 'active' | 'inactive' | 'all';
  search?: string;
}

function buildUsersQuery(p: UsersListParams): Record<string, unknown> {
  const conditions: Array<Record<string, unknown>> = [];
  if (p.role) conditions.push({ role: p.role });
  if (p.status === 'active') conditions.push({ isActive: true });
  if (p.status === 'inactive') conditions.push({ isActive: false });
  if (p.search?.trim()) {
    const q = p.search.trim();
    conditions.push({
      $or: [
        { firstName: { $cont: q } },
        { lastName: { $cont: q } },
        { email: { $cont: q } },
        { username: { $cont: q } },
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

export const usersApi = {
  async list(params: UsersListParams = {}): Promise<{
    items: IUser[];
    total: number;
    pageCount: number;
    page: number;
  }> {
    const { data } = await apiClient.get<CrudListResponse<IUser>>('/users', {
      params: buildUsersQuery(params),
    });
    return {
      items: data.data,
      total: data.total,
      pageCount: data.pageCount,
      page: data.page,
    };
  },

  async createTeacher(payload: Omit<ICreateUserPayload, 'role'>): Promise<IUser> {
    const { data } = await apiClient.post<IUser>('/users/teachers', payload);
    return data;
  },

  async updateTeacher(id: string, patch: IUpdateUserPayload): Promise<IUser> {
    const { data } = await apiClient.patch<IUser>(`/users/teachers/${id}`, patch);
    return data;
  },

  async resetPassword(id: string, newPassword: string): Promise<void> {
    await apiClient.post(`/users/teachers/${id}/reset-password`, { newPassword });
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete(`/users/teachers/${id}`);
  },
};
