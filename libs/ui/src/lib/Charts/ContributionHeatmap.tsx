import React, { useMemo } from 'react';
import { cn } from '../cn';
import { IHeatmapData } from '@cp/shared';

interface ContributionHeatmapProps {
  data: IHeatmapData[];
  startDate?: Date;
  endDate?: Date;
  className?: string;
  metric?: 'activityCount' | 'acceptedCount' | 'solvedCount';
}

export function ContributionHeatmap({
  data,
  startDate,
  endDate = new Date(),
  className,
  metric = 'activityCount',
}: ContributionHeatmapProps) {
  const finalStartDate = startDate || new Date(endDate.getTime() - 364 * 24 * 60 * 60 * 1000); // Default to last 365 days

  const weeks = useMemo(() => {
    // Build a map of dates to values
    const dataMap = new Map<string, number>();
    data.forEach((d) => {
      dataMap.set(d.date, d[metric]);
    });

    const current = new Date(finalStartDate);
    current.setHours(0, 0, 0, 0);

    // Adjust to start on Sunday of the first week
    const firstDay = current.getDay();
    current.setDate(current.getDate() - firstDay);

    const end = new Date(endDate);
    end.setHours(0, 0, 0, 0);

    const grid: { date: Date; value: number }[][] = [];
    let currentWeek: { date: Date; value: number }[] = [];

    while (current <= end) {
      if (currentWeek.length === 7) {
        grid.push(currentWeek);
        currentWeek = [];
      }
      const dateStr = current.toISOString().split('T')[0];
      const value = dataMap.get(dateStr) || 0;
      currentWeek.push({ date: new Date(current), value });
      current.setDate(current.getDate() + 1);
    }

    if (currentWeek.length > 0) {
      // Pad the rest of the last week if necessary
      while (currentWeek.length < 7) {
        currentWeek.push({ date: new Date(current), value: 0 });
        current.setDate(current.getDate() + 1);
      }
      grid.push(currentWeek);
    }

    return grid;
  }, [data, finalStartDate, endDate, metric]);

  const getColorClass = (value: number) => {
    if (value === 0) return 'bg-slate-100 dark:bg-slate-800';
    if (value <= 2) return 'bg-emerald-200 dark:bg-emerald-900';
    if (value <= 5) return 'bg-emerald-400 dark:bg-emerald-700';
    if (value <= 9) return 'bg-emerald-600 dark:bg-emerald-500';
    return 'bg-emerald-800 dark:bg-emerald-400';
  };

  const getMetricLabel = () => {
    if (metric === 'acceptedCount') return 'Accepted Submissions';
    if (metric === 'solvedCount') return 'Problems Solved';
    return 'Submissions';
  };

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div className="flex items-start gap-4">
        {/* Days of week labels */}
        <div className="flex flex-col gap-[4px] mt-[1.5rem] text-xs text-slate-400 dark:text-slate-500 leading-[12px] h-[108px] justify-between">
          <span>Sun</span>
          <span>Tue</span>
          <span>Thu</span>
          <span>Sat</span>
        </div>

        {/* Heatmap Grid */}
        <div className="flex-1 overflow-x-auto pb-2">
          <div className="flex gap-[4px] min-w-max">
            {weeks.map((week, weekIdx) => (
              <div key={weekIdx} className="flex flex-col gap-[4px]">
                {weekIdx === 0 || week[0].date.getDate() <= 7 ? (
                  <div className="h-4 text-xs text-slate-400 dark:text-slate-500 mb-1">
                    {week[0].date.toLocaleString('default', { month: 'short' })}
                  </div>
                ) : (
                  <div className="h-4 mb-1" />
                )}
                {week.map((day, dayIdx) => (
                  <div
                    key={dayIdx}
                    className={cn(
                      'w-[12px] h-[12px] rounded-sm transition-colors hover:ring-2 hover:ring-slate-300 dark:hover:ring-slate-600',
                      getColorClass(day.value)
                    )}
                    title={`${day.value} ${getMetricLabel()} on ${day.date.toDateString()}`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Legend */}
      <div className="flex items-center justify-end gap-2 text-xs text-slate-500 dark:text-slate-400 mt-2">
        <span>Less</span>
        <div className="flex gap-1">
          <div className="w-[12px] h-[12px] rounded-sm bg-slate-100 dark:bg-slate-800" />
          <div className="w-[12px] h-[12px] rounded-sm bg-emerald-200 dark:bg-emerald-900" />
          <div className="w-[12px] h-[12px] rounded-sm bg-emerald-400 dark:bg-emerald-700" />
          <div className="w-[12px] h-[12px] rounded-sm bg-emerald-600 dark:bg-emerald-500" />
          <div className="w-[12px] h-[12px] rounded-sm bg-emerald-800 dark:bg-emerald-400" />
        </div>
        <span>More</span>
      </div>
    </div>
  );
}
