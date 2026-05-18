import { IQuest, ICreateQuestPayload, IStudentQuest } from '@cp/shared';
import { apiClient } from '../lib/api-client';

export const questsApi = {
  // --- Admin Endpoints ---
  list(params?: any) {
    return apiClient.get<{ data: IQuest[]; total: number; count: number; pageCount: number }>('/quests', {
      params,
    });
  },
  get(id: string) {
    return apiClient.get<IQuest>(`/quests/${id}`);
  },
  create(payload: ICreateQuestPayload) {
    return apiClient.post<IQuest>('/quests', payload);
  },
  update(id: string, payload: Partial<ICreateQuestPayload>) {
    return apiClient.patch<IQuest>(`/quests/${id}`, payload);
  },
  remove(id: string) {
    return apiClient.delete(`/quests/${id}`);
  },

  // --- Student Endpoints ---
  getMyQuests() {
    return apiClient.get<IStudentQuest[]>('/student-quests/me');
  },
  claimReward(studentQuestId: string) {
    return apiClient.post<IStudentQuest>(`/student-quests/me/${studentQuestId}/claim`);
  }
};
