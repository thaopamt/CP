import {
  IExamLeaderboardResponse,
  IExamListItem,
  IExamResultResponse,
  IExamSubmitPayload,
  ISubmission,
  ITakeExamResponse,
} from '@cp/shared';
import { apiClient } from '../lib/api-client';

/** Full sanitized problem content for solving (hidden testcases stripped). */
export interface IStudentExamProblem {
  id: string;
  examId: string;
  label: string | null;
  points: number;
  scoringMode: string;
  orderIndex: number;
  assignment: {
    id: string;
    title: string;
    description: string;
    difficulty: string;
    points: number;
    tags: string[];
    codingConfig: Record<string, unknown> | null;
  };
}

export const studentExamsApi = {
  myExams() {
    return apiClient.get<IExamListItem[]>('/my-exams');
  },
  take(id: string) {
    return apiClient.get<ITakeExamResponse>(`/my-exams/${id}`);
  },
  join(id: string) {
    return apiClient.post(`/my-exams/${id}/join`);
  },
  problem(id: string, examProblemId: string) {
    return apiClient.get<IStudentExamProblem>(`/my-exams/${id}/problems/${examProblemId}`);
  },
  submit(id: string, payload: IExamSubmitPayload) {
    return apiClient.post<ISubmission>(`/my-exams/${id}/submit`, payload);
  },
  mySubmissions(id: string) {
    return apiClient.get<ISubmission[]>(`/my-exams/${id}/submissions`);
  },
  leaderboard(id: string) {
    return apiClient.get<IExamLeaderboardResponse>(`/my-exams/${id}/leaderboard`);
  },
  result(id: string) {
    return apiClient.get<IExamResultResponse>(`/my-exams/${id}/result`);
  },
};
