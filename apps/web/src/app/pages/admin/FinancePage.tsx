import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Button,
  Column,
  DataTable,
  FilterToolbar,
  Icon,
  PageHeader,
  Pagination,
  SearchBox,
  StatCard,
  useToast,
} from '@cp/ui';
import { IFinanceMonthlyRow } from '@cp/shared';

import { financeApi } from '../../api/finance.api';
import { useFinanceMonthlyReport } from '../../api/finance.queries';

const PAGE_SIZE = 25;

function currentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export default function AdminFinancePage() {
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const locale = i18n.language === 'vi' ? 'vi-VN' : 'en-US';
  const [month, setMonth] = useState(currentMonth);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [exporting, setExporting] = useState(false);
  const deferredSearch = useDeferredValue(search.trim());

  useEffect(() => {
    setPage(1);
  }, [month, deferredSearch]);

  const reportQuery = useFinanceMonthlyReport({
    month,
    search: deferredSearch || undefined,
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

  const columns: Column<IFinanceMonthlyRow>[] = [
    {
      key: 'student',
      header: t('pages.admin.finance.columns.student'),
      cell: (row) => (
        <div className="min-w-[220px]">
          <div className="font-semibold text-on-surface">{row.studentName}</div>
          <div className="text-[12px] text-on-surface-variant truncate">
            {row.username ? `${row.username} · ` : ''}
            {row.email}
          </div>
        </div>
      ),
    },
    {
      key: 'grade',
      header: t('pages.admin.finance.columns.grade'),
      cell: (row) => (
        <span className="whitespace-nowrap text-on-surface-variant">
          {t('pages.admin.studentProfile.gradeShort', { grade: row.grade })}
        </span>
      ),
    },
    {
      key: 'classes',
      header: t('pages.admin.finance.columns.classes'),
      cell: (row) =>
        row.classNames.length ? (
          <div className="flex max-w-[260px] flex-wrap gap-xs">
            {row.classNames.slice(0, 3).map((name) => (
              <span
                key={name}
                className="rounded-md bg-primary-container/30 px-xs py-0.5 text-[11px] font-semibold text-primary"
              >
                {name}
              </span>
            ))}
            {row.classNames.length > 3 && (
              <span className="rounded-md bg-surface-container-high px-xs py-0.5 text-[11px] text-on-surface-variant">
                +{row.classNames.length - 3}
              </span>
            )}
          </div>
        ) : (
          <span className="text-on-surface-variant">-</span>
        ),
    },
    {
      key: 'sessions',
      header: t('pages.admin.finance.columns.sessions'),
      align: 'right',
      cell: (row) => (
        <span className="font-semibold text-on-surface">{numberFormat.format(row.billableSessions)}</span>
      ),
    },
    {
      key: 'rate',
      header: t('pages.admin.finance.columns.rate'),
      align: 'right',
      cell: (row) => (
        <span className={row.missingTuitionConfig ? 'font-semibold text-error' : 'text-on-surface'}>
          {money.format(row.tuitionPerSession)}
        </span>
      ),
    },
    {
      key: 'amount',
      header: t('pages.admin.finance.columns.amount'),
      align: 'right',
      cell: (row) => <span className="font-bold text-on-surface">{money.format(row.amountDue)}</span>,
    },
    {
      key: 'status',
      header: t('pages.admin.finance.columns.status'),
      cell: (row) =>
        row.missingTuitionConfig ? (
          <span className="inline-flex items-center gap-xs rounded-full bg-error-container/50 px-sm py-1 text-[11px] font-semibold text-error">
            <Icon name="error" size={14} />
            {t('pages.admin.finance.status.missingRate')}
          </span>
        ) : (
          <span className="inline-flex items-center gap-xs rounded-full bg-tertiary-container/40 px-sm py-1 text-[11px] font-semibold text-tertiary">
            <Icon name="check_circle" size={14} />
            {t('pages.admin.finance.status.configured')}
          </span>
        ),
    },
  ];

  async function exportCsv() {
    setExporting(true);
    try {
      const first = await financeApi.monthly({
        month,
        search: deferredSearch || undefined,
        page: 1,
        limit: 100,
      });
      const rest =
        first.pageCount > 1
          ? await Promise.all(
              Array.from({ length: first.pageCount - 1 }, (_, index) =>
                financeApi.monthly({
                  month,
                  search: deferredSearch || undefined,
                  page: index + 2,
                  limit: 100,
                }),
              ),
            )
          : [];
      const rows = [first, ...rest].flatMap((r) => r.rows);
      const csv = toCsv(rows, money);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `finance-${month}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error((err as Error).message || t('pages.admin.finance.exportFailed'));
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="flex flex-col gap-lg">
      <PageHeader
        title={t('pages.admin.finance.title')}
        subtitle={t('pages.admin.finance.subtitle')}
        actions={
          <Button
            variant="ghost"
            leadingIcon={<Icon name={exporting ? 'progress_activity' : 'ios_share'} size={18} className={exporting ? 'animate-spin' : undefined} />}
            onClick={exportCsv}
            disabled={exporting || reportQuery.isLoading}
          >
            {t('common.export')}
          </Button>
        }
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
      </FilterToolbar>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-md">
        <StatCard
          label={t('pages.admin.finance.kpi.totalDue')}
          value={money.format(summary?.totalAmountDue ?? 0)}
          icon="payments"
          iconColor="text-tertiary"
        />
        <StatCard
          label={t('pages.admin.finance.kpi.billableSessions')}
          value={numberFormat.format(summary?.billableSessions ?? 0)}
          icon="event_available"
          iconColor="text-primary"
        />
        <StatCard
          label={t('pages.admin.finance.kpi.missingRates')}
          value={numberFormat.format(summary?.studentsMissingTuition ?? 0)}
          icon="warning"
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
                  from: new Date(`${summary.from}T00:00:00`).toLocaleDateString(locale),
                  to: new Date(`${summary.to}T00:00:00`).toLocaleDateString(locale),
                  count: summary.totalStudents,
                })
              : t('common.loading')}
          </p>
        </header>

        {reportQuery.isError ? (
          <div className="grid min-h-[220px] place-items-center p-xl text-center text-error">
            <div>
              <Icon name="error" size={36} className="mx-auto mb-sm" />
              <p>{(reportQuery.error as Error | undefined)?.message ?? t('pages.admin.finance.loadFailed')}</p>
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

function toCsv(rows: IFinanceMonthlyRow[], money: Intl.NumberFormat) {
  const header = [
    'Student',
    'Email',
    'Grade',
    'Classes',
    'Billable sessions',
    'Tuition per session',
    'Amount due',
    'Missing tuition config',
  ];
  const body = rows.map((row) => [
    row.studentName,
    row.email,
    String(row.grade),
    row.classNames.join('; '),
    String(row.billableSessions),
    money.format(row.tuitionPerSession),
    money.format(row.amountDue),
    row.missingTuitionConfig ? 'YES' : 'NO',
  ]);
  return [header, ...body].map((line) => line.map(csvCell).join(',')).join('\n');
}

function csvCell(value: string) {
  return `"${value.replace(/"/g, '""')}"`;
}
