import { DayOfWeek, IClassMeeting } from '@cp/shared';

/**
 * Format a list of weekly meetings as compact text, e.g.
 *   "Mon, Wed 10:00 · Fri 09:00"
 *
 * Groups meetings that share the same start/end time so two-day-a-week
 * classes render as one line.
 */
export function formatSchedule(
  sessions: IClassMeeting[],
  dayLabel: (d: DayOfWeek) => string,
): string {
  if (sessions.length === 0) return '—';
  const grouped = new Map<string, DayOfWeek[]>();
  for (const s of sessions) {
    const key = `${s.startTime}-${s.endTime}`;
    const arr = grouped.get(key) ?? [];
    arr.push(s.dayOfWeek);
    grouped.set(key, arr);
  }
  return Array.from(grouped.entries())
    .map(([times, days]) => {
      const [start] = times.split('-');
      return `${days.map(dayLabel).join(', ')} ${start}`;
    })
    .join(' · ');
}
