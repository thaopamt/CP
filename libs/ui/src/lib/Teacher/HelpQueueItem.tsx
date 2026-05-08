import { useTranslation } from 'react-i18next';
import { IHelpRequest } from '@cp/shared';
import { Avatar } from '../Avatar/Avatar';
import { cn } from '../cn';

interface HelpQueueItemProps {
  request: IHelpRequest;
  onDismiss?: () => void;
  onAccept?: () => void;
  className?: string;
}

export function HelpQueueItem({ request, onDismiss, onAccept, className }: HelpQueueItemProps) {
  const { t } = useTranslation();
  return (
    <li
      className={cn(
        'flex flex-col gap-sm p-md rounded-xl border border-error/30 bg-error-container/10',
        className,
      )}
    >
      <header className="flex items-center gap-sm">
        <Avatar
          size="sm"
          initials={initials(request.studentName)}
          src={request.studentAvatarUrl ?? undefined}
        />
        <div className="flex-1 min-w-0">
          <div className="text-on-surface font-semibold truncate">{request.studentName}</div>
          <div className="text-[11px] text-on-surface-variant">{relativeTime(request.requestedAt, t)}</div>
        </div>
      </header>
      <p className="text-label-sm text-on-surface-variant line-clamp-2">{request.message}</p>
      <div className="flex gap-sm">
        <button
          type="button"
          onClick={onDismiss}
          className="flex-1 px-md py-sm rounded-lg border border-outline-variant text-on-surface-variant hover:bg-surface-container-high text-label-sm font-semibold"
        >
          {t('ui.helpQueue.dismiss')}
        </button>
        <button
          type="button"
          onClick={onAccept}
          className="flex-1 px-md py-sm rounded-lg bg-primary text-on-primary hover:brightness-95 text-label-sm font-semibold"
        >
          {t('ui.helpQueue.accept')}
        </button>
      </div>
    </li>
  );
}

function initials(name: string) {
  return name.split(' ').slice(0, 2).map((p) => p[0]).join('').toUpperCase();
}

function relativeTime(iso: string, t: (k: string, v?: Record<string, unknown>) => string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.round(diff / 60_000);
  if (minutes < 1) return t('ui.helpQueue.justNow');
  if (minutes < 60) return t('ui.helpQueue.minutesAgo', { count: minutes });
  const hours = Math.round(minutes / 60);
  if (hours < 24) return t('ui.helpQueue.hoursAgo', { count: hours });
  return t('ui.helpQueue.daysAgo', { count: Math.round(hours / 24) });
}
