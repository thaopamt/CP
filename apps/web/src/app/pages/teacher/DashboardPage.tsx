import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AttendanceCircle,
  Button,
  ClassScheduleCard,
  Icon,
  PageHeader,
} from '@cp/ui';
import {
  ClassSessionStatus,
  IClassSession,
  IPendingReview,
} from '@cp/shared';
import { useAuthStore } from '../../stores/auth.store';

export default function TeacherDashboardPage() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const greeting = user?.firstName ?? '';

  const schedule: IClassSession[] = useMemo(
    () => [
      {
        id: 's1',
        title: t('pages.teacher.dashboard.sessions.period1.title'),
        startTime: today(8, 30).toISOString(),
        endTime: today(9, 20).toISOString(),

        studentCount: 28,
        status: ClassSessionStatus.COMPLETED,
      },
      {
        id: 's2',
        title: t('pages.teacher.dashboard.sessions.period3.title'),
        startTime: today(10, 30).toISOString(),
        endTime: today(11, 20).toISOString(),

        studentCount: 24,
        status: ClassSessionStatus.ACTIVE,
      },
      {
        id: 's3',
        title: t('pages.teacher.dashboard.sessions.algorithms.title'),
        startTime: today(13, 0).toISOString(),
        endTime: today(14, 30).toISOString(),

        studentCount: 16,
        status: ClassSessionStatus.UPCOMING,
      },
    ],
    [t],
  );

  const pending: IPendingReview[] = useMemo(
    () => [
      { id: 'r1', title: t('pages.teacher.dashboard.reviews.quizTrees.title'), context: t('pages.teacher.dashboard.reviews.quizTrees.context'), submissionCount: 24 },
      { id: 'r2', title: t('pages.teacher.dashboard.reviews.searchEngine.title'), context: t('pages.teacher.dashboard.reviews.searchEngine.context'), submissionCount: 9 },
      { id: 'r3', title: t('pages.teacher.dashboard.reviews.reflection.title'), context: t('pages.teacher.dashboard.reviews.reflection.context'), submissionCount: 12 },
      { id: 'r4', title: t('pages.teacher.dashboard.reviews.bigO.title'), context: t('pages.teacher.dashboard.reviews.bigO.context'), submissionCount: 7 },
    ],
    [t],
  );

  const totalPending = pending.reduce((acc, p) => acc + p.submissionCount, 0);
  const presentPct = Math.round((68 / (68 + 4 + 2)) * 100);

  return (
    <div className="flex flex-col gap-lg">
      <PageHeader
        title={t('pages.teacher.dashboard.greeting', { name: greeting })}
        subtitle={t('pages.teacher.dashboard.subtitle', { classes: 3, pending: 12 })}
        actions={
          <>
            <Button variant="teacher" leadingIcon={<Icon name="how_to_reg" size={18} />}>
              {t('pages.teacher.dashboard.takeAttendance')}
            </Button>
            <Button variant="ghost" leadingIcon={<Icon name="quiz" size={18} />}>
              {t('pages.teacher.dashboard.createQuiz')}
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-lg">
        <section className="lg:col-span-8 bg-surface-container-lowest rounded-xl shadow-elev-2 p-md">
          <header className="flex items-center justify-between mb-md">
            <div className="flex items-center gap-sm">
              <Icon name="calendar_month" className="text-primary" />
              <h3 className="font-manrope text-headline-md text-on-surface">
                {t('pages.teacher.dashboard.todaysSchedule')}
              </h3>
            </div>
            <button className="text-primary text-label-sm font-semibold hover:underline">
              {t('common.viewWeek')}
            </button>
          </header>
          <div className="flex flex-col gap-sm">
            {schedule.map((s) => (
              <ClassScheduleCard key={s.id} session={s} />
            ))}
          </div>
        </section>

        <aside className="lg:col-span-4 bg-surface-container-lowest rounded-xl shadow-elev-2 p-md flex flex-col">
          <header className="flex items-center justify-between mb-md">
            <h3 className="font-manrope text-headline-md text-on-surface">
              {t('pages.teacher.dashboard.todaysAttendance')}
            </h3>
            <Icon name="people" className="text-primary" />
          </header>
          <div className="flex-1 grid place-items-center py-sm">
            <AttendanceCircle
              percentage={presentPct}
              label={t('pages.teacher.dashboard.attendanceLegend.present')}
              size={180}
            />
          </div>
          <div className="grid grid-cols-3 gap-sm pt-sm border-t border-outline-variant/30">
            <Stat label={t('pages.teacher.dashboard.attendanceLegend.present')} value={68} tone="text-tertiary" />
            <Stat label={t('pages.teacher.dashboard.attendanceLegend.absent')} value={4} tone="text-error" />
            <Stat label={t('pages.teacher.dashboard.attendanceLegend.late')} value={2} tone="text-on-surface-variant" />
          </div>
        </aside>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-lg">
        <section className="bg-surface-container-lowest rounded-xl shadow-elev-2 p-md">
          <header className="flex items-center gap-sm mb-md">
            <Icon name="bolt" className="text-tertiary" />
            <h3 className="font-manrope text-headline-md text-on-surface">
              {t('pages.teacher.dashboard.quickActions')}
            </h3>
          </header>
          <div className="grid grid-cols-2 gap-sm">
            <QuickAction icon="grading" label={t('pages.teacher.dashboard.actions.gradeAssignments.label')} caption={t('pages.teacher.dashboard.actions.gradeAssignments.caption', { count: 12 })} />
            <QuickAction icon="forum" label={t('pages.teacher.dashboard.actions.messages.label')} caption={t('pages.teacher.dashboard.actions.messages.caption', { count: 5 })} />
            <QuickAction icon="bar_chart" label={t('pages.teacher.dashboard.actions.analytics.label')} caption={t('pages.teacher.dashboard.actions.analytics.caption')} />
            <QuickAction icon="extension" label={t('pages.teacher.dashboard.actions.createModule.label')} caption={t('pages.teacher.dashboard.actions.createModule.caption')} />
          </div>
        </section>

        <section className="bg-surface-container-lowest rounded-xl shadow-elev-2 p-md">
          <header className="flex items-center justify-between mb-md">
            <div className="flex items-center gap-sm">
              <Icon name="reviews" className="text-primary" />
              <h3 className="font-manrope text-headline-md text-on-surface">
                {t('pages.teacher.dashboard.pendingReviews')}
              </h3>
            </div>
            <span className="text-[11px] font-bold uppercase tracking-wider px-md py-xs rounded-full bg-error-container text-on-error-container">
              {t('pages.teacher.dashboard.items', { count: totalPending })}
            </span>
          </header>
          <ul className="flex flex-col gap-sm max-h-[280px] overflow-y-auto pr-xs">
            {pending.map((p) => (
              <li
                key={p.id}
                className="flex items-center gap-md p-sm rounded-lg hover:bg-surface-container-low transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary grid place-items-center">
                  <Icon name="assignment_late" size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-body-md text-on-surface truncate">{p.title}</div>
                  <div className="text-label-sm text-on-surface-variant truncate">{p.context}</div>
                </div>
                <span className="text-label-sm font-bold text-primary whitespace-nowrap">
                  {t('pages.teacher.dashboard.newSubmissions', { count: p.submissionCount })}
                </span>
                <Icon name="chevron_right" className="text-on-surface-variant" />
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="text-center">
      <div className={`font-manrope text-headline-md ${tone}`}>{value}</div>
      <div className="text-[12px] text-on-surface-variant uppercase tracking-wider">{label}</div>
    </div>
  );
}

function QuickAction({ icon, label, caption }: { icon: string; label: string; caption: string }) {
  return (
    <button
      type="button"
      className="text-left p-md rounded-xl border border-outline-variant/40 bg-surface-container-low hover:bg-surface-container-high hover:shadow-elev-1 transition-all flex flex-col gap-xs"
    >
      <span className="w-10 h-10 rounded-lg bg-primary/10 text-primary grid place-items-center">
        <Icon name={icon} />
      </span>
      <div className="text-body-md font-semibold text-on-surface">{label}</div>
      <div className="text-[12px] text-on-surface-variant">{caption}</div>
    </button>
  );
}

function today(hours: number, minutes: number) {
  const d = new Date();
  d.setHours(hours, minutes, 0, 0);
  return d;
}
