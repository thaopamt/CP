import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  IAddExamProblemPayload,
  ICreateExamPayload,
  ICreateExamRewardRulePayload,
  IUpdateExamPayload,
  IUpdateExamProblemPayload,
  IUpdateExamRewardRulePayload,
} from '@cp/shared';
import { examsApi, ExamsListParams } from './exams.api';
import { queryStaleTime } from './query-cache';

export const examQueryKeys = {
  all: ['exams'] as const,
  list: (params?: ExamsListParams) => ['exams', 'list', params] as const,
  detail: (id: string) => ['exams', 'detail', id] as const,
  problems: (id: string) => ['exams', id, 'problems'] as const,
  participants: (id: string) => ['exams', id, 'participants'] as const,
  rewardRules: (id: string) => ['exams', id, 'reward-rules'] as const,
  grants: (id: string) => ['exams', id, 'grants'] as const,
  leaderboard: (id: string) => ['exams', id, 'leaderboard'] as const,
  audit: (id: string) => ['exams', id, 'audit'] as const,
};

// ── Exam CRUD ──────────────────────────────────────────────────────────────
export function useExams(params?: ExamsListParams) {
  return useQuery({
    queryKey: examQueryKeys.list(params),
    queryFn: () => examsApi.list(params).then((r) => r.data),
    staleTime: queryStaleTime.adminList,
  });
}

export function useExam(id: string) {
  return useQuery({
    queryKey: examQueryKeys.detail(id),
    queryFn: () => examsApi.get(id).then((r) => r.data),
    enabled: !!id,
    staleTime: queryStaleTime.adminList,
  });
}

export function useCreateExam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: ICreateExamPayload) => examsApi.create(payload).then((r) => r.data),
    onSuccess: () => void qc.invalidateQueries({ queryKey: examQueryKeys.all }),
  });
}

export function useUpdateExam(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: IUpdateExamPayload) => examsApi.update(id, payload).then((r) => r.data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: examQueryKeys.all });
      void qc.invalidateQueries({ queryKey: examQueryKeys.detail(id) });
    },
  });
}

export function useDeleteExam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => examsApi.remove(id).then((r) => r.data),
    onSuccess: () => void qc.invalidateQueries({ queryKey: examQueryKeys.all }),
  });
}

/** Generic lifecycle action hook keyed by exam id (publish/finalize/...). */
export function useExamAction(id: string) {
  const qc = useQueryClient();
  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: examQueryKeys.detail(id) });
    void qc.invalidateQueries({ queryKey: examQueryKeys.all });
    void qc.invalidateQueries({ queryKey: examQueryKeys.leaderboard(id) });
    void qc.invalidateQueries({ queryKey: examQueryKeys.grants(id) });
  };
  return {
    publish: useMutation({ mutationFn: () => examsApi.publish(id), onSuccess: invalidate }),
    archive: useMutation({ mutationFn: () => examsApi.archive(id), onSuccess: invalidate }),
    freeze: useMutation({ mutationFn: () => examsApi.freeze(id), onSuccess: invalidate }),
    unfreeze: useMutation({ mutationFn: () => examsApi.unfreeze(id), onSuccess: invalidate }),
    finalize: useMutation({ mutationFn: (force?: boolean) => examsApi.finalize(id, force), onSuccess: invalidate }),
    recalculate: useMutation({ mutationFn: () => examsApi.recalculate(id), onSuccess: invalidate }),
    rejudge: useMutation({ mutationFn: (force?: boolean) => examsApi.rejudge(id, force), onSuccess: invalidate }),
    grantRewards: useMutation({ mutationFn: () => examsApi.grantRewards(id), onSuccess: invalidate }),
    retryGrants: useMutation({ mutationFn: () => examsApi.retryGrants(id), onSuccess: invalidate }),
  };
}

// ── Problems ───────────────────────────────────────────────────────────────
export function useExamProblems(id: string) {
  return useQuery({
    queryKey: examQueryKeys.problems(id),
    queryFn: () => examsApi.listProblems(id).then((r) => r.data),
    enabled: !!id,
    staleTime: queryStaleTime.adminList,
  });
}

export function useExamProblemMutations(examId: string) {
  const qc = useQueryClient();
  const invalidate = () => void qc.invalidateQueries({ queryKey: examQueryKeys.problems(examId) });
  return {
    add: useMutation({ mutationFn: (p: IAddExamProblemPayload) => examsApi.addProblem(examId, p), onSuccess: invalidate }),
    update: useMutation({
      mutationFn: (v: { id: string; payload: IUpdateExamProblemPayload }) =>
        examsApi.updateProblem(examId, v.id, v.payload),
      onSuccess: invalidate,
    }),
    remove: useMutation({ mutationFn: (epId: string) => examsApi.removeProblem(examId, epId), onSuccess: invalidate }),
  };
}

// ── Participants ───────────────────────────────────────────────────────────
export function useExamParticipants(id: string) {
  return useQuery({
    queryKey: examQueryKeys.participants(id),
    queryFn: () => examsApi.listParticipants(id).then((r) => r.data),
    enabled: !!id,
    staleTime: queryStaleTime.adminList,
  });
}

export function useExamParticipantMutations(examId: string) {
  const qc = useQueryClient();
  const invalidate = () => void qc.invalidateQueries({ queryKey: examQueryKeys.participants(examId) });
  return {
    invite: useMutation({ mutationFn: (userIds: string[]) => examsApi.invite(examId, userIds), onSuccess: invalidate }),
    remove: useMutation({ mutationFn: (userId: string) => examsApi.removeParticipant(examId, userId), onSuccess: invalidate }),
    ban: useMutation({
      mutationFn: (v: { userId: string; reason?: string }) => examsApi.ban(examId, v.userId, v.reason),
      onSuccess: invalidate,
    }),
    unban: useMutation({ mutationFn: (userId: string) => examsApi.unban(examId, userId), onSuccess: invalidate }),
  };
}

// ── Reward rules / grants ──────────────────────────────────────────────────
export function useExamRewardRules(id: string) {
  return useQuery({
    queryKey: examQueryKeys.rewardRules(id),
    queryFn: () => examsApi.listRewardRules(id).then((r) => r.data),
    enabled: !!id,
    staleTime: queryStaleTime.adminList,
  });
}

export function useExamRewardRuleMutations(examId: string) {
  const qc = useQueryClient();
  const invalidate = () => void qc.invalidateQueries({ queryKey: examQueryKeys.rewardRules(examId) });
  return {
    create: useMutation({ mutationFn: (p: ICreateExamRewardRulePayload) => examsApi.createRewardRule(examId, p), onSuccess: invalidate }),
    update: useMutation({
      mutationFn: (v: { id: string; payload: IUpdateExamRewardRulePayload }) =>
        examsApi.updateRewardRule(examId, v.id, v.payload),
      onSuccess: invalidate,
    }),
    remove: useMutation({ mutationFn: (ruleId: string) => examsApi.deleteRewardRule(examId, ruleId), onSuccess: invalidate }),
  };
}

export function useExamGrants(id: string) {
  return useQuery({
    queryKey: examQueryKeys.grants(id),
    queryFn: () => examsApi.listGrants(id).then((r) => r.data),
    enabled: !!id,
    staleTime: queryStaleTime.adminList,
  });
}

// ── Leaderboard / audit ────────────────────────────────────────────────────
export function useExamLeaderboard(id: string, enabled = true) {
  return useQuery({
    queryKey: examQueryKeys.leaderboard(id),
    queryFn: () => examsApi.leaderboard(id).then((r) => r.data),
    enabled: !!id && enabled,
    refetchInterval: 10_000,
    staleTime: queryStaleTime.realtime,
  });
}

export function useExamAudit(id: string) {
  return useQuery({
    queryKey: examQueryKeys.audit(id),
    queryFn: () => examsApi.audit(id).then((r) => r.data),
    enabled: !!id,
    staleTime: queryStaleTime.adminList,
  });
}
