import { apiClient } from '../lib/api-client';
import { ICodeExecutionRequest, ICodeExecutionResponse, ISubmitCodePayload, ISubmitCodeResponse } from '@cp/shared';

export const submissionsApi = {
  runCode: async (payload: ICodeExecutionRequest): Promise<ICodeExecutionResponse> => {
    const { data } = await apiClient.post('/submissions/run', payload);
    return data;
  },

  submitCode: async (payload: ISubmitCodePayload): Promise<ISubmitCodeResponse> => {
    const { data } = await apiClient.post('/submissions/submit', payload);
    return data;
  },

  getSubmissions: async (assignmentId: string): Promise<any[]> => {
    const { data } = await apiClient.get(`/submissions/assignment/${assignmentId}`);
    return data;
  },

  /** Student: get all own submissions across all assignments */
  getAllMySubmissions: async (): Promise<any[]> => {
    const { data } = await apiClient.get('/submissions/my');
    return data;
  },

  /** Admin/Teacher: get all submissions from all students */
  getAllSubmissions: async (): Promise<any[]> => {
    const { data } = await apiClient.get('/submissions/all');
    return data;
  },
};
