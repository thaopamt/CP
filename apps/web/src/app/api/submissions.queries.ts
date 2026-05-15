import { useMutation, useQueryClient } from '@tanstack/react-query';
import { submissionsApi } from './submissions.api';
import { ICodeExecutionRequest, ISubmitCodePayload } from '@cp/shared';

export function useRunCode() {
  return useMutation({
    mutationFn: (payload: ICodeExecutionRequest) => submissionsApi.runCode(payload),
  });
}

export function useSubmitCode() {
  return useMutation({
    mutationFn: (payload: ISubmitCodePayload) => submissionsApi.submitCode(payload),
  });
}
