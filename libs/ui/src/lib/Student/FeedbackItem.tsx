import { useTranslation } from 'react-i18next';
import { IFeedback } from '@cp/shared';
import { Avatar } from '../Avatar/Avatar';
import { Icon } from '../Icon/Icon';
import { cn } from '../cn';

interface FeedbackItemProps {
  feedback: IFeedback;
  onOpen?: () => void;
  className?: string;
}

export function FeedbackItem({ feedback, onOpen, className }: FeedbackItemProps) {
  const { t } = useTranslation();
  return (
    <article
      className={cn(
        'p-md rounded-2xl border border-outline-variant/40 bg-surface-container-lowest',
        className,
      )}
    >
      <header className="flex items-center gap-sm mb-sm">
        <Avatar
          size="sm"
          initials={initials(feedback.teacherName)}
          src={feedback.teacherAvatarUrl ?? undefined}
        />
        <div className="flex-1 min-w-0">
          <div className="text-body-md font-semibold text-on-surface truncate">{feedback.teacherName}</div>
          <div className="text-[11px] text-on-surface-variant">{relativeTime(feedback.postedAt, t)}</div>
        </div>
      </header>
      <p className="text-body-md text-on-surface line-clamp-3 mb-sm">{feedback.text}</p>
      <button
        type="button"
        onClick={onOpen}
        className="inline-flex items-center gap-xs text-primary text-label-sm font-semibold hover:underline"
      >
        <Icon name="assignment" size={16} />
        {feedback.assignmentTitle}
      </button>
    </article>
  );
}

function initials(name: string) {
  return name.split(' ').slice(0, 2).map((p) => p[0]).join('').toUpperCase();
}

function relativeTime(iso: string, t: (k: string, v?: Record<string, unknown>) => string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.round(diff / 60_000);
  if (minutes < 1) return t('ui.feedback.justNow');
  if (minutes < 60) return t('ui.feedback.minutesAgo', { count: minutes });
  const hours = Math.round(minutes / 60);
  if (hours < 24) return t('ui.feedback.hoursAgo', { count: hours });
  return t('ui.feedback.daysAgo', { count: Math.round(hours / 24) });
}
