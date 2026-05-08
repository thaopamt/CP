import { Fragment, ReactNode } from 'react';
import { Icon } from '../Icon/Icon';
import { cn } from '../cn';

export interface BreadcrumbItem {
  label: ReactNode;
  /** Optional onClick to make the crumb interactive */
  onClick?: () => void;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

/**
 * Inline breadcrumb row used by deep-link pages (Course Builder,
 * Attendance per-class view, etc.). The last item is rendered as the
 * current page (bold, non-interactive).
 */
export function Breadcrumb({ items, className }: BreadcrumbProps) {
  return (
    <nav
      className={cn('flex items-center gap-xs text-label-sm text-on-surface-variant', className)}
      aria-label="Breadcrumb"
    >
      {items.map((item, idx) => {
        const isLast = idx === items.length - 1;
        return (
          <Fragment key={idx}>
            {item.onClick && !isLast ? (
              <button
                type="button"
                onClick={item.onClick}
                className="hover:text-primary cursor-pointer"
              >
                {item.label}
              </button>
            ) : (
              <span className={isLast ? 'text-on-surface font-semibold' : ''}>{item.label}</span>
            )}
            {!isLast && <Icon name="chevron_right" size={16} />}
          </Fragment>
        );
      })}
    </nav>
  );
}
