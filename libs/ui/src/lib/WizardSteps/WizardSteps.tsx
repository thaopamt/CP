import { ReactNode } from 'react';
import { Icon } from '../Icon/Icon';
import { cn } from '../cn';

export interface WizardStep {
  key: string;
  label: ReactNode;
}

interface WizardStepsProps {
  steps: WizardStep[];
  /** 0-indexed current step */
  current: number;
  className?: string;
}

/**
 * Numbered step indicator used by the Class Create wizard. Renders a
 * line that fills proportionally to current step.
 */
export function WizardSteps({ steps, current, className }: WizardStepsProps) {
  const progressPct = steps.length > 1 ? (current / (steps.length - 1)) * 100 : 0;

  return (
    <div className={cn('relative w-full', className)} role="progressbar" aria-valuenow={current + 1} aria-valuemax={steps.length}>
      {/* Track */}
      <div className="absolute left-4 right-4 top-4 h-1 rounded-full bg-outline-variant" aria-hidden />
      <div
        className="absolute left-4 top-4 h-1 rounded-full bg-primary transition-all"
        style={{ width: `calc((100% - 32px) * ${progressPct / 100})` }}
        aria-hidden
      />

      <ol className="relative flex justify-between">
        {steps.map((step, i) => {
          const completed = i < current;
          const active = i === current;
          return (
            <li key={step.key} className="flex flex-col items-center gap-xs flex-1 min-w-0">
              <div
                className={cn(
                  'w-8 h-8 rounded-full grid place-items-center font-semibold text-label-sm border-2 transition-colors',
                  completed && 'bg-primary text-on-primary border-primary',
                  active && 'bg-primary-container text-on-primary-container border-primary',
                  !completed && !active && 'bg-surface-container-low text-on-surface-variant border-outline-variant',
                )}
              >
                {completed ? <Icon name="check" size={16} /> : i + 1}
              </div>
              <div
                className={cn(
                  'text-[12px] text-center max-w-[120px] truncate',
                  active ? 'text-on-surface font-semibold' : 'text-on-surface-variant',
                )}
              >
                {step.label}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
