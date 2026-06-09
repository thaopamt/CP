import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button, Icon, PageHeader, StatusBadge, WeekGrid, cn, useToast } from '@cp/ui';
import {
  AttendanceStatus,
  DayOfWeek,
  IScheduleEvent,
  SubjectTrack,
} from '@cp/shared';

import {
  useBulkUpsertScheduleSlotAttendance,
  useScheduleSlotAttendance,
  useScheduleSlotSummaries,
  useSetScheduleSlotCancellation,
} from '../../api/attendance.queries';
import type { ScheduleSlotAttendanceParams, ScheduleSlotSummary } from '../../api/attendance.api';

type View = 'week' | 'month';
type ScheduleSlotEvent = IScheduleEvent & {
  slot: {
    dayOfWeek: DayOfWeek;
    startTime: string;
    endTime: string;
  };
};

// Full 7-day week — Mon (0) … Sun (6).
const WEEKDAY_INDEX: Record<DayOfWeek, number> = {
  [DayOfWeek.MON]: 0,
  [DayOfWeek.TUE]: 1,
  [DayOfWeek.WED]: 2,
  [DayOfWeek.THU]: 3,
  [DayOfWeek.FRI]: 4,
  [DayOfWeek.SAT]: 5,
  [DayOfWeek.SUN]: 6,
};

// Render order matches WEEKDAY_INDEX so day labels line up with `event.day`.
const WEEKDAY_KEYS: DayOfWeek[] = [
  DayOfWeek.MON,
  DayOfWeek.TUE,
  DayOfWeek.WED,
  DayOfWeek.THU,
  DayOfWeek.FRI,
  DayOfWeek.SAT,
  DayOfWeek.SUN,
];

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

function startOfWeekMon(d: Date): Date {
  const out = new Date(d);
  const dow = out.getDay(); // 0=Sun, 1=Mon
  const diff = dow === 0 ? -6 : 1 - dow;
  out.setDate(out.getDate() + diff);
  out.setHours(0, 0, 0, 0);
  return out;
}

function dateKey(d: Date) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const date = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${date}`;
}

/** Flattens date-specific schedule summaries into weekly calendar events. */
function flattenEvents(summaries: ScheduleSlotSummary[], weekStart: Date): ScheduleSlotEvent[] {
  const weekStartTime = new Date(weekStart).setHours(0, 0, 0, 0);

  const events: ScheduleSlotEvent[] = summaries.map((summary) => {
    const eventDate = new Date(`${summary.date}T00:00:00`);
    const day = Math.round((eventDate.getTime() - weekStartTime) / 86_400_000);
    const startMinutes = timeToMinutes(summary.startTime);
    const endMinutes = timeToMinutes(summary.endTime);

    return {
      id: `slot_${summary.date}_${summary.dayOfWeek}_${summary.startTime}_${summary.endTime}`,
      classId: '',
      title: `${summary.presentCount}/${summary.totalCount}`,
      location: '',
      teacherName: '',
      teacherInitials: '–',
      day,
      startMinutes,
      durationMin: Math.max(15, endMinutes - startMinutes),
      track: SubjectTrack.SCIENCE,
      isCancelled: summary.cancelled,
      slot: {
        dayOfWeek: summary.dayOfWeek,
        startTime: summary.startTime,
        endTime: summary.endTime,
      },
    };
  });

  return markConflicts(events);
}

/**
 * Two events conflict when they share a day, their time windows overlap,
 * AND they share either the same room or the same (assigned) teacher.
 */
function markConflicts<T extends IScheduleEvent>(events: T[]): T[] {
  return events.map((e, i) => {
    const aEnd = e.startMinutes + e.durationMin;
    const conflicting = events.some((other, j) => {
      if (i === j || other.day !== e.day) return false;
      const bEnd = other.startMinutes + other.durationMin;
      const overlap = e.startMinutes < bEnd && other.startMinutes < aEnd;
      if (!overlap) return false;
      return true;
    });
    return conflicting ? { ...e, hasConflict: true } : e;
  });
}

export default function AdminSchedulePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();
  const [view, setView] = useState<View>('week');
  const [weekStart, setWeekStart] = useState<Date>(() => startOfWeekMon(new Date()));
  const [selectedSlot, setSelectedSlot] = useState<ScheduleSlotAttendanceParams | null>(null);

  // Settings for custom timetable layout
  const [showSettings, setShowSettings] = useState(false);
  const [stepMinutes, setStepMinutes] = useState<number>(90); // default to 90m (1h30p fixed slot)
  const [slotPx, setSlotPx] = useState<number>(70); // default cozy height

  const summaryParams = useMemo(() => {
    const start = new Date(weekStart);
    const end = new Date(weekStart);
    end.setDate(start.getDate() + 6);
    return { from: dateKey(start), to: dateKey(end) };
  }, [weekStart]);
  const summariesQuery = useScheduleSlotSummaries(summaryParams);

  const events = useMemo(
    () => flattenEvents(summariesQuery.data ?? [], weekStart),
    [summariesQuery.data, weekStart],
  );

  const dayLabels = useMemo(() => {
    return WEEKDAY_KEYS.map((key, i) => {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      return `${t(`enums.dayOfWeek.${key}`)} ${d.getDate()}`;
    });
  }, [t, weekStart]);

  const dateRange = useMemo(() => {
    const sunday = new Date(weekStart);
    sunday.setDate(weekStart.getDate() + 6);
    const m = weekStart.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    const s = sunday.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    return `${m} – ${s}`;
  }, [weekStart]);

  const todayIndex = useMemo(() => {
    const todayMon = startOfWeekMon(new Date());
    if (+todayMon !== +weekStart) return -1;
    const dow = new Date().getDay(); // 0=Sun, 1=Mon … 6=Sat
    return dow === 0 ? 6 : dow - 1;  // 0=Mon … 6=Sun
  }, [weekStart]);

  const conflictCount = events.filter((e) => e.hasConflict).length;

  // Dynamically calculate the schedule range based on the current week's events
  const { startMin, endMin } = useMemo(() => {
    if (events.length === 0) {
      return { startMin: 480, endMin: 1290 }; // default 8:00 - 21:30
    }
    let minStart = 480; // 8:00 default
    let maxEnd = 1080;  // 18:00 default
    for (const e of events) {
      if (e.startMinutes < minStart) {
        minStart = Math.max(360, Math.floor(e.startMinutes / 60) * 60); // round down to hour (min 6:00)
      }
      const eEnd = e.startMinutes + e.durationMin;
      if (eEnd > maxEnd) {
        maxEnd = Math.min(1380, Math.ceil(eEnd / 60) * 60); // round up to hour (max 23:00)
      }
    }
    // If it spans past 18:00, extend end to cover evening classes fully (at least until 21:30)
    if (maxEnd > 1080) {
      maxEnd = Math.max(maxEnd, 1290);
    }
    return { startMin: minStart, endMin: maxEnd };
  }, [events]);

  function shiftWeek(deltaWeeks: number) {
    const next = new Date(weekStart);
    next.setDate(weekStart.getDate() + deltaWeeks * 7);
    setWeekStart(next);
  }

  const getDateForDay = useCallback(
    (day: number) => {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + day);
      return dateKey(d);
    },
    [weekStart],
  );

  const handleSlotClick = useCallback(
    (event: IScheduleEvent) => {
      const slotEvent = event as ScheduleSlotEvent;
      setSelectedSlot({
        date: getDateForDay(slotEvent.day),
        dayOfWeek: slotEvent.slot.dayOfWeek,
        startTime: slotEvent.slot.startTime,
        endTime: slotEvent.slot.endTime,
      });
    },
    [getDateForDay],
  );

  return (
    <div className="flex flex-col gap-lg">
      <PageHeader
        title={t('pages.admin.schedule.title')}
        subtitle={t('pages.admin.schedule.subtitle')}
        actions={
          <>
            <ViewToggle view={view} onChange={setView} />
            <Button
              variant="admin"
              leadingIcon={<Icon name="person_add" size={18} />}
              onClick={() => navigate('/admin/students')}
            >
              {t('pages.admin.schedule.scheduleSession')}
            </Button>
          </>
        }
      />

      <div className="flex flex-col gap-sm">
        <div className="flex flex-col md:flex-row md:items-center gap-sm md:gap-md bg-surface-container-lowest border border-outline-variant/50 rounded-lg p-md">
          <div className="flex items-center gap-sm">
            <button
              type="button"
              onClick={() => shiftWeek(-1)}
              className="p-1 rounded hover:bg-surface-container-high text-on-surface-variant"
              aria-label={t('pages.admin.schedule.prevWeek')}
            >
              <Icon name="chevron_left" />
            </button>
            <div className="text-label-sm font-semibold text-on-surface min-w-[180px] text-center">
              {dateRange}
            </div>
            <button
              type="button"
              onClick={() => shiftWeek(1)}
              className="p-1 rounded hover:bg-surface-container-high text-on-surface-variant"
              aria-label={t('pages.admin.schedule.nextWeek')}
            >
              <Icon name="chevron_right" />
            </button>
            <button
              type="button"
              onClick={() => setWeekStart(startOfWeekMon(new Date()))}
              className="ml-sm px-sm py-1 text-label-sm rounded border border-outline-variant text-on-surface-variant hover:bg-surface-container-high"
            >
              {t('pages.admin.schedule.today', 'Today')}
            </button>
          </div>

          <div className="md:ml-auto flex items-center gap-sm md:gap-md">
            <button
              type="button"
              onClick={() => setShowSettings(!showSettings)}
              className={cn(
                'p-2 rounded-lg border transition-all flex items-center gap-xs text-label-sm font-medium',
                showSettings
                  ? 'bg-primary/10 border-primary/50 text-primary shadow-sm'
                  : 'border-outline-variant/60 text-on-surface-variant hover:bg-surface-container-high'
              )}
            >
              <Icon name="settings" size={18} />
              <span>Tùy chỉnh lịch</span>
            </button>

            <span className="inline-flex items-center gap-xs text-label-sm text-on-surface-variant">
              <span className="w-2 h-2 rounded-full bg-error" />
              {conflictCount > 0
                ? t('pages.admin.schedule.conflictCount', {
                    count: conflictCount,
                    defaultValue: '{{count}} conflicts',
                  })
                : t('pages.admin.schedule.conflict')}
            </span>

          </div>
        </div>

        {/* Customized Preferences Bar */}
        {showSettings && (
          <div className="flex flex-wrap items-center gap-x-lg gap-y-md bg-surface-container-low border border-outline-variant/30 rounded-lg p-md animate-fade-in">
            <div className="flex items-center gap-sm">
              <span className="text-label-sm font-semibold text-on-surface-variant">Suất học định sẵn:</span>
              <div className="inline-flex rounded-md border border-outline-variant overflow-hidden shadow-sm">
                {[
                  { value: 60, label: '1 giờ' },
                  { value: 90, label: '1h30p (Suất học chuẩn)' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setStepMinutes(opt.value)}
                    className={cn(
                      'px-sm py-1.5 text-label-sm transition-all',
                      stepMinutes === opt.value
                        ? 'bg-primary text-on-primary font-medium'
                        : 'bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-high'
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-sm">
              <span className="text-label-sm font-semibold text-on-surface-variant">Độ thu gọn hàng giờ:</span>
              <div className="inline-flex rounded-md border border-outline-variant overflow-hidden shadow-sm">
                {[
                  { value: 50, label: 'Thu gọn' },
                  { value: 70, label: 'Vừa vặn' },
                  { value: 90, label: 'Rộng rãi' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setSlotPx(opt.value)}
                    className={cn(
                      'px-sm py-1.5 text-label-sm transition-all',
                      slotPx === opt.value
                        ? 'bg-primary text-on-primary font-medium'
                        : 'bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-high'
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-surface-container-lowest border border-outline-variant/50 rounded-xl shadow-elev-1 overflow-hidden relative">
        {summariesQuery.isError ? (
          <div className="p-xl text-center">
            <Icon name="error" size={36} className="mx-auto mb-sm text-error" />
            <p className="text-body-md text-on-surface">{(summariesQuery.error as Error).message}</p>
          </div>
        ) : summariesQuery.isLoading ? (
          <div className="p-xl text-center text-on-surface-variant">{t('common.loading')}</div>
        ) : events.length === 0 ? (
          <div className="p-xl text-center">
            <Icon name="event_busy" size={36} className="mx-auto mb-sm text-on-surface-variant/50" />
            <p className="text-body-md text-on-surface-variant">
              {t('pages.admin.schedule.empty', 'No sessions scheduled yet.')}
            </p>
          </div>
        ) : (
          <WeekGrid
            dayLabels={dayLabels}
            todayIndex={todayIndex}
            startMinutes={startMin}
            endMinutes={endMin}
            stepMinutes={stepMinutes}
            slotPx={slotPx}
            events={events}
            onEventClick={handleSlotClick}
          />
        )}
      </div>

      {selectedSlot && (
        <ScheduleSlotAttendancePanel
          slot={selectedSlot}
          onClose={() => setSelectedSlot(null)}
          onSaved={() => toast.success(t('pages.admin.attendance.savedToast'))}
        />
      )}
    </div>
  );
}

const STATUS_CYCLE: AttendanceStatus[] = [
  AttendanceStatus.UNMARKED,
  AttendanceStatus.PRESENT,
  AttendanceStatus.ABSENT,
  AttendanceStatus.LATE,
];

function nextStatus(status: AttendanceStatus): AttendanceStatus {
  const idx = STATUS_CYCLE.indexOf(status);
  return STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length];
}

function formatTime(t: string) {
  return t.split(':').slice(0, 2).join(':');
}

function ScheduleSlotAttendancePanel({
  slot,
  onClose,
  onSaved,
}: {
  slot: ScheduleSlotAttendanceParams;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { t } = useTranslation();
  const slotQuery = useScheduleSlotAttendance(slot);
  const saveAttendance = useBulkUpsertScheduleSlotAttendance();
  const setCancellation = useSetScheduleSlotCancellation();
  const [localRecords, setLocalRecords] = useState<Map<string, AttendanceStatus>>(new Map());
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    setLocalRecords(new Map());
    setIsDirty(false);
  }, [slot.date, slot.dayOfWeek, slot.startTime, slot.endTime]);

  const data = slotQuery.data;
  const isCancelled = !!data?.cancelled;

  const getStatus = useCallback(
    (studentId: string, original: AttendanceStatus) => localRecords.get(studentId) ?? original,
    [localRecords],
  );

  const toggleStatus = useCallback((studentId: string, current: AttendanceStatus) => {
    setLocalRecords((prev) => {
      const next = new Map(prev);
      next.set(studentId, nextStatus(current));
      return next;
    });
    setIsDirty(true);
  }, []);

  const markAll = useCallback(
    (status: AttendanceStatus) => {
      if (!data || data.cancelled) return;
      setLocalRecords((prev) => {
        const next = new Map(prev);
        for (const student of data.students) {
          next.set(student.studentId, status);
        }
        return next;
      });
      setIsDirty(true);
    },
    [data],
  );

  const handleSave = useCallback(async () => {
    if (!data || data.cancelled) return;
    await saveAttendance.mutateAsync({
      ...slot,
      records: data.students.map((student) => ({
        studentId: student.studentId,
        status: getStatus(student.studentId, student.status),
      })),
    });
    setLocalRecords(new Map());
    setIsDirty(false);
    onSaved();
  }, [data, getStatus, onSaved, saveAttendance, slot]);

  const handleToggleCancellation = useCallback(async () => {
    await setCancellation.mutateAsync({
      ...slot,
      cancelled: !isCancelled,
    });
    setLocalRecords(new Map());
    setIsDirty(false);
  }, [isCancelled, setCancellation, slot]);

  const stats = useMemo(() => {
    if (!data) return { total: 0, present: 0, absent: 0, late: 0 };
    let present = 0;
    let absent = 0;
    let late = 0;
    for (const student of data.students) {
      const status = getStatus(student.studentId, student.status);
      if (status === AttendanceStatus.PRESENT) present++;
      if (status === AttendanceStatus.ABSENT) absent++;
      if (status === AttendanceStatus.LATE) late++;
    }
    return { total: data.students.length, present, absent, late };
  }, [data, getStatus]);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm">
      <div className="flex h-full w-full max-w-full sm:max-w-xl flex-col bg-surface shadow-elev-3 animate-in slide-in-from-right overflow-hidden">
        <div className="flex items-center justify-between border-b border-outline-variant px-lg py-md bg-surface-container-low">
          <div>
            <h2 className="text-title-lg font-bold text-on-surface">
              {formatTime(slot.startTime)}-{formatTime(slot.endTime)}
            </h2>
            <p className="text-label-sm text-on-surface-variant">
              {new Date(slot.date).toLocaleDateString(undefined, {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
          <div className="flex items-center gap-sm">
            {isCancelled && <StatusBadge tone="error">Đã huỷ</StatusBadge>}
            <button
              onClick={onClose}
              className="p-sm rounded-full text-on-surface-variant hover:bg-surface-container-highest transition-colors"
            >
              <Icon name="close" size={24} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-lg flex flex-col gap-md">
          {slotQuery.isLoading && (
            <div className="flex-1 grid place-items-center">
              <Icon name="progress_activity" size={40} className="animate-spin text-on-surface-variant/50" />
            </div>
          )}

          {data && (
            <>
              {isCancelled && (
                <div className="rounded-lg border border-error/30 bg-error-container/30 px-md py-sm text-label-sm text-on-error-container">
                  Lịch của ngày này đã được huỷ. Bấm "Bỏ huỷ lịch" để mở lại điểm danh.
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-sm">
                <SummaryCard label={t('pages.admin.attendance.summary.total')} value={stats.total} />
                <SummaryCard label={t('pages.admin.attendance.summary.present')} value={stats.present} />
                <SummaryCard label={t('pages.admin.attendance.summary.absent')} value={stats.absent} />
                <SummaryCard label={t('pages.admin.attendance.summary.late')} value={stats.late} />
              </div>

              <div className="flex items-center justify-end gap-xs">
                <button
                  type="button"
                  className="px-sm py-xs rounded-md text-[11px] font-semibold bg-tertiary-container/40 text-tertiary hover:bg-tertiary-container transition-colors"
                  onClick={() => markAll(AttendanceStatus.PRESENT)}
                  disabled={isCancelled}
                >
                  {t('pages.admin.attendance.allPresent')}
                </button>
                <button
                  type="button"
                  className="px-sm py-xs rounded-md text-[11px] font-semibold bg-error-container/40 text-error hover:bg-error-container transition-colors"
                  onClick={() => markAll(AttendanceStatus.ABSENT)}
                  disabled={isCancelled}
                >
                  {t('pages.admin.attendance.allAbsent')}
                </button>
              </div>

              <div className="bg-surface-container-lowest border border-outline-variant/50 rounded-xl overflow-hidden">
                {data.students.length === 0 ? (
                  <div className="p-lg text-center text-on-surface-variant">
                    Không có học sinh trong khung giờ này.
                  </div>
                ) : (
                  <div className="divide-y divide-outline-variant/30">
                    {data.students.map((student) => {
                      const status = getStatus(student.studentId, student.status);
                      return (
                        <button
                          key={student.studentId}
                          type="button"
                          className="w-full flex items-center justify-between px-md py-sm text-left hover:bg-surface-container-high/30 transition-colors"
                          onClick={() => toggleStatus(student.studentId, status)}
                          disabled={isCancelled}
                        >
                          <div className="flex items-center gap-md min-w-0">
                            <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary-container grid place-items-center text-label-sm font-bold shrink-0">
                              {student.studentName
                                .split(' ')
                                .slice(0, 2)
                                .map((part) => part[0])
                                .join('')
                                .toUpperCase()}
                            </div>
                            <span className="text-body-md text-on-surface truncate">{student.studentName}</span>
                          </div>
                          <AttendanceBadge status={status} />
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-end gap-sm sm:gap-md border-t border-outline-variant px-md sm:px-lg py-md bg-surface-container-lowest">
          <Button
            variant="ghost"
            leadingIcon={<Icon name={isCancelled ? 'undo' : 'event_busy'} size={18} />}
            onClick={handleToggleCancellation}
            disabled={setCancellation.isPending}
          >
            {isCancelled ? 'Bỏ huỷ lịch' : 'Huỷ lịch ngày này'}
          </Button>
          <Button variant="secondary" onClick={onClose}>
            {t('common.cancel', 'Cancel')}
          </Button>
          <Button
            variant="admin"
            leadingIcon={<Icon name="check_circle" size={18} />}
            onClick={handleSave}
            disabled={isCancelled || !isDirty || saveAttendance.isPending}
          >
            {saveAttendance.isPending ? (
              <Icon name="progress_activity" size={18} className="animate-spin" />
            ) : (
              t('pages.admin.attendance.save')
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-surface-container-low border border-outline-variant/50 rounded-xl p-sm text-center">
      <div className="text-[10px] text-on-surface-variant uppercase tracking-wider">{label}</div>
      <div className="font-manrope text-title-md font-bold text-on-surface">{value}</div>
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

function ViewToggle({ view, onChange }: { view: View; onChange: (v: View) => void }) {
  const { t } = useTranslation();
  return (
    <div className="inline-flex rounded-lg border border-outline-variant overflow-hidden">
      {(['week', 'month'] as const).map((v) => (
        <button
          key={v}
          type="button"
          onClick={() => onChange(v)}
          className={
            v === view
              ? 'px-md py-sm text-label-sm bg-primary text-on-primary'
              : 'px-md py-sm text-label-sm bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'
          }
        >
          {t(`pages.admin.schedule.view.${v}`)}
        </button>
      ))}
    </div>
  );
}
