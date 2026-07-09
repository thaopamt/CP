import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  TabPills,
  useToast,
} from '@cp/ui';
import {
  FINANCE_BILLING_STATUSES,
  FINANCE_COLLECTION_STATUSES,
  FinanceBillingStatus,
  FinanceCollectionStatus,
  IFinanceMonthlyRow,
} from '@cp/shared';

import { financeApi } from '../../api/finance.api';
import {
  useFinanceMonthlyReport,
  useResetFinanceMonthlyAmountDue,
  useSetFinanceMonthlyAmountDue,
  useSetFinanceMonthlyStatus,
} from '../../api/finance.queries';
import {
  buildTuitionInvoicePngBlob,
  buildTuitionInvoiceImageFilename,
} from './finance-invoice-print';

const PAGE_SIZE = 25;
type StatusFilter = 'all' | FinanceCollectionStatus;

function currentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function formatInvoiceMonth(month: string) {
  const [year, monthNumber] = month.split('-');
  if (!year || !monthNumber) return month;
  return `${monthNumber.padStart(2, '0')}/${year}`;
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
  const navigate = useNavigate();
  const toast = useToast();
  const locale = i18n.language === 'vi' ? 'vi-VN' : 'en-US';
  const [month, setMonth] = useState(currentMonth);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [exporting, setExporting] = useState(false);
  const [amountDrafts, setAmountDrafts] = useState<Record<string, string>>({});
  const [collectionStatusFilter, setCollectionStatusFilter] = useState<StatusFilter>('all');
  const [billingStatusFilter, setBillingStatusFilter] = useState<'all' | FinanceBillingStatus>('all');
  const [studentGroup, setStudentGroup] = useState<'center' | 'home'>('center');
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const deferredSearch = useDeferredValue(search.trim());
  const setMonthlyAmountDue = useSetFinanceMonthlyAmountDue();
  const resetMonthlyAmountDue = useResetFinanceMonthlyAmountDue();
  const setMonthlyStatus = useSetFinanceMonthlyStatus();
  const [downloadingInvoiceKeys, setDownloadingInvoiceKeys] = useState<Set<string>>(new Set());

  useEffect(() => {
    setPage(1);
    setSelectedKeys(new Set());
  }, [month, deferredSearch, collectionStatusFilter, billingStatusFilter, studentGroup]);

  const reportQuery = useFinanceMonthlyReport({
    month,
    search: deferredSearch || undefined,
    status: collectionStatusFilter === 'all' ? undefined : collectionStatusFilter,
    billingStatus: billingStatusFilter === 'all' ? undefined : billingStatusFilter,
    studentGroup,
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

  function toggleRow(key: string | number) {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      const strKey = String(key);
      if (next.has(strKey)) next.delete(strKey);
      else next.add(strKey);
      return next;
    });
  }

  function toggleAll() {
    if (!report?.rows) return;
    setSelectedKeys((prev) => {
      if (prev.size === report.rows.length) return new Set();
      return new Set(report.rows.map((r) => r.studentId));
    });
  }

  function handleMergeInvoices() {
    if (!report?.rows) return;
    const selectedRows = report.rows.filter((r) => selectedKeys.has(r.studentId));
    if (selectedRows.length === 0) return;
    sessionStorage.setItem('invoice_builder_merged', JSON.stringify({ rows: selectedRows, summary }));
    window.open(`/admin/finance/invoice/merged?month=${month}`, '_blank');
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

  async function handleDownloadDirectly(row: IFinanceMonthlyRow) {
    if (!summary) return;
    setDownloadingInvoiceKeys((prev) => new Set(prev).add(row.studentId));
    try {
      const overrides = {
        studentName: row.studentName,
        className: row.classNames.length > 0 ? row.classNames.join(', ') : `Khối ${row.grade}`,
        amountDue: row.amountDue,
        transferMemo: `HP ${row.studentName} ${formatInvoiceMonth(month)}`,
      };
      const invoiceStatus = row.collectionStatus === 'PAID' ? row.collectionStatus : 'PRINTED';
      const statusLabel = t(`pages.admin.finance.collectionStatus.${invoiceStatus}`);

      const blob = await buildTuitionInvoicePngBlob({
        row,
        month,
        from: formatDate(summary.from),
        to: formatDate(summary.to),
        issuedAt: formatDate(new Date()),
        money: money,
        status: statusLabel,
        overrides,
      });

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = buildTuitionInvoiceImageFilename(row, month);
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error((err as Error).message || t('pages.admin.finance.invoice.printFailed'));
    } finally {
      setDownloadingInvoiceKeys((prev) => {
        const next = new Set(prev);
        next.delete(row.studentId);
        return next;
      });
    }
  }

  const columns: Column<IFinanceMonthlyRow>[] = [
    {
      key: 'student',
      header: t('pages.admin.finance.columns.student'),
      align: 'left',
      cell: (row) => (
        <div className="w-[80px] min-w-0 text-left">
          <div className="truncate text-[13px] font-semibold text-on-surface" title={row.studentName}>{row.studentName}</div>
        </div>
      ),
    },
    {
      key: 'sessions',
      header: t('pages.admin.finance.columns.sessions', 'Số buổi'),
      align: 'center',
      cell: (row) => (
        <span className="text-on-surface text-[13px]">
          <span className="font-semibold">{row.billableSessions}</span>
          <span className="text-on-surface-variant"> / {row.scheduledSessions}</span>
        </span>
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
      key: 'parent',
      header: t('pages.admin.finance.columns.parent', 'Phụ huynh'),
      align: 'center',
      cell: (row) => (
        <div className="flex flex-col items-center text-[13px] leading-tight">
          {row.parentName ? (
            <>
              <span className="font-medium text-on-surface">{row.parentName}</span>
              {row.parentPhone && <span className="text-on-surface-variant text-[11px] mt-0.5">{row.parentPhone}</span>}
            </>
          ) : (
            <span className="text-on-surface-variant opacity-60">--</span>
          )}
        </div>
      ),
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
          className={`w-28 rounded-lg border px-2 py-1 text-center text-[13px] font-semibold outline-none transition focus:ring-2 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-60 ${row.hasAmountDueOverride
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
              className="w-32 rounded-lg border border-transparent bg-transparent px-2 py-1 text-center text-[13px] font-semibold text-on-surface outline-none transition hover:border-outline-variant hover:bg-surface-container-low focus:border-primary focus:bg-surface-container-low focus:ring-2 focus:ring-primary"
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
      cell: (row) => {
        const isDownloading = downloadingInvoiceKeys.has(row.studentId);
        return (
          <div className="flex items-center justify-center gap-xs">
            <Button
              variant="ghost"
              size="sm"
              title={t('pages.admin.finance.invoice.customize', 'Tuỳ chỉnh & In')}
              onClick={() => {
                sessionStorage.setItem(`invoice_builder_${row.studentId}`, JSON.stringify({ row, summary }));
                window.open(`/admin/finance/invoice/${row.studentId}?month=${month}`, '_blank');
              }}
              className="px-2"
            >
              <Icon name="tune" size={18} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              title={t('pages.admin.finance.invoice.download', 'Tải hoá đơn')}
              onClick={() => void handleDownloadDirectly(row)}
              disabled={isDownloading}
              className="px-2"
            >
              <Icon name={isDownloading ? "progress_activity" : "download"} size={18} className={isDownloading ? "animate-spin" : undefined} />
            </Button>
          </div>
        );
      },
    },
  ];


  async function exportCsv() {
    setExporting(true);
    try {
      const first = await financeApi.monthly({
        month,
        search: deferredSearch || undefined,
        status: collectionStatusFilter === 'all' ? undefined : collectionStatusFilter,
        billingStatus: billingStatusFilter === 'all' ? undefined : billingStatusFilter,
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
                billingStatus: billingStatusFilter === 'all' ? undefined : billingStatusFilter,
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
          <div className="flex items-center gap-sm">
            {selectedKeys.size > 0 && (
              <Button
                onClick={handleMergeInvoices}
                leadingIcon={<Icon name="call_merge" size={18} />}
              >
                {t('pages.admin.finance.mergeInvoices', `Tạo hoá đơn gộp (${selectedKeys.size})`)}
              </Button>
            )}
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
          </div>
        }
      />

      <section className="grid grid-cols-1 md:grid-cols-3 gap-sm">
        <StatCard
          label={t('pages.admin.finance.kpi.potentialDue')}
          value={money.format(summary?.totalPotentialAmount ?? 0)}
          icon="account_balance_wallet"
          iconColor="text-primary"
          valueClassName="text-[28px]"
        />
        <StatCard
          label={t('pages.admin.finance.kpi.totalDue')}
          value={money.format(summary?.totalAmountDue ?? 0)}
          icon="payments"
          iconColor="text-tertiary"
          valueClassName="text-[28px]"
        />
        <StatCard
          label={t('pages.admin.finance.kpi.outstandingDue')}
          value={money.format(summary?.totalOutstandingAmount ?? 0)}
          icon="pending_actions"
          iconColor="text-error"
          valueClassName="text-[28px]"
        />
      </section>

      <div className="flex justify-start">
        <TabPills
          options={[
            { value: 'center', label: 'Trung tâm' },
            { value: 'home', label: 'Tại nhà' },
          ]}
          value={studentGroup}
          onChange={setStudentGroup}
        />
      </div>

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
        <SelectFilter
          label={t('pages.admin.finance.filters.billingStatusLabel')}
          value={billingStatusFilter}
          onChange={(event) => setBillingStatusFilter(event.target.value as 'all' | FinanceBillingStatus)}
          options={[
            { value: 'all', label: t('pages.admin.finance.filters.statusAll') },
            ...FINANCE_BILLING_STATUSES.map((status) => ({
              value: status,
              label: t(`pages.admin.finance.status.${status}`),
            })),
          ]}
        />
      </FilterToolbar>

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
                selectable
                selectedKeys={selectedKeys}
                onToggleRow={toggleRow}
                onToggleAll={toggleAll}
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

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
