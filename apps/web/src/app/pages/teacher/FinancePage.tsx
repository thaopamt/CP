import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Avatar,
  Column,
  DataTable,
  FilterToolbar,
  Icon,
  PageHeader,
  Pagination,
  SearchBox,
  SelectFilter,
  StatCard,
} from '@cp/ui';
import { FINANCE_COLLECTION_STATUSES, FinanceCollectionStatus, IFinanceMonthlyRow } from '@cp/shared';

import { useTeacherFinanceMonthlyReport } from '../../api/finance.queries';

const PAGE_SIZE = 25;
type StatusFilter = 'all' | FinanceCollectionStatus;

function currentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function formatDate(value: string | Date) {
  const date = typeof value === 'string' ? new Date(`${value.slice(0, 10)}T00:00:00`) : value;
  if (Number.isNaN(date.getTime())) return '';
  return [
    String(date.getDate()).padStart(2, '0'),
    String(date.getMonth() + 1).padStart(2, '0'),
    date.getFullYear(),
  ].join('/');
}

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

/**
 * Teacher Finance Page — read-only view of the monthly finance report.
 *
 * Shows only students assigned to the current teacher or not assigned to
 * any teacher. Amount-due and collection-status editing are admin-only.
 */
export default function TeacherFinancePage() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language === 'vi' ? 'vi-VN' : 'en-US';
  const [month, setMonth] = useState(currentMonth);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [collectionStatusFilter, setCollectionStatusFilter] = useState<StatusFilter>('all');
  const deferredSearch = useDeferredValue(search.trim());

  useEffect(() => {
    setPage(1);
  }, [month, deferredSearch, collectionStatusFilter]);

  const reportQuery = useTeacherFinanceMonthlyReport({
    month,
    search: deferredSearch || undefined,
    status: collectionStatusFilter === 'all' ? undefined : collectionStatusFilter,
    page,
    limit: PAGE_SIZE,
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
  const report = reportQuery.data;
  const summary = report?.summary;
  const getBillingStatus = (row: IFinanceMonthlyRow) =>
    row.billingStatus ?? (row.missingTuitionConfig ? 'MISSING_TUITION' : 'READY');
  const getBillingStatusLabel = (row: IFinanceMonthlyRow) =>
    t(`pages.admin.finance.status.${getBillingStatus(row)}`);
  const getCollectionStatusLabel = (status: FinanceCollectionStatus) =>
    t(`pages.admin.finance.collectionStatus.${status}`);

  const columns: Column<IFinanceMonthlyRow>[] = [
    {
      key: 'student',
      header: t('pages.admin.finance.columns.student'),
      align: 'left',
      cell: (row) => (
        <div className="flex min-w-[260px] items-center gap-sm">
          <Avatar size="sm" initials={initials(row.studentName)} src={row.avatarUrl ?? undefined} />
          <div className="min-w-0 text-left">
            <div className="truncate font-semibold text-on-surface">{row.studentName}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'grade',
      header: t('pages.admin.finance.columns.grade'),
      align: 'center',
      cell: (row) => (
        <span className="whitespace-nowrap text-on-surface-variant">
          {t('pages.admin.studentProfile.gradeShort', { grade: row.grade })}
        </span>
      ),
    },
    {
      key: 'scheduled',
      header: t('pages.admin.finance.columns.scheduledSessions'),
      align: 'center',
      cell: (row) => (
        <span className="text-on-surface-variant">{numberFormat.format(row.scheduledSessions)}</span>
      ),
    },
    {
      key: 'billable',
      header: t('pages.admin.finance.columns.billableSessions'),
      align: 'center',
      cell: (row) => (
        <span className="font-semibold text-on-surface">{numberFormat.format(row.billableSessions)}</span>
      ),
    },
    {
      key: 'monthly',
      header: t('pages.admin.finance.columns.monthlyTuition'),
      align: 'center',
      cell: (row) => (
        <span
          className={row.missingTuitionConfig ? 'font-semibold text-error' : 'font-semibold text-on-surface'}
        >
          {money.format(row.monthlyTuition)}
        </span>
      ),
    },
    {
      key: 'rate',
      header: t('pages.admin.finance.columns.sessionRate'),
      align: 'center',
      cell: (row) => <span className="text-on-surface-variant">{money.format(row.tuitionPerSession)}</span>,
    },
    {
      key: 'amount',
      header: t('pages.admin.finance.columns.amount'),
      align: 'center',
      cell: (row) => (
        <span className={`font-semibold ${row.hasAmountDueOverride ? 'text-primary' : 'text-on-surface'}`}>
          {money.format(row.amountDue)}
        </span>
      ),
    },
    {
      key: 'status',
      header: t('pages.admin.finance.columns.status'),
      align: 'center',
      cell: (row) => {
        const billingStatus = getBillingStatus(row);
        return (
          <div className="flex items-center justify-center gap-xs">
            <span
              className={`inline-flex items-center rounded-full px-md py-xs text-label-sm font-semibold ${statusChipClass(row.collectionStatus)}`}
            >
              {getCollectionStatusLabel(row.collectionStatus)}
            </span>
            {billingStatus !== 'READY' && (
              <span
                className="inline-grid h-8 w-8 place-items-center rounded-lg bg-error-container/40 text-error"
                title={getBillingStatusLabel(row)}
              >
                <Icon name="info" size={16} />
              </span>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="flex flex-col gap-lg">
      <PageHeader
        title={t('pages.admin.finance.title')}
        subtitle={t('pages.admin.finance.subtitle')}
      />

      <FilterToolbar>
        <SearchBox
          value={search}
          onChange={setSearch}
          placeholder={t('pages.admin.finance.searchPlaceholder')}
        />
        <label className="flex items-center gap-sm text-label-sm text-on-surface-variant">
          <span>{t('pages.admin.finance.month')}</span>
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value || currentMonth())}
            className="rounded-lg border border-outline-variant bg-surface-container-low px-md py-sm text-label-sm text-on-surface outline-none focus:ring-2 focus:ring-primary"
          />
        </label>
        <SelectFilter
          label={t('pages.admin.finance.filters.statusLabel')}
          value={collectionStatusFilter}
          onChange={(event) => setCollectionStatusFilter(event.target.value as StatusFilter)}
          options={[
            { value: 'all', label: t('pages.admin.finance.filters.statusAll') },
            ...FINANCE_COLLECTION_STATUSES.map((status) => ({
              value: status,
              label: getCollectionStatusLabel(status),
            })),
          ]}
        />
      </FilterToolbar>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-md">
        <StatCard
          label={t('pages.admin.finance.kpi.potentialDue')}
          value={money.format(summary?.totalPotentialAmount ?? 0)}
          icon="account_balance_wallet"
          iconColor="text-primary"
        />
        <StatCard
          label={t('pages.admin.finance.kpi.totalDue')}
          value={money.format(summary?.totalAmountDue ?? 0)}
          icon="payments"
          iconColor="text-tertiary"
        />
        <StatCard
          label={t('pages.admin.finance.kpi.outstandingDue')}
          value={money.format(summary?.totalOutstandingAmount ?? 0)}
          icon="pending_actions"
          iconColor="text-error"
        />
      </section>

      <section className="overflow-hidden rounded-xl border border-outline-variant/50 bg-surface-container-lowest shadow-elev-1">
        <header className="flex flex-col gap-xs border-b border-outline-variant/30 bg-surface-bright p-md md:p-lg">
          <h3 className="font-manrope text-headline-md text-on-surface">
            {t('pages.admin.finance.monthlyReceivables')}
          </h3>
          <p className="text-label-sm text-on-surface-variant">
            {summary
              ? t('pages.admin.finance.reportMeta', {
                  from: formatDate(summary.from),
                  to: formatDate(summary.to),
                  count: summary.totalStudents,
                })
              : t('common.loading')}
          </p>
        </header>

        {reportQuery.isError ? (
          <div className="grid min-h-[220px] place-items-center p-xl text-center text-error">
            <div>
              <Icon name="error" size={36} className="mx-auto mb-sm" />
              <p>
                {(reportQuery.error as Error | undefined)?.message ?? t('pages.admin.finance.loadFailed')}
              </p>
            </div>
          </div>
        ) : (
          <>
            {reportQuery.isLoading && !report ? (
              <div className="grid min-h-[220px] place-items-center text-on-surface-variant">
                <Icon name="progress_activity" size={36} className="animate-spin" />
              </div>
            ) : (
              <DataTable
                rows={report?.rows ?? []}
                columns={columns}
                rowKey={(row) => row.studentId}
                emptyState={t('pages.admin.finance.empty')}
              />
            )}
            <div className="flex items-center justify-between border-t border-outline-variant/30 px-md py-sm">
              <span className="text-label-sm text-on-surface-variant">
                {t('pages.admin.finance.totalRows', { count: report?.total ?? 0 })}
              </span>
              <Pagination page={report?.page ?? page} pageCount={report?.pageCount ?? 1} onChange={setPage} />
            </div>
          </>
        )}
      </section>
    </div>
  );
}

function statusChipClass(status: FinanceCollectionStatus): string {
  switch (status) {
    case 'PAID':
      return 'bg-tertiary-container/50 text-on-tertiary-container';
    case 'PRINTED':
      return 'bg-primary-container/50 text-on-primary-container';
    case 'SENT':
      return 'bg-secondary-container/50 text-on-secondary-container';
    case 'PENDING':
    default:
      return 'bg-surface-container-high text-on-surface-variant';
  }
}
