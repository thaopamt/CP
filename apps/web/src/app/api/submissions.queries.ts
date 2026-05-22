import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { submissionsApi } from './submissions.api';
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

/** Student: get all own submissions across all assignments */
export function useAllMySubmissions() {
  return useQuery({
    queryKey: ['submissions-all-my'],
    queryFn: () => submissionsApi.getAllMySubmissions(),
  });
}

/** Admin/Teacher: get all submissions from all students */
export function useAllSubmissions() {
  return useQuery({
    queryKey: ['submissions-all'],
    queryFn: () => submissionsApi.getAllSubmissions(),
  });
}
