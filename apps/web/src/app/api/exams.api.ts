import {
  IAddExamProblemPayload,
  ICreateExamPayload,
  ICreateExamRewardRulePayload,
  IExam,
  IExamAuditLogEntry,
  IExamLeaderboardResponse,
  IExamParticipant,
  IExamProblem,
  IExamRewardGrant,
  IExamRewardRule,
  IUpdateExamPayload,
  IUpdateExamProblemPayload,
  IUpdateExamRewardRulePayload,
} from '@cp/shared';
import { apiClient } from '../lib/api-client';

interface ListResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageCount: number;
}

export type ExamsListParams = {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  format?: string;
};

/** Admin / teacher exam management API. */
export const examsApi = {
  list(params: ExamsListParams = {}) {
    return apiClient.get<ListResponse<IExam>>('/exams', { params });
  },
  get(id: string) {
    return apiClient.get<IExam>(`/exams/${id}`);
  },
  create(payload: ICreateExamPayload) {
    return apiClient.post<IExam>('/exams', payload);
  },
  update(id: string, payload: IUpdateExamPayload) {
    return apiClient.patch<IExam>(`/exams/${id}`, payload);
  },
  remove(id: string) {
    return apiClient.delete(`/exams/${id}`);
  },

  // Lifecycle
  publish(id: string) {
    return apiClient.post<IExam>(`/exams/${id}/publish`);
  },
  archive(id: string) {
    return apiClient.post<IExam>(`/exams/${id}/archive`);
  },
  freeze(id: string) {
    return apiClient.post<IExam>(`/exams/${id}/freeze`);
  },
  unfreeze(id: string) {
    return apiClient.post<IExam>(`/exams/${id}/unfreeze`);
  },
  finalize(id: string, force = false) {
    return apiClient.post<IExam>(`/exams/${id}/finalize`, undefined, { params: { force } });
  },
  recalculate(id: string) {
    return apiClient.post<IExam>(`/exams/${id}/recalculate-ranking`);
  },
  rejudge(id: string, force = false) {
    return apiClient.post<{ rejudged: number }>(`/exams/${id}/rejudge`, undefined, { params: { force } });
  },

  // Problems
  listProblems(examId: string) {
    return apiClient.get<IExamProblem[]>(`/exams/${examId}/problems`);
  },
  addProblem(examId: string, payload: IAddExamProblemPayload) {
    return apiClient.post<IExamProblem>(`/exams/${examId}/problems`, payload);
  },
  updateProblem(examId: string, examProblemId: string, payload: IUpdateExamProblemPayload) {
    return apiClient.patch<IExamProblem>(`/exams/${examId}/problems/${examProblemId}`, payload);
  },
  removeProblem(examId: string, examProblemId: string) {
    return apiClient.delete(`/exams/${examId}/problems/${examProblemId}`);
  },

  // Participants
  listParticipants(examId: string) {
    return apiClient.get<IExamParticipant[]>(`/exams/${examId}/participants`);
  },
  invite(examId: string, userIds: string[]) {
    return apiClient.post<{ added: number }>(`/exams/${examId}/participants`, { userIds });
  },
  removeParticipant(examId: string, userId: string) {
    return apiClient.delete(`/exams/${examId}/participants/${userId}`);
  },
  ban(examId: string, userId: string, reason?: string) {
    return apiClient.post(`/exams/${examId}/participants/${userId}/ban`, { reason });
  },
  unban(examId: string, userId: string) {
    return apiClient.post(`/exams/${examId}/participants/${userId}/unban`);
  },

  // Reward rules
  listRewardRules(examId: string) {
    return apiClient.get<IExamRewardRule[]>(`/exams/${examId}/reward-rules`);
  },
  createRewardRule(examId: string, payload: ICreateExamRewardRulePayload) {
    return apiClient.post<IExamRewardRule>(`/exams/${examId}/reward-rules`, payload);
  },
  updateRewardRule(examId: string, ruleId: string, payload: IUpdateExamRewardRulePayload) {
    return apiClient.patch<IExamRewardRule>(`/exams/${examId}/reward-rules/${ruleId}`, payload);
  },
  deleteRewardRule(examId: string, ruleId: string) {
    return apiClient.delete(`/exams/${examId}/reward-rules/${ruleId}`);
  },

  // Reward grants
  listGrants(examId: string) {
    return apiClient.get<IExamRewardGrant[]>(`/exams/${examId}/reward-grants`);
  },
  grantRewards(examId: string) {
    return apiClient.post<{ granted: number }>(`/exams/${examId}/rewards/grant`);
  },
  retryGrants(examId: string) {
    return apiClient.post<{ retried: number }>(`/exams/${examId}/reward-grants/retry`);
  },
  revokeGrant(examId: string, grantId: string) {
    return apiClient.post(`/exams/${examId}/reward-grants/${grantId}/revoke`);
  },

  // Leaderboard / audit (staff)
  leaderboard(examId: string) {
    return apiClient.get<IExamLeaderboardResponse>(`/exams/${examId}/leaderboard`);
  },
  audit(examId: string) {
    return apiClient.get<IExamAuditLogEntry[]>(`/exams/${examId}/audit`);
  },
};
