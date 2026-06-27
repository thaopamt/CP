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
  SelectFilter,
  StatCard,
  useToast,
} from '@cp/ui';
import { FINANCE_COLLECTION_STATUSES, FinanceCollectionStatus, IFinanceMonthlyRow } from '@cp/shared';

import { financeApi } from '../../api/finance.api';
import {
  useFinanceMonthlyReport,
  useResetFinanceMonthlyAmountDue,
  useSetFinanceMonthlyAmountDue,
  useSetFinanceMonthlyStatus,
} from '../../api/finance.queries';

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

function normalizeAmountInput(value: string) {
  return value.replace(/\D/g, '');
}

function formatAmountInput(value: string, formatter: Intl.NumberFormat) {
  const normalized = normalizeAmountInput(value);
  if (!normalized) return '';

  const amount = Number(normalized);
  if (!Number.isSafeInteger(amount)) return normalized;

  return formatter.format(amount);
}

export default function AdminFinancePage() {
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const locale = i18n.language === 'vi' ? 'vi-VN' : 'en-US';
  const [month, setMonth] = useState(currentMonth);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [exporting, setExporting] = useState(false);
  const [amountDrafts, setAmountDrafts] = useState<Record<string, string>>({});
  const [collectionStatusFilter, setCollectionStatusFilter] = useState<StatusFilter>('all');
  const deferredSearch = useDeferredValue(search.trim());
  const setMonthlyAmountDue = useSetFinanceMonthlyAmountDue();
  const resetMonthlyAmountDue = useResetFinanceMonthlyAmountDue();
  const setMonthlyStatus = useSetFinanceMonthlyStatus();

  useEffect(() => {
    setPage(1);
  }, [month, deferredSearch, collectionStatusFilter]);

  const reportQuery = useFinanceMonthlyReport({
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
  const amountBusy = setMonthlyAmountDue.isPending || resetMonthlyAmountDue.isPending;

  function amountDraftValue(row: IFinanceMonthlyRow) {
    return amountDrafts[row.studentId] ?? String(row.amountDue);
  }

  function setAmountDraft(row: IFinanceMonthlyRow, value: string) {
    setAmountDrafts((prev) => ({
      ...prev,
      [row.studentId]: normalizeAmountInput(value),
    }));
  }

  function clearAmountDraft(row: IFinanceMonthlyRow) {
    setAmountDrafts((prev) => {
      const next = { ...prev };
      delete next[row.studentId];
      return next;
    });
  }

  async function commitAmountDue(row: IFinanceMonthlyRow) {
    const raw = normalizeAmountInput(amountDraftValue(row));
    if (raw === '') {
      if (row.hasAmountDueOverride) {
        try {
          await resetMonthlyAmountDue.mutateAsync({ studentId: row.studentId, month });
          toast.success(t('pages.admin.finance.amountDue.reset'));
        } catch (err) {
          toast.error((err as Error).message || t('pages.admin.finance.amountDue.resetFailed'));
          return;
        }
      }
      clearAmountDraft(row);
      return;
    }

    const amountDue = Number(raw);
    if (!Number.isSafeInteger(amountDue) || amountDue < 0) {
      toast.error(t('pages.admin.finance.amountDue.invalidAmount'));
      return;
    }

    try {
      const roundedAmount = Math.round(amountDue);
      if (roundedAmount === row.calculatedAmountDue) {
        if (row.hasAmountDueOverride) {
          await resetMonthlyAmountDue.mutateAsync({ studentId: row.studentId, month });
          toast.success(t('pages.admin.finance.amountDue.reset'));
        }
      } else if (roundedAmount !== row.amountDue || !row.hasAmountDueOverride) {
        await setMonthlyAmountDue.mutateAsync({
          studentId: row.studentId,
          month,
          amountDue: roundedAmount,
        });
        toast.success(t('pages.admin.finance.amountDue.saved'));
      }
      clearAmountDraft(row);
    } catch (err) {
      toast.error((err as Error).message || t('pages.admin.finance.amountDue.saveFailed'));
    }
  }

  async function updateCollectionStatus(row: IFinanceMonthlyRow, status: FinanceCollectionStatus) {
    if (status === row.collectionStatus) return;
    try {
      await setMonthlyStatus.mutateAsync({ studentId: row.studentId, month, status });
      toast.success(t('pages.admin.finance.collectionStatusSaved'));
    } catch (err) {
      toast.error((err as Error).message || t('pages.admin.finance.collectionStatusSaveFailed'));
    }
  }

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
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          placeholder={money.format(0)}
          value={formatAmountInput(amountDraftValue(row), money)}
          onChange={(event) => setAmountDraft(row, event.target.value)}
          onBlur={() => void commitAmountDue(row)}
          onFocus={(event) => event.currentTarget.select()}
          onKeyDown={(event) => {
            if (event.key === 'Enter') event.currentTarget.blur();
            if (event.key === 'Escape') {
              clearAmountDraft(row);
            }
          }}
          disabled={amountBusy}
          className={`w-36 rounded-lg border px-sm py-xs text-center text-label-sm font-semibold outline-none transition focus:ring-2 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-60 ${
            row.hasAmountDueOverride
              ? 'border-primary/70 bg-primary-container/10 text-on-surface'
              : 'border-transparent bg-transparent text-on-surface hover:border-outline-variant hover:bg-surface-container-low focus:border-primary focus:bg-surface-container-low'
          }`}
          aria-label={t('pages.admin.finance.amountDue.inputLabel')}
          title={row.hasAmountDueOverride ? t('pages.admin.finance.amountDue.overrideTitle') : undefined}
        />
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
            <select
              value={row.collectionStatus}
              onChange={(event) =>
                void updateCollectionStatus(row, event.target.value as FinanceCollectionStatus)
              }
              className="w-40 rounded-lg border border-transparent bg-transparent px-sm py-xs text-center text-label-sm font-semibold text-on-surface outline-none transition hover:border-outline-variant hover:bg-surface-container-low focus:border-primary focus:bg-surface-container-low focus:ring-2 focus:ring-primary"
              aria-label={t('pages.admin.finance.collectionStatusInputLabel')}
            >
              {FINANCE_COLLECTION_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {getCollectionStatusLabel(status)}
                </option>
              ))}
            </select>
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

    const invoiceStatus = row.collectionStatus === 'PAID' ? row.collectionStatus : 'PRINTED';
    const html = buildInvoiceHtml({
      row,
      month,
      from: formatDate(summary.from),
      to: formatDate(summary.to),
      issuedAt: formatDate(new Date()),
      money,
      status: getCollectionStatusLabel(invoiceStatus),
      t,
    });
    invoiceWindow.document.open();
    invoiceWindow.document.write(html);
    invoiceWindow.document.close();
    invoiceWindow.focus();
    invoiceWindow.setTimeout(() => {
      invoiceWindow.print();
    }, 250);

    if (invoiceStatus !== row.collectionStatus) {
      void setMonthlyStatus
        .mutateAsync({ studentId: row.studentId, month, status: invoiceStatus })
        .catch((err) => {
          toast.error((err as Error).message || t('pages.admin.finance.collectionStatusSaveFailed'));
        });
    }
  }

  async function exportCsv() {
    setExporting(true);
    try {
      const first = await financeApi.monthly({
        month,
        search: deferredSearch || undefined,
        status: collectionStatusFilter === 'all' ? undefined : collectionStatusFilter,
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
                  status: collectionStatusFilter === 'all' ? undefined : collectionStatusFilter,
                  page: index + 2,
                  limit: 100,
                }),
              ),
            )
          : [];
      const rows = [first, ...rest].flatMap((r) => r.rows);
      const csv = toCsv(rows, money, getCollectionStatusLabel, getBillingStatusLabel);
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
            leadingIcon={
              <Icon
                name={exporting ? 'progress_activity' : 'ios_share'}
                size={18}
                className={exporting ? 'animate-spin' : undefined}
              />
            }
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

      <section className="grid grid-cols-1 md:grid-cols-2 gap-md">
        <StatCard
          label={t('pages.admin.finance.kpi.potentialDue')}
          value={money.format(summary?.totalPotentialAmount ?? 0)}
          icon="account_balance_wallet"
          iconColor="text-primary"
        />
        <StatCard
          label={t('pages.admin.finance.kpi.monthlyPotentialDue')}
          value={money.format(summary?.totalAmountDue ?? 0)}
          icon="calendar_month"
          iconColor="text-primary"
        />
        <StatCard
          label={t('pages.admin.finance.kpi.centerPotential')}
          value={money.format(summary?.centerPotentialAmount ?? 0)}
          icon="apartment"
          iconColor="text-tertiary"
        />
        <StatCard
          label={t('pages.admin.finance.kpi.centerPotentialDue')}
          value={money.format(summary?.centerAmountDue ?? 0)}
          icon="apartment"
          iconColor="text-tertiary"
        />
        <StatCard
          label={t('pages.admin.finance.kpi.homePotential')}
          value={money.format(summary?.homePotentialAmount ?? 0)}
          icon="home"
          iconColor="text-secondary"
        />
        <StatCard
          label={t('pages.admin.finance.kpi.homePotentialDue')}
          value={money.format(summary?.homeAmountDue ?? 0)}
          icon="home"
          iconColor="text-secondary"
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

function toCsv(
  rows: IFinanceMonthlyRow[],
  money: Intl.NumberFormat,
  collectionStatusLabel: (status: FinanceCollectionStatus) => string,
  billingStatusLabel: (row: IFinanceMonthlyRow) => string,
) {
  const header = [
    'Student',
    'Grade',
    'Scheduled sessions',
    'Billable sessions',
    'Monthly tuition',
    'Derived tuition per session',
    'Calculated amount due',
    'Amount due',
    'Collection status',
    'Billing status',
  ];
  const body = rows.map((row) => [
    row.studentName,
    String(row.grade),
    String(row.scheduledSessions),
    String(row.billableSessions),
    money.format(row.monthlyTuition),
    money.format(row.tuitionPerSession),
    money.format(row.calculatedAmountDue),
    money.format(row.amountDue),
    collectionStatusLabel(row.collectionStatus),
    billingStatusLabel(row),
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
    ...(row.hasAmountDueOverride
      ? [[t('pages.admin.finance.invoice.fields.calculatedAmountDue'), money.format(row.calculatedAmountDue)]]
      : []),
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
          ([label, value]) =>
            `<div class="item"><span class="label">${escapeHtml(label)}</span><span class="value">${escapeHtml(value)}</span></div>`,
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
