import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ILeaderboardParams } from '@cp/shared';
import { gamificationApi } from './gamification.api';
import { queryStaleTime } from './query-cache';

export const gamificationQueryKeys = {
  leaderboard: (params?: ILeaderboardParams) => ['leaderboard', params] as const,
  questAnalytics: () => ['quest-analytics', 'summary'] as const,
  pendingReward: () => ['leaderboard', 'pending-reward'] as const,
  finalizedWeeks: () => ['leaderboard', 'finalized'] as const,
};

export function useLeaderboard(params?: ILeaderboardParams) {
  return useQuery({
    queryKey: gamificationQueryKeys.leaderboard(params),
    queryFn: () => gamificationApi.leaderboard(params).then((res) => res.data),
    placeholderData: keepPreviousData,
    staleTime: queryStaleTime.realtime,
  });
}

export function useQuestAnalytics() {
  return useQuery({
    queryKey: gamificationQueryKeys.questAnalytics(),
    queryFn: () => gamificationApi.questAnalytics().then((res) => res.data),
    staleTime: queryStaleTime.adminList,
  });
}

export function usePendingReward() {
  return useQuery({
    queryKey: gamificationQueryKeys.pendingReward(),
    queryFn: () => gamificationApi.getPendingReward().then((res) => res.data),
    staleTime: queryStaleTime.realtime,
  });
}

export function useFinalizedWeeks() {
  return useQuery({
    queryKey: gamificationQueryKeys.finalizedWeeks(),
    queryFn: () => gamificationApi.finalizedWeeks().then((res) => res.data),
    staleTime: queryStaleTime.publishedDetail,
  });
}

export function useClaimReward() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => gamificationApi.claimReward().then((res) => res.data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: gamificationQueryKeys.pendingReward() });
      void qc.invalidateQueries({ queryKey: ['students'] });
      void qc.invalidateQueries({ queryKey: ['leaderboard'] });
      void qc.invalidateQueries({ queryKey: ['shop'] });
    },
  });
}

