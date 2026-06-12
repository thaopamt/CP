import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Avatar,
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

function formatDate(value: string | Date) {
  const date =
    typeof value === 'string'
      ? new Date(`${value.slice(0, 10)}T00:00:00`)
      : value;
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
  const getBillingStatus = (row: IFinanceMonthlyRow) =>
    row.billingStatus ?? (row.missingTuitionConfig ? 'MISSING_TUITION' : 'READY');
  const getBillingStatusLabel = (row: IFinanceMonthlyRow) =>
    t(`pages.admin.finance.status.${getBillingStatus(row)}`);
  const statusMeta = (row: IFinanceMonthlyRow) => {
    const status = getBillingStatus(row);
    const meta = {
      READY: {
        icon: 'receipt_long',
        className: 'bg-tertiary-container/40 text-tertiary',
      },
      MISSING_TUITION: {
        icon: 'error',
        className: 'bg-error-container/50 text-error',
      },
      NO_SCHEDULE: {
        icon: 'event_busy',
        className: 'bg-secondary-container/50 text-on-secondary-container',
      },
      NO_BILLABLE: {
        icon: 'pending_actions',
        className: 'bg-outline-variant/40 text-on-surface-variant',
      },
    } satisfies Record<string, { icon: string; className: string }>;
    return meta[status];
  };

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
        <span className={row.missingTuitionConfig ? 'font-semibold text-error' : 'text-on-surface'}>
          {money.format(row.monthlyTuition)}
        </span>
      ),
    },
    {
      key: 'rate',
      header: t('pages.admin.finance.columns.sessionRate'),
      align: 'center',
      cell: (row) => (
        <span className="text-on-surface-variant">
          {money.format(row.tuitionPerSession)}
        </span>
      ),
    },
    {
      key: 'amount',
      header: t('pages.admin.finance.columns.amount'),
      align: 'center',
      cell: (row) => <span className="font-bold text-on-surface">{money.format(row.amountDue)}</span>,
    },
    {
      key: 'status',
      header: t('pages.admin.finance.columns.status'),
      align: 'center',
      cell: (row) => {
        const meta = statusMeta(row);
        return (
          <span className={`inline-flex items-center gap-xs rounded-full px-sm py-1 text-[11px] font-semibold ${meta.className}`}>
            <Icon name={meta.icon} size={14} />
            {getBillingStatusLabel(row)}
          </span>
        );
      },
    },
    {
      key: 'invoice',
      header: t('pages.admin.finance.columns.invoice'),
      align: 'center',
      cell: (row) => (
        <Button
          variant="ghost"
          size="sm"
          leadingIcon={<Icon name="print" size={16} />}
          onClick={() => printInvoice(row)}
        >
          {t('pages.admin.finance.invoice.print')}
        </Button>
      ),
    },
  ];

  function printInvoice(row: IFinanceMonthlyRow) {
    if (!summary) {
      toast.error(t('pages.admin.finance.invoice.printFailed'));
      return;
    }

    const invoiceWindow = window.open('', '_blank', 'width=900,height=720');
    if (!invoiceWindow) {
      toast.error(t('pages.admin.finance.invoice.popupBlocked'));
      return;
    }

    const html = buildInvoiceHtml({
      row,
      month,
      from: formatDate(summary.from),
      to: formatDate(summary.to),
      issuedAt: formatDate(new Date()),
      money,
      status: getBillingStatusLabel(row),
      t,
    });
    invoiceWindow.document.open();
    invoiceWindow.document.write(html);
    invoiceWindow.document.close();
    invoiceWindow.focus();
    invoiceWindow.setTimeout(() => {
      invoiceWindow.print();
    }, 250);
  }

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
      const csv = toCsv(rows, money, getBillingStatusLabel);
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

      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-md">
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

function toCsv(
  rows: IFinanceMonthlyRow[],
  money: Intl.NumberFormat,
  statusLabel: (row: IFinanceMonthlyRow) => string,
) {
  const header = [
    'Student',
    'Grade',
    'Scheduled sessions',
    'Billable sessions',
    'Monthly tuition',
    'Derived tuition per session',
    'Amount due',
    'Billing status',
  ];
  const body = rows.map((row) => [
    row.studentName,
    String(row.grade),
    String(row.scheduledSessions),
    String(row.billableSessions),
    money.format(row.monthlyTuition),
    money.format(row.tuitionPerSession),
    money.format(row.amountDue),
    statusLabel(row),
  ]);
  return [header, ...body].map((line) => line.map(csvCell).join(',')).join('\n');
}

function csvCell(value: string) {
  return `"${value.replace(/"/g, '""')}"`;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildInvoiceHtml({
  row,
  month,
  from,
  to,
  issuedAt,
  money,
  status,
  t,
}: {
  row: IFinanceMonthlyRow;
  month: string;
  from: string;
  to: string;
  issuedAt: string;
  money: Intl.NumberFormat;
  status: string;
  t: (key: string, options?: Record<string, unknown>) => string;
}) {
  const invoiceNo = `FIN-${month}-${row.profileId.slice(0, 8).toUpperCase()}`;
  const lines = [
    [t('pages.admin.finance.invoice.fields.period'), `${from} - ${to}`],
    [t('pages.admin.finance.invoice.fields.student'), row.studentName],
    [t('pages.admin.finance.invoice.fields.grade'), String(row.grade)],
    [t('pages.admin.finance.invoice.fields.classes'), row.classNames.join(', ') || t('common.none')],
    [t('pages.admin.finance.invoice.fields.scheduledSessions'), String(row.scheduledSessions)],
    [t('pages.admin.finance.invoice.fields.billableSessions'), String(row.billableSessions)],
    [t('pages.admin.finance.invoice.fields.monthlyTuition'), money.format(row.monthlyTuition)],
    [t('pages.admin.finance.invoice.fields.sessionRate'), money.format(row.tuitionPerSession)],
  ];

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(t('pages.admin.finance.invoice.title'))} ${escapeHtml(invoiceNo)}</title>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; padding: 32px; font-family: Inter, Arial, sans-serif; color: #1f2937; background: #f8fafc; }
    .invoice { max-width: 760px; margin: 0 auto; background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 32px; }
    .top { display: flex; justify-content: space-between; gap: 24px; border-bottom: 2px solid #111827; padding-bottom: 20px; }
    .brand { font-size: 24px; font-weight: 800; letter-spacing: .02em; }
    .muted { color: #6b7280; font-size: 13px; }
    .title { text-align: right; }
    .title h1 { margin: 0 0 8px; font-size: 28px; }
    .badge { display: inline-flex; padding: 6px 10px; border-radius: 999px; background: #ecfdf5; color: #047857; font-size: 12px; font-weight: 700; }
    .section { margin-top: 24px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px 24px; }
    .item { display: flex; justify-content: space-between; gap: 16px; border-bottom: 1px solid #f1f5f9; padding: 10px 0; }
    .label { color: #64748b; }
    .value { font-weight: 700; text-align: right; }
    .total { margin-top: 24px; padding: 20px; border-radius: 10px; background: #111827; color: white; display: flex; justify-content: space-between; align-items: center; }
    .total .amount { font-size: 28px; font-weight: 900; }
    .note { margin-top: 20px; font-size: 12px; color: #64748b; line-height: 1.5; }
    @media print {
      body { background: #fff; padding: 0; }
      .invoice { border: none; border-radius: 0; max-width: none; }
    }
  </style>
</head>
<body>
  <main class="invoice">
    <section class="top">
      <div>
        <div class="brand">Zenith</div>
        <div class="muted">${escapeHtml(t('brand.adminPortal'))}</div>
        <div class="muted">${escapeHtml(t('pages.admin.finance.invoice.issuedAt'))}: ${escapeHtml(issuedAt)}</div>
      </div>
      <div class="title">
        <h1>${escapeHtml(t('pages.admin.finance.invoice.title'))}</h1>
        <div class="muted">#${escapeHtml(invoiceNo)}</div>
        <div class="badge">${escapeHtml(status)}</div>
      </div>
    </section>

    <section class="section grid">
      ${lines
        .map(
          ([label, value]) => `<div class="item"><span class="label">${escapeHtml(label)}</span><span class="value">${escapeHtml(value)}</span></div>`,
        )
        .join('')}
    </section>

    <section class="total">
      <div>
        <div class="muted">${escapeHtml(t('pages.admin.finance.invoice.fields.amountDue'))}</div>
        <div>${escapeHtml(t('pages.admin.finance.invoice.fields.status'))}: ${escapeHtml(status)}</div>
      </div>
      <div class="amount">${escapeHtml(money.format(row.amountDue))}</div>
    </section>

    <p class="note">${escapeHtml(t('pages.admin.finance.invoice.note'))}</p>
  </main>
</body>
</html>`;
}
