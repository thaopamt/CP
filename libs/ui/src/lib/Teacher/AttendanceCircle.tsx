import { cn } from '../cn';

interface AttendanceCircleProps {
  /** 0–100 */
  percentage: number;
  label?: string;
  size?: number;
  /** Tailwind text colour controlling the stroke (uses currentColor) */
  className?: string;
}

/**
 * SVG circular progress indicator used by the Teacher Dashboard
 * attendance widget. Stroke colour follows currentColor so it picks up
 * `className="text-primary"` etc.
 */
export function AttendanceCircle({
  percentage,
  label = 'Present',
  size = 160,
  className,
}: AttendanceCircleProps) {
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const dash = (percentage / 100) * circumference;

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
          strokeWidth="9"
          fill="none"
        />
        <circle
          cx="50"
          cy="50"
          r={radius}
          stroke="currentColor"
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference}`}
          fill="none"
        />
      </svg>
      <div className="text-center">
        <div className="font-manrope text-headline-lg text-on-surface">{percentage}%</div>
        <div className="text-label-sm text-on-surface-variant">{label}</div>
      </div>
    </div>
  );
}
