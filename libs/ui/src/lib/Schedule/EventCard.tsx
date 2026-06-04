import { IScheduleEvent, SubjectTrack } from '@cp/shared';
import { Icon } from '../Icon/Icon';
import { cn } from '../cn';

const TRACK_TONE: Record<SubjectTrack, { bg: string; ring: string; text: string }> = {
  [SubjectTrack.SCIENCE]: {
    bg: 'bg-secondary-container/60',
    ring: 'border-l-secondary',
    text: 'text-on-secondary-container',
  },
  [SubjectTrack.HUMANITIES]: {
    bg: 'bg-tertiary-container/40',
    ring: 'border-l-tertiary',
    text: 'text-tertiary',
  },
  [SubjectTrack.MATH]: {
    bg: 'bg-primary-container/40',
    ring: 'border-l-primary',
    text: 'text-primary',
  },
  [SubjectTrack.ARTS]: {
    bg: 'bg-error-container/40',
    ring: 'border-l-error',
    text: 'text-on-error-container',
  },
};

interface EventCardProps {
  event: IScheduleEvent;
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
}

/**
 * One scheduled session in the institutional timetable. Designed to be
 * placed inside a CSS-grid cell; absolute positioning is handled by the
 * parent calendar (so this is a "dumb" card).
 */
export function EventCard({ event, className, ...props }: EventCardProps) {
  const tone = TRACK_TONE[event.track];
  const interactive = !!props.onClick;
  return (
    <div
      onClick={props.onClick}
      className={cn(
        'h-full rounded-lg border-l-4 px-sm py-xs flex flex-col items-center justify-center gap-1 overflow-hidden shadow-elev-1 transition-shadow text-center',
        interactive && 'cursor-pointer hover:shadow-elev-2',
        tone.bg,
        tone.ring,
        event.isCancelled && 'opacity-60 grayscale',
        event.hasConflict && 'ring-2 ring-error',
        className,
      )}
    >
      <div className="flex items-center justify-center gap-xs w-full">
        <h5 className={cn('text-title-md leading-none font-extrabold tabular-nums', tone.text)}>{event.title}</h5>
        {event.hasConflict && (
          <Icon name="warning" size={16} className="text-error shrink-0" />
        )}
      </div>
      {event.location && (
        <div className="text-[10px] leading-tight text-on-surface-variant truncate">{event.location}</div>
      )}
      {event.isCancelled && (
        <div className="text-[10px] leading-tight font-semibold text-error truncate">Đã huỷ</div>
      )}
      {event.teacherName && (
        <div className="text-[11px] text-on-surface mt-auto truncate">{event.teacherName}</div>
      )}
    </div>
  );
}
