import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Icon } from '@cp/ui';
import { BadgeRarity, IStudentBadgeProgress } from '@cp/shared';
import { useBadgeCatalog } from '../../api/badges.queries';

type BadgeFilter = 'all' | 'earned' | 'locked';
type TFn = (key: string, opts?: Record<string, unknown>) => string;

interface RarityStyle {
  medallion: string;
  glow: string;
  label: string;
  ring: string;
}

const RARITY_STYLE: Record<BadgeRarity, RarityStyle> = {
  [BadgeRarity.COMMON]: {
    medallion: 'from-gray-500 to-gray-700 text-white',
    glow: 'shadow-[0_0_18px_rgba(148,163,184,0.35)]',
    label: 'text-gray-300 bg-gray-400/10',
    ring: 'ring-gray-400/30',
  },
  [BadgeRarity.RARE]: {
    medallion: 'from-sky-400 to-blue-600 text-white',
    glow: 'shadow-[0_0_18px_rgba(56,189,248,0.45)]',
    label: 'text-sky-300 bg-sky-400/10',
    ring: 'ring-sky-400/40',
  },
  [BadgeRarity.EPIC]: {
    medallion: 'from-purple-500 to-fuchsia-600 text-white',
    glow: 'shadow-[0_0_18px_rgba(192,132,252,0.5)]',
    label: 'text-fuchsia-300 bg-fuchsia-400/10',
    ring: 'ring-fuchsia-400/40',
  },
  [BadgeRarity.LEGENDARY]: {
    medallion: 'from-amber-300 to-orange-500 text-amber-950',
    glow: 'shadow-[0_0_22px_rgba(251,191,36,0.6)]',
    label: 'text-amber-300 bg-amber-400/10',
    ring: 'ring-amber-400/50',
  },
};

export default function StudentBadgesPage() {
  const { t } = useTranslation();
  const { data: catalog, isLoading } = useBadgeCatalog();
  const [filter, setFilter] = useState<BadgeFilter>('all');

  const all = catalog ?? [];
  const earnedCount = all.filter((p) => p.earned).length;
  const totalCount = all.length;

  const filtered = useMemo(() => {
    if (filter === 'earned') return all.filter((p) => p.earned);
    if (filter === 'locked') return all.filter((p) => !p.earned);
    return all;
  }, [all, filter]);

  if (isLoading) {
    return (
      <div className="min-h-screen p-8 flex items-center justify-center bg-[#0f0f13]">
        <div className="flex flex-col items-center gap-4">
          <Icon name="sync" className="animate-spin text-emerald-400" size={48} />
          <span className="text-gray-500 text-sm font-medium">{t('common.loading')}</span>
        </div>
      </div>
    );
  }

  const filterOptions: { key: BadgeFilter; label: string; icon: string }[] = [
    { key: 'all', label: t('gamif.student.badges.all'), icon: 'apps' },
    { key: 'earned', label: t('gamif.student.badges.earned'), icon: 'verified' },
    { key: 'locked', label: t('gamif.student.badges.locked'), icon: 'lock' },
  ];

  return (
    <div className="min-h-screen text-gray-200 p-4 md:p-8 font-sans" style={{ backgroundColor: '#0f0f13' }}>
      {/* ── Hero Header ── */}
      <header className="mb-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-white mb-2 flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-[0_4px_15px_rgba(251,191,36,0.3)]">
                <Icon name="workspace_premium" size={28} className="text-white" />
              </div>
              {t('gamif.student.badges.title')}
            </h1>
            <p className="text-gray-400 max-w-lg">{t('gamif.student.badges.subtitle')}</p>
          </div>

          {/* Quick stats */}
          <div className="flex gap-3 flex-wrap">
            <StatPill
              icon="verified"
              color="text-amber-400"
              bgColor="bg-amber-400/10"
              value={String(earnedCount)}
              label={t('gamif.student.badges.statEarned')}
            />
            <StatPill
              icon="workspace_premium"
              color="text-cyan-400"
              bgColor="bg-cyan-400/10"
              value={String(totalCount)}
              label={t('gamif.student.badges.statTotal')}
            />
          </div>
        </div>
      </header>

      {/* ── Filter pills ── */}
      <div className="flex gap-2 mb-8 overflow-x-auto pb-1">
        {filterOptions.map((opt) => (
          <button
            key={opt.key}
            onClick={() => setFilter(opt.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all duration-200 ${
              filter === opt.key
                ? 'bg-white/10 text-white border border-white/20 shadow-lg'
                : 'bg-white/5 text-gray-400 border border-transparent hover:bg-white/10 hover:text-gray-200'
            }`}
          >
            <Icon name={opt.icon} size={16} />
            {opt.label}
          </button>
        ))}
      </div>

      {/* ── Badge grid ── */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-20 h-20 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
            <Icon name="workspace_premium" size={40} className="text-gray-600" />
          </div>
          <p className="text-sm text-gray-500">{t('gamif.student.badges.empty')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map((p) => (
            <BadgeCard key={p.badge.id} p={p} t={t} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Badge Card ── */
function BadgeCard({ p, t }: { p: IStudentBadgeProgress; t: TFn }) {
  const style = RARITY_STYLE[p.badge.rarity];
  const earned = p.earned;

  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-[#16161e] border p-5 flex flex-col items-center text-center transition-all duration-300 ${
        earned ? `border-white/10 hover:-translate-y-1 hover:shadow-xl ring-1 ${style.ring}` : 'border-white/5 opacity-80'
      }`}
    >
      {earned && (
        <div className="absolute top-3 right-3 text-emerald-400">
          <Icon name="check_circle" size={18} />
        </div>
      )}

      {/* Medallion */}
      <div
        className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 bg-gradient-to-br ${style.medallion} ${
          earned ? style.glow : 'grayscale opacity-50'
        }`}
      >
        <Icon name={p.badge.icon} size={40} />
      </div>

      {/* Rarity label */}
      <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full mb-2 ${style.label}`}>
        {t(`gamif.rarity.${p.badge.rarity}`)}
      </span>

      <h3 className={`font-bold text-base mb-1 ${earned ? 'text-white' : 'text-gray-400'}`}>{p.badge.title}</h3>
      {p.badge.description && <p className="text-[12px] text-gray-500 leading-relaxed mb-4 line-clamp-2">{p.badge.description}</p>}

      <div className="mt-auto w-full">
        {earned ? (
          <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-amber-300">
            <Icon name="event_available" size={14} />
            {t('gamif.student.badges.earnedOn', {
              date: p.earnedAt ? new Date(p.earnedAt).toLocaleDateString() : '',
            })}
          </div>
        ) : (
          <>
            <div className="flex justify-between text-[11px] font-semibold mb-1.5">
              <span className="text-gray-500">{t('gamif.student.badges.progressTo', { current: p.current, threshold: p.threshold })}</span>
              <span className="text-cyan-400">{p.percent}%</span>
            </div>
            <div className="w-full h-2 bg-[#0a0a0f] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-cyan-400 transition-all duration-1000 ease-out"
                style={{ width: `${Math.min(100, Math.max(0, p.percent))}%` }}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ── Stat Pill ── */
function StatPill({
  icon,
  color,
  bgColor,
  value,
  label,
}: {
  icon: string;
  color: string;
  bgColor: string;
  value: string;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#16161e] border border-white/5">
      <div className={`w-8 h-8 rounded-lg ${bgColor} flex items-center justify-center ${color}`}>
        <Icon name={icon} size={16} />
      </div>
      <div>
        <div className="text-sm font-black text-white">{value}</div>
        <div className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">{label}</div>
      </div>
    </div>
  );
}
