import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../lib/api-client';

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
      const res = await apiClient.get(`/finance/monthly-trend?month=${currentMonth}&months=6`);
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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-sm mt-4">
      <div className="lg:col-span-2 rounded-2xl border border-outline-variant bg-surface p-md shadow-sm">
        <h3 className="mb-md text-[15px] font-semibold text-on-surface">Xu hướng 6 tháng gần nhất</h3>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" fontSize={12} tickLine={false} />
              <YAxis tickFormatter={formatK} fontSize={12} tickLine={false} axisLine={false} />
              <RechartsTooltip formatter={(value: any) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)} />
              <Legend wrapperStyle={{ fontSize: '13px', paddingTop: '10px' }} />
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
                <RechartsTooltip formatter={(value: any) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)} />
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
