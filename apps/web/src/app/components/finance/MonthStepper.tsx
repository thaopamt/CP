import { Button, Icon } from '@cp/ui';

import { formatFinanceMonthLabel, shiftFinanceMonth } from '../../lib/finance-month';

interface MonthStepperProps {
  month: string;
  onChange: (month: string) => void;
  label: string;
  previousLabel: string;
  nextLabel: string;
}

export function MonthStepper({
  month,
  onChange,
  label,
  previousLabel,
  nextLabel,
}: MonthStepperProps) {
  return (
    <div className="flex items-center gap-sm text-label-sm text-on-surface-variant">
      <span>{label}</span>
      <div className="inline-flex h-10 items-center overflow-hidden rounded-lg border border-outline-variant bg-surface-container-low">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-full w-10 rounded-none px-0 py-0"
          onClick={() => onChange(shiftFinanceMonth(month, -1))}
          title={previousLabel}
          aria-label={previousLabel}
        >
          <Icon name="chevron_left" size={20} />
        </Button>
        <span className="min-w-[92px] px-sm text-center text-label-sm font-semibold text-on-surface">
          {formatFinanceMonthLabel(month)}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-full w-10 rounded-none px-0 py-0"
          onClick={() => onChange(shiftFinanceMonth(month, 1))}
          title={nextLabel}
          aria-label={nextLabel}
        >
          <Icon name="chevron_right" size={20} />
        </Button>
      </div>
    </div>
  );
}
