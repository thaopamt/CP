export const FINANCE_BILLING_STATUSES = ['READY', 'MISSING_TUITION', 'NO_SCHEDULE', 'NO_BILLABLE'] as const;
export type FinanceBillingStatus = (typeof FINANCE_BILLING_STATUSES)[number];

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
  parentName?: string | null;
  parentPhone?: string | null;
  amountDueOverride?: number | null;
  hasAmountDueOverride: boolean;
  /** Whether the student has at least one teacher assigned (TeacherStudent link). */
  hasAssignedTeacher: boolean;
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
  /** Full-month tuition summed over all students. */
  totalPotentialAmount: number;
  /** Actual collectable (amountDue) summed over all students. */
  totalAmountDue: number;
  /** Full-month tuition summed over students with NO assigned teacher ("trung tâm"). */
  centerPotentialAmount: number;
  /** Actual collectable summed over students with NO assigned teacher ("trung tâm"). */
  centerAmountDue: number;
  /** Full-month tuition summed over students with ≥1 assigned teacher ("tại nhà"). */
  homePotentialAmount: number;
  /** Actual collectable summed over students with ≥1 assigned teacher ("tại nhà"). */
  homeAmountDue: number;
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
  billingStatus?: FinanceBillingStatus;
  studentGroup?: 'center' | 'home';
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
