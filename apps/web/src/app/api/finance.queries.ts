import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  FinanceCollectionStatus,
  IFinanceMonthlyReport,
  IFinanceMonthlyReportParams,
  IFinanceMonthlyRow,
} from '@cp/shared';

import { financeApi } from './finance.api';
import { queryStaleTime } from './query-cache';

export const financeKeys = {
  all: ['finance'] as const,
  monthly: (params: IFinanceMonthlyReportParams) => ['finance', 'monthly', params] as const,
};

export function useFinanceMonthlyReport(params: IFinanceMonthlyReportParams) {
  return useQuery({
    queryKey: financeKeys.monthly(params),
    queryFn: () => financeApi.monthly(params),
    placeholderData: keepPreviousData,
    staleTime: queryStaleTime.adminList,
  });
}

export const teacherFinanceKeys = {
  all: ['teacher-finance'] as const,
  monthly: (params: IFinanceMonthlyReportParams) => ['teacher-finance', 'monthly', params] as const,
};

export function useTeacherFinanceMonthlyReport(params: IFinanceMonthlyReportParams) {
  return useQuery({
    queryKey: teacherFinanceKeys.monthly(params),
    queryFn: () => financeApi.teacherMonthly(params),
    placeholderData: keepPreviousData,
    staleTime: queryStaleTime.adminList,
  });
}

export function useSetFinanceMonthlyAmountDue() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ studentId, month, amountDue }: { studentId: string; month: string; amountDue: number }) =>
      financeApi.setMonthlyAmountDue(studentId, { month, amountDue }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: financeKeys.all });
      void qc.invalidateQueries({ queryKey: teacherFinanceKeys.all });
    },
  });
}

export function useResetFinanceMonthlyAmountDue() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ studentId, month }: { studentId: string; month: string }) =>
      financeApi.resetMonthlyAmountDue(studentId, month),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: financeKeys.all });
      void qc.invalidateQueries({ queryKey: teacherFinanceKeys.all });
    },
  });
}

export function useSetFinanceMonthlyStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      studentId,
      month,
      status,
    }: {
      studentId: string;
      month: string;
      status: FinanceCollectionStatus;
    }) => financeApi.setMonthlyStatus(studentId, { month, status }),
    onMutate: async ({ studentId, month, status }) => {
      await qc.cancelQueries({ queryKey: financeKeys.all });
      const previousReports = qc.getQueriesData<IFinanceMonthlyReport>({
        queryKey: financeKeys.all,
      });

      for (const [queryKey, report] of previousReports) {
        if (!report || report.month !== month) continue;

        qc.setQueryData<IFinanceMonthlyReport>(queryKey, (current) =>
          updateReportStatus(current, queryKey, studentId, status),
        );
      }

      return { previousReports };
    },
    onError: (_error, _variables, context) => {
      for (const [queryKey, report] of context?.previousReports ?? []) {
        qc.setQueryData(queryKey, report);
      }
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: financeKeys.all });
      void qc.invalidateQueries({ queryKey: teacherFinanceKeys.all });
    },
  });
}

function updateReportStatus(
  report: IFinanceMonthlyReport | undefined,
  queryKey: readonly unknown[],
  studentId: string,
  status: FinanceCollectionStatus,
): IFinanceMonthlyReport | undefined {
  if (!report) return report;

  const row = report.rows.find((candidate) => candidate.studentId === studentId);
  if (!row) return report;

  const currentStatus = row.collectionStatus;
  if (currentStatus === status) return report;

  const filterStatus = getReportStatusFilter(queryKey);
  const updatedRow = { ...row, collectionStatus: status };
  const keepRow = !filterStatus || updatedRow.collectionStatus === filterStatus;
  const rows = keepRow
    ? report.rows.map((candidate) => (candidate.studentId === studentId ? updatedRow : candidate))
    : report.rows.filter((candidate) => candidate.studentId !== studentId);

  const removedRow = !keepRow;
  const total = removedRow ? Math.max(0, report.total - 1) : report.total;
  const pageCount = Math.max(1, Math.ceil(total / report.limit));

  return {
    ...report,
    rows,
    total,
    pageCount,
    summary: removedRow
      ? removeRowFromSummary(report, row)
      : {
          ...report.summary,
          totalOutstandingAmount: Math.max(
            0,
            report.summary.totalOutstandingAmount + outstandingAmount(updatedRow) - outstandingAmount(row),
          ),
        },
  };
}

function getReportStatusFilter(queryKey: readonly unknown[]) {
  const params = queryKey[2] as IFinanceMonthlyReportParams | undefined;
  return params?.status;
}

function removeRowFromSummary(report: IFinanceMonthlyReport, row: IFinanceMonthlyRow) {
  return {
    ...report.summary,
    totalStudents: Math.max(0, report.summary.totalStudents - 1),
    scheduledSessions: Math.max(0, report.summary.scheduledSessions - row.scheduledSessions),
    billableSessions: Math.max(0, report.summary.billableSessions - row.billableSessions),
    totalPotentialAmount: Math.max(0, report.summary.totalPotentialAmount - row.monthlyTuition),
    totalAmountDue: Math.max(0, report.summary.totalAmountDue - row.amountDue),
    totalOutstandingAmount: Math.max(0, report.summary.totalOutstandingAmount - outstandingAmount(row)),
    studentsMissingTuition: Math.max(
      0,
      report.summary.studentsMissingTuition - (row.missingTuitionConfig ? 1 : 0),
    ),
  };
}

function outstandingAmount(row: Pick<IFinanceMonthlyRow, 'amountDue' | 'collectionStatus'>) {
  return row.collectionStatus === 'PAID' ? 0 : row.amountDue;
}
