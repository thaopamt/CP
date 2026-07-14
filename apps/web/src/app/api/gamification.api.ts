import { ILeaderboardParams, ILeaderboardResponse, IQuestAnalyticsSummary, IWeeklyWinnerPendingReward } from '@cp/shared';
import { apiClient } from '../lib/api-client';

export const gamificationApi = {
  leaderboard(params?: ILeaderboardParams) {
    return apiClient.get<ILeaderboardResponse>('/leaderboard', { params });
  },
  questAnalytics() {
    return apiClient.get<IQuestAnalyticsSummary>('/quest-analytics/summary');
  },
  getPendingReward() {
    return apiClient.get<IWeeklyWinnerPendingReward | null>('/leaderboard/pending-reward');
  },
  claimReward() {
    return apiClient.post<any>('/leaderboard/claim-reward');
  },
};

