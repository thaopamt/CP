import { useTranslation } from 'react-i18next';
import { ClassroomStudentStatus } from '@cp/shared';
import { cn } from '../cn';

const TONE: Record<ClassroomStudentStatus, { dot: string; text: string }> = {
  [ClassroomStudentStatus.ACTIVE]: { dot: 'bg-tertiary', text: 'text-tertiary' },
  [ClassroomStudentStatus.HELP_NEEDED]: { dot: 'bg-error', text: 'text-error' },
  [ClassroomStudentStatus.IDLE]: { dot: 'bg-tertiary-fixed', text: 'text-on-tertiary-fixed-variant' },
  [ClassroomStudentStatus.AWAY]: { dot: 'bg-outline', text: 'text-on-surface-variant' },
};

interface StatusIndicatorProps {
  status: ClassroomStudentStatus;
  /** Override the "Active" / "Help needed" label, e.g. "Idle 5m" */
  label?: string;
  /** Whether the dot should pulse — usually true for ACTIVE/HELP_NEEDED */
  pulse?: boolean;
  className?: string;
}

/**
 * Animated status pip — a coloured dot with optional ping animation,
 * followed by a label. Used by the Live Classroom monitoring grid and
 * the help queue.
 */
export function StatusIndicator({ status, label, pulse, className }: StatusIndicatorProps) {
  const { t } = useTranslation();
  const tone = TONE[status];
  const showPing = pulse ?? (status === ClassroomStudentStatus.ACTIVE || status === ClassroomStudentStatus.HELP_NEEDED);
  return (
    <span className={cn('inline-flex items-center gap-xs text-label-sm font-semibold', tone.text, className)}>
      <span className="relative inline-flex w-2 h-2">
        {showPing && (
          <span className={cn('absolute inset-0 rounded-full opacity-60 animate-ping', tone.dot)} />
        )}
        <span className={cn('relative w-2 h-2 rounded-full', tone.dot)} />
      </span>
      {label ?? t(`ui.statusIndicator.${status}`)}
    </span>
  );
}
