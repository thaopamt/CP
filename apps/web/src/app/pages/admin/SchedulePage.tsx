import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Icon, PageHeader, SelectFilter, WeekGrid } from '@cp/ui';
import {
  ClassDepartment,
  ClassStatus,
  DayOfWeek,
  IClass,
  IScheduleEvent,
  SubjectTrack,
  IStudentScheduleSession,
} from '@cp/shared';

import { useClassesList } from '../../api/class.queries';
import { useAllCustomSchedules } from '../../api/attendance.queries';

type View = 'week' | 'month';

// Department → SubjectTrack mapping drives the colour stripe on event cards.
const DEPARTMENT_TRACK: Record<ClassDepartment, SubjectTrack> = {
  [ClassDepartment.MATHEMATICS]: SubjectTrack.MATH,
  [ClassDepartment.SCIENCE]: SubjectTrack.SCIENCE,
  [ClassDepartment.HUMANITIES]: SubjectTrack.HUMANITIES,
  [ClassDepartment.ARTS]: SubjectTrack.ARTS,
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

function initials(fullName: string): string {
  return fullName
    .split(/\s+/)
    .slice(0, 2)
    .map((s) => s[0])
    .filter(Boolean)
    .join('')
    .toUpperCase();
}

function startOfWeekMon(d: Date): Date {
  const out = new Date(d);
  const dow = out.getDay(); // 0=Sun, 1=Mon
  const diff = dow === 0 ? -6 : 1 - dow;
  out.setDate(out.getDate() + diff);
  out.setHours(0, 0, 0, 0);
  return out;
}

/** Flattens classes → individual weekly events (one per IClassMeeting). */
function flattenEvents(classes: IClass[], customSchedules: IStudentScheduleSession[], unassignedLabel: string): IScheduleEvent[] {
  const events: IScheduleEvent[] = [];
  const existingKeys = new Set<string>();

  for (const cls of classes) {
    if (cls.status === ClassStatus.ARCHIVED) continue;
    const track = DEPARTMENT_TRACK[cls.department];
    for (const m of cls.sessions) {
      const day = WEEKDAY_INDEX[m.dayOfWeek];
      const startMinutes = timeToMinutes(m.startTime);
      const endMinutes = timeToMinutes(m.endTime);
      const teacherName = cls.instructor?.fullName ?? unassignedLabel;
      
      events.push({
        id: m.id,
        classId: cls.id,
        title: `${cls.name} (${cls.code})`,
        location: m.room ?? cls.room ?? '—',
        teacherName,
        teacherInitials: cls.instructor ? initials(cls.instructor.fullName) : '–',
        day,
        startMinutes,
        durationMin: Math.max(15, endMinutes - startMinutes),
        track,
      });
      existingKeys.add(`${cls.id}_${m.dayOfWeek}_${m.startTime}_${m.endTime}`);
    }
  }

  // Group custom schedules by classId + dayOfWeek + time
  const customGroups = new Map<string, IStudentScheduleSession[]>();
  for (const cs of customSchedules) {
    if (!cs.classId) continue;
    const key = `${cs.classId}_${cs.dayOfWeek}_${cs.startTime}_${cs.endTime}`;
    if (existingKeys.has(key)) continue; // Matches an official session EXACTLY, no need to draw a custom block

    if (!customGroups.has(key)) customGroups.set(key, []);
    customGroups.get(key)!.push(cs);
  }

  for (const [key, group] of customGroups.entries()) {
    const sample = group[0];
    const cls = classes.find(c => c.id === sample.classId);
    if (!cls || cls.status === ClassStatus.ARCHIVED) continue;

    const day = WEEKDAY_INDEX[sample.dayOfWeek];
    const startMinutes = timeToMinutes(sample.startTime);
    const endMinutes = timeToMinutes(sample.endTime);
    
    events.push({
      id: `custom_${key}`,
      classId: cls.id,
      title: `${cls.name} (${cls.code})`,
      location: sample.room ?? cls.room ?? '—',
      teacherName: cls.instructor?.fullName ?? unassignedLabel,
      teacherInitials: cls.instructor ? initials(cls.instructor.fullName) : '–',
      day,
      startMinutes,
      durationMin: Math.max(15, endMinutes - startMinutes),
      track: DEPARTMENT_TRACK[cls.department],
      isCustom: true,
    });
  }

  return markConflicts(events, unassignedLabel);
}

/**
 * Two events conflict when they share a day, their time windows overlap,
 * AND they share either the same room or the same (assigned) teacher.
 */
function markConflicts(events: IScheduleEvent[], unassignedLabel: string): IScheduleEvent[] {
  return events.map((e, i) => {
    const aEnd = e.startMinutes + e.durationMin;
    const conflicting = events.some((other, j) => {
      if (i === j || other.day !== e.day) return false;
      const bEnd = other.startMinutes + other.durationMin;
      const overlap = e.startMinutes < bEnd && other.startMinutes < aEnd;
      if (!overlap) return false;
      const sameRoom = e.location === other.location && e.location !== '—';
      const sameTeacher =
        e.teacherName === other.teacherName && e.teacherName !== unassignedLabel;
      return sameRoom || sameTeacher;
    });
    return conflicting ? { ...e, hasConflict: true } : e;
  });
}

import { AttendancePanel } from './AttendancePanel';

export default function AdminSchedulePage() {
  const { t } = useTranslation();
  const [view, setView] = useState<View>('week');
  const [department, setDepartment] = useState<ClassDepartment | 'all'>('all');
  const [weekStart, setWeekStart] = useState<Date>(() => startOfWeekMon(new Date()));
  const [selectedAttendance, setSelectedAttendance] = useState<{ classId: string; date: string } | null>(null);

  // ── API combo: classes (with sessions + instructor) drives the entire grid.
  // We over-fetch (limit 200) so a typical institution shows in one page; if
  // your school exceeds that, swap to dedicated `/api/schedule` aggregation.
  const { data, isLoading, isError, error } = useClassesList({
    page: 1,
    limit: 200,
    department,
    status: 'all',
  });

  const customSchedulesQuery = useAllCustomSchedules();

  const unassignedLabel = t('pages.admin.classes.list.unassignedInstructor');
  const events = useMemo(
    () => flattenEvents(data?.items ?? [], customSchedulesQuery.data ?? [], unassignedLabel),
    [data, customSchedulesQuery.data, unassignedLabel],
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

  function shiftWeek(deltaWeeks: number) {
    const next = new Date(weekStart);
    next.setDate(weekStart.getDate() + deltaWeeks * 7);
    setWeekStart(next);
  }

  function handleEventClick(event: IScheduleEvent) {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + event.day);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    setSelectedAttendance({ classId: event.classId, date: dateStr });
  }

  return (
    <div className="flex flex-col gap-lg">
      <PageHeader
        title={t('pages.admin.schedule.title')}
        subtitle={t('pages.admin.schedule.subtitle')}
        actions={
          <>
            <ViewToggle view={view} onChange={setView} />
            <Button variant="admin" leadingIcon={<Icon name="add" size={18} />}>
              {t('pages.admin.schedule.scheduleSession')}
            </Button>
          </>
        }
      />

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
        <div className="md:ml-auto flex items-center gap-md">
          <span className="inline-flex items-center gap-xs text-label-sm text-on-surface-variant">
            <span className="w-2 h-2 rounded-full bg-error" />
            {conflictCount > 0
              ? t('pages.admin.schedule.conflictCount', {
                  count: conflictCount,
                  defaultValue: '{{count}} conflicts',
                })
              : t('pages.admin.schedule.conflict')}
          </span>
          <SelectFilter
            label={t('common.department')}
            value={department}
            onChange={(e) => setDepartment(e.target.value as ClassDepartment | 'all')}
            options={[
              { value: 'all', label: t('common.all') },
              ...Object.values(ClassDepartment).map((d) => ({
                value: d,
                label: t(`enums.classDepartment.${d}`),
              })),
            ]}
          />
        </div>
      </div>

      <div className="bg-surface-container-lowest border border-outline-variant/50 rounded-xl shadow-elev-1 overflow-hidden relative">
        {isError ? (
          <div className="p-xl text-center">
            <Icon name="error" size={36} className="mx-auto mb-sm text-error" />
            <p className="text-body-md text-on-surface">{(error as Error).message}</p>
          </div>
        ) : isLoading ? (
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
            startMinutes={480}
            endMinutes={1080}
            slotPx={80}
            events={events}
            onEventClick={handleEventClick}
          />
        )}
      </div>

      {selectedAttendance && (
        <AttendancePanel
          classId={selectedAttendance.classId}
          date={selectedAttendance.date}
          onClose={() => setSelectedAttendance(null)}
        />
      )}
    </div>
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
