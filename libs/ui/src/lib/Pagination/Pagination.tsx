import { useTranslation } from 'react-i18next';
import { Icon } from '../Icon/Icon';
import { cn } from '../cn';

interface PaginationProps {
  /** 1-indexed current page */
  page: number;
  /** Total page count, ≥ 1 */
  pageCount: number;
  onChange: (page: number) => void;
  className?: string;
}

/**
 * Numbered pagination — shows up to 7 page buttons with ellipses for
 * larger ranges, plus prev/next. Stays compact on mobile.
 */
export function Pagination({ page, pageCount, onChange, className }: PaginationProps) {
  const { t } = useTranslation();
  if (pageCount <= 1) return null;

  const pages = pageRange(page, pageCount);

  return (
    <nav className={cn('flex items-center gap-xs', className)} aria-label={t('ui.pagination.label')}>
      <PageButton disabled={page === 1} onClick={() => onChange(page - 1)} aria-label={t('ui.pagination.previous')}>
        <Icon name="chevron_left" />
      </PageButton>

      {pages.map((p, idx) =>
        p === '…' ? (
          <span key={`gap-${idx}`} className="px-sm text-on-surface-variant">
            …
          </span>
        ) : (
          <PageButton key={p} active={p === page} onClick={() => onChange(p)}>
            {p}
          </PageButton>
        ),
      )}

      <PageButton disabled={page === pageCount} onClick={() => onChange(page + 1)} aria-label={t('ui.pagination.next')}>
        <Icon name="chevron_right" />
      </PageButton>
    </nav>
  );
}

function PageButton({
  children,
  active,
  disabled,
  onClick,
  ...rest
}: {
  children: React.ReactNode;
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      {...rest}
      className={cn(
        'min-w-[36px] h-9 grid place-items-center rounded-md text-label-sm font-medium transition-colors',
        active
          ? 'bg-primary text-on-primary'
          : 'text-on-surface-variant hover:bg-surface-container-highest',
        disabled && 'opacity-40 cursor-not-allowed hover:bg-transparent',
      )}
    >
      {children}
    </button>
  );
}

function pageRange(current: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const out: (number | '…')[] = [1];
  if (current > 3) out.push('…');
  for (let p = Math.max(2, current - 1); p <= Math.min(total - 1, current + 1); p++) out.push(p);
  if (current < total - 2) out.push('…');
  out.push(total);
  return out;
}
