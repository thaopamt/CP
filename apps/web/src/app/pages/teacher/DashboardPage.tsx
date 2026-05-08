import { Button, Icon, ScheduleItem } from '@cp/ui';
import { useAuthStore } from '../../stores/auth.store';

/**
 * Teacher Dashboard — ported from
 *   /design/01_stitch_edunexus_ui_foundation/teacher_portal_foundation/code.html
 *
 * 12-col grid: Today's Schedule (8 cols) + Action Items (4 cols).
 * Standard density (24px gaps).
 */
export default function TeacherDashboardPage() {
  const user = useAuthStore((s) => s.user);
  const greetingName = user?.firstName ?? 'there';

  return (
    <div className="flex flex-col gap-lg">
      {/* Greeting */}
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-md">
        <div>
          <h2 className="font-manrope text-headline-lg text-on-surface">
            Good morning, {greetingName} 👋
          </h2>
          <p className="text-body-lg text-on-surface-variant mt-xs">
            You have 3 classes scheduled today and 12 assignments to review.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-sm">
          <Button variant="teacher" leadingIcon={<Icon name="how_to_reg" size={18} />}>
            Add Attendance
          </Button>
          <Button variant="ghost" leadingIcon={<Icon name="quiz" size={18} />}>
            Create Quiz
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-lg">
        {/* Schedule (8 cols) */}
        <section className="lg:col-span-8 bg-surface-container-lowest rounded-xl shadow-elev-2 p-md">
          <header className="flex items-center justify-between mb-md">
            <div className="flex items-center gap-sm">
              <Icon name="calendar_month" className="text-primary" />
              <h3 className="font-manrope text-headline-md text-on-surface">Today's Schedule</h3>
            </div>
            <button className="text-primary text-label-sm font-semibold hover:underline">View week</button>
          </header>
          <div className="flex flex-col gap-sm max-h-[480px] overflow-y-auto">
            <ScheduleItem
              time="08:30 AM"
              duration="50 min"
              title="Algebra II — Period 1"
              subtitle="Room 204 · 28 students"
              status="past"
            />
            <ScheduleItem
              time="09:30 AM"
              duration="50 min"
              title="Algebra II — Period 2"
              subtitle="Room 204 · 26 students · Quiz scheduled"
              status="now"
            />
            <ScheduleItem
              time="10:30 AM"
              duration="50 min"
              title="Geometry — Period 3"
              subtitle="Room 204 · 30 students"
              status="upcoming"
            />
            <ScheduleItem
              time="11:30 AM"
              duration="40 min"
              title="Lesson Planning"
              subtitle="Department block"
              status="planning"
            />
            <ScheduleItem
              time="01:00 PM"
              duration="50 min"
              title="Algebra II — Period 5"
              subtitle="Room 204 · 27 students"
              status="upcoming"
            />
          </div>
        </section>

        {/* Action items (4 cols) */}
        <aside className="lg:col-span-4 bg-surface-container-lowest rounded-xl shadow-elev-2 p-md">
          <header className="flex items-center gap-sm mb-md">
            <Icon name="checklist" className="text-tertiary" />
            <h3 className="font-manrope text-headline-md text-on-surface">Action Items</h3>
          </header>
          <ul className="flex flex-col gap-sm">
            {[
              { task: 'Grade Period 1 quiz', due: 'Due today', urgent: true },
              { task: 'Submit weekly progress report', due: 'Tomorrow' },
              { task: 'Reply to parent emails (3)', due: 'Wed' },
              { task: 'Prepare slides for Geometry test', due: 'Thu' },
            ].map((t) => (
              <li
                key={t.task}
                className="flex items-start gap-sm p-sm rounded-lg hover:bg-surface-container-low transition-colors"
              >
                <input type="checkbox" className="mt-1 rounded text-primary focus:ring-primary" />
                <div className="flex-1 min-w-0">
                  <div className="text-body-md text-on-surface">{t.task}</div>
                  <div className="text-label-sm text-on-surface-variant">{t.due}</div>
                </div>
                {t.urgent && (
                  <span className="text-[10px] uppercase font-bold tracking-wider px-sm py-xs rounded-full bg-error-container text-on-error-container">
                    Today
                  </span>
                )}
              </li>
            ))}
          </ul>
          <button className="mt-md w-full border-2 border-dashed border-outline-variant text-primary text-label-sm font-semibold py-sm rounded-lg hover:bg-surface-container-low transition-colors">
            + Add Task
          </button>
        </aside>
      </div>
    </div>
  );
}
