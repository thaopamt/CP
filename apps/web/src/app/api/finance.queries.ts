import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { IFinanceMonthlyReportParams } from '@cp/shared';

import { financeApi } from './finance.api';

export const financeKeys = {
  monthly: (params: IFinanceMonthlyReportParams) => ['finance', 'monthly', params] as const,
};

export function useFinanceMonthlyReport(params: IFinanceMonthlyReportParams) {
  return useQuery({
    queryKey: financeKeys.monthly(params),
    queryFn: () => financeApi.monthly(params),
    placeholderData: keepPreviousData,
    staleTime: 15_000,
  });
}
