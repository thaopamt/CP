export type FinanceBillingStatus =
  | 'READY'
  | 'MISSING_TUITION'
  | 'NO_SCHEDULE'
  | 'NO_BILLABLE';

export interface IFinanceMonthlyRow {
  profileId: string;
  studentId: string;
  studentName: string;
  username?: string | null;
  avatarUrl?: string | null;
  email: string;
  grade: number;
  classNames: string[];
  scheduledSessions: number;
  billableSessions: number;
  monthlyTuition: number;
  tuitionPerSession: number;
  amountDue: number;
  missingTuitionConfig: boolean;
  billingStatus: FinanceBillingStatus;
}

export interface IFinanceMonthlySummary {
  month: string;
  from: string;
  to: string;
  totalStudents: number;
  scheduledSessions: number;
  billableSessions: number;
  totalPotentialAmount: number;
  totalAmountDue: number;
  studentsMissingTuition: number;
}

export interface IFinanceMonthlyReport {
  month: string;
  from: string;
  to: string;
  rows: IFinanceMonthlyRow[];
  summary: IFinanceMonthlySummary;
  total: number;
  page: number;
  pageCount: number;
  limit: number;
}

export interface IFinanceMonthlyReportParams {
  month?: string;
  search?: string;
  page?: number;
  limit?: number;
}
