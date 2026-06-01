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
  return (
    <div
      onClick={props.onClick}
      className={cn(
        'h-full rounded-lg border-l-4 px-sm py-xs flex flex-col gap-xs overflow-hidden shadow-elev-1 hover:shadow-elev-2 transition-shadow cursor-pointer',
        tone.bg,
        tone.ring,
        event.hasConflict && 'ring-2 ring-error',
        className,
      )}
    >
      <div className="flex items-start gap-xs">
        <h5 className={cn('text-label-sm font-bold flex-1 truncate', tone.text)}>{event.title}</h5>
        {event.hasConflict && (
          <Icon name="warning" size={16} className="text-error shrink-0" />
        )}
      </div>
      {event.isCustom && (
        <span className="w-fit px-xs py-[2px] rounded bg-tertiary-container/80 text-on-tertiary-container text-[9px] font-extrabold uppercase tracking-widest mt-[-2px]">
          Tuỳ chỉnh
        </span>
      )}
      <div className="text-[11px] text-on-surface-variant truncate mt-auto">{event.location}</div>
      <div className="text-[11px] text-on-surface mt-auto truncate">{event.teacherName}</div>
    </div>
  );
}
