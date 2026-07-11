import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { checkinApi } from './checkin.api';
import { queryStaleTime } from './query-cache';

export const checkinQueryKeys = {
  all: ['checkin'] as const,
  me: () => ['checkin', 'me'] as const,
};

export function useCheckinStatus() {
  return useQuery({
    queryKey: checkinQueryKeys.me(),
    queryFn: () => checkinApi.me().then((res) => res.data),
    staleTime: queryStaleTime.dashboard,
  });
}

export function useCheckIn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => checkinApi.checkIn().then((res) => res.data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: checkinQueryKeys.all });
      void qc.invalidateQueries({ queryKey: ['students', 'dashboard'] });
      void qc.invalidateQueries({ queryKey: ['leaderboard'] });
      void qc.invalidateQueries({ queryKey: ['shop'] });
    },
  });
}
