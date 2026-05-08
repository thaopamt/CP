import { ReactNode } from 'react';
import { cn } from '../cn';

interface FormFieldProps {
  label?: ReactNode;
  required?: boolean;
  hint?: ReactNode;
  error?: ReactNode;
  className?: string;
  children: ReactNode;
}

/**
 * Label + control + hint/error wrapper. Pair with native `<input>` or
 * the `SelectFilter`/`TagInput` primitives — keeps form rows visually
 * consistent across the wizard and other forms.
 */
export function FormField({ label, required, hint, error, className, children }: FormFieldProps) {
  return (
    <label className={cn('flex flex-col gap-xs', className)}>
      {label && (
        <span className="text-label-sm text-on-surface-variant">
          {label}
          {required && <span className="text-error ml-xs" aria-hidden>*</span>}
        </span>
      )}
      {children}
      {error ? (
        <span className="text-[12px] text-error">{error}</span>
      ) : hint ? (
        <span className="text-[12px] text-on-surface-variant">{hint}</span>
      ) : null}
    </label>
  );
}
