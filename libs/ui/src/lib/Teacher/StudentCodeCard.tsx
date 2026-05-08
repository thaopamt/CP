import { useTranslation } from 'react-i18next';
import { ClassroomStudentStatus, IClassroomStudent } from '@cp/shared';
import { Avatar } from '../Avatar/Avatar';
import { Icon } from '../Icon/Icon';
import { cn } from '../cn';
import { CodeThumbnail } from './CodeThumbnail';
import { StatusIndicator } from './StatusIndicator';

interface StudentCodeCardProps {
  student: IClassroomStudent;
  language?: string;
  errorLines?: number[];
  onView?: () => void;
  onDismissHelp?: () => void;
  onJoin?: () => void;
  className?: string;
}

const RING_TONE: Record<ClassroomStudentStatus, string> = {
  [ClassroomStudentStatus.ACTIVE]: 'border-outline-variant/40',
  [ClassroomStudentStatus.HELP_NEEDED]: 'border-error/60 bg-error-container/10',
  [ClassroomStudentStatus.IDLE]: 'border-outline-variant/40',
  [ClassroomStudentStatus.AWAY]: 'border-outline-variant/40',
};

/**
 * One tile in the live classroom monitoring grid.
 *  - Active: full-color, hover overlay with "View screen" button.
 *  - Help needed: red ring, error-highlighted code, Dismiss + Join CTAs.
 *  - Idle:    faded code thumbnail, label like "Idle 5m".
 *  - Away:    swap code thumbnail for a "Screen locked" placeholder.
 */
export function StudentCodeCard({
  student,
  language,
  errorLines,
  onView,
  onDismissHelp,
  onJoin,
  className,
}: StudentCodeCardProps) {
  const { t } = useTranslation();
  const isAway = student.status === ClassroomStudentStatus.AWAY;
  const isHelp = student.status === ClassroomStudentStatus.HELP_NEEDED;
  const isIdle = student.status === ClassroomStudentStatus.IDLE;
  const idleLabel =
    isIdle && student.idleMinutes != null
      ? t('ui.statusIndicator.idleMinutes', { count: student.idleMinutes })
      : undefined;

  return (
    <article
      className={cn(
        'group relative bg-surface-container-lowest border rounded-xl p-md flex flex-col gap-sm transition-colors hover:border-primary-fixed-dim',
        RING_TONE[student.status],
        className,
      )}
    >
      <header className="flex items-center gap-sm">
        <Avatar size="sm" initials={initials(student.name)} src={student.avatarUrl ?? undefined} />
        <div className="flex-1 min-w-0">
          <div className="text-on-surface font-semibold truncate">{student.name}</div>
          <StatusIndicator status={student.status} label={idleLabel} />
        </div>
      </header>

      {isAway ? (
        <div className="rounded-md bg-surface-container-high border border-outline-variant grid place-items-center min-h-[140px] text-on-surface-variant gap-xs">
          <Icon name="lock" size={28} />
          <span className="text-label-sm">{t('ui.studentCodeCard.screenLocked')}</span>
        </div>
      ) : (
        <CodeThumbnail
          code={student.currentCode ?? '// no code yet'}
          language={language}
          errorLines={isHelp ? errorLines ?? [4] : undefined}
          faded={isIdle}
        />
      )}

      {isHelp ? (
        <div className="flex gap-sm">
          <button
            type="button"
            onClick={onDismissHelp}
            className="flex-1 px-md py-sm text-label-sm font-semibold rounded-lg border border-outline-variant text-on-surface-variant hover:bg-surface-container-high"
          >
            {t('ui.studentCodeCard.dismiss')}
          </button>
          <button
            type="button"
            onClick={onJoin}
            className="flex-1 px-md py-sm text-label-sm font-semibold rounded-lg bg-primary text-on-primary hover:brightness-95"
          >
            {t('ui.studentCodeCard.joinSession')}
          </button>
        </div>
      ) : (
        !isAway && (
          <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity bg-on-surface/40 backdrop-blur-[2px] grid place-items-center">
            <button
              type="button"
              onClick={onView}
              className="px-lg py-sm rounded-lg bg-surface text-on-surface font-semibold shadow-elev-2 inline-flex items-center gap-xs"
            >
              <Icon name="visibility" size={18} />
              {t('ui.studentCodeCard.viewScreen')}
            </button>
          </div>
        )
      )}
    </article>
  );
}

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();
}
