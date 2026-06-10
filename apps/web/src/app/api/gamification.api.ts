import { ILeaderboardParams, ILeaderboardResponse, IQuestAnalyticsSummary } from '@cp/shared';
import { apiClient } from '../lib/api-client';

export const gamificationApi = {
  leaderboard(params?: ILeaderboardParams) {
    return apiClient.get<ILeaderboardResponse>('/leaderboard', { params });
  },
  questAnalytics() {
    return apiClient.get<IQuestAnalyticsSummary>('/quest-analytics/summary');
  },
};
