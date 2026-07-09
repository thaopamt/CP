# Finance Charts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Thêm Dashboard biểu đồ trực quan vào trang Admin Finance (gồm Biểu đồ Xu hướng và Cơ cấu thu chi).

**Architecture:** 
1. Cài đặt thư viện `recharts`.
2. Tạo API `GET /api/finance/monthly-trend` để trả về summary của 6 tháng gần nhất bằng cách gọi lại hàm `getMonthlyReport`.
3. Xây dựng component `FinanceDashboardCharts` ở Frontend chứa Trend Chart (Bar) và Breakdown Chart (Pie).
4. Nhúng component vào `AdminFinancePage`.

**Tech Stack:** React, Recharts, NestJS, TailwindCSS.

## Global Constraints
- Viết code sạch, tái sử dụng logic.
- Không phá vỡ luồng Teacher Finance hiện tại.

---

### Task 1: Cài đặt thư viện Recharts

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Cài đặt recharts**

```bash
pnpm add recharts
```

### Task 2: Backend API `monthly-trend`

**Files:**
- Modify: `apps/api/src/modules/finance/finance.service.ts`
- Modify: `apps/api/src/modules/finance/finance.controller.ts`

**Interfaces:**
- Produces: API `GET /api/finance/monthly-trend?month=YYYY-MM&months=6` trả về `Array<{ month: string, summary: IFinanceMonthlySummary }>`.

- [ ] **Step 1: Cập nhật Service (`finance.service.ts`)**
Thêm hàm `getMonthlyTrend`. Sử dụng logic lấy 6 tháng (tính lùi) và gọi hàm `getMonthlyReport` cho từng tháng.

```typescript
  async getMonthlyTrend(monthStr?: string, monthsCount: number = 6, user?: any) {
    const endMonthDate = monthStr ? new Date(`${monthStr}-01T00:00:00Z`) : new Date();
    const result = [];
    
    // Tạo danh sách các tháng lùi dần về quá khứ
    for (let i = monthsCount - 1; i >= 0; i--) {
      const d = new Date(endMonthDate);
      d.setUTCMonth(d.getUTCMonth() - i);
      const mStr = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
      
      // Gọi lại hàm getMonthlyReport cho tháng này
      const report = await this.getMonthlyReport(mStr, {}, user);
      result.push({
        month: mStr,
        summary: report.summary,
      });
    }
    
    return result;
  }
```

- [ ] **Step 2: Cập nhật Controller (`finance.controller.ts`)**

```typescript
  @Get('monthly-trend')
  getMonthlyTrend(
    @Query('month') month?: string,
    @Query('months') months?: string,
    @Req() req?: any,
  ) {
    const monthsCount = months ? parseInt(months, 10) : 6;
    return this.financeService.getMonthlyTrend(month, monthsCount, req?.user);
  }
```

### Task 3: Component `FinanceDashboardCharts`

**Files:**
- Create: `apps/web/src/app/pages/admin/FinanceDashboardCharts.tsx`

**Interfaces:**
- Consumes: Mảng Trend data từ API và `reportQuery.data.summary` từ trang AdminFinancePage.

- [ ] **Step 1: Tạo Component**

```tsx
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { axiosInstance } from '../../api';

interface Props {
  currentMonth: string;
  currentSummary?: {
    totalPotentialAmount: number;
    totalAmountDue: number;
    totalOutstandingAmount: number;
  };
}

export function FinanceDashboardCharts({ currentMonth, currentSummary }: Props) {
  const { data: trendData } = useQuery({
    queryKey: ['finance-monthly-trend', currentMonth],
    queryFn: async () => {
      const res = await axiosInstance.get(`/api/finance/monthly-trend?month=${currentMonth}&months=6`);
      return res.data as Array<{ month: string; summary: any }>;
    },
  });

  const chartData = trendData?.map(d => ({
    name: d.month,
    potential: d.summary.totalPotentialAmount,
    due: d.summary.totalAmountDue,
    outstanding: d.summary.totalOutstandingAmount,
  })) || [];

  const breakdownData = currentSummary ? [
    { name: 'Đã thu', value: currentSummary.totalAmountDue - currentSummary.totalOutstandingAmount },
    { name: 'Chưa thu', value: currentSummary.totalOutstandingAmount }
  ] : [];

  const formatK = (val: number) => `${(val / 1000).toLocaleString()}k`;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-md">
      <div className="lg:col-span-2 rounded-2xl border border-outline-variant bg-surface p-md shadow-sm">
        <h3 className="mb-md text-[15px] font-semibold text-on-surface">Xu hướng 6 tháng gần nhất</h3>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" fontSize={12} tickLine={false} />
              <YAxis tickFormatter={formatK} fontSize={12} tickLine={false} axisLine={false} />
              <RechartsTooltip formatter={(value: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)} />
              <Legend wrapperStyle={{ fontSize: '13px' }} />
              <Bar dataKey="potential" name="Tối đa" fill="#94a3b8" radius={[4, 4, 0, 0]} />
              <Bar dataKey="due" name="Tổng thu" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="outstanding" name="Chưa thu" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      <div className="lg:col-span-1 rounded-2xl border border-outline-variant bg-surface p-md shadow-sm">
        <h3 className="mb-md text-[15px] font-semibold text-on-surface">Cơ cấu tháng {currentMonth}</h3>
        <div className="h-[300px]">
          {currentSummary && currentSummary.totalAmountDue > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={breakdownData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" stroke="none">
                  <Cell fill="#10b981" />
                  <Cell fill="#ef4444" />
                </Pie>
                <RechartsTooltip formatter={(value: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)} />
                <Legend wrapperStyle={{ fontSize: '13px' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-on-surface-variant italic">Không có khoản thu</div>
          )}
        </div>
      </div>
    </div>
  );
}
```

### Task 4: Nhúng vào `AdminFinancePage`

**Files:**
- Modify: `apps/web/src/app/pages/admin/FinancePage.tsx`

- [ ] **Step 1: Import và render component**

Thêm dòng import:
```tsx
import { FinanceDashboardCharts } from './FinanceDashboardCharts';
```

Thêm component vào giao diện ngay sau khối `StatCard`s:
```tsx
      <section className="grid grid-cols-1 md:grid-cols-3 gap-sm">
         {/* ... (các StatCard) ... */}
      </section>

      <section>
        <FinanceDashboardCharts currentMonth={month} currentSummary={summary} />
      </section>
```
