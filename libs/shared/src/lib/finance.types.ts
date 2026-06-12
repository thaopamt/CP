export interface IFinanceMonthlyRow {
  profileId: string;
  studentId: string;
  studentName: string;
  username?: string | null;
  email: string;
  grade: number;
  classNames: string[];
  billableSessions: number;
  tuitionPerSession: number;
  amountDue: number;
  missingTuitionConfig: boolean;
}

export interface IFinanceMonthlySummary {
  month: string;
  from: string;
  to: string;
  totalStudents: number;
  billableSessions: number;
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
