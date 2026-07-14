import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence } from 'framer-motion';
import { Icon } from '@cp/ui';
import { LeaderboardScope, LeaderboardWindow, ILeaderboardRankEntry } from '@cp/shared';
import { useLeaderboard, usePendingReward, useFinalizedWeeks } from '../../api/gamification.queries';
import { StudentHoverCard } from '../../components/StudentHoverCard';
import { WeeklyWinnerModal } from '../../components/WeeklyWinnerModal';

type TFn = (key: string, opts?: Record<string, unknown>) => string;

const SCOPES: { key: LeaderboardScope; labelKey: string; icon: string }[] = [
  { key: 'xp', labelKey: 'gamif.student.leaderboard.scopeXp', icon: 'star' },
  { key: 'level', labelKey: 'gamif.student.leaderboard.scopeLevel', icon: 'military_tech' },
  { key: 'gems', labelKey: 'gamif.student.leaderboard.scopeGems', icon: 'diamond' },
  { key: 'questsCompleted', labelKey: 'gamif.student.leaderboard.scopeQuests', icon: 'swords' },
  { key: 'streak', labelKey: 'gamif.student.leaderboard.scopeStreak', icon: 'local_fire_department' },
];

const WINDOWS: { key: LeaderboardWindow; labelKey: string; icon: string }[] = [
  { key: 'weekly', labelKey: 'gamif.student.leaderboard.windowWeekly', icon: 'calendar_view_week' },
  { key: 'monthly', labelKey: 'gamif.student.leaderboard.windowMonthly', icon: 'calendar_month' },
  { key: 'all_time', labelKey: 'gamif.student.leaderboard.windowAllTime', icon: 'all_inclusive' },
];

/** Time left until the next ISO week (Monday 00:00 UTC) — for the reset banner. */
function untilNextWeek(): { days: number; hours: number } {
  const now = new Date();
  const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const dayNum = date.getUTCDay() || 7;
  const nextMonday = new Date(date);
  nextMonday.setUTCDate(date.getUTCDate() + (8 - dayNum));
  const ms = nextMonday.getTime() - now.getTime();
  return { days: Math.floor(ms / 86400000), hours: Math.floor((ms % 86400000) / 3600000) };
}

function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('') || '?';
}

const PILL_ACTIVE =
  'bg-primary text-on-primary border border-transparent shadow-elev-1 dark:bg-white/10 dark:text-white dark:border-white/20';
const PILL_IDLE =
  'bg-surface-container-low text-on-surface-variant border border-transparent hover:bg-surface-container-high hover:text-on-surface';

export default function StudentLeaderboardPage() {
  const { t } = useTranslation();
  const [activeSubTab, setActiveSubTab] = useState<'leaderboard' | 'hall_of_fame'>('leaderboard');
  const [scope, setScope] = useState<LeaderboardScope>('xp');
  const [timeWindow, setTimeWindow] = useState<LeaderboardWindow>('weekly');
  const { data, isLoading } = useLeaderboard({ scope, window: timeWindow, limit: 50 });
  const { data: pendingReward } = usePendingReward();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const reset = untilNextWeek();

  useEffect(() => {
    if (pendingReward) {
      setIsModalOpen(true);
    }
  }, [pendingReward]);

  const entries = data?.entries ?? [];
  const me = data?.me ?? null;
  const isSelf = (e: ILeaderboardRankEntry) => e.isMe || (me != null && e.userId === me.userId);

  const top3 = entries.slice(0, 3);
  const rest = entries.slice(3);
  const meInList = me != null && entries.some((e) => e.userId === me.userId);

  return (
    <div className="mx-auto w-full max-w-5xl py-lg text-on-surface">
      <AnimatePresence>
        {isModalOpen && pendingReward && (
          <WeeklyWinnerModal
            reward={pendingReward}
            onClose={() => setIsModalOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* ── Hero Header ── */}
      <header className="mb-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="font-manrope text-headline-md md:text-headline-lg font-black text-on-surface mb-2 flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-[0_4px_15px_rgba(251,191,36,0.3)]">
                <Icon name="leaderboard" size={28} className="text-white" />
              </div>
              {activeSubTab === 'leaderboard' ? t('gamif.student.leaderboard.title') : t('gamif.student.leaderboard.hallOfFame.title')}
            </h1>
            <p className="text-on-surface-variant max-w-lg">
              {activeSubTab === 'leaderboard' ? t('gamif.student.leaderboard.subtitle') : t('gamif.student.leaderboard.hallOfFame.subtitle')}
            </p>
          </div>
        </div>
      </header>

      {/* ── Sub-tab Toggler ── */}
      <div className="flex border-b border-outline-variant dark:border-white/5 mb-6">
        <button
          onClick={() => setActiveSubTab('leaderboard')}
          className={`px-6 py-3 font-bold text-sm border-b-2 transition-all duration-200 flex items-center gap-2 ${
            activeSubTab === 'leaderboard'
              ? 'border-amber-500 text-amber-600 dark:border-amber-400 dark:text-amber-300'
              : 'border-transparent text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <Icon name="leaderboard" size={18} />
          {t('gamif.student.leaderboard.hallOfFame.tabLeaderboard')}
        </button>
        <button
          onClick={() => setActiveSubTab('hall_of_fame')}
          className={`px-6 py-3 font-bold text-sm border-b-2 transition-all duration-200 flex items-center gap-2 ${
            activeSubTab === 'hall_of_fame'
              ? 'border-amber-500 text-amber-600 dark:border-amber-400 dark:text-amber-300'
              : 'border-transparent text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <Icon name="workspace_premium" size={18} />
          {t('gamif.student.leaderboard.hallOfFame.tabHallOfFame')}
        </button>
      </div>

      {activeSubTab === 'leaderboard' ? (
        <>
          {/* ── Window selector pills ── */}
          <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
            {WINDOWS.map((w) => (
              <button
                key={w.key}
                onClick={() => setTimeWindow(w.key)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all duration-200 ${
                  timeWindow === w.key
                    ? 'bg-amber-100 text-amber-800 border border-amber-300 shadow-elev-1 dark:bg-amber-400/15 dark:text-amber-200 dark:border-amber-400/40'
                    : PILL_IDLE
                }`}
              >
                <Icon name={w.icon} size={16} />
                {t(w.labelKey)}
              </button>
            ))}
          </div>

          {/* ── Weekly season reset banner ── */}
          {timeWindow === 'weekly' && (
            <div className="flex items-center gap-2 mb-6 px-4 py-2.5 rounded-xl bg-amber-50 border border-amber-200 text-sm dark:bg-amber-400/5 dark:border-amber-400/20">
              <Icon name="hourglass_top" size={18} className="text-amber-600 dark:text-amber-300 shrink-0" />
              <span className="text-amber-800 dark:text-amber-200 font-semibold">
                {t('gamif.student.leaderboard.seasonResetsIn', { days: reset.days, hours: reset.hours })}
              </span>
              <span className="hidden sm:inline text-on-surface-variant">· {t('gamif.student.leaderboard.weeklyHint')}</span>
            </div>
          )}

          {/* ── Weekly reward info card ── */}
          {timeWindow === 'weekly' && (
            <div className="mb-6 p-6 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-pink-500/10 border border-amber-500/20 shadow-elev-1 relative overflow-hidden dark:from-amber-500/5 dark:via-orange-500/5 dark:to-pink-500/5 dark:border-amber-500/10">
              <div className="absolute -right-10 -top-10 w-32 h-32 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 opacity-20 blur-xl pointer-events-none" />
              <div className="absolute -left-10 -bottom-10 w-32 h-32 rounded-full bg-gradient-to-tr from-pink-500 to-purple-500 opacity-20 blur-xl pointer-events-none" />
              
              <div className="flex gap-4 items-start relative z-10">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-pink-500 flex items-center justify-center shadow-lg shrink-0">
                  <Icon name="card_giftcard" size={26} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-lg text-on-surface mb-1 flex items-center gap-2">
                    {t('gamif.student.leaderboard.rewardsInfo.title')}
                    <span className="text-xs bg-amber-100 text-amber-800 dark:bg-amber-400/15 dark:text-amber-200 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Hot
                    </span>
                  </h3>
                  <p className="text-sm text-on-surface-variant mb-4">
                    {t('gamif.student.leaderboard.rewardsInfo.subtitle')}
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-xl bg-surface-container-low/70 border border-outline-variant/50 backdrop-blur-sm flex flex-col gap-1 dark:bg-white/[0.02]">
                      <span className="text-xs font-bold text-amber-500 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1">
                        <Icon name="crown" size={14} />
                        {t('gamif.student.leaderboard.rewardsInfo.championTitle')}
                      </span>
                      <span className="text-xs text-on-surface-variant font-medium">
                        {t('gamif.student.leaderboard.rewardsInfo.championDesc')}
                      </span>
                    </div>
                    
                    <div className="p-4 rounded-xl bg-surface-container-low/70 border border-outline-variant/50 backdrop-blur-sm flex flex-col gap-1 dark:bg-white/[0.02]">
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1">
                        <Icon name="military_tech" size={14} />
                        {t('gamif.student.leaderboard.rewardsInfo.eliteTitle')}
                      </span>
                      <span className="text-xs text-on-surface-variant font-medium">
                        {t('gamif.student.leaderboard.rewardsInfo.eliteDesc')}
                      </span>
                    </div>
                    
                    <div className="p-4 rounded-xl bg-surface-container-low/70 border border-outline-variant/50 backdrop-blur-sm flex flex-col gap-1 dark:bg-white/[0.02]">
                      <span className="text-xs font-bold text-orange-500 dark:text-orange-400 uppercase tracking-wider flex items-center gap-1">
                        <Icon name="workspace_premium" size={14} />
                        {t('gamif.student.leaderboard.rewardsInfo.challengerTitle')}
                      </span>
                      <span className="text-xs text-on-surface-variant font-medium">
                        {t('gamif.student.leaderboard.rewardsInfo.challengerDesc')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Scope selector pills (all-time only — windowed boards rank by XP) ── */}
          {timeWindow === 'all_time' && (
            <div className="flex gap-2 mb-8 overflow-x-auto pb-1">
              {SCOPES.map((s) => (
                <button
                  key={s.key}
                  onClick={() => setScope(s.key)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all duration-200 ${
                    scope === s.key ? PILL_ACTIVE : PILL_IDLE
                  }`}
                >
                  <Icon name={s.icon} size={16} />
                  {t(s.labelKey)}
                </button>
              ))}
            </div>
          )}

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <Icon name="sync" className="animate-spin text-primary" size={48} />
              <span className="text-on-surface-variant text-sm font-medium">{t('common.loading')}</span>
            </div>
          ) : entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-20 h-20 rounded-2xl bg-surface-container-high flex items-center justify-center mb-4">
                <Icon name="leaderboard" size={40} className="text-on-surface-variant" />
              </div>
              <p className="text-sm text-on-surface-variant">{t('gamif.student.leaderboard.empty')}</p>
            </div>
          ) : (
            <>
              {/* ── Podium ── */}
              {top3.length > 0 && (
                <div className="flex items-end justify-center gap-3 md:gap-6 mb-8">
                  {[top3[1], top3[0], top3[2]].map((e, idx) =>
                    e ? (
                      <PodiumCard
                        key={e.userId}
                        entry={e}
                        place={e.rank}
                        highlighted={isSelf(e)}
                        t={t}
                        timeWindow={timeWindow}
                      />
                    ) : (
                      <div key={`empty-${idx}`} className="w-28 md:w-44" />
                    )
                  )}
                </div>
              )}

              {/* ── Ranked list ── */}
              {rest.length > 0 && (
                <div className="rounded-2xl bg-surface-container-lowest border border-outline-variant overflow-hidden shadow-elev-1 dark:bg-[#16161e] dark:border-white/5">
                  {rest.map((e) => (
                    <RankRow key={e.userId} entry={e} highlighted={isSelf(e)} t={t} timeWindow={timeWindow} />
                  ))}
                </div>
              )}

              {/* ── Sticky "Your rank" if outside the visible list ── */}
              {me != null && !meInList && (
                <div className="sticky bottom-4 mt-4">
                  <div className="rounded-2xl bg-surface-container border border-amber-300 shadow-elev-2 overflow-hidden dark:bg-[#1b1b26] dark:border-amber-400/40 dark:shadow-[0_0_24px_rgba(251,191,36,0.2)]">
                    <div className="px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 dark:text-amber-300 dark:bg-amber-400/5">
                      {t('gamif.student.leaderboard.yourRank')}
                    </div>
                    <RankRow entry={me} highlighted t={t} timeWindow={timeWindow} />
                  </div>
                </div>
              )}
            </>
          )}
        </>
      ) : (
        /* ── Hall of Fame Tab ── */
        <HallOfFameTab t={t} initials={initials} />
      )}
    </div>
  );
}

/* ── Podium Card ── */
function PodiumCard({
  entry,
  place,
  highlighted,
  t,
  timeWindow,
}: {
  entry: ILeaderboardRankEntry;
  place: number;
  highlighted: boolean;
  t: TFn;
  timeWindow?: LeaderboardWindow;
}) {
  const isFirst = place === 1;
  const config =
    place === 1
      ? { medal: 'from-amber-300 to-orange-500 text-amber-950', glow: 'shadow-[0_0_28px_rgba(251,191,36,0.5)]', icon: 'crown', height: 'md:h-44', label: 'text-amber-500 dark:text-amber-300' }
      : place === 2
        ? { medal: 'from-slate-300 to-slate-500 text-slate-900', glow: 'shadow-[0_0_18px_rgba(203,213,225,0.4)]', icon: 'military_tech', height: 'md:h-36', label: 'text-slate-500 dark:text-slate-300' }
        : { medal: 'from-orange-700 to-amber-800 text-orange-100', glow: 'shadow-[0_0_18px_rgba(180,83,9,0.4)]', icon: 'military_tech', height: 'md:h-32', label: 'text-orange-500 dark:text-orange-300' };

  return (
    <div className={`flex flex-col items-center w-28 md:w-44 ${isFirst ? '-mt-4' : ''}`}>
      {/* Avatar + crown */}
      <StudentHoverCard 
        userId={entry.userId} 
        fallbackName={entry.name} 
        fallbackAvatar={entry.avatarUrl}
        className="relative mb-3 flex flex-col items-center"
      >
        {/* <div className={`absolute -top-5 left-1/2 -translate-x-1/2 z-10 ${config.label}`}>
          <Icon name={config.icon} size={isFirst ? 24 : 20} />
        </div> */}
        {entry.avatarUrl ? (
          <img
            src={entry.avatarUrl}
            alt={entry.name}
            className={`object-contain ${isFirst ? 'w-28 h-28 md:w-44 md:h-44' : 'w-24 h-24 md:w-36 md:h-36'}`}
          />
        ) : (
          <div
            className={`rounded-full grid place-items-center font-black bg-gradient-to-br ${config.medal} border-2 border-outline-variant dark:border-white/10 ${config.glow} ${isFirst ? 'w-28 h-28 md:w-44 md:h-44 text-3xl' : 'w-24 h-24 md:w-36 md:h-36 text-2xl'
              }`}
          >
            {initials(entry.name)}
          </div>
        )}
      </StudentHoverCard>

      <span
        className="text-sm font-bold text-on-surface text-center truncate w-full px-1"
        style={entry.nameColor ? { color: entry.nameColor } : undefined}
      >
        {entry.name}
      </span>
      {entry.title && (
        <span className="text-[10px] font-semibold text-fuchsia-600 dark:text-fuchsia-300 text-center truncate w-full px-1">
          {entry.title}
        </span>
      )}
      <span className="text-[10px] font-semibold text-on-surface-variant mb-2">
        {t('gamif.student.leaderboard.level')} {entry.level}
      </span>

      {/* Pedestal */}
      <div
        className={`w-full rounded-t-xl bg-surface-container-high border-x border-t border-outline-variant flex flex-col items-center justify-center py-3 h-24 dark:bg-gradient-to-b dark:from-white/10 dark:to-white/[0.02] dark:border-white/5 ${config.height} ${highlighted ? 'ring-1 ring-amber-400/50' : ''
          }`}
      >
        <div className="flex items-center gap-1 justify-center">
          <span className={`text-2xl font-black bg-gradient-to-br ${config.medal} bg-clip-text text-transparent`}>#{place}</span>
          {timeWindow === 'weekly' && place <= 10 && (
            <RewardTooltip rank={place} t={t} />
          )}
        </div>
        <span className="text-sm font-black text-on-surface mt-1">{entry.value.toLocaleString()}</span>
      </div>
    </div>
  );
}

/* ── Rank Row ── */
function RankRow({
  entry,
  highlighted,
  t,
  timeWindow,
}: {
  entry: ILeaderboardRankEntry;
  highlighted: boolean;
  t: TFn;
  timeWindow?: LeaderboardWindow;
}) {
  return (
    <div
      className={`flex items-center gap-3 md:gap-4 px-4 py-3 border-b border-outline-variant last:border-b-0 transition-colors dark:border-white/5 ${highlighted
        ? 'bg-amber-50 ring-1 ring-inset ring-amber-300 dark:bg-amber-400/5 dark:ring-amber-400/40'
        : 'hover:bg-surface-container-high'
        }`}
    >
      {/* Rank with gift preview if eligible */}
      <div className="w-12 flex items-center justify-start gap-1 shrink-0">
        <span
          className={`text-sm font-black shrink-0 ${highlighted ? 'text-amber-600 dark:text-amber-400' : 'text-on-surface-variant'
            }`}
        >
          #{entry.rank}
        </span>
        {timeWindow === 'weekly' && entry.rank <= 10 && (
          <RewardTooltip rank={entry.rank} t={t} />
        )}
      </div>

      {/* Avatar */}
      <StudentHoverCard
        userId={entry.userId}
        fallbackName={entry.name}
        fallbackAvatar={entry.avatarUrl}
        className="flex items-center gap-3 md:gap-4 shrink-0"
      >
        {entry.avatarUrl ? (
          <img src={entry.avatarUrl} alt={entry.name} className="w-16 h-16 md:w-20 md:h-20 shrink-0 object-contain" />
        ) : (
          <div className="w-16 h-16 md:w-20 md:h-20 shrink-0 rounded-full grid place-items-center text-lg font-black bg-surface-container-high text-on-surface border border-outline-variant dark:border-white/10">
            {initials(entry.name)}
          </div>
        )}
      </StudentHoverCard>

      {/* Name + title + level/badges */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <StudentHoverCard
            userId={entry.userId}
            fallbackName={entry.name}
            fallbackAvatar={entry.avatarUrl}
            className="truncate"
          >
            <span
              className="font-bold text-sm truncate text-on-surface hover:underline cursor-pointer"
              style={entry.nameColor ? { color: entry.nameColor } : undefined}
            >
              {entry.name}
            </span>
          </StudentHoverCard>
          {highlighted && (
            <span className="text-[9px] font-black uppercase tracking-wider text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded-full shrink-0 dark:text-amber-300 dark:bg-amber-400/15">
              {t('gamif.student.leaderboard.you')}
            </span>
          )}
        </div>
        {entry.title && (
          <p className="text-[11px] font-semibold text-fuchsia-600 dark:text-fuchsia-300 truncate">{entry.title}</p>
        )}
        <div className="flex items-center gap-3 text-[11px] text-on-surface-variant font-semibold mt-0.5">
          <span className="flex items-center gap-1">
            <Icon name="military_tech" size={12} className="text-cyan-600 dark:text-cyan-400/70" /> {t('gamif.student.leaderboard.level')} {entry.level}
          </span>
          <span className="flex items-center gap-1">
            <Icon name="workspace_premium" size={12} className="text-amber-600 dark:text-amber-400/70" /> {entry.badgeCount}
          </span>
        </div>
      </div>

      {/* Scope value */}
      <span className="text-sm font-black text-on-surface shrink-0 tabular-nums">{entry.value.toLocaleString()}</span>
    </div>
  );
}

/* ── Reward Tooltip ── */
function RewardTooltip({ rank, t }: { rank: number; t: TFn }) {
  let text = '';
  if (rank === 1) {
    text = t('gamif.student.leaderboard.rewardsInfo.tooltipChampion');
  } else if (rank === 2 || rank === 3) {
    text = t('gamif.student.leaderboard.rewardsInfo.tooltipElite', { rank });
  } else if (rank >= 4 && rank <= 10) {
    text = t('gamif.student.leaderboard.rewardsInfo.tooltipChallenger', { rank });
  }

  if (!text) return null;

  return (
    <div className="relative group flex items-center justify-center shrink-0">
      <button className="text-amber-500 hover:text-amber-600 dark:text-amber-400 dark:hover:text-amber-300 transition-colors focus:outline-none p-0.5 rounded-full hover:bg-amber-100 dark:hover:bg-amber-400/10">
        <Icon name="card_giftcard" size={14} />
      </button>
      <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 scale-95 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-200 origin-bottom z-[999]">
        <div className="bg-surface-container border border-outline-variant text-[11px] font-semibold text-on-surface px-3 py-2 rounded-xl shadow-lg dark:bg-[#16161e] dark:border-white/10 text-center leading-relaxed">
          {text}
        </div>
        {/* Tooltip arrow */}
        <div className="w-2.5 h-2.5 bg-surface-container border-r border-b border-outline-variant rotate-45 absolute top-full left-1/2 -translate-x-1/2 -mt-1.5 dark:bg-[#16161e] dark:border-white/10" />
      </div>
    </div>
  );
}

/* ── Hall of Fame Tab ── */
function HallOfFameTab({ t, initials }: { t: TFn; initials: (name: string) => string }) {
  const { data: finalizedWeeks, isLoading } = useFinalizedWeeks();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <Icon name="sync" className="animate-spin text-primary" size={48} />
        <span className="text-on-surface-variant text-sm font-medium">{t('common.loading')}</span>
      </div>
    );
  }

  if (!finalizedWeeks || finalizedWeeks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-20 h-20 rounded-2xl bg-surface-container-high flex items-center justify-center mb-4">
          <Icon name="workspace_premium" size={40} className="text-on-surface-variant" />
        </div>
        <p className="text-sm text-on-surface-variant">{t('gamif.student.leaderboard.hallOfFame.empty')}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 animate-fadeIn">
      {finalizedWeeks.map((week) => (
        <div
          key={week.id}
          className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-6 shadow-elev-1 dark:bg-[#16161e] dark:border-white/5"
        >
          {/* Week Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-outline-variant/50 pb-4 mb-6 dark:border-white/5 gap-2">
            <div>
              <h2 className="font-manrope text-lg md:text-xl font-extrabold text-on-surface flex items-center gap-2">
                <Icon name="stars" className="text-amber-500 shrink-0" size={22} />
                {t('gamif.student.leaderboard.hallOfFame.weekTitle', { weekKey: week.weekKey })}
              </h2>
              <p className="text-xs text-on-surface-variant mt-1">
                {t('gamif.student.leaderboard.hallOfFame.finalizedAt', {
                  date: new Date(week.finalizedAt).toLocaleDateString(t('languageSwitcher.short') === 'VI' ? 'vi-VN' : 'en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  }),
                })}
              </p>
            </div>
            <div className="text-xs bg-surface-container-high font-bold px-3 py-1.5 rounded-full text-on-surface-variant dark:bg-white/5">
              {t('gamif.student.leaderboard.hallOfFame.top3Winners')}
            </div>
          </div>

          {/* Top 3 Winners */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {week.winners
              .filter((w) => w.rank <= 3)
              .sort((a, b) => a.rank - b.rank)
              .map((winner) => {
                const is1st = winner.rank === 1;
                const is2nd = winner.rank === 2;

                const borderClass = is1st
                  ? 'border-amber-400/50 bg-gradient-to-b from-amber-500/[0.08] to-transparent dark:from-amber-400/5'
                  : is2nd
                  ? 'border-slate-300/40 bg-gradient-to-b from-slate-300/[0.05] to-transparent dark:from-slate-300/5'
                  : 'border-orange-700/30 bg-gradient-to-b from-orange-700/[0.05] to-transparent dark:from-orange-700/5';

                const rankBadgeColor = is1st
                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-400/20 dark:text-amber-300'
                  : is2nd
                  ? 'bg-slate-100 text-slate-800 dark:bg-slate-300/20 dark:text-slate-200'
                  : 'bg-orange-100 text-orange-800 dark:bg-orange-700/20 dark:text-orange-300';

                return (
                  <div
                    key={winner.userId}
                    className={`flex flex-col items-center p-5 rounded-2xl border ${borderClass} transition-all duration-300 hover:scale-[1.02]`}
                  >
                    {/* Avatar */}
                    <StudentHoverCard
                      userId={winner.userId}
                      fallbackName={winner.name}
                      fallbackAvatar={winner.avatarUrl}
                      className="relative mb-3 flex flex-col items-center"
                    >
                      {winner.avatarUrl ? (
                        <img
                          src={winner.avatarUrl}
                          alt={winner.name}
                          className="w-20 h-20 md:w-24 md:h-24 object-contain"
                        />
                      ) : (
                        <div className="w-20 h-20 md:w-24 md:h-24 rounded-full grid place-items-center text-xl font-black bg-surface-container-high text-on-surface border border-outline-variant dark:border-white/10 animate-glow">
                          {initials(winner.name)}
                        </div>
                      )}
                    </StudentHoverCard>

                    {/* Name */}
                    <span className="font-extrabold text-sm text-center truncate w-full mb-1">
                      {winner.name}
                    </span>

                    {/* Rank badge */}
                    <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${rankBadgeColor} mb-3`}>
                      #{winner.rank}
                    </span>

                    {/* XP score */}
                    <div className="flex items-center gap-1 mb-4 text-xs font-semibold text-on-surface-variant">
                      <Icon name="star" size={14} className="text-amber-500" />
                      <span>{winner.weeklyXp.toLocaleString()} XP</span>
                    </div>

                    {/* Rewards earned list */}
                    <div className="w-full border-t border-outline-variant/30 pt-3 dark:border-white/5 flex flex-col gap-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-on-surface-variant flex items-center gap-1">
                          <Icon name="diamond" size={12} className="text-cyan-500" />
                          {t('gamif.student.leaderboard.weeklyWinner.gemsLabel')}
                        </span>
                        <span className="font-extrabold text-cyan-600 dark:text-cyan-400">
                          +{winner.rewards.gems}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-on-surface-variant flex items-center gap-1">
                          <Icon name="flash_on" size={12} className="text-amber-500" />
                          XP
                        </span>
                        <span className="font-extrabold text-amber-600 dark:text-amber-400">
                          +{winner.rewards.xp}
                        </span>
                      </div>
                      {winner.rewards.avatarCode && (
                        <div className="flex items-center justify-between text-[10px] text-fuchsia-600 dark:text-fuchsia-300 font-bold border-t border-dashed border-outline-variant/30 pt-2 mt-1 dark:border-white/5">
                          <span className="flex items-center gap-1">
                            <Icon name="face" size={12} />
                            Avatar
                          </span>
                          <span className="truncate max-w-[120px]" title={winner.rewards.avatarCode}>
                            {t(`gamif.student.leaderboard.weeklyWinner.avatarName.${winner.rewards.avatarCode}`, { defaultValue: winner.rewards.avatarCode })}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      ))}
    </div>
  );
}

