import { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { EnrollmentStatus, InvoiceStatus } from '@cp/shared';
import { cn } from '../cn';

type Tone = 'success' | 'warning' | 'error' | 'neutral' | 'info';

const TONE: Record<Tone, string> = {
  success:
    'bg-tertiary-container/30 text-tertiary border-tertiary-container/60',
  warning:
    'bg-tertiary-fixed-dim/40 text-on-tertiary-fixed-variant border-tertiary-fixed-dim/60',
  error: 'bg-error-container/60 text-on-error-container border-error/30',
  neutral:
    'bg-outline-variant/30 text-on-surface-variant border-outline-variant/60',
  info: 'bg-secondary-container/40 text-on-secondary-container border-secondary-container/60',
};

const ENROLLMENT_TONE: Record<EnrollmentStatus, Tone> = {
  [EnrollmentStatus.ACTIVE]: 'success',
  [EnrollmentStatus.PENDING]: 'warning',
  [EnrollmentStatus.INACTIVE]: 'neutral',
  [EnrollmentStatus.GRADUATED]: 'info',
};

const INVOICE_TONE: Record<InvoiceStatus, Tone> = {
  [InvoiceStatus.PAID]: 'success',
  [InvoiceStatus.OVERDUE]: 'error',
  [InvoiceStatus.PARTIAL]: 'warning',
  [InvoiceStatus.DRAFT]: 'neutral',
};

interface StatusBadgeProps {
  tone?: Tone;
  className?: string;
  children: ReactNode;
}

/**
 * Generic status pill. Pair with one of the helpers below for the typed
 * domain enums:
 *
 *   <EnrollmentStatusBadge status={row.status} />
 *   <InvoiceStatusBadge status={inv.status} />
 */
export function StatusBadge({ tone = 'neutral', className, children }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-xs px-md py-xs rounded-full text-[11px] font-bold tracking-wider uppercase border',
        TONE[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function EnrollmentStatusBadge({ status }: { status: EnrollmentStatus }) {
  const { t } = useTranslation();
  return <StatusBadge tone={ENROLLMENT_TONE[status]}>{t(`enums.enrollmentStatus.${status}`)}</StatusBadge>;
}

export function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  const { t } = useTranslation();
  return <StatusBadge tone={INVOICE_TONE[status]}>{t(`enums.invoiceStatus.${status}`)}</StatusBadge>;
}
