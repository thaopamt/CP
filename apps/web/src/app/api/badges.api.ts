import {
  IBadge,
  ICreateBadgePayload,
  IUpdateBadgePayload,
  IStudentBadge,
  IStudentBadgeProgress,
} from '@cp/shared';
import { apiClient } from '../lib/api-client';

interface CrudListResponse<T> {
  data: T[];
  count: number;
  total: number;
  page: number;
  pageCount: number;
}

export interface IBadgeStats {
  total: number;
  active: number;
  totalEarned: number;
  legendary: number;
}

export const badgesApi = {
  // ── Admin ──────────────────────────────────────────────────────────────────
  list(params?: Record<string, unknown>) {
    return apiClient.get<CrudListResponse<IBadge>>('/badges', { params });
  },
  get(id: string) {
    return apiClient.get<IBadge>(`/badges/${id}`);
  },
  stats() {
    return apiClient.get<IBadgeStats>('/badges/stats');
  },
  create(payload: ICreateBadgePayload) {
    return apiClient.post<IBadge>('/badges', payload);
  },
  update(id: string, payload: IUpdateBadgePayload) {
    return apiClient.patch<IBadge>(`/badges/${id}`, payload);
  },
  remove(id: string) {
    return apiClient.delete(`/badges/${id}`);
  },

  // ── Student ────────────────────────────────────────────────────────────────
  getMyBadges() {
    return apiClient.get<IStudentBadge[]>('/student-badges/me');
  },
  getCatalog() {
    return apiClient.get<IStudentBadgeProgress[]>('/student-badges/catalog');
  },
};
