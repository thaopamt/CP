import { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '../cn';

type Variant = 'admin' | 'teacher' | 'student' | 'ghost' | 'outline' | 'danger' | 'secondary';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
}

const VARIANT: Record<Variant, string> = {
  // Flat solid — Admin/Teacher Material 3 button
  admin: 'bg-primary text-white hover:brightness-95 active:scale-[0.98]',
  teacher: 'bg-primary text-white hover:brightness-95 active:scale-[0.98]',
  // 3D skeuomorphic — Student portal
  student:
    'bg-primary text-white shadow-btn-3d active:translate-y-[2px] active:shadow-none transition-transform',
  ghost: 'bg-transparent text-on-surface-variant hover:bg-surface-container-highest',
  outline:
    'bg-transparent border-2 border-outline-variant text-on-surface-variant hover:bg-surface-container-highest',
  danger: 'bg-error text-on-error hover:brightness-95 active:scale-[0.98]',
  secondary: 'bg-secondary text-on-secondary hover:brightness-95 active:scale-[0.98]',
};

const SIZE: Record<Size, string> = {
  sm: 'px-md py-xs text-[13px] rounded-md',
  md: 'px-lg py-sm text-label-sm rounded-lg',
  lg: 'px-lg py-md text-body-md rounded-xl',
};

export function Button({
  variant = 'admin',
  size = 'md',
  leadingIcon,
  trailingIcon,
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      {...rest}
      className={cn(
        'inline-flex items-center justify-center gap-sm font-semibold transition-all disabled:opacity-60 disabled:cursor-not-allowed',
        VARIANT[variant],
        SIZE[size],
        // Student portal also uses pill-shaped buttons
        variant === 'student' && 'rounded-full',
        className,
      )}
    >
      {leadingIcon}
      {children}
      {trailingIcon}
    </button>
  );
}
