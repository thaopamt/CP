import { ITestResult } from '@cp/shared';
import { Icon } from '../Icon/Icon';
import { cn } from '../cn';

interface TestResultRowProps {
  result: ITestResult;
  className?: string;
}

/**
 * One pass/fail row in the Coding Workspace test results panel.
 * Pass = green tinted, fail = red tinted; details render below.
 */
export function TestResultRow({ result, className }: TestResultRowProps) {
  return (
    <div
      className={cn(
        'flex items-start gap-sm p-sm rounded-md border',
        result.passed
          ? 'bg-tertiary-container/30 border-tertiary-container'
          : 'bg-error-container/40 border-error/40',
        className,
      )}
    >
      <span
        className={cn(
          'shrink-0 mt-0.5 w-5 h-5 rounded-full grid place-items-center',
          result.passed ? 'bg-tertiary text-on-tertiary' : 'bg-error text-on-error',
        )}
      >
        <Icon name={result.passed ? 'check' : 'close'} size={14} />
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-label-sm font-semibold text-on-surface truncate">{result.name}</div>
        {result.details && (
          <div className="text-[12px] text-on-surface-variant mt-xs">{result.details}</div>
        )}
      </div>
    </div>
  );
}
