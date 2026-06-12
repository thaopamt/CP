import { ReactNode, useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  AreaChart,
  BarChart,
  Button,
  Icon,
  PageHeader,
  StatCard,
  Timeline,
  TimelineItem,
} from '@cp/ui';
import {
  DayOfWeek,
  EnrollmentStatus,
  IRealtimeSubmission,
  SubmissionStatus,
  UserRole,
} from '@cp/shared';

import { useScheduleSlotSummaries } from '../../api/attendance.queries';
import type { ScheduleSlotSummary } from '../../api/attendance.api';
import { financeApi } from '../../api/finance.api';
import { financeKeys, useFinanceMonthlyReport } from '../../api/finance.queries';
import { useStudentsList } from '../../api/student.queries';
import { useAllSubmissions } from '../../api/submissions.queries';
import { useUsersList } from '../../api/users.queries';
import { usePortalBase } from '../../hooks/usePortalBase';

const FINANCE_TREND_MONTHS = 6;

const WEEKDAY_KEYS: DayOfWeek[] = [
  DayOfWeek.MON,
  DayOfWeek.TUE,
  DayOfWeek.WED,
  DayOfWeek.THU,
  DayOfWeek.FRI,
  DayOfWeek.SAT,
  DayOfWeek.SUN,
];

const DAY_LABEL_KEYS: Record<DayOfWeek, 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun'> = {
  [DayOfWeek.MON]: 'mon',
  [DayOfWeek.TUE]: 'tue',
  [DayOfWeek.WED]: 'wed',
  [DayOfWeek.THU]: 'thu',
  [DayOfWeek.FRI]: 'fri',
  [DayOfWeek.SAT]: 'sat',
  [DayOfWeek.SUN]: 'sun',
};

const SUBMISSION_TONE: Record<SubmissionStatus, TimelineItem['tone']> = {
  [SubmissionStatus.ACCEPTED]: 'tertiary',
  [SubmissionStatus.WRONG_ANSWER]: 'error',
  [SubmissionStatus.COMPILATION_ERROR]: 'error',
  [SubmissionStatus.TIME_LIMIT_EXCEEDED]: 'error',
  [SubmissionStatus.MEMORY_LIMIT_EXCEEDED]: 'error',
  [SubmissionStatus.RUNTIME_ERROR]: 'error',
  [SubmissionStatus.INTERNAL_ERROR]: 'error',
  [SubmissionStatus.PENDING]: 'neutral',
};

const SUBMISSION_ICON: Record<SubmissionStatus, string> = {
  [SubmissionStatus.ACCEPTED]: 'check_circle',
  [SubmissionStatus.WRONG_ANSWER]: 'cancel',
  [SubmissionStatus.COMPILATION_ERROR]: 'terminal',
  [SubmissionStatus.TIME_LIMIT_EXCEEDED]: 'timer',
  [SubmissionStatus.MEMORY_LIMIT_EXCEEDED]: 'memory',
  [SubmissionStatus.RUNTIME_ERROR]: 'bug_report',
  [SubmissionStatus.INTERNAL_ERROR]: 'error',
  [SubmissionStatus.PENDING]: 'hourglass_empty',
};

type DashboardSubmission = IRealtimeSubmission;
type TotalQuery = {
  isError: boolean;
  isLoading: boolean;
  data?: {
    total?: number;
  };
};

function addMonths(date: Date, offset: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + offset, 1);
}

function addDays(date: Date, offset: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + offset);
  return next;
}

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function dateKey(date: Date): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}

function startOfWeekMon(date: Date): Date {
  const out = new Date(date);
  const dow = out.getDay();
  const diff = dow === 0 ? -6 : 1 - dow;
  out.setDate(out.getDate() + diff);
  out.setHours(0, 0, 0, 0);
  return out;
}

function formatMonthLabel(month: string, locale: string): string {
  const [year, monthValue] = month.split('-').map(Number);
  return new Date(year, (monthValue || 1) - 1, 1).toLocaleDateString(locale, {
    month: 'short',
    year: 'numeric',
  });
}

function formatDateTime(value: string | undefined, locale: string): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString(locale, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function timeToMinutes(value: string): number {
  const [hours, minutes] = value.split(':').map(Number);
  return (hours || 0) * 60 + (minutes || 0);
}

function formatTimeRange(summary: ScheduleSlotSummary): string {
  return `${summary.startTime} - ${summary.endTime}`;
}

function studentName(submission: DashboardSubmission): string {
  const user = submission.user;
  const fullName = `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim();
  return fullName || user?.username || user?.id?.slice(0, 8).toUpperCase() || '';
}

export default function AdminDashboardPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const base = usePortalBase();
  const locale = i18n.language === 'vi' ? 'vi-VN' : 'en-US';
  const today = useMemo(() => new Date(), []);
  const currentMonth = useMemo(() => monthKey(today), [today]);
  const weekStart = useMemo(() => startOfWeekMon(today), [today]);
  const todayDateKey = useMemo(() => dateKey(today), [today]);
  const monthKeys = useMemo(
    () =>
      Array.from({ length: FINANCE_TREND_MONTHS }, (_, index) =>
        monthKey(addMonths(today, index - FINANCE_TREND_MONTHS + 1)),
      ),
    [today],
  );
  const priorMonthParams = useMemo(
    () => monthKeys.slice(0, -1).map((month) => ({ month, page: 1, limit: 1 })),
    [monthKeys],
  );
  const weekParams = useMemo(() => {
    const weekEnd = addDays(weekStart, 6);
    return { from: dateKey(weekStart), to: dateKey(weekEnd) };
  }, [weekStart]);

  const studentsQuery = useStudentsList({
    status: EnrollmentStatus.ACTIVE,
    page: 1,
    limit: 1,
  });
  const teachersQuery = useUsersList({
    role: UserRole.TEACHER,
    status: 'active',
    page: 1,
    limit: 1,
  });
  const financeQuery = useFinanceMonthlyReport({
    month: currentMonth,
    page: 1,
    limit: 100,
  });
  const scheduleSummariesQuery = useScheduleSlotSummaries(weekParams);
  const submissionsQuery = useAllSubmissions({ page: 1, limit: 5 });
  const trendQueries = useQueries({
    queries: priorMonthParams.map((params) => ({
      queryKey: financeKeys.monthly(params),
      queryFn: () => financeApi.monthly(params),
      staleTime: 15_000,
    })),
  });

  const money = useMemo(
    () =>
      new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: 'VND',
        maximumFractionDigits: 0,
      }),
    [locale],
  );
  const numberFormat = useMemo(() => new Intl.NumberFormat(locale), [locale]);
  const days = t('pages.admin.dashboard.days', { returnObjects: true }) as Record<
    'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun',
    string
  >;

  const dashboardQueries = [
    studentsQuery,
    teachersQuery,
    financeQuery,
    scheduleSummariesQuery,
    submissionsQuery,
    ...trendQueries,
  ];
  const isRefreshing = dashboardQueries.some((query) => query.isFetching);
  const hasAnyError = dashboardQueries.some((query) => query.isError);

  const financeSummary = financeQuery.data?.summary;
  const financeTrendData = monthKeys.map((month, index) => {
    if (month === currentMonth) return financeSummary?.totalAmountDue ?? 0;
    return trendQueries[index]?.data?.summary.totalAmountDue ?? 0;
  });
  const financeTrendMeta = monthKeys.map((month) => formatMonthLabel(month, locale));

  const scheduleSummaries = scheduleSummariesQuery.data ?? [];
  const attendanceBars = WEEKDAY_KEYS.map((day, index) => {
    const date = dateKey(addDays(weekStart, index));
    const total = scheduleSummaries
      .filter((summary) => summary.date === date && !summary.cancelled)
      .reduce(
        (acc, summary) => ({
          present: acc.present + summary.presentCount,
          total: acc.total + summary.totalCount,
        }),
        { present: 0, total: 0 },
      );
    return {
      label: days[DAY_LABEL_KEYS[day]],
      value: total.total > 0 ? Math.round((total.present / total.total) * 100) : 0,
    };
  });
  const attendanceTotal = scheduleSummaries.reduce(
    (acc, summary) => {
      if (summary.cancelled) return acc;
      return {
        present: acc.present + summary.presentCount,
        total: acc.total + summary.totalCount,
      };
    },
    { present: 0, total: 0 },
  );
  const attendanceAverage =
    attendanceTotal.total > 0 ? Math.round((attendanceTotal.present / attendanceTotal.total) * 100) : 0;
  const todaySessions = scheduleSummaries
    .filter((summary) => summary.date === todayDateKey)
    .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

  const submissions = ((submissionsQuery.data?.data ?? []) as DashboardSubmission[]).slice(0, 5);
  const submissionStats = submissionsQuery.data?.stats ?? { total: 0, accepted: 0, wrong: 0, other: 0 };
  const submissionTimeline: TimelineItem[] = submissions.map((submission) => {
    const name = studentName(submission) || t('pages.admin.dashboard.recentSubmissions.unknownStudent');
    const assignmentTitle =
      submission.assignment?.title || t('pages.admin.dashboard.recentSubmissions.unknownAssignment');
    return {
      id: submission.id,
      icon: SUBMISSION_ICON[submission.status],
      tone: SUBMISSION_TONE[submission.status],
      title: assignmentTitle,
      meta: t('pages.admin.dashboard.recentSubmissions.meta', {
        student: name,
        status: t(`pages.admin.dashboard.recentSubmissions.status.${submission.status}`),
      }),
      time: formatDateTime(submission.createdAt, locale),
    };
  });

  const financeIssues =
    financeQuery.data?.rows
      .filter((row) => row.missingTuitionConfig || row.scheduledSessions === 0)
      .slice(0, 4) ?? [];

  function formatQueryTotal(query: TotalQuery) {
    if (query.isError) return '-';
    if (query.isLoading) return t('common.loading');
    return numberFormat.format(query.data?.total ?? 0);
  }

  function refetchDashboard() {
    void Promise.all(dashboardQueries.map((query) => query.refetch()));
  }

  return (
    <div className="flex flex-col gap-lg">
      <PageHeader
        title={t('pages.admin.dashboard.title')}
        subtitle={t('pages.admin.dashboard.subtitle')}
        actions={
          <Button
            variant="admin"
            leadingIcon={
              <Icon
                name={isRefreshing ? 'progress_activity' : 'refresh'}
                size={18}
                className={isRefreshing ? 'animate-spin' : undefined}
              />
            }
            onClick={refetchDashboard}
            disabled={isRefreshing}
          >
            {t('pages.admin.dashboard.actions.refresh')}
          </Button>
        }
      />

      {hasAnyError && (
        <div className="flex items-start gap-sm rounded-lg border border-error/30 bg-error-container/20 p-md text-label-sm text-on-surface">
          <Icon name="error" size={18} className="mt-0.5 text-error" />
          <div>
            <div className="font-semibold text-error">{t('pages.admin.dashboard.status.partialErrorTitle')}</div>
            <p className="text-on-surface-variant">{t('pages.admin.dashboard.status.partialErrorBody')}</p>
          </div>
        </div>
      )}

      <section className="grid grid-cols-1 md:grid-cols-3 gap-md">
        <StatCard
          label={t('pages.admin.dashboard.kpi.monthlyReceivables')}
          value={financeQuery.isError ? '-' : money.format(financeSummary?.totalAmountDue ?? 0)}
          icon="payments"
          iconColor="text-tertiary"
          trend="flat"
          delta={t('pages.admin.dashboard.kpi.thisMonth')}
        />
        <StatCard
          label={t('pages.admin.dashboard.kpi.activeStudents')}
          value={formatQueryTotal(studentsQuery)}
          icon="groups"
          iconColor="text-primary"
          trend="flat"
          delta={t('pages.admin.dashboard.kpi.live')}
        />
        <StatCard
          label={t('pages.admin.dashboard.kpi.activeTeachers')}
          value={formatQueryTotal(teachersQuery)}
          icon="school"
          iconColor="text-error"
          trend="flat"
          delta={t('pages.admin.dashboard.kpi.live')}
        />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-md">
        <DashboardPanel className="lg:col-span-2">
          <PanelHeader
            title={t('pages.admin.dashboard.revenue.title')}
            subtitle={t('pages.admin.dashboard.revenue.subtitle', {
              month: formatMonthLabel(currentMonth, locale),
              sessions: numberFormat.format(financeSummary?.billableSessions ?? 0),
            })}
            trailing={
              <span className="rounded-full bg-tertiary-container/40 px-sm py-1 text-[12px] font-semibold text-tertiary">
                {money.format(financeSummary?.totalAmountDue ?? 0)}
              </span>
            }
          />

          {financeQuery.isError ? (
            <EmptyInline icon="error" text={t('pages.admin.dashboard.status.financeError')} />
          ) : (
            <>
              <AreaChart className="text-primary" data={financeTrendData} height={240} />
              <div className="flex items-center justify-between gap-xs text-[11px] text-on-surface-variant">
                {financeTrendMeta.map((label) => (
                  <span key={label} className="min-w-0 truncate">
                    {label}
                  </span>
                ))}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-sm pt-sm">
                <MetricChip
                  icon="event_available"
                  label={t('pages.admin.dashboard.revenue.scheduledSessions')}
                  value={numberFormat.format(financeSummary?.scheduledSessions ?? 0)}
                />
                <MetricChip
                  icon="task_alt"
                  label={t('pages.admin.dashboard.revenue.billableSessions')}
                  value={numberFormat.format(financeSummary?.billableSessions ?? 0)}
                />
                <MetricChip
                  icon="warning"
                  label={t('pages.admin.dashboard.revenue.missingRates')}
                  value={numberFormat.format(financeSummary?.studentsMissingTuition ?? 0)}
                />
              </div>
            </>
          )}
        </DashboardPanel>

        <DashboardPanel>
          <PanelHeader
            title={t('pages.admin.dashboard.attendance.title')}
            subtitle={t('pages.admin.dashboard.attendance.subtitle', {
              rate: numberFormat.format(attendanceAverage),
            })}
          />
          {scheduleSummariesQuery.isError ? (
            <EmptyInline icon="error" text={t('pages.admin.dashboard.status.scheduleError')} />
          ) : (
            <>
              <BarChart className="flex-1" barClassName="bg-secondary" data={attendanceBars} height={190} />
              <div className="grid grid-cols-2 gap-sm pt-sm">
                <MetricChip
                  icon="how_to_reg"
                  label={t('pages.admin.dashboard.attendance.present')}
                  value={numberFormat.format(attendanceTotal.present)}
                />
                <MetricChip
                  icon="groups"
                  label={t('pages.admin.dashboard.attendance.expected')}
                  value={numberFormat.format(attendanceTotal.total)}
                />
              </div>
            </>
          )}
        </DashboardPanel>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-md">
        <DashboardPanel>
          <PanelHeader
            title={t('pages.admin.dashboard.todaySessions.title')}
            subtitle={t('pages.admin.dashboard.todaySessions.subtitle', {
              count: todaySessions.length,
            })}
            trailing={
              <Button variant="ghost" size="sm" onClick={() => navigate(`${base}/schedule`)}>
                {t('common.viewAll')}
              </Button>
            }
          />
          {scheduleSummariesQuery.isError ? (
            <EmptyInline icon="error" text={t('pages.admin.dashboard.status.scheduleError')} />
          ) : todaySessions.length === 0 ? (
            <EmptyInline icon="event_busy" text={t('pages.admin.dashboard.todaySessions.empty')} />
          ) : (
            <ul className="flex flex-col gap-sm">
              {todaySessions.slice(0, 5).map((session) => (
                <li
                  key={`${session.date}_${session.dayOfWeek}_${session.startTime}_${session.endTime}`}
                  className="flex items-center gap-md rounded-lg bg-surface-container-low p-sm"
                >
                  <div className="w-20 shrink-0 text-label-sm font-bold text-primary">
                    {formatTimeRange(session)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-body-md font-semibold text-on-surface">
                      {session.cancelled
                        ? t('pages.admin.dashboard.todaySessions.cancelled')
                        : t('pages.admin.dashboard.todaySessions.attendance', {
                            present: numberFormat.format(session.presentCount),
                            total: numberFormat.format(session.totalCount),
                          })}
                    </div>
                    <div className="text-[12px] text-on-surface-variant">
                      {days[DAY_LABEL_KEYS[session.dayOfWeek]]}
                    </div>
                  </div>
                  <Icon
                    name={session.cancelled ? 'event_busy' : 'chevron_right'}
                    className={session.cancelled ? 'text-error' : 'text-on-surface-variant'}
                  />
                </li>
              ))}
            </ul>
          )}
        </DashboardPanel>

        <DashboardPanel>
          <PanelHeader
            title={t('pages.admin.dashboard.learningHealth.title')}
            subtitle={t('pages.admin.dashboard.learningHealth.subtitle', {
              count: submissionStats.total,
            })}
          />
          {submissionsQuery.isError ? (
            <EmptyInline icon="error" text={t('pages.admin.dashboard.status.submissionsError')} />
          ) : (
            <div className="flex flex-col gap-md">
              <ProgressRow
                label={t('pages.admin.dashboard.learningHealth.accepted')}
                value={submissionStats.accepted}
                total={submissionStats.total}
                className="bg-tertiary"
                numberFormat={numberFormat}
              />
              <ProgressRow
                label={t('pages.admin.dashboard.learningHealth.wrong')}
                value={submissionStats.wrong}
                total={submissionStats.total}
                className="bg-error"
                numberFormat={numberFormat}
              />
              <ProgressRow
                label={t('pages.admin.dashboard.learningHealth.other')}
                value={submissionStats.other}
                total={submissionStats.total}
                className="bg-primary"
                numberFormat={numberFormat}
              />
            </div>
          )}
        </DashboardPanel>

        <DashboardPanel>
          <PanelHeader
            title={t('pages.admin.dashboard.recentSubmissions.title')}
            subtitle={t('pages.admin.dashboard.recentSubmissions.subtitle')}
            trailing={
              <Button variant="ghost" size="sm" onClick={() => navigate(`${base}/submissions`)}>
                {t('common.viewAll')}
              </Button>
            }
          />
          {submissionsQuery.isError ? (
            <EmptyInline icon="error" text={t('pages.admin.dashboard.status.submissionsError')} />
          ) : submissionTimeline.length === 0 ? (
            <EmptyInline icon="history" text={t('pages.admin.dashboard.recentSubmissions.empty')} />
          ) : (
            <Timeline items={submissionTimeline} className="gap-sm" />
          )}
        </DashboardPanel>

        <DashboardPanel>
          <PanelHeader
            title={t('pages.admin.dashboard.financeAttention.title')}
            subtitle={t('pages.admin.dashboard.financeAttention.subtitle', {
              count: financeSummary?.studentsMissingTuition ?? 0,
            })}
            trailing={
              <Button variant="ghost" size="sm" onClick={() => navigate(`${base}/finance`)}>
                {t('common.viewAll')}
              </Button>
            }
          />
          {financeQuery.isError ? (
            <EmptyInline icon="error" text={t('pages.admin.dashboard.status.financeError')} />
          ) : financeIssues.length === 0 ? (
            <EmptyInline icon="task_alt" text={t('pages.admin.dashboard.financeAttention.empty')} />
          ) : (
            <ul className="flex flex-col gap-sm">
              {financeIssues.map((row) => (
                <li
                  key={row.profileId}
                  className="flex items-center justify-between gap-md rounded-lg bg-surface-container-low p-sm"
                >
                  <div className="min-w-0">
                    <div className="truncate text-body-md font-semibold text-on-surface">{row.studentName}</div>
                    <div className="text-[12px] text-on-surface-variant">
                      {row.missingTuitionConfig
                        ? t('pages.admin.dashboard.financeAttention.missingRate')
                        : t('pages.admin.dashboard.financeAttention.noSchedule')}
                    </div>
                  </div>
                  <span className="shrink-0 rounded-full bg-error-container/50 px-sm py-1 text-[11px] font-semibold text-error">
                    {row.missingTuitionConfig
                      ? t('pages.admin.dashboard.financeAttention.rateBadge')
                      : t('pages.admin.dashboard.financeAttention.scheduleBadge')}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </DashboardPanel>
      </section>
    </div>
  );
}

function DashboardPanel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`flex min-h-[260px] flex-col gap-md rounded-xl border border-outline-variant/50 bg-surface-container-lowest p-md shadow-elev-1 ${className}`}
    >
      {children}
    </div>
  );
}

function PanelHeader({
  title,
  subtitle,
  trailing,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  trailing?: ReactNode;
}) {
  return (
    <header className="flex items-start justify-between gap-md">
      <div className="min-w-0">
        <h3 className="font-manrope text-headline-md text-on-surface">{title}</h3>
        {subtitle && <p className="mt-1 text-label-sm text-on-surface-variant">{subtitle}</p>}
      </div>
      {trailing && <div className="shrink-0">{trailing}</div>}
    </header>
  );
}

function MetricChip({ icon, label, value }: { icon: string; label: ReactNode; value: ReactNode }) {
  return (
    <div className="flex items-center gap-sm rounded-lg bg-surface-container-low p-sm">
      <Icon name={icon} size={18} className="text-primary" />
      <div className="min-w-0">
        <div className="truncate text-[11px] font-semibold uppercase text-on-surface-variant">{label}</div>
        <div className="font-manrope text-headline-sm font-bold text-on-surface">{value}</div>
      </div>
    </div>
  );
}

function ProgressRow({
  label,
  value,
  total,
  className,
  numberFormat,
}: {
  label: ReactNode;
  value: number;
  total: number;
  className: string;
  numberFormat: Intl.NumberFormat;
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="flex flex-col gap-xs">
      <div className="flex items-center justify-between gap-md text-label-sm">
        <span className="font-semibold text-on-surface">{label}</span>
        <span className="text-on-surface-variant">
          {numberFormat.format(value)} ({numberFormat.format(pct)}%)
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-surface-container-high">
        <div className={`h-full rounded-full ${className}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function EmptyInline({ icon, text }: { icon: string; text: ReactNode }) {
  return (
    <div className="grid min-h-[140px] place-items-center rounded-lg bg-surface-container-low p-md text-center">
      <div>
        <Icon name={icon} size={32} className="mx-auto mb-sm text-on-surface-variant/60" />
        <p className="text-label-sm text-on-surface-variant">{text}</p>
      </div>
    </div>
  );
}
