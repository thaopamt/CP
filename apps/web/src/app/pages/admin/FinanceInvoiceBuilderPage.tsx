import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button, Icon, PageHeader, useToast } from '@cp/ui';
import { IFinanceMonthlyRow } from '@cp/shared';

import {
  buildTuitionInvoiceHtml,
  buildTuitionInvoicePngBlob,
  buildTuitionInvoiceImageFilename,
} from './finance-invoice-print';

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

export default function FinanceInvoiceBuilderPage() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language === 'vi' ? 'vi-VN' : 'en-US';
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();
  const [searchParams] = useSearchParams();
  const { studentId } = useParams();
  
  const month = searchParams.get('month') || '';
  const state = useMemo(() => {
    if (location.state) return location.state as { row?: IFinanceMonthlyRow; rows?: IFinanceMonthlyRow[]; summary?: any };
    try {
      const stored = sessionStorage.getItem(`invoice_builder_${studentId || 'merged'}`);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      // ignore parse error
    }
    return null;
  }, [location.state, studentId]);
  
  const rows = useMemo(() => {
    if (state?.rows && state.rows.length > 0) return state.rows;
    if (state?.row) return [state.row];
    return [];
  }, [state]);
  const summary = state?.summary;

  useEffect(() => {
    if (rows.length === 0 || !month || !summary) {
      navigate('/admin/finance', { replace: true });
    }
  }, [rows, month, summary, navigate]);

  const moneyFormatter = useMemo(
    () =>
      new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: 'VND',
        maximumFractionDigits: 0,
      }),
    [locale],
  );

  const defaultStudentName = useMemo(() => rows.map((r) => r.studentName).join(', '), [rows]);
  const defaultClassName = useMemo(() => {
    const classes = new Set(rows.flatMap((r) => (r.classNames.length > 0 ? r.classNames : [`Khối ${r.grade}`])));
    return Array.from(classes).join(', ');
  }, [rows]);
  const baseAmount = useMemo(() => rows.reduce((sum, r) => sum + (r.amountDue || 0), 0), [rows]);

  const [monthsCount, setMonthsCount] = useState(1);
  const [studentName, setStudentName] = useState(defaultStudentName);
  const [className, setClassName] = useState(defaultClassName);
  const [amountDue, setAmountDue] = useState(String(baseAmount));
  const [transferMemo, setTransferMemo] = useState(`HP ${defaultStudentName} ${formatInvoiceMonth(month)}`);

  // Update defaults when monthsCount changes (only for amount and memo)
  useEffect(() => {
    setAmountDue(String(baseAmount * monthsCount));
    const extraMonths = monthsCount > 1 ? ` va ${monthsCount - 1} thang tiep theo` : '';
    setTransferMemo(`HP ${defaultStudentName} ${formatInvoiceMonth(month)}${extraMonths}`);
  }, [monthsCount, baseAmount, defaultStudentName, month]);

  const [previewHtml, setPreviewHtml] = useState<string>('');
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    if (rows.length === 0 || !summary) return;
    
    // Generate the HTML preview
    const generatePreview = async () => {
      try {
        const overrides = {
          studentName,
          className,
          amountDue: Number(amountDue.replace(/\D/g, '')) || 0,
          transferMemo,
        };

        const primaryRow = rows[0];
        const invoiceStatus = primaryRow.collectionStatus === 'PAID' ? primaryRow.collectionStatus : 'PRINTED';
        const statusLabel = t(`pages.admin.finance.collectionStatus.${invoiceStatus}`);

        const html = buildTuitionInvoiceHtml({
          row: primaryRow,
          month,
          from: formatDate(summary.from),
          to: formatDate(summary.to),
          issuedAt: formatDate(new Date()),
          money: moneyFormatter,
          status: statusLabel,
          overrides,
        });
        setPreviewHtml(html);
      } catch (err) {
        console.error(err);
      }
    };

    const timeout = setTimeout(generatePreview, 300);
    return () => clearTimeout(timeout);
  }, [rows, summary, month, studentName, className, amountDue, transferMemo, moneyFormatter, t]);

  if (rows.length === 0) return null;

  async function handleDownload() {
    if (rows.length === 0 || !summary) return;
    setIsExporting(true);
    try {
      const overrides = {
        studentName,
        className,
        amountDue: Number(amountDue.replace(/\D/g, '')) || 0,
        transferMemo,
      };

      const primaryRow = rows[0];
      const invoiceStatus = primaryRow.collectionStatus === 'PAID' ? primaryRow.collectionStatus : 'PRINTED';
      const statusLabel = t(`pages.admin.finance.collectionStatus.${invoiceStatus}`);

      const blob = await buildTuitionInvoicePngBlob({
        row: primaryRow,
        month,
        from: formatDate(summary.from),
        to: formatDate(summary.to),
        issuedAt: formatDate(new Date()),
        money: moneyFormatter,
        status: statusLabel,
        overrides,
      });

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = buildTuitionInvoiceImageFilename(primaryRow, month);
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error((err as Error).message || t('pages.admin.finance.invoice.printFailed'));
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div className="flex h-full flex-col gap-lg">
      <PageHeader
        title={t('pages.admin.finance.invoiceBuilderTitle', 'Tuỳ chỉnh Hoá Đơn')}
        subtitle={t('pages.admin.finance.invoiceBuilderSubtitle', 'Tuỳ chỉnh thông tin và in hoá đơn cho học viên')}
        actions={
          <div className="flex gap-sm">
            <Button
              variant="outlined"
              onClick={() => navigate(-1)}
              leadingIcon={<Icon name="arrow_back" size={18} />}
            >
              {t('common.back', 'Trở lại')}
            </Button>
            <Button
              leadingIcon={
                <Icon
                  name={isExporting ? 'progress_activity' : 'download'}
                  size={18}
                  className={isExporting ? 'animate-spin' : undefined}
                />
              }
              onClick={() => void handleDownload()}
              disabled={isExporting}
            >
              {t('common.download', 'Tải xuống')}
            </Button>
          </div>
        }
      />

      <div className="grid flex-1 grid-cols-1 lg:grid-cols-[400px_1fr] gap-lg items-start">
        {/* Form Column */}
        <div className="flex flex-col gap-md rounded-xl border border-outline-variant/50 bg-surface-container-lowest p-md shadow-elev-1">
          <h3 className="text-title-md font-semibold text-on-surface">Thông tin in hoá đơn</h3>
          
          <label className="flex flex-col gap-xs">
            <span className="text-label-sm font-semibold text-on-surface-variant">Tên học sinh</span>
            <input
              type="text"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              className="rounded-lg border border-outline-variant bg-surface-container-low px-md py-sm text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </label>

          <label className="flex flex-col gap-xs">
            <span className="text-label-sm font-semibold text-on-surface-variant">Lớp</span>
            <input
              type="text"
              value={className}
              onChange={(e) => setClassName(e.target.value)}
              className="rounded-lg border border-outline-variant bg-surface-container-low px-md py-sm text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </label>

          <label className="flex flex-col gap-xs">
            <span className="text-label-sm font-semibold text-on-surface-variant">Số tháng thanh toán</span>
            <input
              type="number"
              min={1}
              max={12}
              value={monthsCount}
              onChange={(e) => setMonthsCount(Math.max(1, parseInt(e.target.value) || 1))}
              className="rounded-lg border border-outline-variant bg-surface-container-low px-md py-sm text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </label>

          <label className="flex flex-col gap-xs">
            <span className="text-label-sm font-semibold text-on-surface-variant">Số tiền</span>
            <input
              type="text"
              value={amountDue}
              onChange={(e) => setAmountDue(e.target.value)}
              className="rounded-lg border border-outline-variant bg-surface-container-low px-md py-sm text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </label>

          <label className="flex flex-col gap-xs">
            <span className="text-label-sm font-semibold text-on-surface-variant">Nội dung chuyển khoản</span>
            <textarea
              rows={2}
              value={transferMemo}
              onChange={(e) => setTransferMemo(e.target.value)}
              className="rounded-lg border border-outline-variant bg-surface-container-low px-md py-sm text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none"
            />
            <span className="text-label-sm text-on-surface-variant/70">
              * Nội dung này sẽ được nhúng vào mã QR chuyển khoản.
            </span>
          </label>
        </div>

        {/* Preview Column */}
        <div className="flex h-full min-h-[600px] flex-col overflow-hidden rounded-xl border border-outline-variant/50 bg-surface-container-lowest shadow-elev-1">
          <div className="border-b border-outline-variant/30 bg-surface-bright px-md py-sm">
            <h3 className="text-title-sm font-semibold text-on-surface">Bản xem trước (Preview)</h3>
          </div>
          <div className="flex-1 bg-surface-container-low p-md">
            {previewHtml ? (
              <iframe
                title="Invoice Preview"
                srcDoc={previewHtml}
                className="h-full w-full rounded-lg border-0 shadow-sm"
                style={{ backgroundColor: '#ffffff' }}
              />
            ) : (
              <div className="flex h-full items-center justify-center text-on-surface-variant">
                <Icon name="progress_activity" size={32} className="animate-spin" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
