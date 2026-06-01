import { useCallback, useMemo, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Icon, StatusBadge, useToast } from '@cp/ui';
import { AttendanceStatus, IAttendanceEntry } from '@cp/shared';

import { useClassDateAttendance, useBulkUpsertAttendance } from '../../api/attendance.queries';

const STATUS_CYCLE: AttendanceStatus[] = [
  AttendanceStatus.UNMARKED,
  AttendanceStatus.PRESENT,
  AttendanceStatus.ABSENT,
  AttendanceStatus.LATE,
];

function nextStatus(s: AttendanceStatus): AttendanceStatus {
  const idx = STATUS_CYCLE.indexOf(s);
  return STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length];
}

const formatTime = (t: string) => t.split(':').slice(0, 2).join(':');

interface AttendancePanelProps {
  classId: string;
  date: string;
  onClose: () => void;
}

export function AttendancePanel({ classId, date, onClose }: AttendancePanelProps) {
  const { t } = useTranslation();
  const toast = useToast();
  const pfx = 'pages.admin.attendance';

  // Fetch attendance data
  const attendanceQuery = useClassDateAttendance(classId, date);
  const bulkUpsert = useBulkUpsertAttendance(classId);

  // Local edits — mirror the fetched data for inline editing
  const [localRecords, setLocalRecords] = useState<Map<string, AttendanceStatus>>(new Map());
  const [isDirty, setIsDirty] = useState(false);

  // When class/date changes, reset edits
  useEffect(() => {
    setLocalRecords(new Map());
    setIsDirty(false);
  }, [classId, date]);

  const attendanceData = attendanceQuery.data;

  // Key = studentId:sessionId
  const getKey = (studentId: string, sessionId: string | null) =>
    `${studentId}:${sessionId ?? 'null'}`;

  const getStatus = useCallback(
    (studentId: string, sessionId: string | null, original: AttendanceStatus) => {
      const key = getKey(studentId, sessionId);
      return localRecords.get(key) ?? original;
    },
    [localRecords],
  );

  const toggleStatus = useCallback(
    (studentId: string, sessionId: string | null, current: AttendanceStatus) => {
      const key = getKey(studentId, sessionId);
      const next = nextStatus(current);
      setLocalRecords((prev) => {
        const m = new Map(prev);
        m.set(key, next);
        return m;
      });
      setIsDirty(true);
    },
    [],
  );

  const markAll = useCallback(
    (sessionId: string, status: AttendanceStatus, records: IAttendanceEntry[]) => {
      setLocalRecords((prev) => {
        const m = new Map(prev);
        for (const r of records) {
          m.set(getKey(r.studentId, sessionId), status);
        }
        return m;
      });
      setIsDirty(true);
    },
    [],
  );

  const handleSave = useCallback(async () => {
    if (!attendanceData) return;
    const records: Array<{
      studentId: string;
      sessionId: string | null;
      status: AttendanceStatus;
    }> = [];

    for (const s of attendanceData.sessions) {
      for (const r of s.records) {
        const status = getStatus(r.studentId, s.sessionId, r.status);
        records.push({
          studentId: r.studentId,
          sessionId: s.sessionId,
          status,
        });
      }
    }

    try {
      await bulkUpsert.mutateAsync({ date, records });
      toast.success(t(`${pfx}.savedToast`));
      setIsDirty(false);
      setLocalRecords(new Map());
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err.message || 'Error');
    }
  }, [attendanceData, date, getStatus, bulkUpsert, toast, t]);

  const handleReset = useCallback(() => {
    setLocalRecords(new Map());
    setIsDirty(false);
  }, []);

  // Stats
  const stats = useMemo(() => {
    if (!attendanceData) return { total: 0, present: 0, absent: 0, late: 0, pct: 0 };
    let total = 0;
    let present = 0;
    let absent = 0;
    let late = 0;

    for (const s of attendanceData.sessions) {
      for (const r of s.records) {
        const st = getStatus(r.studentId, s.sessionId, r.status);
        total++;
        if (st === AttendanceStatus.PRESENT) present++;
        if (st === AttendanceStatus.ABSENT) absent++;
        if (st === AttendanceStatus.LATE) late++;
      }
    }
    const pct = total > 0 ? Math.round((present / total) * 100) : 0;
    return { total, present, absent, late, pct };
  }, [attendanceData, getStatus]);

  // Render a slide-over overlay
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm transition-opacity">
      <div className="flex w-full max-w-2xl flex-col bg-surface shadow-elev-3 h-full animate-in slide-in-from-right overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-outline-variant px-lg py-md bg-surface-container-low">
          <div>
            <h2 className="text-title-lg font-bold text-on-surface">
              {attendanceData?.className ?? t(`${pfx}.title`)}
            </h2>
            <p className="text-label-sm text-on-surface-variant">
              {new Date(date).toLocaleDateString(undefined, {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-sm rounded-full text-on-surface-variant hover:bg-surface-container-highest transition-colors"
          >
            <Icon name="close" size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-lg flex flex-col gap-lg">
          {attendanceQuery.isLoading && (
            <div className="flex-1 grid place-items-center">
              <Icon name="progress_activity" size={48} className="animate-spin text-on-surface-variant/50" />
            </div>
          )}

          {attendanceData && attendanceData.sessions.length === 0 && (
            <div className="flex-1 grid place-items-center text-center">
              <div>
                <Icon name="event_busy" size={64} className="mx-auto mb-md opacity-30 text-on-surface-variant" />
                <p className="text-body-lg text-on-surface-variant">{t(`${pfx}.noSessions`)}</p>
              </div>
            </div>
          )}

          {attendanceData && attendanceData.sessions.length > 0 && (
            <>
              {/* Summary stats */}
              <div className="grid grid-cols-4 gap-sm">
                <SummaryCard
                  icon="groups"
                  label={t(`${pfx}.summary.total`)}
                  value={stats.total}
                  tone="text-on-surface"
                />
                <SummaryCard
                  icon="check_circle"
                  label={t(`${pfx}.summary.present`)}
                  value={`${stats.present} (${stats.pct}%)`}
                  tone="text-tertiary"
                />
                <SummaryCard
                  icon="cancel"
                  label={t(`${pfx}.summary.absent`)}
                  value={stats.absent}
                  tone="text-error"
                />
                <SummaryCard
                  icon="schedule"
                  label={t(`${pfx}.summary.late`)}
                  value={stats.late}
                  tone="text-warning"
                />
              </div>

              {/* Rosters */}
              <div className="flex flex-col gap-md">
                {attendanceData.sessions.map((session) => (
                  <div
                    key={session.sessionId}
                    className="bg-surface-container-lowest border border-outline-variant/50 rounded-xl overflow-hidden"
                  >
                    <div className="flex items-center justify-between px-md py-sm bg-surface-container-low border-b border-outline-variant/30">
                      <div className="flex items-center gap-sm">
                        <Icon name="schedule" size={18} className="text-primary" />
                        <span className="text-label-md font-bold text-on-surface">
                          {formatTime(session.startTime)}–{formatTime(session.endTime)}
                        </span>
                        {session.sessionId?.startsWith('custom-') && (
                          <span className="px-xs py-0.5 rounded bg-tertiary-container text-on-tertiary-container text-[10px] font-bold uppercase tracking-wider">
                            {t(`${pfx}.customSession`, 'Tuỳ chỉnh')}
                          </span>
                        )}
                        {session.room && (
                          <span className="text-label-sm text-on-surface-variant">· {session.room}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-xs">
                        <button
                          type="button"
                          className="px-sm py-xs rounded-md text-[11px] font-semibold bg-tertiary-container/40 text-tertiary hover:bg-tertiary-container transition-colors"
                          onClick={() => markAll(session.sessionId, AttendanceStatus.PRESENT, session.records)}
                        >
                          {t(`${pfx}.allPresent`)}
                        </button>
                        <button
                          type="button"
                          className="px-sm py-xs rounded-md text-[11px] font-semibold bg-error-container/40 text-error hover:bg-error-container transition-colors"
                          onClick={() => markAll(session.sessionId, AttendanceStatus.ABSENT, session.records)}
                        >
                          {t(`${pfx}.allAbsent`)}
                        </button>
                      </div>
                    </div>

                    <div className="divide-y divide-outline-variant/30">
                      {session.records.length === 0 && (
                        <div className="p-md text-center text-label-sm text-on-surface-variant">
                          Không có học sinh trong khung giờ này.
                        </div>
                      )}
                      {session.records.map((record) => {
                        const status = getStatus(record.studentId, session.sessionId, record.status);
                        return (
                          <div
                            key={record.studentId}
                            className="flex items-center justify-between px-md py-sm hover:bg-surface-container-high/30 transition-colors"
                          >
                            <div className="flex items-center gap-md">
                              <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary-container grid place-items-center text-label-sm font-bold">
                                {record.studentName
                                  .split(' ')
                                  .slice(0, 2)
                                  .map((p: string) => p[0])
                                  .join('')
                                  .toUpperCase()}
                              </div>
                              <span className="text-body-md text-on-surface">{record.studentName}</span>
                            </div>

                            <button
                              type="button"
                              className="flex items-center gap-xs"
                              onClick={() => toggleStatus(record.studentId, session.sessionId, status)}
                            >
                              <AttendanceBadge status={status} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-md border-t border-outline-variant px-lg py-md bg-surface-container-lowest">
          {isDirty && (
            <Button variant="ghost" onClick={handleReset}>
              {t('common.resetAll', 'Reset')}
            </Button>
          )}
          <Button variant="secondary" onClick={onClose}>
            {t('common.cancel', 'Cancel')}
          </Button>
          <Button
            variant="admin"
            leadingIcon={<Icon name="check_circle" size={18} />}
            onClick={handleSave}
            disabled={!isDirty || bulkUpsert.isPending}
          >
            {bulkUpsert.isPending ? (
              <Icon name="progress_activity" size={18} className="animate-spin" />
            ) : (
              t(`${pfx}.save`)
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────────

function SummaryCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: string;
  label: string;
  value: string | number;
  tone: string;
}) {
  return (
    <div className="bg-surface-container-low border border-outline-variant/50 rounded-xl p-sm text-center">
      <div className="flex items-center justify-center gap-xs mb-xs">
        <Icon name={icon} size={14} className="text-on-surface-variant" />
        <span className="text-[10px] text-on-surface-variant uppercase tracking-wider">{label}</span>
      </div>
      <div className={`font-manrope text-title-md font-bold ${tone}`}>{value}</div>
    </div>
  );
}

function AttendanceBadge({ status }: { status: AttendanceStatus }) {
  const { t } = useTranslation();
  const config: Record<AttendanceStatus, { tone: 'info' | 'success' | 'warning' | 'error'; icon: string }> = {
    [AttendanceStatus.PRESENT]: { tone: 'success', icon: 'check_circle' },
    [AttendanceStatus.ABSENT]: { tone: 'error', icon: 'cancel' },
    [AttendanceStatus.LATE]: { tone: 'warning', icon: 'schedule' },
    [AttendanceStatus.UNMARKED]: { tone: 'info', icon: 'radio_button_unchecked' },
  };
  const c = config[status];
  return (
    <StatusBadge tone={c.tone}>
      <Icon name={c.icon} size={14} className="mr-xs" />
      {t(`enums.attendanceStatus.${status}`)}
    </StatusBadge>
  );
}
