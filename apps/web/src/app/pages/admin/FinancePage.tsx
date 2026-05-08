import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Button,
  Column,
  DataTable,
  Icon,
  InvoiceStatusBadge,
  PageHeader,
  StatCard,
  Timeline,
  TimelineItem,
} from '@cp/ui';
import { IInvoiceRow, InvoiceStatus } from '@cp/shared';

export default function AdminFinancePage() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language === 'vi' ? 'vi-VN' : 'en-US';

  const invoices: IInvoiceRow[] = useMemo(
    () => [
      { id: 'inv-1', invoiceNumber: 'INV-2024-0182', accountName: t('pages.admin.finance.accounts.sarah'), accountEmail: 'sarah.jenkins@cp.local', amount: 1250, dueDate: '2024-10-30', status: InvoiceStatus.PAID },
      { id: 'inv-2', invoiceNumber: 'INV-2024-0181', accountName: t('pages.admin.finance.accounts.aiko'), accountEmail: 'aiko.tanaka@cp.local', amount: 2100, dueDate: '2024-10-25', status: InvoiceStatus.OVERDUE },
      { id: 'inv-3', invoiceNumber: 'INV-2024-0180', accountName: t('pages.admin.finance.accounts.michael'), accountEmail: 'michael.rossi@cp.local', amount: 890, dueDate: '2024-11-05', status: InvoiceStatus.PARTIAL },
      { id: 'inv-4', invoiceNumber: 'INV-2024-0179', accountName: t('pages.admin.finance.accounts.liam'), accountEmail: 'liam.carter@cp.local', amount: 1500, dueDate: '2024-11-12', status: InvoiceStatus.DRAFT },
      { id: 'inv-5', invoiceNumber: 'INV-2024-0178', accountName: t('pages.admin.finance.accounts.priya'), accountEmail: 'priya.singh@cp.local', amount: 2200, dueDate: '2024-10-22', status: InvoiceStatus.PAID },
    ],
    [t],
  );

  const activities: TimelineItem[] = useMemo(
    () => [
      {
        id: '1',
        icon: 'paid',
        tone: 'tertiary',
        title: t('pages.admin.finance.activities.paymentReceived', { amount: '$2,200' }),
        meta: t('pages.admin.finance.accounts.priya'),
        time: t('ui.helpQueue.minutesAgo', { count: 12 }),
      },
      {
        id: '2',
        icon: 'warning',
        tone: 'error',
        title: t('pages.admin.finance.activities.invoiceOverdue', { amount: '$2,100' }),
        meta: t('pages.admin.finance.accounts.aiko'),
        time: t('ui.helpQueue.hoursAgo', { count: 2 }),
      },
      {
        id: '3',
        icon: 'description',
        tone: 'secondary',
        title: t('pages.admin.finance.activities.draftCreated'),
        meta: 'INV-2024-0179',
        time: t('ui.helpQueue.hoursAgo', { count: 5 }),
      },
      {
        id: '4',
        icon: 'send',
        tone: 'primary',
        title: t('pages.admin.finance.activities.reminderSent'),
        meta: t('pages.admin.finance.meta.accountCount', { count: 12 }),
        time: t('ui.helpQueue.daysAgo', { count: 1 }),
      },
    ],
    [t],
  );

  const columns: Column<IInvoiceRow>[] = [
    { key: 'invoice', header: t('pages.admin.finance.columns.invoice'), cell: (row) => <span className="text-primary font-bold">{row.invoiceNumber}</span> },
    {
      key: 'account',
      header: t('pages.admin.finance.columns.account'),
      cell: (row) => (
        <div className="min-w-0">
          <div className="text-on-surface font-medium truncate">{row.accountName}</div>
          <div className="text-[12px] text-on-surface-variant truncate">{row.accountEmail}</div>
        </div>
      ),
    },
    {
      key: 'amount',
      header: t('pages.admin.finance.columns.amount'),
      align: 'right',
      cell: (row) => <span className="text-on-surface font-semibold">${row.amount.toLocaleString()}</span>,
    },
    {
      key: 'due',
      header: t('pages.admin.finance.columns.due'),
      cell: (row) => (
        <span className="text-on-surface-variant whitespace-nowrap">
          {new Date(row.dueDate).toLocaleDateString(locale)}
        </span>
      ),
    },
    {
      key: 'status',
      header: t('pages.admin.finance.columns.status'),
      cell: (row) => <InvoiceStatusBadge status={row.status} />,
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      cell: () => (
        <button className="opacity-0 group-hover:opacity-100 p-1 rounded text-on-surface-variant hover:text-primary transition-opacity" aria-label={t('common.more')}>
          <Icon name="more_horiz" size={18} />
        </button>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-lg">
      <PageHeader
        title={t('pages.admin.finance.title')}
        subtitle={t('pages.admin.finance.subtitle')}
        actions={
          <>
            <Button variant="ghost" leadingIcon={<Icon name="ios_share" size={18} />}>
              {t('common.export')}
            </Button>
            <Button variant="admin" leadingIcon={<Icon name="add" size={18} />}>
              {t('pages.admin.finance.newInvoice')}
            </Button>
          </>
        }
      />

      <section className="grid grid-cols-1 md:grid-cols-3 gap-md">
        <StatCard label={t('pages.admin.finance.kpi.totalRevenue')} value="$1.2M" icon="payments" iconColor="text-tertiary" trend="up" delta="+12.5%" />
        <StatCard label={t('pages.admin.finance.kpi.outstanding')} value="$84,200" icon="schedule" iconColor="text-error" trend="down" delta="−3.1%" />
        <StatCard label={t('pages.admin.finance.kpi.activeAccounts')} value="2,184" icon="account_balance_wallet" iconColor="text-secondary" trend="up" delta="+1.4%" />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-md">
        <section className="lg:col-span-2 bg-surface-container-lowest border border-outline-variant/50 rounded-xl shadow-elev-1 overflow-hidden">
          <header className="p-md md:p-lg border-b border-outline-variant/30 flex justify-between items-center bg-surface-bright">
            <h3 className="font-manrope text-headline-md text-on-surface">
              {t('pages.admin.finance.recentInvoices')}
            </h3>
            <button className="text-primary text-label-sm font-semibold hover:underline">
              {t('common.viewAll')}
            </button>
          </header>
          <DataTable rows={invoices} columns={columns} rowKey={(r) => r.id} />
        </section>

        <aside className="bg-surface-container-lowest border border-outline-variant/50 rounded-xl p-md">
          <header className="flex items-center justify-between mb-md">
            <h3 className="font-manrope text-headline-md text-on-surface">
              {t('pages.admin.finance.recentActivity')}
            </h3>
          </header>
          <Timeline items={activities} />
          <button className="mt-md w-full text-primary text-label-sm font-semibold py-sm rounded-lg hover:bg-primary/5">
            {t('common.viewHistory')}
          </button>
        </aside>
      </div>
    </div>
  );
}
