import { useTranslation } from 'react-i18next';
import { cn } from '../cn';

type Status = 'past' | 'now' | 'upcoming' | 'planning';

interface ScheduleItemProps {
  time: string;
  duration: string;
  title: string;
  subtitle?: string;
  status?: Status;
}

const STATUS_BORDER: Record<Status, string> = {
  past: 'border-l-outline-variant',
  now: 'border-l-primary',
  upcoming: 'border-l-tertiary-container',
  planning: 'border-l-secondary-container',
};

const STATUS_BG: Record<Status, string> = {
  past: '',
  now: 'bg-primary-container/10 border border-primary/20',
  upcoming: '',
  planning: '',
};

/**
 * One row in the Teacher Dashboard schedule widget.
 */
export function ScheduleItem({ time, duration, title, subtitle, status = 'upcoming' }: ScheduleItemProps) {
  const { t } = useTranslation();
  return (
    <div
      className={cn(
        'flex items-stretch gap-md p-sm rounded-lg group hover:bg-surface-container-low transition-colors relative',
        STATUS_BG[status],
      )}
    >
      <div className="w-20 shrink-0">
        <div className="text-label-sm font-bold text-on-surface">{time}</div>
        <div className="text-[12px] text-on-surface-variant">{duration}</div>
      </div>
      <div className={cn('w-1 rounded-full border-l-4', STATUS_BORDER[status])} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-sm">
          <h4 className="text-body-md font-semibold text-on-surface truncate">{title}</h4>
          {status === 'now' && (
            <span className="text-[10px] uppercase font-bold tracking-wider px-sm py-xs rounded-full bg-surface text-primary border border-primary/40">
              {t('ui.schedule.now')}
            </span>
          )}
        </div>
        {subtitle && <p className="text-label-sm text-on-surface-variant truncate">{subtitle}</p>}
      </div>
    </div>
  );
}
