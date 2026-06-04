import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { submissionsApi, SubmissionListParams } from './submissions.api';
import { ICodeExecutionRequest, ISubmitCodePayload } from '@cp/shared';

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
    },
  });
}

export function useSubmissions(assignmentId: string) {
  return useQuery({
    queryKey: ['submissions', assignmentId],
    queryFn: () => submissionsApi.getSubmissions(assignmentId),
    enabled: !!assignmentId,
  });
}

/** Student: own submissions across all assignments — paginated + filtered */
export function useAllMySubmissions(params: SubmissionListParams = {}, enabled = true) {
  return useQuery({
    queryKey: ['submissions-all-my', params],
    queryFn: () => submissionsApi.getAllMySubmissions(params),
    placeholderData: keepPreviousData,
    enabled,
  });
}

/** Admin/Teacher: all submissions — paginated + filtered */
export function useAllSubmissions(params: SubmissionListParams = {}, enabled = true) {
  return useQuery({
    queryKey: ['submissions-all', params],
    queryFn: () => submissionsApi.getAllSubmissions(params),
    placeholderData: keepPreviousData,
    enabled,
  });
}
