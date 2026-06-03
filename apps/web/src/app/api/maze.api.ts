import {
  ICreateMazeLevelPayload,
  IMazeLevel,
  IMazeProgressRow,
  IMazeProgressSummaryRow,
  IMazeSubmitResult,
  ISubmitMazePayload,
} from '@cp/shared';
import { apiClient } from '../lib/api-client';

export const mazeApi = {
  // --- Admin ---
  list() {
    return apiClient.get<IMazeLevel[]>('/maze-levels');
  },
  get(id: string) {
    return apiClient.get<IMazeLevel>(`/maze-levels/${id}`);
  },
  create(payload: ICreateMazeLevelPayload) {
    return apiClient.post<IMazeLevel>('/maze-levels', payload);
  },
  update(id: string, payload: Partial<ICreateMazeLevelPayload>) {
    return apiClient.patch<IMazeLevel>(`/maze-levels/${id}`, payload);
  },
  remove(id: string) {
    return apiClient.delete(`/maze-levels/${id}`);
  },
  progress(levelId: string) {
    return apiClient.get<IMazeProgressRow[]>(`/maze-levels/${levelId}/progress`);
  },
  progressSummary() {
    return apiClient.get<IMazeProgressSummaryRow[]>('/maze-levels/progress/summary');
  },

  // --- Student ---
  getAssigned() {
    return apiClient.get<IMazeLevel[]>('/maze-levels/me/assigned');
  },
  getForStudent(id: string) {
    return apiClient.get<IMazeLevel>(`/maze-levels/me/${id}`);
  },
  submit(payload: ISubmitMazePayload) {
    return apiClient.post<IMazeSubmitResult>('/maze-levels/submit', payload);
  },
  getMyResults(levelId: string) {
    return apiClient.get(`/maze-levels/${levelId}/my-submissions`);
  },
};
