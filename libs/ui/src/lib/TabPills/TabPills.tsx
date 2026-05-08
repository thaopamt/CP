import { ReactNode } from 'react';
import { cn } from '../cn';

interface TabOption<V extends string> {
  value: V;
  label: ReactNode;
  count?: number;
}

interface TabPillsProps<V extends string> {
  options: TabOption<V>[];
  value: V;
  onChange: (v: V) => void;
  className?: string;
}

/**
 * Generic horizontal pill tabs (used in Student Assignments tabs and
 * filter rows). Active pill uses primary-container, idle uses
 * surface-container with a subtle hover state.
 */
export function TabPills<V extends string>({ options, value, onChange, className }: TabPillsProps<V>) {
  return (
    <div className={cn('flex flex-wrap gap-sm', className)}>
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              'inline-flex items-center gap-xs px-md py-sm rounded-full border text-label-sm font-semibold transition-colors',
              active
                ? 'bg-primary-container text-on-primary-container border-primary'
                : 'bg-surface-container-low text-on-surface-variant border-outline-variant hover:bg-surface-container-high',
            )}
          >
            {opt.label}
            {opt.count != null && (
              <span
                className={cn(
                  'px-xs rounded-full text-[11px]',
                  active ? 'bg-on-primary-container/20' : 'bg-surface-container-high text-on-surface-variant',
                )}
              >
                {opt.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
