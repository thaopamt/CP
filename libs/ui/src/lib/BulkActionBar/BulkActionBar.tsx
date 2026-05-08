import { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '../cn';

interface BulkActionBarProps {
  /** Number of selected rows. Bar hides itself when 0. */
  count: number;
  /** Action buttons (e.g., Edit / Delete). */
  actions: ReactNode;
  /** Override the default "{{count}} selected" label */
  label?: ReactNode;
  className?: string;
}

/**
 * Header bar that appears above a DataTable when rows are selected.
 * Shows "{{count}} selected" + action buttons.
 */
export function BulkActionBar({ count, actions, label, className }: BulkActionBarProps) {
  const { t } = useTranslation();
  if (count === 0) return null;

  return (
    <div
      className={cn(
        'flex items-center justify-between px-md py-sm bg-primary-container/30 text-on-primary-container border-b border-primary-container',
        className,
      )}
    >
      <span className="text-label-sm font-semibold">
        {label ?? t('pages.admin.students.bulk.selected', { count })}
      </span>
      <div className="flex gap-sm">{actions}</div>
    </div>
  );
}
