import { cn } from '../cn';

interface AvatarProps {
  initials?: string;
  src?: string | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZE = {
  sm: 'w-8 h-8 text-[12px]',
  md: 'w-10 h-10 text-label-sm',
  lg: 'w-12 h-12 text-body-md',
};

export function Avatar({ initials, src, size = 'md', className }: AvatarProps) {
  if (src) {
    return (
      <img
        src={src}
        alt=""
        className={cn(
          'rounded-full object-cover border border-outline-variant/40',
          SIZE[size],
          className,
        )}
      />
    );
  }
  return (
    <div
      className={cn(
        'rounded-full bg-primary-container text-on-primary-container grid place-items-center font-bold border border-outline-variant/40',
        SIZE[size],
        className,
      )}
    >
      {initials ?? '·'}
    </div>
  );
}
