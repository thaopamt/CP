import { useTranslation } from 'react-i18next';
import { AttendanceStatus, IRosterStudent } from '@cp/shared';
import { Avatar } from '../Avatar/Avatar';
import { cn } from '../cn';
import { AttendanceStatusBadge } from './AttendanceStatusBadge';

interface AttendanceRosterProps {
  students: IRosterStudent[];
  records: Record<string, AttendanceStatus>;
  onChange: (studentId: string, status: AttendanceStatus) => void;
  className?: string;
}

const QUICK_BUTTONS: { code: 'P' | 'A' | 'L' | 'M'; status: AttendanceStatus }[] = [
  { code: 'P', status: AttendanceStatus.PRESENT },
  { code: 'A', status: AttendanceStatus.ABSENT },
  { code: 'L', status: AttendanceStatus.LATE },
  { code: 'M', status: AttendanceStatus.UNMARKED },
];

const ACTIVE_TONE: Record<AttendanceStatus, string> = {
  [AttendanceStatus.PRESENT]:
    'bg-tertiary-container/40 border-tertiary text-tertiary',
  [AttendanceStatus.ABSENT]: 'bg-error-container/60 border-error text-on-error-container',
  [AttendanceStatus.LATE]:
    'bg-tertiary-fixed-dim/60 border-tertiary text-on-tertiary-fixed-variant',
  [AttendanceStatus.UNMARKED]:
    'bg-outline-variant/40 border-outline text-on-surface-variant',
};

const ROW_TONE: Record<AttendanceStatus, string> = {
  [AttendanceStatus.PRESENT]: '',
  [AttendanceStatus.ABSENT]: 'bg-error-container/10',
  [AttendanceStatus.LATE]: 'bg-tertiary-fixed-dim/10',
  [AttendanceStatus.UNMARKED]: '',
};

/**
 * Single-class attendance roster — one row per student with a status
 * badge and four quick-toggle buttons (P/A/L/M). Highlights the row
 * background when a student is marked Absent or Late.
 */
export function AttendanceRoster({ students, records, onChange, className }: AttendanceRosterProps) {
  const { t } = useTranslation();
  return (
    <div className={cn('divide-y divide-outline-variant/30', className)}>
      {students.map((s) => {
        const status = records[s.id] ?? AttendanceStatus.UNMARKED;
        return (
          <div
            key={s.id}
            className={cn(
              'grid gap-sm md:gap-md p-sm md:p-md items-center',
              'grid-cols-1 md:grid-cols-[3fr_1fr_4fr]',
              ROW_TONE[status],
            )}
          >
            {/* Student */}
            <div className="flex items-center gap-sm min-w-0">
              <Avatar
                size="sm"
                initials={initials(s.name)}
                src={s.avatarUrl ?? undefined}
              />
              <div className="min-w-0">
                <div className="text-on-surface font-medium truncate">{s.name}</div>
              </div>
            </div>

            {/* Current status */}
            <div className="md:justify-self-start">
              <AttendanceStatusBadge status={status} />
            </div>

            {/* Quick-toggle buttons */}
            <div className="flex flex-wrap gap-xs md:justify-end">
              {QUICK_BUTTONS.map((btn) => {
                const isActive = btn.status === status;
                return (
                  <button
                    key={btn.code}
                    type="button"
                    onClick={() => onChange(s.id, btn.status)}
                    aria-pressed={isActive}
                    title={t(`enums.attendanceStatus.${btn.status}`)}
                    className={cn(
                      'min-w-[40px] h-9 px-md text-label-sm font-bold rounded-lg border transition-colors',
                      isActive
                        ? ACTIVE_TONE[btn.status]
                        : 'bg-surface-container-low border-outline-variant text-on-surface-variant hover:bg-surface-container-high',
                    )}
                  >
                    {btn.code}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
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
