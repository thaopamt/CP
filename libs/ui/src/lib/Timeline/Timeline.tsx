import { ReactNode } from 'react';
import { Icon } from '../Icon/Icon';
import { cn } from '../cn';

type TimelineTone = 'primary' | 'secondary' | 'tertiary' | 'error' | 'neutral';

const DOT_TONE: Record<TimelineTone, string> = {
  primary: 'bg-primary-container text-primary',
  secondary: 'bg-secondary-container text-on-secondary-container',
  tertiary: 'bg-tertiary-container/50 text-tertiary',
  error: 'bg-error-container text-on-error-container',
  neutral: 'bg-surface-container-high text-on-surface-variant',
};

export interface TimelineItem {
  id: string;
  icon: string;
  tone?: TimelineTone;
  title: ReactNode;
  meta?: ReactNode;
  /** Right-aligned slot — typically a timestamp */
  time?: ReactNode;
}

interface TimelineProps {
  items: TimelineItem[];
  className?: string;
}

/**
 * Vertical activity timeline used by the Admin Dashboard "Recent Activities"
 * widget and Finance "Recent Activity" panel. Renders an SVG-free vertical
 * line via a single absolutely positioned column.
 */
export function Timeline({ items, className }: TimelineProps) {
  return (
    <ol className={cn('relative flex flex-col gap-md pl-md', className)}>
      {/* Vertical line */}
      <div className="absolute left-[14px] top-3 bottom-3 w-px bg-outline-variant" aria-hidden />

      {items.map((item) => (
        <li key={item.id} className="relative flex items-start gap-md">
          <div
            className={cn(
              'relative z-10 w-8 h-8 rounded-full grid place-items-center border-2 border-surface-container-lowest shrink-0 -ml-md',
              DOT_TONE[item.tone ?? 'primary'],
            )}
          >
            <Icon name={item.icon} size={16} />
          </div>
          <div className="flex-1 min-w-0 pt-1">
            <div className="text-body-md text-on-surface">{item.title}</div>
            {item.meta && <div className="text-label-sm text-on-surface-variant">{item.meta}</div>}
          </div>
          {item.time && (
            <div className="text-[12px] text-on-surface-variant pt-1 whitespace-nowrap">{item.time}</div>
          )}
        </li>
      ))}
    </ol>
  );
}
