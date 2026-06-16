import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { submissionsApi, SubmissionListParams } from './submissions.api';
import { ICodeExecutionRequest, ISubmitCodePayload } from '@cp/shared';
import { queryStaleTime } from './query-cache';

export function useRunCode() {
  return useMutation({
    mutationFn: (payload: ICodeExecutionRequest) => submissionsApi.runCode(payload),
  });
}

export function useSubmitCode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ISubmitCodePayload) => submissionsApi.submitCode(payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['submissions', variables.assignmentId] });
      queryClient.invalidateQueries({ queryKey: ['submissions-all-my'] });
      queryClient.invalidateQueries({ queryKey: ['submissions-all'] });
      queryClient.invalidateQueries({ queryKey: ['students', 'dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
      queryClient.invalidateQueries({ queryKey: ['student-quests'] });
      queryClient.invalidateQueries({ queryKey: ['student-badges'] });
      queryClient.invalidateQueries({ queryKey: ['shop'] });
    },
  });
}

export function useSubmissions(assignmentId: string) {
  return useQuery({
    queryKey: ['submissions', assignmentId],
    queryFn: () => submissionsApi.getSubmissions(assignmentId),
    enabled: !!assignmentId,
    staleTime: queryStaleTime.realtime,
  });
}

/** Student: own submissions across all assignments — paginated + filtered */
export function useAllMySubmissions(params: SubmissionListParams = {}, enabled = true) {
  return useQuery({
    queryKey: ['submissions-all-my', params],
    queryFn: () => submissionsApi.getAllMySubmissions(params),
    placeholderData: keepPreviousData,
    enabled,
    staleTime: queryStaleTime.realtime,
  });
}

/** Admin/Teacher: all submissions — paginated + filtered */
export function useAllSubmissions(params: SubmissionListParams = {}, enabled = true) {
  return useQuery({
    queryKey: ['submissions-all', params],
    queryFn: () => submissionsApi.getAllSubmissions(params),
    placeholderData: keepPreviousData,
    enabled,
    staleTime: queryStaleTime.realtime,
  });
}
