import { ReactNode } from 'react';
import { cn } from '../cn';

interface ProgressRingProps {
  value: number;
  max?: number;
  size?: number;
  /** stroke thickness in viewBox units (out of 100) */
  thickness?: number;
  /** Tailwind class controlling the stroke colour via currentColor */
  className?: string;
  children?: ReactNode;
}

/**
 * Generic SVG progress ring. Uses currentColor for the active stroke
 * so callers can do <ProgressRing className="text-tertiary" />.
 *
 * Drop a centred label via children:
 *
 *   <ProgressRing value={45} max={60} className="text-tertiary">
 *     <div className="text-headline-md">45m</div>
 *     <div className="text-label-sm text-on-surface-variant">of 60</div>
 *   </ProgressRing>
 */
export function ProgressRing({
  value,
  max = 100,
  size = 160,
  thickness = 9,
  className,
  children,
}: ProgressRingProps) {
  const pct = Math.max(0, Math.min(1, max === 0 ? 0 : value / max));
  const radius = 50 - thickness / 2;
  const circumference = 2 * Math.PI * radius;
  const dash = pct * circumference;

  return (
    <div
      className={cn('relative grid place-items-center text-primary', className)}
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 100 100" className="absolute inset-0 -rotate-90">
        <circle
          cx="50"
          cy="50"
          r={radius}
          stroke="currentColor"
          strokeOpacity="0.12"
          strokeWidth={thickness}
          fill="none"
        />
        <circle
          cx="50"
          cy="50"
          r={radius}
          stroke="currentColor"
          strokeWidth={thickness}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference}`}
          fill="none"
        />
      </svg>
      <div className="text-center px-md">{children}</div>
    </div>
  );
}
