import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { ILeaderboardParams } from '@cp/shared';
import { gamificationApi } from './gamification.api';

export const gamificationQueryKeys = {
  leaderboard: (params?: ILeaderboardParams) => ['leaderboard', params] as const,
  questAnalytics: () => ['quest-analytics', 'summary'] as const,
};

export function useLeaderboard(params?: ILeaderboardParams) {
  return useQuery({
    queryKey: gamificationQueryKeys.leaderboard(params),
    queryFn: () => gamificationApi.leaderboard(params).then((res) => res.data),
    placeholderData: keepPreviousData,
    staleTime: 15_000,
  });
}

export function useQuestAnalytics() {
  return useQuery({
    queryKey: gamificationQueryKeys.questAnalytics(),
    queryFn: () => gamificationApi.questAnalytics().then((res) => res.data),
  });
}
