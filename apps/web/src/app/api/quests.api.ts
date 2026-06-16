import {
  IQuest,
  ICreateQuestPayload,
  IUpdateQuestPayload,
  IStudentQuest,
  IClaimQuestResult,
} from '@cp/shared';
import { apiClient } from '../lib/api-client';

interface CrudListResponse<T> {
  data: T[];
  count: number;
  total: number;
  page: number;
  pageCount: number;
}

/** Compact quest reference used by prerequisite/badge pickers. */
export interface IQuestOption {
  id: string;
  title: string;
  type: string;
  icon: string;
}

export interface IQuestStats {
  total: number;
  active: number;
  totalXp: number;
  totalGems: number;
}

export const questsApi = {
  // ── Admin ──────────────────────────────────────────────────────────────────
  list(params?: Record<string, unknown>) {
    return apiClient.get<CrudListResponse<IQuest>>('/quests', { params });
  },
  get(id: string) {
    return apiClient.get<IQuest>(`/quests/${id}`);
  },
  stats() {
    return apiClient.get<IQuestStats>('/quests/stats');
  },
  options() {
    return apiClient.get<IQuestOption[]>('/quests/options/all');
  },
  create(payload: ICreateQuestPayload) {
    return apiClient.post<IQuest>('/quests', payload);
  },
  update(id: string, payload: IUpdateQuestPayload) {
    return apiClient.patch<IQuest>(`/quests/${id}`, payload);
  },
  remove(id: string) {
    return apiClient.delete(`/quests/${id}`);
  },

  // ── Student ────────────────────────────────────────────────────────────────
  getMyQuests() {
    return apiClient.get<IStudentQuest[]>('/student-quests/me');
  },
  claimReward(studentQuestId: string) {
    return apiClient.post<IClaimQuestResult>(`/student-quests/me/${studentQuestId}/claim`);
  },
};
