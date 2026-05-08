import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AchievementTile,
  Icon,
  ProgressRing,
  QuestCard,
  StreakWidget,
} from '@cp/ui';
import { IAchievement } from '@cp/shared';
import { useAuthStore } from '../../stores/auth.store';

export default function StudentDashboardPage() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const name = user?.firstName ?? '';

  const level = 12;
  const xp = 450;
  const xpForNext = 500;
  const xpPct = Math.round((xp / xpForNext) * 100);
  const goalLogged = 45;
  const goalTarget = 60;

  const achievements: IAchievement[] = useMemo(
    () => [
      {
        id: 'a1',
        icon: 'workspace_premium',
        label: t('pages.student.home.achievementList.topClass.label'),
        caption: t('pages.student.home.achievementList.topClass.caption'),
        unlocked: true,
      },
      {
        id: 'a2',
        icon: 'bolt',
        label: t('pages.student.home.achievementList.speed.label'),
        caption: t('pages.student.home.achievementList.speed.caption'),
        unlocked: true,
      },
      {
        id: 'a3',
        icon: 'group',
        label: t('pages.student.home.achievementList.friends.label'),
        caption: t('pages.student.home.achievementList.friends.caption'),
        unlocked: false,
      },
      {
        id: 'a4',
        icon: 'military_tech',
        label: t('pages.student.home.achievementList.medals.label'),
        caption: t('pages.student.home.achievementList.medals.caption'),
        unlocked: false,
      },
    ],
    [t],
  );

  return (
    <div className="flex flex-col gap-lg pt-lg">
      <section className="relative overflow-hidden rounded-3xl p-lg md:p-xl bg-gradient-to-br from-primary-container via-surface-tint to-secondary text-on-primary">
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-16 -left-16 w-72 h-72 bg-tertiary-container/20 rounded-full blur-3xl" />

        <div className="relative flex flex-col md:flex-row md:items-center gap-lg">
          <div className="flex-1">
            <h2 className="font-manrope text-headline-lg">
              {t('pages.student.home.welcome', { name })}
            </h2>
            <p className="text-body-lg opacity-90 mt-xs">
              {t('pages.student.home.streakLine', { count: 3 })}
            </p>

            <div className="mt-md max-w-md bg-surface/20 rounded-2xl backdrop-blur-sm border border-white/10 p-md">
              <div className="flex justify-between mb-xs">
                <span className="text-label-sm font-semibold">
                  {t('pages.student.home.levelLabel', { level })}
                </span>
                <span className="text-label-sm">
                  {t('pages.student.home.xpFraction', { current: xp, next: xpForNext })}
                </span>
              </div>
              <div className="h-2.5 rounded-full bg-surface-container-highest/30 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-tertiary-fixed to-white/80 rounded-full transition-all"
                  style={{ width: `${xpPct}%` }}
                />
              </div>
            </div>
          </div>

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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg">
        <section className="lg:col-span-2">
          <header className="flex items-center justify-between mb-md">
            <h3 className="font-manrope text-headline-md text-on-surface">
              {t('pages.student.home.myQuests')}
            </h3>
            <button className="text-primary text-label-sm font-semibold hover:underline">
              {t('common.seeAll')}
            </button>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
            <QuestCard
              title={t('pages.student.home.quests.linear.title')}
              subject={t('pages.student.home.quests.linear.subject')}
              icon="functions"
              iconClass="bg-primary-container text-primary"
              duration={t('pages.student.home.quests.linear.duration')}
              progress={60}
              state="in-progress"
            />
            <QuestCard
              title={t('pages.student.home.quests.photosynthesis.title')}
              subject={t('pages.student.home.quests.photosynthesis.subject')}
              icon="science"
              iconClass="bg-[#E8F5E9] text-[#2E7D32]"
              duration={t('pages.student.home.quests.photosynthesis.duration')}
              progress={0}
              state="new"
            />
            <QuestCard
              title={t('pages.student.home.quests.robot.title')}
              subject={t('pages.student.home.quests.robot.subject')}
              icon="smart_toy"
              iconClass="bg-secondary-container text-on-secondary-container"
              duration={t('pages.student.home.quests.robot.duration')}
              progress={30}
              state="in-progress"
            />
            <QuestCard
              title={t('pages.student.home.quests.reading.title')}
              subject={t('pages.student.home.quests.reading.subject')}
              icon="menu_book"
              iconClass="bg-tertiary-container/30 text-tertiary"
              duration={t('pages.student.home.quests.reading.duration')}
              state="done"
            />
          </div>
        </section>

        <aside className="flex flex-col gap-md">
          <div className="rounded-3xl p-md bg-surface-container-lowest border border-outline-variant/40 shadow-elev-1">
            <header className="flex items-center justify-between mb-sm">
              <h3 className="font-manrope text-headline-md text-on-surface">
                {t('pages.student.home.dailyGoal')}
              </h3>
              <Icon name="track_changes" className="text-primary" />
            </header>
            <div className="grid place-items-center py-sm">
              <ProgressRing value={goalLogged} max={goalTarget} className="text-tertiary" size={170}>
                <div className="font-manrope text-headline-md text-on-surface">{goalLogged}m</div>
                <div className="text-label-sm text-on-surface-variant">
                  {t('ui.dailyGoal.ofTarget', { count: goalTarget })}
                </div>
              </ProgressRing>
            </div>
            <p className="text-label-sm text-on-surface-variant text-center mt-sm">
              {t('ui.dailyGoal.remaining', { count: goalTarget - goalLogged })}
            </p>
          </div>

          <StreakWidget days={3} nextMilestone={7} />

          <div className="rounded-3xl p-md bg-surface-container-lowest border border-outline-variant/40">
            <header className="flex items-center justify-between mb-sm">
              <h3 className="font-manrope text-headline-md text-on-surface">
                {t('pages.student.home.achievements')}
              </h3>
              <button className="text-primary text-label-sm font-semibold hover:underline">
                {t('pages.student.home.achievementsAll')}
              </button>
            </header>
            <div className="grid grid-cols-2 gap-sm">
              {achievements.map((a) => (
                <AchievementTile key={a.id} achievement={a} />
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
