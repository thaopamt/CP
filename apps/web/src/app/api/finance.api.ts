import {
  IFinanceMonthlyAmountDueOverride,
  IFinanceMonthlyAmountDuePayload,
  IFinanceMonthlyAmountDueResetResult,
  IFinanceMonthlyReport,
  IFinanceMonthlyReportParams,
  IFinanceMonthlyStatusPayload,
  IFinanceMonthlyStatusUpdate,
} from '@cp/shared';

import { apiClient } from '../lib/api-client';

export const financeApi = {
  async monthly(params: IFinanceMonthlyReportParams): Promise<IFinanceMonthlyReport> {
    const { data } = await apiClient.get<IFinanceMonthlyReport>('/finance/monthly', { params });
    return data;
  },
  async setMonthlyAmountDue(
    studentId: string,
    payload: IFinanceMonthlyAmountDuePayload,
  ): Promise<IFinanceMonthlyAmountDueOverride> {
    const { data } = await apiClient.patch<IFinanceMonthlyAmountDueOverride>(
      `/finance/monthly/${studentId}/amount-due`,
      payload,
    );
    return data;
  },
  async resetMonthlyAmountDue(
    studentId: string,
    month: string,
  ): Promise<IFinanceMonthlyAmountDueResetResult> {
    const { data } = await apiClient.delete<IFinanceMonthlyAmountDueResetResult>(
      `/finance/monthly/${studentId}/amount-due`,
      { params: { month } },
    );
    return data;
  },
  async setMonthlyStatus(
    studentId: string,
    payload: IFinanceMonthlyStatusPayload,
  ): Promise<IFinanceMonthlyStatusUpdate> {
    const { data } = await apiClient.patch<IFinanceMonthlyStatusUpdate>(
      `/finance/monthly/${studentId}/status`,
      payload,
    );
    return data;
  },
  async teacherMonthly(params: IFinanceMonthlyReportParams): Promise<IFinanceMonthlyReport> {
    const { data } = await apiClient.get<IFinanceMonthlyReport>('/teacher/finance/monthly', {
      params,
    });
    return data;
  },
};
