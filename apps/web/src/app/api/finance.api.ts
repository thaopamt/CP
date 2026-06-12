import { IFinanceMonthlyReport, IFinanceMonthlyReportParams } from '@cp/shared';

import { apiClient } from '../lib/api-client';

export const financeApi = {
  async monthly(params: IFinanceMonthlyReportParams): Promise<IFinanceMonthlyReport> {
    const { data } = await apiClient.get<IFinanceMonthlyReport>('/finance/monthly', { params });
    return data;
  },
};
