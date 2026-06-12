export type FinanceBillingStatus = 'READY' | 'MISSING_TUITION' | 'NO_SCHEDULE' | 'NO_BILLABLE';

export const FINANCE_COLLECTION_STATUSES = ['PENDING', 'PRINTED', 'SENT', 'PAID'] as const;

export type FinanceCollectionStatus = (typeof FINANCE_COLLECTION_STATUSES)[number];

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
  defaultMonthlyTuition: number;
  monthlyTuition: number;
  tuitionPerSession: number;
  calculatedAmountDue: number;
  amountDue: number;
  amountDueOverride?: number | null;
  hasAmountDueOverride: boolean;
  missingTuitionConfig: boolean;
  billingStatus: FinanceBillingStatus;
  collectionStatus: FinanceCollectionStatus;
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
  totalOutstandingAmount: number;
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
  status?: FinanceCollectionStatus;
  page?: number;
  limit?: number;
}

export interface IFinanceMonthlyAmountDuePayload {
  month: string;
  amountDue: number;
}

export interface IFinanceMonthlyAmountDueOverride {
  studentId: string;
  month: string;
  amountDue: number;
}

export interface IFinanceMonthlyAmountDueResetResult {
  studentId: string;
  month: string;
  reset: true;
}

export interface IFinanceMonthlyStatusPayload {
  month: string;
  status: FinanceCollectionStatus;
}

export interface IFinanceMonthlyStatusUpdate {
  studentId: string;
  month: string;
  status: FinanceCollectionStatus;
}
