import { IScheduleEvent } from '@cp/shared';
import { EventCard } from './EventCard';
import { cn } from '../cn';

interface WeekGridProps {
  /** ISO short labels per day, length must equal `daysCount`. e.g. ["Mon 14", "Tue 15", …] */
  dayLabels: string[];
  /** Index 0..daysCount-1 of the column to highlight (today). -1 to disable. */
  todayIndex?: number;
  /** Minutes since 00:00 for the first time slot, e.g. 480 = 08:00 */
  startMinutes?: number;
  /** Minutes since 00:00 for the last time slot, e.g. 900 = 15:00 */
  endMinutes?: number;
  /** Slot height in px */
  slotPx?: number;
  events: IScheduleEvent[];
  className?: string;
}

/**
 * Custom CSS-grid weekly calendar. Time column on the left, one column
 * per day across, events absolutely-positioned within each day column
 * by the parent (we compute offsets from `event.startMinutes`).
 */
export function WeekGrid({
  dayLabels,
  todayIndex = -1,
  startMinutes = 480, // 08:00
  endMinutes = 900,   // 15:00
  slotPx = 80,
  events,
  className,
}: WeekGridProps) {
  const daysCount = dayLabels.length;
  const slots: number[] = [];
  for (let m = startMinutes; m <= endMinutes; m += 60) slots.push(m);
  const totalMinutes = endMinutes - startMinutes;
  const totalPx = (totalMinutes / 60) * slotPx;

  return (
    <div
      className={cn('w-full overflow-x-auto bg-surface-container-lowest rounded-xl border border-outline-variant/50', className)}
    >
      <div
        className="grid"
        style={{
          gridTemplateColumns: `80px repeat(${daysCount}, minmax(120px, 1fr))`,
          minWidth: `${80 + daysCount * 120}px`,
        }}
      >
        {/* Header row */}
        <div className="border-b border-outline-variant/40 bg-surface-container-low" />
        {dayLabels.map((label, i) => (
          <div
            key={label}
            className={cn(
              'p-sm text-center text-label-sm font-semibold border-b border-l border-outline-variant/40 bg-surface-container-low',
              i === todayIndex && 'text-primary bg-primary/5',
            )}
          >
            {label}
          </div>
        ))}

        {/* Time column */}
        <div className="relative" style={{ height: totalPx }}>
          {slots.map((m, i) => (
            <div
              key={m}
              className="absolute left-0 right-0 text-[11px] text-on-surface-variant pr-sm text-right -translate-y-1/2"
              style={{ top: (i / (slots.length - 1)) * totalPx }}
            >
              {minutesLabel(m)}
            </div>
          ))}
        </div>

        {/* Day columns */}
        {dayLabels.map((_, dayIdx) => {
          const dayEvents = events.filter((e) => e.day === dayIdx);
          return (
            <div
              key={dayIdx}
              className={cn(
                'relative border-l border-outline-variant/40',
                dayIdx === todayIndex && 'bg-primary/5',
              )}
              style={{ height: totalPx }}
            >
              {/* Horizontal grid lines */}
              {slots.slice(1).map((_, i) => (
                <div
                  key={i}
                  className="absolute inset-x-0 border-t border-outline-variant/30"
                  style={{ top: ((i + 1) / (slots.length - 1)) * totalPx }}
                  aria-hidden
                />
              ))}
              {/* Events */}
              {dayEvents.map((evt) => {
                const top = ((evt.startMinutes - startMinutes) / 60) * slotPx;
                const height = (evt.durationMin / 60) * slotPx - 4;
                return (
                  <div
                    key={evt.id}
                    className="absolute inset-x-1"
                    style={{ top, height }}
                  >
                    <EventCard event={evt} />
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function minutesLabel(m: number) {
  const hh = Math.floor(m / 60);
  const mm = m % 60;
  return `${hh.toString().padStart(2, '0')}:${mm.toString().padStart(2, '0')}`;
}
