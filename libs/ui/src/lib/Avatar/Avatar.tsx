import { cn } from '../cn';

interface AvatarProps {
  initials?: string;
  src?: string | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  /**
   * 'circle' (default) crops a circular avatar (object-cover). 'rounded' shows
   * the full image uncropped in a rounded square (object-contain) — used for
   * full-body character avatars that a circle would clip.
   */
  shape?: 'circle' | 'rounded';
}

const SIZE = {
  sm: 'w-8 h-8 text-[12px]',
  md: 'w-10 h-10 text-label-sm',
  lg: 'w-12 h-12 text-body-md',
};

export function Avatar({ initials, src, size = 'md', className, shape = 'circle' }: AvatarProps) {
  const radius = shape === 'rounded' ? 'rounded-xl' : 'rounded-full';
  if (src) {
    return (
      <img
        src={src}
        alt=""
        className={cn(
          //   // radius,
          //   // Character avatars (rounded) render the image directly with no frame;
          //   // circular photo avatars keep a subtle ring.
          //   // shape === 'rounded' ? 'object-contain' : 'object-cover border border-outline-variant/40',
          SIZE[size],
          className,
        )}
      />
    );
  }
  return (
    <div
      className={cn(
        radius,
        'bg-primary-container text-on-primary-container grid place-items-center font-bold border border-outline-variant/40',
        SIZE[size],
        className,
      )}
    >
      {initials ?? '·'}
    </div>
  );
}
