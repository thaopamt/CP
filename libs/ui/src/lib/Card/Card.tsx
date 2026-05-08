import { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../cn';

type CardVariant = 'bordered' | 'warm' | 'glass';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  children: ReactNode;
}

const VARIANT: Record<CardVariant, string> = {
  // Admin: subtle 1px border, no shadow
  bordered:
    'bg-surface-container-lowest border border-outline-variant/50 rounded-xl shadow-elev-1 hover:shadow-elev-2 transition-shadow',
  // Teacher: clear header style + soft shadow
  warm: 'bg-surface-container-lowest rounded-xl shadow-elev-2',
  // Student: glassmorphism
  glass:
    'bg-surface/60 backdrop-blur-md border border-white/20 rounded-3xl shadow-elev-3',
};

export function Card({ variant = 'bordered', className, children, ...rest }: CardProps) {
  return (
    <div {...rest} className={cn(VARIANT[variant], className)}>
      {children}
    </div>
  );
}
