import { Icon, QuestCard } from '@cp/ui';
import { useAuthStore } from '../../stores/auth.store';

/**
 * Student Dashboard — ported from
 *   /design/01_stitch_edunexus_ui_foundation/student_portal_foundation/code.html
 *
 * Glass hero section + 3-column quest card grid.
 * Relaxed density, glassmorphism, 3D buttons.
 */
export default function StudentDashboardPage() {
  const user = useAuthStore((s) => s.user);
  const name = user?.firstName ?? 'Explorer';

  return (
    <div className="flex flex-col gap-lg pt-lg">
      {/* ── Hero ──────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden rounded-3xl p-lg md:p-xl bg-gradient-to-br from-primary-container via-surface-tint to-secondary text-on-primary">
        {/* Decorative blur orbs */}
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-16 -left-16 w-72 h-72 bg-tertiary-container/20 rounded-full blur-3xl" />

        <div className="relative flex flex-col md:flex-row md:items-center gap-lg">
          <div className="flex-1">
            <h2 className="font-manrope text-headline-lg">Welcome back, {name}! 👋</h2>
            <p className="text-body-lg opacity-90 mt-xs">
              You're on a 3-day learning streak. Keep the momentum going!
            </p>

            {/* Level/XP card */}
            <div className="mt-md max-w-md bg-surface/20 rounded-2xl backdrop-blur-sm border border-white/10 p-md">
              <div className="flex justify-between mb-xs">
                <span className="text-label-sm font-semibold">Level 12 Explorer</span>
                <span className="text-label-sm">450 / 500 XP</span>
              </div>
              <div className="h-2.5 rounded-full bg-surface-container-highest/30 overflow-hidden">
                <div
                  className="h-full bg-tertiary-fixed bg-gradient-to-r from-tertiary-fixed to-white/80 rounded-full"
                  style={{ width: '90%' }}
                />
              </div>
            </div>
          </div>

          {/* Mascot-ish badge */}
          <div className="relative shrink-0">
            <div className="absolute inset-0 bg-tertiary-fixed/30 blur-xl rounded-full animate-pulse" />
            <div className="relative w-32 h-32 md:w-44 md:h-44 rounded-full bg-surface-container-lowest grid place-items-center text-primary">
              <Icon name="rocket_launch" size={64} />
            </div>
            <div className="absolute -bottom-2 -right-2 w-12 h-12 rounded-full bg-tertiary text-on-tertiary grid place-items-center shadow-elev-2">
              <Icon name="star" filled size={28} />
            </div>
          </div>
        </div>
      </section>

      {/* ── Quests grid ───────────────────────────────────────────── */}
      <section>
        <header className="flex items-center justify-between mb-md">
          <h3 className="font-manrope text-headline-md text-on-surface">My Quests</h3>
          <button className="text-primary text-label-sm font-semibold hover:underline">See all</button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md">
          <QuestCard
            title="Linear Equations"
            subject="Math · Chapter 4"
            icon="functions"
            iconClass="bg-primary-container text-primary"
            duration="In Progress"
            progress={60}
            state="in-progress"
          />
          <QuestCard
            title="Photosynthesis Lab"
            subject="Science · Lab 2"
            icon="science"
            iconClass="bg-[#E8F5E9] text-[#2E7D32]"
            duration="Due in 2 days"
            progress={0}
            state="new"
          />
          <QuestCard
            title="Reading: The Outsiders"
            subject="English · Chapter 7"
            icon="menu_book"
            iconClass="bg-tertiary-container/30 text-tertiary"
            duration="Done"
            state="done"
          />
        </div>
      </section>
    </div>
  );
}
