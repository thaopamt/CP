import { Icon } from '../Icon/Icon';
import { cn } from '../cn';

type Trend = 'up' | 'flat' | 'down';

const TREND_ICON: Record<Trend, string> = {
  up: 'trending_up',
  flat: 'trending_flat',
  down: 'trending_down',
};

const TREND_TONE: Record<Trend, string> = {
  up: 'text-tertiary-container',
  flat: 'text-on-surface-variant',
  down: 'text-error',
};

interface TrendBadgeProps {
  trend: Trend;
  /** "+12.5%", "Same as last week", etc */
  label: string;
  className?: string;
}

export function TrendBadge({ trend, label, className }: TrendBadgeProps) {
  return (
    <span className={cn('inline-flex items-center gap-xs text-label-sm', TREND_TONE[trend], className)}>
      <Icon name={TREND_ICON[trend]} size={16} />
      <span>{label}</span>
    </span>
  );
}
