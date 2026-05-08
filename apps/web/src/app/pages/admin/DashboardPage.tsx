import { Button, Icon, StatCard } from '@cp/ui';

/**
 * Admin Dashboard — ported from
 *   /design/01_stitch_edunexus_ui_foundation/admin_portal_foundation/code.html
 * Lines 187–352 of the prototype: page header + 3 stat cards + recent
 * enrollments table + alerts panel.
 */
export default function AdminDashboardPage() {
  return (
    <div className="flex flex-col gap-lg">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-md">
        <div>
          <h2 className="font-manrope text-headline-lg text-on-surface">Overview</h2>
          <p className="text-body-md text-on-surface-variant mt-xs">
            Track key metrics and recent activity across the institution.
          </p>
        </div>
        <Button variant="admin" leadingIcon={<Icon name="download" size={18} />}>
          Export Report
        </Button>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md lg:gap-lg">
        <StatCard
          label="Total Students"
          value="12,450"
          icon="groups"
          iconColor="text-primary"
          trend="up"
          delta="+4.2%"
        />
        <StatCard
          label="Active Classes"
          value="842"
          icon="class"
          iconColor="text-secondary"
          trend="flat"
          delta="—"
        />
        <StatCard
          label="Revenue (MTD)"
          value="$1.2M"
          icon="payments"
          iconColor="text-tertiary"
          trend="up"
          delta="+12.5%"
        />
      </div>

      {/* Bento layout: table + alerts */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-md lg:gap-lg">
        <section className="xl:col-span-2 bg-surface-container-lowest border border-outline-variant/50 rounded-xl shadow-elev-1 overflow-hidden flex flex-col">
          <header className="p-md md:p-lg border-b border-outline-variant/30 flex justify-between items-center bg-surface-bright">
            <h3 className="font-manrope text-headline-md text-on-surface">Recent Enrollments</h3>
            <button className="text-primary text-label-sm font-semibold hover:underline">View All</button>
          </header>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-surface-container-low text-label-sm text-on-surface-variant">
                <tr className="border-b border-outline-variant/30">
                  <th className="p-sm md:p-md font-semibold whitespace-nowrap">Student</th>
                  <th className="p-sm md:p-md font-semibold whitespace-nowrap">Course</th>
                  <th className="p-sm md:p-md font-semibold whitespace-nowrap">Date</th>
                  <th className="p-sm md:p-md font-semibold whitespace-nowrap">Status</th>
                </tr>
              </thead>
              <tbody className="text-body-md divide-y divide-outline-variant/20">
                {[
                  { name: 'Sarah Jenkins', initials: 'SJ', course: 'CS-101', date: 'Oct 24, 2023', status: 'Active' },
                  { name: 'Michael Rossi', initials: 'MR', course: 'ENG-204', date: 'Oct 23, 2023', status: 'Pending' },
                  { name: 'Aiko Tanaka', initials: 'AT', course: 'MATH-310', date: 'Oct 22, 2023', status: 'Active' },
                ].map((row) => (
                  <tr key={row.name} className="hover:bg-surface-container-highest/30 transition-colors">
                    <td className="p-sm md:p-md flex items-center gap-sm">
                      <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary-container grid place-items-center text-label-sm font-bold shrink-0">
                        {row.initials}
                      </div>
                      <span className="text-on-surface font-medium whitespace-nowrap">{row.name}</span>
                    </td>
                    <td className="p-sm md:p-md text-on-surface-variant">{row.course}</td>
                    <td className="p-sm md:p-md text-on-surface-variant whitespace-nowrap">{row.date}</td>
                    <td className="p-sm md:p-md">
                      <span
                        className={
                          row.status === 'Active'
                            ? 'px-md py-xs bg-tertiary-container/30 text-tertiary rounded-full text-[12px] font-bold uppercase border border-tertiary-container'
                            : 'px-md py-xs bg-outline-variant/30 text-on-surface-variant rounded-full text-[12px] font-bold uppercase border border-outline-variant'
                        }
                      >
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <aside className="flex flex-col gap-md">
          <div className="bg-surface-container-lowest border border-outline-variant/50 rounded-xl p-md">
            <div className="flex items-center gap-sm mb-md">
              <Icon name="campaign" className="text-error" />
              <h3 className="font-manrope text-headline-md text-on-surface">System Alerts</h3>
            </div>
            <ul className="flex flex-col gap-sm">
              {[
                { tone: 'error', msg: 'Server CPU above 85% for 12 min.' },
                { tone: 'warn', msg: 'Backup job missed a window last night.' },
                { tone: 'info', msg: '14 new tickets in support queue.' },
              ].map((a, i) => (
                <li
                  key={i}
                  className={
                    a.tone === 'error'
                      ? 'rounded-md bg-error-container/40 text-on-error-container text-label-sm px-md py-sm'
                      : a.tone === 'warn'
                      ? 'rounded-md bg-tertiary-container/30 text-on-surface text-label-sm px-md py-sm'
                      : 'rounded-md bg-secondary-container/40 text-on-secondary-container text-label-sm px-md py-sm'
                  }
                >
                  {a.msg}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl p-lg text-on-primary bg-gradient-to-br from-primary via-primary-container to-secondary shadow-elev-3 backdrop-blur-md">
            <h4 className="font-manrope text-headline-md mb-xs">Need Assistance?</h4>
            <p className="text-label-sm opacity-90 mb-md">
              Our support team is on standby for institutional questions.
            </p>
            <Button variant="outline" className="bg-surface/20 border-white/40 text-on-primary">
              Contact Support
            </Button>
          </div>
        </aside>
      </div>
    </div>
  );
}
