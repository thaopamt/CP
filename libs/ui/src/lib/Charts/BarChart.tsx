import { cn } from '../cn';

interface BarChartProps {
  data: { label: string; value: number }[];
  /** Tailwind colour class for the bars, e.g. "bg-primary" */
  barClassName?: string;
  height?: number;
  className?: string;
}

/**
 * Pure-CSS faux bar chart — divs with percentage heights.
 * Matches the "Faux Bar Chart" pattern in the v2 Admin Dashboard prototype.
 */
export function BarChart({
  data,
  barClassName = 'bg-primary/80',
  height = 200,
  className,
}: BarChartProps) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className={cn('w-full flex flex-col', className)}>
      <div
        className="flex items-end justify-around gap-sm border-b border-outline-variant"
        style={{ height }}
      >
        {data.map((d) => {
          const pct = (d.value / max) * 100;
          return (
            <div
              key={d.label}
              className={cn(
                'flex-1 max-w-[40px] rounded-t-md transition-all hover:brightness-110',
                barClassName,
              )}
              style={{ height: `${pct}%` }}
              title={`${d.label}: ${d.value}`}
            />
          );
        })}
      </div>
      <div className="flex justify-around gap-sm mt-xs text-[10px] text-on-surface-variant">
        {data.map((d) => (
          <span key={d.label} className="flex-1 max-w-[40px] text-center">
            {d.label}
          </span>
        ))}
      </div>
    </div>
  );
}
