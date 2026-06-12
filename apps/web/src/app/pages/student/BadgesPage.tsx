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
    medallion: 'from-slate-200 to-slate-400 text-slate-800 dark:from-slate-500 dark:to-slate-700 dark:text-white',
    glow: 'shadow-[0_10px_24px_rgba(100,116,139,0.18)] dark:shadow-[0_0_18px_rgba(148,163,184,0.28)]',
    label: 'border border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-300/20 dark:bg-slate-400/10 dark:text-slate-200',
    ring: 'ring-slate-300/50 dark:ring-slate-400/30',
  },
  [BadgeRarity.RARE]: {
    medallion: 'from-sky-100 to-blue-300 text-sky-900 dark:from-sky-400 dark:to-blue-600 dark:text-white',
    glow: 'shadow-[0_10px_24px_rgba(2,132,199,0.2)] dark:shadow-[0_0_18px_rgba(56,189,248,0.36)]',
    label: 'border border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-300/20 dark:bg-sky-400/10 dark:text-sky-200',
    ring: 'ring-sky-300/50 dark:ring-sky-400/40',
  },
  [BadgeRarity.EPIC]: {
    medallion: 'from-purple-100 to-fuchsia-300 text-fuchsia-900 dark:from-purple-500 dark:to-fuchsia-600 dark:text-white',
    glow: 'shadow-[0_10px_24px_rgba(192,38,211,0.2)] dark:shadow-[0_0_18px_rgba(192,132,252,0.4)]',
    label: 'border border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700 dark:border-fuchsia-300/20 dark:bg-fuchsia-400/10 dark:text-fuchsia-200',
    ring: 'ring-fuchsia-300/50 dark:ring-fuchsia-400/40',
  },
  [BadgeRarity.LEGENDARY]: {
    medallion: 'from-amber-100 to-orange-300 text-amber-950 dark:from-amber-300 dark:to-orange-500 dark:text-amber-950',
    glow: 'shadow-[0_10px_26px_rgba(217,119,6,0.24)] dark:shadow-[0_0_22px_rgba(251,191,36,0.46)]',
    label: 'border border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-300/20 dark:bg-amber-400/10 dark:text-amber-200',
    ring: 'ring-amber-300/60 dark:ring-amber-400/50',
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
      <div className="grid min-h-[60vh] place-items-center text-on-surface-variant">
        <div className="flex flex-col items-center gap-4">
          <Icon name="sync" className="animate-spin text-primary" size={48} />
          <span className="text-sm font-medium">{t('common.loading')}</span>
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
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-lg py-lg text-on-surface">
      {/* ── Hero Header ── */}
      <header>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="font-manrope text-headline-md md:text-headline-lg font-extrabold text-on-surface mb-2 flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-tertiary-container text-on-tertiary-container flex items-center justify-center shadow-elev-1 dark:bg-amber-400/15 dark:text-amber-100 dark:ring-1 dark:ring-amber-200/25 dark:shadow-[0_0_34px_rgba(251,191,36,0.14)]">
                <Icon name="workspace_premium" size={28} />
              </div>
              {t('gamif.student.badges.title')}
            </h1>
            <p className="text-body-md text-on-surface-variant max-w-lg">{t('gamif.student.badges.subtitle')}</p>
          </div>

          {/* Quick stats */}
          <div className="flex gap-3 flex-wrap">
            <StatPill
              icon="verified"
              color="text-amber-700 dark:text-amber-300"
              bgColor="bg-amber-50 dark:bg-amber-400/10"
              value={String(earnedCount)}
              label={t('gamif.student.badges.statEarned')}
            />
            <StatPill
              icon="workspace_premium"
              color="text-cyan-700 dark:text-cyan-300"
              bgColor="bg-cyan-50 dark:bg-cyan-400/10"
              value={String(totalCount)}
              label={t('gamif.student.badges.statTotal')}
            />
          </div>
        </div>
      </header>

      {/* ── Filter pills ── */}
      <div className="flex gap-xs overflow-x-auto rounded-lg bg-surface-container-low p-xs dark:border dark:border-white/10 dark:bg-[#17131d]/90 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
        {filterOptions.map((opt) => (
          <button
            key={opt.key}
            onClick={() => setFilter(opt.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all duration-200 ${
              filter === opt.key
                ? 'bg-primary text-on-primary shadow-elev-1 dark:bg-primary-container dark:text-on-primary-container dark:ring-1 dark:ring-primary/30'
                : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface dark:hover:bg-white/[0.08] dark:hover:text-on-surface'
            }`}
          >
            <Icon name={opt.icon} size={16} />
            {opt.label}
          </button>
        ))}
      </div>

      {/* ── Badge grid ── */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-outline-variant bg-surface-container-low py-24 text-center dark:border-white/10 dark:bg-[#17131d]/70">
          <div className="w-20 h-20 rounded-lg bg-surface-container-high flex items-center justify-center mb-4 dark:bg-white/[0.06]">
            <Icon name="workspace_premium" size={40} className="text-on-surface-variant" />
          </div>
          <p className="text-sm text-on-surface-variant">{t('gamif.student.badges.empty')}</p>
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
      className={`relative overflow-hidden rounded-lg border bg-surface-container-lowest p-5 flex flex-col items-center text-center shadow-elev-1 transition-all duration-300 dark:bg-[#18151f]/95 ${
        earned
          ? `border-outline-variant hover:-translate-y-1 hover:border-primary/40 hover:shadow-elev-2 ring-1 dark:border-white/10 dark:hover:shadow-[0_18px_42px_rgba(0,0,0,0.28)] ${style.ring}`
          : 'border-outline-variant/70 bg-surface-container-low opacity-75 dark:border-white/5'
      }`}
    >
      {earned && (
        <div className="absolute top-3 right-3 text-emerald-700 dark:text-emerald-300">
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
      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md mb-2 ${style.label}`}>
        {t(`gamif.rarity.${p.badge.rarity}`)}
      </span>

      <h3 className={`font-bold text-base mb-1 ${earned ? 'text-on-surface' : 'text-on-surface-variant'}`}>
        {p.badge.title}
      </h3>
      {p.badge.description && (
        <p className="text-[12px] text-on-surface-variant leading-relaxed mb-4 line-clamp-2">
          {p.badge.description}
        </p>
      )}

      <div className="mt-auto w-full">
        {earned ? (
          <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-amber-700 dark:text-amber-300">
            <Icon name="event_available" size={14} />
            {t('gamif.student.badges.earnedOn', {
              date: p.earnedAt ? new Date(p.earnedAt).toLocaleDateString() : '',
            })}
          </div>
        ) : (
          <>
            <div className="flex justify-between text-[11px] font-semibold mb-1.5">
              <span className="text-on-surface-variant">
                {t('gamif.student.badges.progressTo', { current: p.current, threshold: p.threshold })}
              </span>
              <span className="text-primary">{p.percent}%</span>
            </div>
            <div className="w-full h-2 bg-surface-container-highest rounded-full overflow-hidden dark:bg-[#0a0a0f]">
              <div
                className="h-full rounded-full bg-primary transition-all duration-1000 ease-out"
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
    <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-container-lowest border border-outline-variant shadow-elev-1 dark:border-white/10 dark:bg-[#18151f]/95 dark:shadow-[0_16px_42px_rgba(0,0,0,0.24)]">
      <div className={`w-8 h-8 rounded-lg ${bgColor} flex items-center justify-center ${color}`}>
        <Icon name={icon} size={16} />
      </div>
      <div>
        <div className="text-sm font-black text-on-surface">{value}</div>
        <div className="text-[10px] text-on-surface-variant uppercase font-bold">{label}</div>
      </div>
    </div>
  );
}
