import { useMemo } from 'react';
import { cn } from '../cn';

interface AreaChartProps {
  data: number[];
  /** Tailwind colour class for the line/area, e.g. "text-primary" */
  className?: string;
  height?: number;
  showAxis?: boolean;
}

/**
 * Inline SVG area chart. No JS dependency — sized by viewBox so it
 * scales fluidly inside its parent. Use for revenue trends, growth, etc.
 */
export function AreaChart({ data, className, height = 200, showAxis }: AreaChartProps) {
  const { linePath, areaPath } = useMemo(() => buildPaths(data), [data]);

  return (
    <div className={cn('w-full relative', className)} style={{ height }}>
      <svg
        viewBox="0 0 100 40"
        preserveAspectRatio="none"
        className="w-full h-full"
        aria-hidden
      >
        <defs>
          <linearGradient id="cp-area-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.25" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill="url(#cp-area-grad)" />
        <path d={linePath} fill="none" stroke="currentColor" strokeWidth="0.6" strokeLinejoin="round" />
      </svg>
      {showAxis && (
        <div className="absolute inset-x-0 bottom-0 flex justify-between text-[10px] text-on-surface-variant px-xs">
          {data.map((_, i) => (
            <span key={i}>{i % Math.ceil(data.length / 6) === 0 ? `M${i + 1}` : ''}</span>
          ))}
        </div>
      )}
    </div>
  );
}

function buildPaths(data: number[]) {
  if (data.length === 0) return { linePath: '', areaPath: '' };
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const W = 100;
  const H = 40;
  const stepX = data.length > 1 ? W / (data.length - 1) : 0;
  const points = data.map((v, i) => {
    const x = i * stepX;
    const y = H - ((v - min) / range) * (H - 2) - 1;
    return [x, y] as const;
  });
  const linePath = points.reduce((acc, [x, y], i) => `${acc}${i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`}`, '');
  const areaPath = `${linePath} L ${W} ${H} L 0 ${H} Z`;
  return { linePath, areaPath };
}
