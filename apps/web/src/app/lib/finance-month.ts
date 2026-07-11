const FINANCE_MONTH_RE = /^(\d{4})-(0[1-9]|1[0-2])$/;

function padMonth(value: number): string {
  return String(value).padStart(2, '0');
}

function monthValue(year: number, monthIndex: number): string {
  return `${year}-${padMonth(monthIndex + 1)}`;
}

function parseFinanceMonth(month: string): { year: number; monthIndex: number } | null {
  const match = FINANCE_MONTH_RE.exec(month);
  if (!match) return null;
  return {
    year: Number(match[1]),
    monthIndex: Number(match[2]) - 1,
  };
}

export function currentFinanceMonth(date: Date = new Date()): string {
  return monthValue(date.getFullYear(), date.getMonth());
}

export function formatFinanceMonthLabel(month: string): string {
  const parsed = parseFinanceMonth(month);
  if (!parsed) return month;
  return `${padMonth(parsed.monthIndex + 1)}/${parsed.year}`;
}

export function shiftFinanceMonth(month: string, offset: number): string {
  const parsed = parseFinanceMonth(month);
  if (!parsed) return currentFinanceMonth();
  const date = new Date(parsed.year, parsed.monthIndex + offset, 1);
  return monthValue(date.getFullYear(), date.getMonth());
}
