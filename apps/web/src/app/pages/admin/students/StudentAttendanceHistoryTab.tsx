import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AttendanceStatus, IStudentAttendanceHistoryItem } from '@cp/shared';
import { Icon } from '@cp/ui';

import { useStudentAttendanceHistory } from '../../../api/attendance.queries';

const STATUS_CLASS: Record<AttendanceStatus, string> = {
  [AttendanceStatus.PRESENT]: 'bg-green-100 text-green-800 border-green-200',
  [AttendanceStatus.LATE]: 'bg-amber-100 text-amber-800 border-amber-200',
  [AttendanceStatus.ABSENT]: 'bg-red-100 text-red-800 border-red-200',
  [AttendanceStatus.UNMARKED]: 'bg-surface-container text-on-surface-variant border-outline-variant',
};

function monthBounds(month: string) {
  const [year, monthIndex] = month.split('-').map(Number);
  const from = `${year}-${String(monthIndex).padStart(2, '0')}-01`;
  const to = new Date(Date.UTC(year, monthIndex, 0)).toISOString().slice(0, 10);
  return { from, to };
}

function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function formatDate(date: string, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
  }).format(new Date(`${date}T00:00:00`));
}

function formatTime(row: IStudentAttendanceHistoryItem) {
  if (!row.startTime || !row.endTime) return '--:--';
  return `${row.startTime.slice(0, 5)} - ${row.endTime.slice(0, 5)}`;
}

export default function StudentAttendanceHistoryTab({ studentId }: { studentId: string }) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language === 'vi' ? 'vi-VN' : 'en-US';
  const [month, setMonth] = useState(currentMonth());
  const params = useMemo(() => monthBounds(month), [month]);
  const historyQuery = useStudentAttendanceHistory(studentId, params);

  const records = historyQuery.data?.records ?? [];
  const summary = historyQuery.data?.summary;

  return (
    <div className="p-md md:p-lg flex flex-col gap-md">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-sm">
        <div>
          <h4 className="font-manrope text-headline-md text-on-surface">
            {t('pages.admin.studentProfile.attendance.title')}
          </h4>
          <p className="text-body-sm text-on-surface-variant">
            {t('pages.admin.studentProfile.attendance.subtitle')}
          </p>
        </div>
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value || currentMonth())}
          className="bg-surface-container-low border border-outline-variant rounded-lg px-md py-sm focus:ring-2 focus:ring-primary outline-none"
        />
      </header>

      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-sm">
          <SummaryCell label={t('pages.admin.studentProfile.attendance.rate')} value={`${summary.attendanceRate}%`} />
          <SummaryCell label={t('pages.admin.studentProfile.attendance.attended')} value={String(summary.attended)} />
          <SummaryCell label={t('pages.admin.studentProfile.attendance.absent')} value={String(summary.absent)} />
          <SummaryCell label={t('pages.admin.studentProfile.attendance.cancelled')} value={String(summary.cancelled)} />
        </div>
      )}

      {historyQuery.isLoading ? (
        <div className="grid place-items-center min-h-[180px] text-on-surface-variant">
          <Icon name="progress_activity" className="animate-spin" />
        </div>
      ) : historyQuery.isError ? (
        <div className="rounded-lg border border-error/30 bg-error-container/50 px-md py-sm text-on-error-container">
          {(historyQuery.error as Error).message}
        </div>
      ) : records.length === 0 ? (
        <div className="rounded-lg border border-dashed border-outline-variant bg-surface-container-low px-md py-lg text-center text-body-sm text-on-surface-variant">
          {t('pages.admin.studentProfile.attendance.empty')}
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-outline-variant/60">
          <div className="grid grid-cols-[1fr_1fr_1fr] md:grid-cols-[1fr_1fr_1fr_1.2fr] bg-surface-container-low px-md py-sm text-label-sm text-on-surface-variant">
            <span>{t('pages.admin.studentProfile.attendance.date')}</span>
            <span>{t('pages.admin.studentProfile.attendance.time')}</span>
            <span>{t('pages.admin.studentProfile.attendance.status')}</span>
            <span className="hidden md:block">{t('pages.admin.studentProfile.attendance.note')}</span>
          </div>
          <ul className="divide-y divide-outline-variant/40">
            {records.map((row, index) => (
              <li
                key={`${row.source}-${row.id ?? index}-${row.date}-${row.startTime ?? ''}`}
                className="grid grid-cols-[1fr_1fr_1fr] md:grid-cols-[1fr_1fr_1fr_1.2fr] items-center gap-sm px-md py-sm"
              >
                <span className="text-body-sm text-on-surface">{formatDate(row.date, locale)}</span>
                <span className="text-body-sm text-on-surface-variant tabular-nums">{formatTime(row)}</span>
                <StatusPill row={row} />
                <span className="hidden md:block text-body-sm text-on-surface-variant truncate">
                  {row.note || row.className || '—'}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function SummaryCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-outline-variant/50 bg-surface-container-low px-md py-sm">
      <div className="text-label-sm text-on-surface-variant">{label}</div>
      <div className="font-manrope text-headline-md text-on-surface">{value}</div>
    </div>
  );
}

function StatusPill({ row }: { row: IStudentAttendanceHistoryItem }) {
  const { t } = useTranslation();
  if (row.cancelled) {
    return (
      <span className="w-fit rounded-full border border-outline-variant bg-surface-container px-sm py-1 text-label-sm text-on-surface-variant">
        {t('pages.admin.studentProfile.attendance.cancelledStatus')}
      </span>
    );
  }
  return (
    <span className={`w-fit rounded-full border px-sm py-1 text-label-sm ${STATUS_CLASS[row.status]}`}>
      {t(`attendanceStatus.${row.status}`)}
    </span>
  );
}
