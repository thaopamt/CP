import { useTranslation } from 'react-i18next';
import { ClassSessionStatus, IClassSession } from '@cp/shared';
import { Icon } from '../Icon/Icon';
import { cn } from '../cn';

interface ClassScheduleCardProps {
  session: IClassSession;
  onOpen?: () => void;
  className?: string;
}

const STATUS_TONE: Record<ClassSessionStatus, string> = {
  [ClassSessionStatus.ACTIVE]:
    'bg-tertiary-container/30 border-tertiary-container/60 ring-1 ring-tertiary-container',
  [ClassSessionStatus.UPCOMING]: 'bg-surface-container border-outline-variant/40',
  [ClassSessionStatus.COMPLETED]: 'bg-surface-container-low border-outline-variant/40 opacity-70',
};

/**
 * Compact schedule card used on the Teacher Dashboard. Shows a class
 * window, location, and student count; the active variant gets a pulsing
 * "Live" dot. Status label is translated via `enums.classSessionStatus.*`.
 */
export function ClassScheduleCard({ session, onOpen, className }: ClassScheduleCardProps) {
  const { t } = useTranslation();
  const isActive = session.status === ClassSessionStatus.ACTIVE;
  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        'group w-full text-left rounded-xl border p-md flex items-start gap-md transition-all hover:shadow-elev-2',
        STATUS_TONE[session.status],
        className,
      )}
    >
      <div className="w-20 shrink-0">
        <div className="text-label-sm font-bold text-on-surface">
          {formatTime(session.startTime)}
        </div>
        <div className="text-[12px] text-on-surface-variant">
          {t('ui.classScheduleCard.durationMin', {
            count: durationMinutes(session.startTime, session.endTime),
          })}
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-sm">
          <h4 className="font-manrope text-headline-md text-on-surface truncate">{session.title}</h4>
          {isActive && (
            <span className="relative inline-flex w-2 h-2">
              <span className="absolute inset-0 rounded-full bg-tertiary animate-ping opacity-60" />
              <span className="relative w-2 h-2 rounded-full bg-tertiary" />
            </span>
          )}
        </div>
        <div className="flex items-center gap-md text-label-sm text-on-surface-variant mt-xs">
          <span className="inline-flex items-center gap-xs">
            <Icon name="groups" size={16} />
            {t('ui.classScheduleCard.students', { count: session.studentCount })}
          </span>
        </div>
      </div>

      <span
        className={cn(
          'shrink-0 px-md py-xs rounded-full text-[11px] uppercase tracking-wider font-bold',
          isActive
            ? 'bg-tertiary text-on-tertiary'
            : 'bg-surface-container-high text-on-surface-variant',
        )}
      >
        {t(`enums.classSessionStatus.${session.status}`)}
      </span>
    </button>
  );
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function durationMinutes(startIso: string, endIso: string): number {
  return Math.round((new Date(endIso).getTime() - new Date(startIso).getTime()) / 60_000);
}
