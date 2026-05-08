import { CSSProperties } from 'react';
import { cn } from '../cn';

interface IconProps {
  name: string;
  className?: string;
  filled?: boolean;
  size?: number;
}

/**
 * Material Symbols Outlined wrapper. The font is loaded once in styles.css
 * via the Google Fonts URL.
 */
export function Icon({ name, className, filled = false, size }: IconProps) {
  const style: CSSProperties = {
    fontVariationSettings: filled ? "'FILL' 1, 'wght' 500" : undefined,
    fontSize: size ? `${size}px` : undefined,
  };
  return (
    <span className={cn('material-symbols-outlined', className)} style={style}>
      {name}
    </span>
  );
}
