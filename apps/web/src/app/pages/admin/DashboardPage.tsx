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

export default function AdminDashboardPage() {
  const { t } = useTranslation();

  const activities: TimelineItem[] = [
    {
      id: '1',
      icon: 'person_add',
      tone: 'primary',
      title: t('pages.admin.dashboard.activities.enroll.title'),
      meta: t('pages.admin.dashboard.activities.enroll.meta'),
      time: t('ui.helpQueue.minutesAgo', { count: 2 }),
    },
    {
      id: '2',
      icon: 'paid',
      tone: 'tertiary',
      title: t('pages.admin.dashboard.activities.payment.title'),
      meta: t('pages.admin.dashboard.activities.payment.meta'),
      time: t('ui.helpQueue.minutesAgo', { count: 18 }),
    },
    {
      id: '3',
      icon: 'warning',
      tone: 'error',
      title: t('pages.admin.dashboard.activities.conflict.title'),
      meta: t('pages.admin.dashboard.activities.conflict.meta'),
      time: t('ui.helpQueue.hoursAgo', { count: 1 }),
    },
    {
      id: '4',
      icon: 'class',
      tone: 'secondary',
      title: t('pages.admin.dashboard.activities.published.title'),
      meta: t('pages.admin.dashboard.activities.published.meta'),
      time: t('ui.helpQueue.hoursAgo', { count: 3 }),
    },
  ];

  const sessions = [
    {
      time: '09:00',
      title: t('pages.admin.dashboard.sessions.algebra.title'),

    },
    {
      time: '10:30',
      title: t('pages.admin.dashboard.sessions.physics.title'),

    },
    {
      time: '13:00',
      title: t('pages.admin.dashboard.sessions.history.title'),

    },
  ];

  const reminders = [
    {
      name: t('pages.admin.dashboard.reminders.sarah'),
      amount: '$1,250',
      overdue: true,
      days: 5,
    },
    {
      name: t('pages.admin.dashboard.reminders.michael'),
      amount: '$890',
      overdue: false,
      days: 7,
    },
    {
      name: t('pages.admin.dashboard.reminders.aiko'),
      amount: '$2,100',
      overdue: false,
      days: 7,
    },
  ];

  const days = t('pages.admin.dashboard.days', { returnObjects: true }) as Record<string, string>;

  return (
    <div className="flex flex-col gap-lg">
      <PageHeader
        title={t('pages.admin.dashboard.title')}
        subtitle={t('pages.admin.dashboard.subtitle')}
        actions={
          <Button variant="admin" leadingIcon={<Icon name="download" size={18} />}>
            {t('common.exportReport')}
          </Button>
        }
      />

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-md">
        <StatCard label={t('pages.admin.dashboard.kpi.totalRevenue')} value="$1.2M" icon="payments" iconColor="text-tertiary" trend="up" delta="+12.5%" />
        <StatCard label={t('pages.admin.dashboard.kpi.activeStudents')} value="12,450" icon="groups" iconColor="text-primary" trend="up" delta="+4.2%" />
        <StatCard label={t('pages.admin.dashboard.kpi.activeClasses')} value="842" icon="class" iconColor="text-secondary" trend="flat" delta={t('pages.admin.dashboard.kpi.flatLabel')} />
        <StatCard label={t('pages.admin.dashboard.kpi.totalTeachers')} value="386" icon="school" iconColor="text-error" trend="up" delta="+2.1%" />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-md">
        <div className="lg:col-span-2 bg-surface-container-lowest border border-outline-variant/50 rounded-xl p-md flex flex-col gap-sm">
          <div className="flex items-center justify-between">
            <h3 className="font-manrope text-headline-md text-on-surface">
              {t('pages.admin.dashboard.revenue.title')}
            </h3>
            <select className="text-label-sm bg-surface-container-low border border-outline-variant rounded-md px-md py-xs">
              <option>{t('pages.admin.dashboard.revenue.range.last12')}</option>
              <option>{t('pages.admin.dashboard.revenue.range.last6')}</option>
              <option>{t('pages.admin.dashboard.revenue.range.ytd')}</option>
            </select>
          </div>
          <AreaChart
            className="text-primary"
            data={[42, 50, 48, 60, 70, 65, 80, 88, 84, 95, 110, 120]}
            height={260}
          />
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant/50 rounded-xl p-md flex flex-col gap-sm">
          <h3 className="font-manrope text-headline-md text-on-surface">
            {t('pages.admin.dashboard.attendance.title')}
          </h3>
          <p className="text-label-sm text-on-surface-variant">
            {t('pages.admin.dashboard.attendance.subtitle')}
          </p>
          <BarChart
            className="flex-1"
            barClassName="bg-secondary"
            data={[
              { label: days.mon, value: 92 },
              { label: days.tue, value: 95 },
              { label: days.wed, value: 88 },
              { label: days.thu, value: 90 },
              { label: days.fri, value: 80 },
            ]}
            height={200}
          />
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-md">
        <div className="bg-surface-container-lowest border border-outline-variant/50 rounded-xl p-md">
          <header className="flex items-center justify-between mb-md">
            <h3 className="font-manrope text-headline-md text-on-surface">
              {t('pages.admin.dashboard.upcomingSessions.title')}
            </h3>
            <button className="text-primary text-label-sm font-semibold hover:underline">
              {t('common.viewAll')}
            </button>
          </header>
          <ul className="flex flex-col gap-sm">
            {sessions.map((s) => (
              <li key={s.time} className="flex items-center gap-md p-sm rounded-lg hover:bg-surface-container-low">
                <div className="w-14 shrink-0 text-label-sm font-bold text-primary">{s.time}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-body-md text-on-surface truncate">{s.title}</div>

                </div>
                <Icon name="chevron_right" className="text-on-surface-variant" />
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant/50 rounded-xl p-md">
          <header className="flex items-center justify-between mb-md">
            <h3 className="font-manrope text-headline-md text-on-surface">
              {t('pages.admin.dashboard.recentActivities.title')}
            </h3>
          </header>
          <Timeline items={activities} />
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant/50 rounded-xl p-md">
          <header className="flex items-center justify-between mb-md">
            <h3 className="font-manrope text-headline-md text-on-surface">
              {t('pages.admin.dashboard.paymentReminders.title')}
            </h3>
            <Icon name="notifications_active" className="text-error" />
          </header>
          <ul className="flex flex-col gap-sm">
            {reminders.map((p) => (
              <li
                key={p.name}
                className={
                  p.overdue
                    ? 'flex items-center justify-between p-sm rounded-lg bg-error-container/30'
                    : 'flex items-center justify-between p-sm rounded-lg hover:bg-surface-container-low'
                }
              >
                <div>
                  <div className="text-body-md text-on-surface">{p.name}</div>
                  <div className="text-label-sm text-on-surface-variant">
                    {p.overdue
                      ? t('pages.admin.dashboard.paymentReminders.overdue', { count: p.days })
                      : t('pages.admin.dashboard.paymentReminders.dueIn', { count: p.days })}
                  </div>
                </div>
                <div className={p.overdue ? 'text-on-error-container font-bold' : 'text-on-surface font-bold'}>
                  {p.amount}
                </div>
              </li>
            ))}
          </ul>
          <button className="mt-md w-full text-primary text-label-sm font-semibold py-sm rounded-lg hover:bg-primary/5">
            {t('pages.admin.dashboard.paymentReminders.batch')}
          </button>
        </div>
      </section>
    </div>
  );
}
