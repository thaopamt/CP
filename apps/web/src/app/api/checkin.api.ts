import { ICheckinResult, ICheckinStatus, ICheckinWheelResult, ICheckinLeaderboardRow } from '@cp/shared';
import { apiClient } from '../lib/api-client';

export const checkinApi = {
  me() {
    return apiClient.get<ICheckinStatus>('/checkin/me');
  },
  checkIn() {
    return apiClient.post<ICheckinResult>('/checkin');
  },
  makeup(date: string) {
    return apiClient.post<ICheckinResult>('/checkin/makeup', { date });
  },
  spin() {
    return apiClient.post<ICheckinWheelResult>('/checkin/wheel/spin');
  },
  leaderboard(limit = 20) {
    return apiClient.get<ICheckinLeaderboardRow[]>('/checkin/leaderboard', { params: { limit } });
  },
};
