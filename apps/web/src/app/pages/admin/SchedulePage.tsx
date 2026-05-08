import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Icon, PageHeader, SelectFilter, WeekGrid } from '@cp/ui';
import { IScheduleEvent, SubjectTrack } from '@cp/shared';

type View = 'week' | 'month';

export default function AdminSchedulePage() {
  const { t } = useTranslation();
  const [view, setView] = useState<View>('week');
  const [department, setDepartment] = useState<'all' | string>('all');

  const events: IScheduleEvent[] = useMemo(
    () => [
      { id: 'e1', day: 0, startMinutes: 510, durationMin: 50, title: t('pages.admin.schedule.events.algebra'), location: t('pages.admin.schedule.rooms.r204'), teacherName: 'Mr. Davis', teacherInitials: 'MD', track: SubjectTrack.MATH },
      { id: 'e2', day: 0, startMinutes: 600, durationMin: 50, title: t('pages.admin.schedule.events.history'), location: t('pages.admin.schedule.rooms.r110'), teacherName: 'Ms. Lin', teacherInitials: 'ML', track: SubjectTrack.HUMANITIES },
      { id: 'e3', day: 1, startMinutes: 540, durationMin: 90, title: t('pages.admin.schedule.events.physics'), location: t('pages.admin.schedule.rooms.lab3'), teacherName: 'Dr. Park', teacherInitials: 'DP', track: SubjectTrack.SCIENCE },
      { id: 'e4', day: 2, startMinutes: 510, durationMin: 50, title: t('pages.admin.schedule.events.geometry'), location: t('pages.admin.schedule.rooms.r204'), teacherName: 'Mr. Davis', teacherInitials: 'MD', track: SubjectTrack.MATH, hasConflict: true },
      { id: 'e5', day: 2, startMinutes: 510, durationMin: 50, title: t('pages.admin.schedule.events.chemistry'), location: t('pages.admin.schedule.rooms.r204'), teacherName: 'Dr. Reed', teacherInitials: 'DR', track: SubjectTrack.SCIENCE, hasConflict: true },
      { id: 'e6', day: 3, startMinutes: 600, durationMin: 50, title: t('pages.admin.schedule.events.art'), location: t('pages.admin.schedule.rooms.studioA'), teacherName: 'Ms. Vega', teacherInitials: 'MV', track: SubjectTrack.ARTS },
      { id: 'e7', day: 4, startMinutes: 540, durationMin: 90, title: t('pages.admin.schedule.events.biology'), location: t('pages.admin.schedule.rooms.lab1'), teacherName: 'Dr. Reed', teacherInitials: 'DR', track: SubjectTrack.SCIENCE },
    ],
    [t],
  );

  const days = t('pages.admin.dashboard.days', { returnObjects: true }) as Record<string, string>;

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
            className="p-1 rounded hover:bg-surface-container-high text-on-surface-variant"
            aria-label={t('pages.admin.schedule.prevWeek')}
          >
            <Icon name="chevron_left" />
          </button>
          <div className="text-label-sm font-semibold text-on-surface">
            {t('pages.admin.schedule.dateRange')}
          </div>
          <button
            className="p-1 rounded hover:bg-surface-container-high text-on-surface-variant"
            aria-label={t('pages.admin.schedule.nextWeek')}
          >
            <Icon name="chevron_right" />
          </button>
        </div>
        <div className="md:ml-auto flex items-center gap-md">
          <span className="inline-flex items-center gap-xs text-label-sm text-on-surface-variant">
            <span className="w-2 h-2 rounded-full bg-error" /> {t('pages.admin.schedule.conflict')}
          </span>
          <SelectFilter
            label={t('common.department')}
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            options={[
              { value: 'all', label: t('pages.admin.schedule.departments.all') },
              { value: 'science', label: t('pages.admin.schedule.departments.science') },
              { value: 'math', label: t('pages.admin.schedule.departments.math') },
              { value: 'humanities', label: t('pages.admin.schedule.departments.humanities') },
              { value: 'arts', label: t('pages.admin.schedule.departments.arts') },
            ]}
          />
        </div>
      </div>

      <WeekGrid
        dayLabels={[`${days.mon} 14`, `${days.tue} 15`, `${days.wed} 16`, `${days.thu} 17`, `${days.fri} 18`]}
        todayIndex={2}
        startMinutes={480}
        endMinutes={900}
        slotPx={80}
        events={events}
      />
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
