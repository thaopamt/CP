import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Icon } from '@cp/ui';
import { LeaderboardScope, LeaderboardWindow, ILeaderboardRankEntry } from '@cp/shared';
import { useLeaderboard, usePendingReward } from '../../api/gamification.queries';
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
  const [scope, setScope] = useState<LeaderboardScope>('xp');
  const [timeWindow, setTimeWindow] = useState<LeaderboardWindow>('weekly');
  const { data, isLoading } = useLeaderboard({ scope, window: timeWindow, limit: 50 });
  const { data: pendingReward } = usePendingReward();
  const [modalOpen, setModalOpen] = useState(false);
  const reset = untilNextWeek();

  useEffect(() => {
    if (pendingReward) {
      setModalOpen(true);
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
      {pendingReward && (
        <WeeklyWinnerModal
          reward={pendingReward}
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
        />
      )}

      {/* ── Hero Header ── */}
      <header className="mb-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="font-manrope text-headline-md md:text-headline-lg font-black text-on-surface mb-2 flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-[0_4px_15px_rgba(251,191,36,0.3)]">
                <Icon name="leaderboard" size={28} className="text-white" />
              </div>
              {t('gamif.student.leaderboard.title')}
            </h1>
            <p className="text-on-surface-variant max-w-lg">{t('gamif.student.leaderboard.subtitle')}</p>
          </div>
        </div>
      </header>

      {/* ── Window selector pills ── */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {WINDOWS.map((w) => (
          <button
            key={w.key}
            onClick={() => setTimeWindow(w.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all duration-200 ${timeWindow === w.key
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

      {/* ── Scope selector pills (all-time only — windowed boards rank by XP) ── */}
      {timeWindow === 'all_time' && (
        <div className="flex gap-2 mb-8 overflow-x-auto pb-1">
          {SCOPES.map((s) => (
            <button
              key={s.key}
              onClick={() => setScope(s.key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all duration-200 ${scope === s.key ? PILL_ACTIVE : PILL_IDLE
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
              {/* order: 2nd, 1st, 3rd */}
              {[top3[1], top3[0], top3[2]].map((e, idx) =>
                e ? <PodiumCard key={e.userId} entry={e} place={e.rank} highlighted={isSelf(e)} t={t} /> : <div key={`empty-${idx}`} className="w-28 md:w-44" />,
              )}
            </div>
          )}

          {/* ── Ranked list ── */}
          {rest.length > 0 && (
            <div className="rounded-2xl bg-surface-container-lowest border border-outline-variant overflow-hidden shadow-elev-1 dark:bg-[#16161e] dark:border-white/5">
              {rest.map((e) => (
                <RankRow key={e.userId} entry={e} highlighted={isSelf(e)} t={t} />
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
                <RankRow entry={me} highlighted t={t} />
              </div>
            </div>
          )}
        </>
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
}: {
  entry: ILeaderboardRankEntry;
  place: number;
  highlighted: boolean;
  t: TFn;
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
        <span className={`text-2xl font-black bg-gradient-to-br ${config.medal} bg-clip-text text-transparent`}>#{place}</span>
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
}: {
  entry: ILeaderboardRankEntry;
  highlighted: boolean;
  t: TFn;
}) {
  return (
    <div
      className={`flex items-center gap-3 md:gap-4 px-4 py-3 border-b border-outline-variant last:border-b-0 transition-colors dark:border-white/5 ${highlighted
        ? 'bg-amber-50 ring-1 ring-inset ring-amber-300 dark:bg-amber-400/5 dark:ring-amber-400/40'
        : 'hover:bg-surface-container-high'
        }`}
    >
      {/* Rank */}
      <span
        className={`w-8 text-center text-sm font-black shrink-0 ${highlighted ? 'text-amber-600 dark:text-amber-400' : 'text-on-surface-variant'
          }`}
      >
        #{entry.rank}
      </span>

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
