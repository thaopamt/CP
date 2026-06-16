import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { IExamSubmitPayload } from '@cp/shared';
import { studentExamsApi } from './studentExams.api';
import { queryStaleTime } from './query-cache';

export const studentExamKeys = {
  all: ['my-exams'] as const,
  list: () => ['my-exams', 'list'] as const,
  take: (id: string) => ['my-exams', id, 'take'] as const,
  problem: (id: string, epId: string) => ['my-exams', id, 'problem', epId] as const,
  submissions: (id: string) => ['my-exams', id, 'submissions'] as const,
  leaderboard: (id: string) => ['my-exams', id, 'leaderboard'] as const,
  result: (id: string) => ['my-exams', id, 'result'] as const,
};

export function useMyExams() {
  return useQuery({
    queryKey: studentExamKeys.list(),
    queryFn: () => studentExamsApi.myExams().then((r) => r.data),
    staleTime: queryStaleTime.userScoped,
  });
}

export function useTakeExam(id: string) {
  return useQuery({
    queryKey: studentExamKeys.take(id),
    queryFn: () => studentExamsApi.take(id).then((r) => r.data),
    enabled: !!id,
    staleTime: queryStaleTime.adminList,
  });
}

export function useJoinExam(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => studentExamsApi.join(id).then((r) => r.data),
    onSuccess: () => void qc.invalidateQueries({ queryKey: studentExamKeys.take(id) }),
  });
}

export function useStudentExamProblem(id: string, examProblemId: string | null) {
  return useQuery({
    queryKey: studentExamKeys.problem(id, examProblemId ?? ''),
    queryFn: () => studentExamsApi.problem(id, examProblemId as string).then((r) => r.data),
    enabled: !!id && !!examProblemId,
    staleTime: queryStaleTime.adminList,
  });
}

export function useMyExamSubmissions(id: string) {
  return useQuery({
    queryKey: studentExamKeys.submissions(id),
    queryFn: () => studentExamsApi.mySubmissions(id).then((r) => r.data),
    enabled: !!id,
    staleTime: queryStaleTime.realtime,
  });
}

export function useSubmitExam(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: IExamSubmitPayload) => studentExamsApi.submit(id, payload).then((r) => r.data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: studentExamKeys.submissions(id) });
      void qc.invalidateQueries({ queryKey: studentExamKeys.leaderboard(id) });
    },
  });
}

export function useStudentExamLeaderboard(id: string) {
  return useQuery({
    queryKey: studentExamKeys.leaderboard(id),
    queryFn: () => studentExamsApi.leaderboard(id).then((r) => r.data),
    enabled: !!id,
    refetchInterval: 15_000,
    staleTime: queryStaleTime.realtime,
  });
}

export function useMyExamResult(id: string) {
  return useQuery({
    queryKey: studentExamKeys.result(id),
    queryFn: () => studentExamsApi.result(id).then((r) => r.data),
    enabled: !!id,
    staleTime: queryStaleTime.userScoped,
  });
}
