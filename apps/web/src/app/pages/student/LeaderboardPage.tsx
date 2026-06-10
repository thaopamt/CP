import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Icon } from '@cp/ui';
import { LeaderboardScope, ILeaderboardRankEntry } from '@cp/shared';
import { useLeaderboard } from '../../api/gamification.queries';

type TFn = (key: string, opts?: Record<string, unknown>) => string;

const SCOPES: { key: LeaderboardScope; labelKey: string; icon: string }[] = [
  { key: 'xp', labelKey: 'gamif.student.leaderboard.scopeXp', icon: 'star' },
  { key: 'level', labelKey: 'gamif.student.leaderboard.scopeLevel', icon: 'military_tech' },
  { key: 'gems', labelKey: 'gamif.student.leaderboard.scopeGems', icon: 'diamond' },
  { key: 'questsCompleted', labelKey: 'gamif.student.leaderboard.scopeQuests', icon: 'swords' },
  { key: 'streak', labelKey: 'gamif.student.leaderboard.scopeStreak', icon: 'local_fire_department' },
];

function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('') || '?';
}

export default function StudentLeaderboardPage() {
  const { t } = useTranslation();
  const [scope, setScope] = useState<LeaderboardScope>('xp');
  const { data, isLoading } = useLeaderboard({ scope, limit: 50 });

  const entries = data?.entries ?? [];
  const me = data?.me ?? null;
  const isSelf = (e: ILeaderboardRankEntry) => e.isMe || (me != null && e.userId === me.userId);

  const top3 = entries.slice(0, 3);
  const rest = entries.slice(3);
  const meInList = me != null && entries.some((e) => e.userId === me.userId);

  return (
    <div className="min-h-screen text-gray-200 p-4 md:p-8 font-sans" style={{ backgroundColor: '#0f0f13' }}>
      {/* ── Hero Header ── */}
      <header className="mb-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-white mb-2 flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-[0_4px_15px_rgba(251,191,36,0.3)]">
                <Icon name="leaderboard" size={28} className="text-white" />
              </div>
              {t('gamif.student.leaderboard.title')}
            </h1>
            <p className="text-gray-400 max-w-lg">{t('gamif.student.leaderboard.subtitle')}</p>
          </div>
        </div>
      </header>

      {/* ── Scope selector pills ── */}
      <div className="flex gap-2 mb-8 overflow-x-auto pb-1">
        {SCOPES.map((s) => (
          <button
            key={s.key}
            onClick={() => setScope(s.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all duration-200 ${
              scope === s.key
                ? 'bg-white/10 text-white border border-white/20 shadow-lg'
                : 'bg-white/5 text-gray-400 border border-transparent hover:bg-white/10 hover:text-gray-200'
            }`}
          >
            <Icon name={s.icon} size={16} />
            {t(s.labelKey)}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <Icon name="sync" className="animate-spin text-emerald-400" size={48} />
          <span className="text-gray-500 text-sm font-medium">{t('common.loading')}</span>
        </div>
      ) : entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-20 h-20 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
            <Icon name="leaderboard" size={40} className="text-gray-600" />
          </div>
          <p className="text-sm text-gray-500">{t('gamif.student.leaderboard.empty')}</p>
        </div>
      ) : (
        <>
          {/* ── Podium ── */}
          {top3.length > 0 && (
            <div className="flex items-end justify-center gap-3 md:gap-6 mb-8">
              {/* order: 2nd, 1st, 3rd */}
              {[top3[1], top3[0], top3[2]].map((e, idx) =>
                e ? <PodiumCard key={e.userId} entry={e} place={e.rank} highlighted={isSelf(e)} t={t} /> : <div key={`empty-${idx}`} className="w-24 md:w-32" />,
              )}
            </div>
          )}

          {/* ── Ranked list ── */}
          {rest.length > 0 && (
            <div className="rounded-2xl bg-[#16161e] border border-white/5 overflow-hidden">
              {rest.map((e) => (
                <RankRow key={e.userId} entry={e} highlighted={isSelf(e)} t={t} />
              ))}
            </div>
          )}

          {/* ── Sticky "Your rank" if outside the visible list ── */}
          {me != null && !meInList && (
            <div className="sticky bottom-4 mt-4">
              <div className="rounded-2xl bg-[#1b1b26] border border-amber-400/40 shadow-[0_0_24px_rgba(251,191,36,0.2)] overflow-hidden">
                <div className="px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-amber-300 bg-amber-400/5">
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
      ? { medal: 'from-amber-300 to-orange-500 text-amber-950', glow: 'shadow-[0_0_28px_rgba(251,191,36,0.5)]', icon: 'crown', height: 'md:h-44', label: 'text-amber-300' }
      : place === 2
        ? { medal: 'from-slate-300 to-slate-500 text-slate-900', glow: 'shadow-[0_0_18px_rgba(203,213,225,0.4)]', icon: 'military_tech', height: 'md:h-36', label: 'text-slate-300' }
        : { medal: 'from-orange-700 to-amber-800 text-orange-100', glow: 'shadow-[0_0_18px_rgba(180,83,9,0.4)]', icon: 'military_tech', height: 'md:h-32', label: 'text-orange-300' };

  return (
    <div className={`flex flex-col items-center w-24 md:w-32 ${isFirst ? '-mt-4' : ''}`}>
      {/* Avatar + crown */}
      <div className="relative mb-3">
        <div className={`absolute -top-5 left-1/2 -translate-x-1/2 ${config.label}`}>
          <Icon name={config.icon} size={isFirst ? 24 : 20} />
        </div>
        {entry.avatarUrl ? (
          <img
            src={entry.avatarUrl}
            alt={entry.name}
            className={`rounded-full object-cover border-2 border-white/10 ${config.glow} ${isFirst ? 'w-20 h-20' : 'w-16 h-16'}`}
          />
        ) : (
          <div
            className={`rounded-full grid place-items-center font-black bg-gradient-to-br ${config.medal} border-2 border-white/10 ${config.glow} ${
              isFirst ? 'w-20 h-20 text-xl' : 'w-16 h-16 text-lg'
            }`}
          >
            {initials(entry.name)}
          </div>
        )}
      </div>

      <span className="text-sm font-bold text-white text-center truncate w-full px-1">{entry.name}</span>
      <span className="text-[10px] font-semibold text-gray-500 mb-2">
        {t('gamif.student.leaderboard.level')} {entry.level}
      </span>

      {/* Pedestal */}
      <div
        className={`w-full rounded-t-xl bg-gradient-to-b from-white/10 to-white/[0.02] border-x border-t border-white/5 flex flex-col items-center justify-center py-3 h-24 ${config.height} ${
          highlighted ? 'ring-1 ring-amber-400/50' : ''
        }`}
      >
        <span className={`text-2xl font-black bg-gradient-to-br ${config.medal} bg-clip-text text-transparent`}>#{place}</span>
        <span className="text-sm font-black text-white mt-1">{entry.value.toLocaleString()}</span>
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
      className={`flex items-center gap-3 md:gap-4 px-4 py-3 border-b border-white/5 last:border-b-0 transition-colors ${
        highlighted ? 'bg-amber-400/5 ring-1 ring-inset ring-amber-400/40' : 'hover:bg-white/5'
      }`}
    >
      {/* Rank */}
      <span className={`w-8 text-center text-sm font-black shrink-0 ${highlighted ? 'text-amber-400' : 'text-gray-500'}`}>
        #{entry.rank}
      </span>

      {/* Avatar */}
      {entry.avatarUrl ? (
        <img src={entry.avatarUrl} alt={entry.name} className="w-9 h-9 rounded-full object-cover border border-white/10 shrink-0" />
      ) : (
        <div className="w-9 h-9 rounded-full grid place-items-center text-xs font-black bg-white/10 text-gray-200 border border-white/10 shrink-0">
          {initials(entry.name)}
        </div>
      )}

      {/* Name + level/badges */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`font-bold text-sm truncate ${highlighted ? 'text-white' : 'text-gray-200'}`}>{entry.name}</span>
          {highlighted && (
            <span className="text-[9px] font-black uppercase tracking-wider text-amber-300 bg-amber-400/15 px-1.5 py-0.5 rounded-full shrink-0">
              {t('gamif.student.leaderboard.you')}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 text-[11px] text-gray-500 font-semibold mt-0.5">
          <span className="flex items-center gap-1">
            <Icon name="military_tech" size={12} className="text-cyan-400/70" /> {t('gamif.student.leaderboard.level')} {entry.level}
          </span>
          <span className="flex items-center gap-1">
            <Icon name="workspace_premium" size={12} className="text-amber-400/70" /> {entry.badgeCount}
          </span>
        </div>
      </div>

      {/* Scope value */}
      <span className="text-sm font-black text-white shrink-0 tabular-nums">{entry.value.toLocaleString()}</span>
    </div>
  );
}
