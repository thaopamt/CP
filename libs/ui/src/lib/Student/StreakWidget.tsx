import { useTranslation } from 'react-i18next';
import { Icon } from '../Icon/Icon';
import { cn } from '../cn';

interface StreakWidgetProps {
  days: number;
  nextMilestone: number;
  className?: string;
}

/**
 * Gamified streak indicator — fire icon + days count + progress bar.
 * Used in the student sidebar / hero.
 */
export function StreakWidget({ days, nextMilestone, className }: StreakWidgetProps) {
  const { t } = useTranslation();
  const pct = Math.min(100, Math.round((days / nextMilestone) * 100));
  const remaining = Math.max(0, nextMilestone - days);
  return (
    <div
      className={cn(
        'flex items-center gap-md p-md rounded-2xl bg-tertiary-container/30 border border-tertiary-container/60',
        className,
      )}
    >
      <div className="relative shrink-0 w-12 h-12 rounded-full bg-tertiary-container grid place-items-center text-tertiary">
        <span className="absolute inset-0 rounded-full bg-tertiary/30 blur-md animate-pulse" aria-hidden />
        <Icon name="local_fire_department" filled className="relative" size={26} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-xs">
          <span className="font-manrope text-headline-md text-tertiary">{days}</span>
          <span className="text-label-sm text-on-surface-variant">
            {t('ui.streak.dayStreak', { count: days }).replace(/^\d+\s*/, '')}
          </span>
        </div>
        <div className="mt-xs h-2 rounded-full bg-surface-container-highest overflow-hidden">
          <div className="h-full bg-tertiary rounded-full" style={{ width: `${pct}%` }} />
        </div>
        <div className="text-[11px] text-on-surface-variant mt-xs">
          {t('ui.streak.milestoneSuffix', { count: remaining, milestone: nextMilestone })}
        </div>
      </div>
    </div>
  );
}
