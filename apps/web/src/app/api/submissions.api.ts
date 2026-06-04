import { apiClient } from '../lib/api-client';
import { ICodeExecutionRequest, ICodeExecutionResponse, ISubmitCodePayload, ISubmitCodeResponse } from '@cp/shared';

export interface SubmissionListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  language?: string;
}

export interface SubmissionListResult {
  data: any[];
  total: number;
  page: number;
  pageCount: number;
  stats: { total: number; accepted: number; wrong: number; other: number };
}

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

  /** Student: own submissions across all assignments — paginated + filtered */
  getAllMySubmissions: async (params: SubmissionListParams = {}): Promise<SubmissionListResult> => {
    const { data } = await apiClient.get('/submissions/my', { params });
    return data;
  },

  /** Admin/Teacher: all submissions — paginated + filtered */
  getAllSubmissions: async (params: SubmissionListParams = {}): Promise<SubmissionListResult> => {
    const { data } = await apiClient.get('/submissions/all', { params });
    return data;
  },
};
