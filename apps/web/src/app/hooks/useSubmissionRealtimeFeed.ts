import { useEffect, useState } from 'react';
import { type QueryClient, useQueryClient } from '@tanstack/react-query';
import { io } from 'socket.io-client';
import { IRealtimeSubmission, ISubmissionRealtimeEvent } from '@cp/shared';

import { resolveSocketNamespace } from '../lib/socket-url';
import { useAuthStore } from '../stores/auth.store';

type SubmissionRow = IRealtimeSubmission & Record<string, any>;

export function useSubmissionRealtimeFeed() {
  const token = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!token || !user) {
      setIsConnected(false);
      return undefined;
    }

    const socket = io(resolveSocketNamespace('/submissions'), {
      transports: ['websocket'],
      auth: { token },
    });

    socket.on('connect', () => {
      setIsConnected(true);
      socket.emit('submissions:join');
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('connect_error', () => {
      setIsConnected(false);
    });

    socket.on('submissions:changed', (payload: ISubmissionRealtimeEvent) => {
      applySubmissionEvent(queryClient, payload, user.id);
    });

    return () => {
      socket.disconnect();
    };
  }, [queryClient, token, user]);

  return { isConnected };
}

function applySubmissionEvent(queryClient: QueryClient, payload: ISubmissionRealtimeEvent, userId: string) {
  const submission = payload.submission as SubmissionRow;

  queryClient.setQueryData(['submissions-all'], (old: unknown) => mergeSubmissionList(old, submission));

  if (submission.userId === userId) {
    queryClient.setQueryData(['submissions-all-my'], (old: unknown) => mergeSubmissionList(old, submission));
    queryClient.setQueryData(['submissions', submission.assignmentId], (old: unknown) => mergeSubmissionList(old, submission));
  }
}

function mergeSubmissionList(old: unknown, incoming: SubmissionRow) {
  if (!Array.isArray(old)) {
    return [incoming];
  }

  const index = old.findIndex((sub: SubmissionRow) => sub.id === incoming.id);
  if (index === -1) {
    return [incoming, ...old].slice(0, 200);
  }

  const next = [...old];
  next[index] = mergeSubmission(next[index], incoming);
  return next.sort((a: SubmissionRow, b: SubmissionRow) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

function mergeSubmission(existing: SubmissionRow | undefined, incoming: SubmissionRow): SubmissionRow {
  const mergedTestResults = mergeTestResults(existing?.testResults ?? [], incoming.testResults ?? []);

  return {
    ...existing,
    ...incoming,
    assignment: {
      ...(existing?.assignment ?? {}),
      ...(incoming.assignment ?? {}),
    },
    user: {
      ...(existing?.user ?? {}),
      ...(incoming.user ?? {}),
    },
    testResults: mergedTestResults,
    judgeProgress: incoming.judgeProgress ?? existing?.judgeProgress,
  };
}

function mergeTestResults(
  existing: NonNullable<SubmissionRow['testResults']> = [],
  incoming: NonNullable<SubmissionRow['testResults']> = [],
) {
  if (!incoming.length) return existing;

  const byIndex = new Map<number, NonNullable<SubmissionRow['testResults']>[number]>();
  for (const result of existing) {
    byIndex.set(result.testCaseIndex, result);
  }
  for (const result of incoming) {
    byIndex.set(result.testCaseIndex, { ...byIndex.get(result.testCaseIndex), ...result });
  }

  return Array.from(byIndex.values()).sort((a, b) => a.testCaseIndex - b.testCaseIndex);
}
