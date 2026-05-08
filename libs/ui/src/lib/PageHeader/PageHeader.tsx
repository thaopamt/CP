import { ReactNode } from 'react';
import { cn } from '../cn';

interface PageHeaderProps {
  /** Optional breadcrumb row above the title — pass <Breadcrumb /> */
  breadcrumb?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  /** Right-side action buttons / toggles */
  actions?: ReactNode;
  /** Optional eyebrow chip or label rendered above title (e.g. status badge) */
  eyebrow?: ReactNode;
  className?: string;
}

/**
 * Cross-portal page header. Replaces the repeated JSX:
 *
 *   <header className="flex flex-col sm:flex-row …">
 *     <div>
 *       <h2 className="font-manrope text-headline-lg …">{title}</h2>
 *       <p className="text-body-md …">{subtitle}</p>
 *     </div>
 *     <div>{actions}</div>
 *   </header>
 *
 * Used by Admin Dashboard, Students, Schedule, Finance, Teacher Dashboard,
 * Attendance, Monitoring, Student Assignments, etc.
 */
export function PageHeader({
  breadcrumb,
  title,
  subtitle,
  actions,
  eyebrow,
  className,
}: PageHeaderProps) {
  return (
    <header className={cn('flex flex-col gap-sm', className)}>
      {breadcrumb}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-md">
        <div className="min-w-0">
          {eyebrow && <div className="mb-xs">{eyebrow}</div>}
          <h2 className="font-manrope text-headline-lg text-on-surface">{title}</h2>
          {subtitle && (
            <p className="text-body-md text-on-surface-variant mt-xs">{subtitle}</p>
          )}
        </div>
        {actions && <div className="flex flex-wrap gap-sm shrink-0">{actions}</div>}
      </div>
    </header>
  );
}
