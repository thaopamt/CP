import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Avatar,
  Icon,
  QuestCard,
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
      <div className="flex items-center gap-xs mb-md">
        <Avatar size="md" src={user?.avatarUrl} initials={name[0]} />
        <div>
          <h2 className="font-manrope text-headline-lg font-extrabold text-on-surface">
            {t('pages.student.home.welcome', { name })} 🚀
          </h2>
          <p className="text-body-lg text-on-surface-variant">Let's smash today's goals!</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-lg">
        {/* Main Content Area */}
        <section className="flex flex-col gap-lg">
          {/* Level & XP Card */}
          <div className="relative overflow-hidden rounded-[32px] p-lg md:p-xl bg-surface-container-lowest border border-outline-variant shadow-elev-2 text-on-surface">
            <h3 className="font-manrope text-headline-md font-extrabold mb-md">Level & XP</h3>
            
            <div className="bg-surface-container rounded-2xl p-sm mb-md flex flex-col gap-xs relative overflow-hidden">
              <div className="flex justify-between items-center z-10 px-sm">
                <span className="font-manrope text-[16px] font-bold">Level {level} | Star Scholar</span>
                <span className="font-manrope text-[16px] font-bold">{xp} / {xpForNext} XP</span>
              </div>
              <div className="h-6 rounded-full bg-surface-variant overflow-hidden z-10 mx-sm mb-sm relative">
                <div
                  className="absolute left-0 top-0 bottom-0 bg-orange-500 rounded-full transition-all"
                  style={{ width: `${xpPct}%` }}
                />
                <span className="absolute right-3 text-[12px] text-white font-bold leading-6 z-20 drop-shadow-md">{xpPct}%</span>
              </div>
            </div>

            <div className="bg-gradient-to-r from-orange-400 to-orange-200 rounded-full py-3 px-md inline-block shadow-md">
              <span className="font-manrope text-white font-bold">Daily Goal: 3/5 Quests Completed</span>
            </div>
          </div>

          {/* Active Quests */}
          <div className="bg-blue-600 rounded-[32px] p-lg shadow-elev-2 flex flex-col">
            <header className="flex items-center justify-between mb-md px-sm text-white">
              <h3 className="font-manrope text-[24px] font-extrabold">Active Quests</h3>
              <button className="hover:bg-white/20 p-2 rounded-full transition-colors">
                <Icon name="more_horiz" />
              </button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
              <QuestCard
                title={t('pages.student.home.quests.linear.title')}
                subject={t('pages.student.home.quests.linear.subject')}
                icon="functions"
                iconClass="bg-blue-100 text-blue-600"
                duration={t('pages.student.home.quests.linear.duration')}
                progress={0}
                state="new"
              />
              <QuestCard
                title={t('pages.student.home.quests.photosynthesis.title')}
                subject={t('pages.student.home.quests.photosynthesis.subject')}
                icon="science"
                iconClass="bg-red-100 text-red-600"
                duration={t('pages.student.home.quests.photosynthesis.duration')}
                progress={0}
                state="new"
              />
              <QuestCard
                title={t('pages.student.home.quests.reading.title')}
                subject={t('pages.student.home.quests.reading.subject')}
                icon="menu_book"
                iconClass="bg-green-100 text-green-600"
                duration={t('pages.student.home.quests.reading.duration')}
                state="new"
              />
            </div>
          </div>
          
          {/* My Courses */}
          <div className="bg-blue-600 rounded-[32px] p-lg shadow-elev-2 flex flex-col">
            <header className="flex items-center justify-between mb-md px-sm text-white">
              <h3 className="font-manrope text-[24px] font-extrabold">My Courses</h3>
              <button className="hover:bg-white/20 p-2 rounded-full transition-colors">
                <Icon name="more_horiz" />
              </button>
            </header>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
              {/* Course Cards */}
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-2xl p-md shadow-sm flex flex-col items-center gap-sm">
                   <div className="w-full h-24 bg-surface-container rounded-xl"></div>
                   <span className="font-manrope font-bold text-on-surface">Algebra I</span>
                   <div className="w-full h-1.5 bg-surface-variant rounded-full mt-auto">
                     <div className="h-full bg-blue-600 rounded-full w-1/2"></div>
                   </div>
                   <button className="w-full mt-2 py-2 rounded-full border-2 border-violet-500 text-violet-600 font-bold hover:bg-violet-50 transition-colors">Continue Learning</button>
                </div>
              ))}
            </div>
          </div>
        </section>

        <aside className="flex flex-col gap-md">
          {/* Streak Card */}
          <div className="rounded-[32px] p-lg bg-surface-container-lowest border border-outline-variant shadow-elev-1 text-center flex flex-col items-center">
            <span className="font-manrope text-label-sm uppercase font-bold text-on-surface-variant tracking-wider">Streak:</span>
            <div className="flex items-center gap-xs text-orange-500 font-extrabold text-[32px] mt-2">
              <Icon name="local_fire_department" size={40} />
              <span>14 Days</span>
            </div>
          </div>

          <div className="rounded-[32px] p-lg bg-surface-container-lowest border border-outline-variant shadow-elev-1 text-center flex flex-col items-center">
            <span className="font-manrope text-label-sm uppercase font-bold text-on-surface-variant tracking-wider">Next Reward:</span>
            <div className="flex items-center gap-sm font-extrabold text-[28px] mt-2">
              <span className="text-blue-500">💎</span>
              <span className="text-on-surface">200 Gems</span>
            </div>
          </div>

          {/* Achievements Area */}
          <div className="rounded-[32px] p-lg bg-orange-500 shadow-elev-2 text-white">
            <header className="flex items-center justify-between mb-md">
              <h3 className="font-manrope text-[20px] font-extrabold">
                Recent Achievements
              </h3>
            </header>
            <div className="flex flex-col gap-sm">
              {achievements.map((a) => (
                <div key={a.id} className="bg-white/10 rounded-2xl p-md flex items-center gap-md backdrop-blur-sm">
                  <div className="bg-white rounded-xl p-2 text-orange-500 shadow-sm shrink-0">
                    <Icon name={a.icon} size={28} />
                  </div>
                  <div>
                    <div className="font-manrope font-bold">{a.label}</div>
                    <div className="text-[12px] opacity-90 leading-tight">{a.caption}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
