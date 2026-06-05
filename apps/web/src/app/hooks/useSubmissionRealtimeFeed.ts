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

function applySubmissionEvent(
  queryClient: QueryClient,
  payload: ISubmissionRealtimeEvent,
  userId: string,
) {
  const submission = payload.submission as SubmissionRow;

  // setQueriesData matches by key prefix, so it updates every cached page/filter
  // variant of the paginated lists (queryKey: ['submissions-all', params]).
  queryClient.setQueriesData({ queryKey: ['submissions-all'] }, (old: unknown) => mergeSubmissionList(old, submission));

  if (submission.userId === userId) {
    queryClient.setQueriesData({ queryKey: ['submissions-all-my'] }, (old: unknown) => mergeSubmissionList(old, submission));
    queryClient.setQueriesData({ queryKey: ['submissions', submission.assignmentId] }, (old: unknown) => mergeSubmissionList(old, submission));
  }
}

const byCreatedDesc = (a: SubmissionRow, b: SubmissionRow) =>
  new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();

function mergeSubmissionList(old: unknown, incoming: SubmissionRow) {
  // Paginated shape: { data, total, page, pageCount, stats }.
  if (old && typeof old === 'object' && Array.isArray((old as any).data)) {
    const page = old as { data: SubmissionRow[]; total?: number; page?: number };
    const index = page.data.findIndex((s) => s.id === incoming.id);
    if (index === -1) {
      // A brand-new submission only belongs at the top of page 1.
      if (page.page && page.page !== 1) return old;
      const limit = page.data.length || 20;
      return { ...page, data: [incoming, ...page.data].slice(0, limit), total: (page.total ?? page.data.length) + 1 };
    }
    const next = [...page.data];
    next[index] = mergeSubmission(next[index], incoming);
    next.sort(byCreatedDesc);
    return { ...page, data: next };
  }

  // Legacy array shape (e.g. per-assignment list).
  if (!Array.isArray(old)) return old;
  const index = old.findIndex((sub: SubmissionRow) => sub.id === incoming.id);
  if (index === -1) return [incoming, ...old].slice(0, 200);
  const next = [...old];
  next[index] = mergeSubmission(next[index], incoming);
  return next.sort(byCreatedDesc);
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
  } as SubmissionRow;
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
