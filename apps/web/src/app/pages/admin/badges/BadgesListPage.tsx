import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button, Icon, PageHeader, DataTable, StatusBadge, TabPills, useConfirm } from '@cp/ui';
import { IBadge, BadgeRarity } from '@cp/shared';
import { useBadges, useDeleteBadge } from '../../../api/badges.queries';
import { usePortalBase } from '../../../hooks/usePortalBase';

type BadgeTab = 'all' | BadgeRarity;

const RARITY_CONFIG: Record<BadgeRarity, { color: string; medallion: string; ring: string; tone: 'success' | 'warning' | 'error' | 'neutral' }> = {
  [BadgeRarity.COMMON]: {
    color: 'text-gray-500 dark:text-gray-300',
    medallion: 'from-gray-400/30 to-gray-500/10 text-gray-500 dark:text-gray-300',
    ring: 'border-gray-400',
    tone: 'neutral',
  },
  [BadgeRarity.RARE]: {
    color: 'text-blue-500 dark:text-blue-400',
    medallion: 'from-blue-400/30 to-blue-500/10 text-blue-500 dark:text-blue-400',
    ring: 'border-blue-400',
    tone: 'success',
  },
  [BadgeRarity.EPIC]: {
    color: 'text-purple-500 dark:text-purple-400',
    medallion: 'from-purple-400/30 to-purple-500/10 text-purple-500 dark:text-purple-400',
    ring: 'border-purple-400',
    tone: 'warning',
  },
  [BadgeRarity.LEGENDARY]: {
    color: 'text-amber-500 dark:text-amber-400',
    medallion: 'from-amber-400/40 to-amber-500/10 text-amber-500 dark:text-amber-400',
    ring: 'border-amber-400',
    tone: 'error',
  },
};

export default function BadgesListPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const base = usePortalBase();
  const { data: badges, isLoading } = useBadges();
  const deleteMutation = useDeleteBadge();
  const [tab, setTab] = useState<BadgeTab>('all');
  const [search, setSearch] = useState('');
  const confirm = useConfirm();

  const badgeList: IBadge[] = badges?.data ?? [];

  const filtered = useMemo(() => {
    let result = badgeList;
    if (tab !== 'all') result = result.filter((b) => b.rarity === tab);
    if (search.trim()) {
      const s = search.toLowerCase();
      result = result.filter(
        (b) =>
          b.title.toLowerCase().includes(s) ||
          b.code.toLowerCase().includes(s) ||
          b.description?.toLowerCase().includes(s),
      );
    }
    return result;
  }, [badgeList, tab, search]);

  // KPI stats
  const totalBadges = badgeList.length;
  const activeBadges = badgeList.filter((b) => b.isActive).length;
  const totalEarned = badgeList.reduce((sum, b) => sum + (b.earnedCount ?? 0), 0);
  const legendaryCount = badgeList.filter((b) => b.rarity === BadgeRarity.LEGENDARY).length;

  const columns = [
    {
      key: 'badge',
      header: t('gamif.admin.badges.colBadge'),
      cell: (b: IBadge) => {
        const cfg = RARITY_CONFIG[b.rarity] ?? RARITY_CONFIG[BadgeRarity.COMMON];
        return (
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-full grid place-items-center shrink-0 bg-gradient-to-br ${cfg.medallion} ring-2 ${cfg.ring}`}>
              <Icon name={b.icon || 'workspace_premium'} size={22} />
            </div>
            <div className="min-w-0">
              <div className="font-semibold text-on-surface truncate">{b.title}</div>
              <div className="text-[12px] text-on-surface-variant font-mono truncate max-w-[220px]">{b.code}</div>
            </div>
          </div>
        );
      },
    },
    {
      key: 'rarity',
      header: t('gamif.admin.badges.colRarity'),
      cell: (b: IBadge) => {
        const cfg = RARITY_CONFIG[b.rarity] ?? RARITY_CONFIG[BadgeRarity.COMMON];
        return <StatusBadge tone={cfg.tone}>{t(`gamif.rarity.${b.rarity}`)}</StatusBadge>;
      },
    },
    {
      key: 'criteria',
      header: t('gamif.admin.badges.colCriteria'),
      cell: (b: IBadge) => (
        <span className="text-[13px] text-on-surface-variant">
          {t(`gamif.criteria.${b.criteria.type}`)} <span className="font-mono">≥ {b.criteria.threshold}</span>
        </span>
      ),
    },
    {
      key: 'reward',
      header: t('gamif.admin.badges.colReward'),
      cell: (b: IBadge) => (
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 text-[12px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-md">
            <Icon name="star" size={12} /> {b.rewardXp} XP
          </span>
          <span className="inline-flex items-center gap-1 text-[12px] font-bold text-fuchsia-600 dark:text-fuchsia-400 bg-fuchsia-400/10 px-2 py-0.5 rounded-md">
            <Icon name="diamond" size={12} /> {b.rewardGems}
          </span>
        </div>
      ),
    },
    {
      key: 'earned',
      header: t('gamif.admin.badges.colEarned'),
      cell: (b: IBadge) => (
        <span className="text-[13px] text-on-surface-variant">
          {t('gamif.admin.badges.students', { count: b.earnedCount ?? 0 })}
        </span>
      ),
    },
    {
      key: 'status',
      header: t('gamif.admin.badges.colStatus'),
      cell: (b: IBadge) => (
        <StatusBadge tone={b.isActive ? 'success' : 'neutral'}>
          {b.isActive ? t('gamif.admin.quests.active') : t('gamif.admin.quests.inactive')}
        </StatusBadge>
      ),
    },
    {
      key: 'actions',
      header: '',
      cell: (b: IBadge) => (
        <div className="flex gap-1 justify-end">
          <Button
            variant="ghost"
            size="sm"
            leadingIcon={<Icon name="edit" size={16} />}
            onClick={() => navigate(`${base}/badges/${b.id}/edit`)}
          />
          <Button
            variant="ghost"
            size="sm"
            leadingIcon={<Icon name="delete" size={16} />}
            className="text-error hover:bg-error/10"
            onClick={async () => {
              const ok = await confirm({
                title: t('common.confirmDelete', 'Confirm'),
                message: t('gamif.admin.badges.deleteConfirm'),
                intent: 'danger',
              });
              if (ok) {
                deleteMutation.mutate(b.id);
              }
            }}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-lg">
      <PageHeader
        title={t('gamif.admin.badges.title')}
        subtitle={t('gamif.admin.badges.subtitle')}
        actions={
          <Button leadingIcon={<Icon name="add" />} onClick={() => navigate(`${base}/badges/new`)}>
            {t('gamif.admin.badges.create')}
          </Button>
        }
      />

      {/* KPI summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-md">
        <KpiMini icon="workspace_premium" color="text-primary" label={t('gamif.admin.badges.title')} value={totalBadges} />
        <KpiMini icon="check_circle" color="text-tertiary" label={t('gamif.admin.quests.active')} value={activeBadges} />
        <KpiMini icon="groups" color="text-emerald-500" label={t('gamif.admin.badges.colEarned')} value={totalEarned.toLocaleString()} />
        <KpiMini icon="trophy" color="text-amber-500" label={t('gamif.rarity.LEGENDARY')} value={legendaryCount} />
      </div>

      {/* Filter bar */}
      <div className="bg-surface-container-lowest border border-outline-variant/50 rounded-xl shadow-sm overflow-hidden">
        <div className="px-md pt-md flex flex-col sm:flex-row sm:items-center gap-md border-b border-outline-variant/30 pb-md">
          <TabPills
            value={tab}
            onChange={setTab}
            options={[
              { value: 'all', label: t('common.all') },
              ...(Object.values(BadgeRarity) as BadgeRarity[]).map((r) => ({
                value: r,
                label: t(`gamif.rarity.${r}`),
              })),
            ]}
          />
          <div className="relative sm:ml-auto">
            <Icon name="search" size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('gamif.admin.badges.search')}
              className="pl-9 pr-4 py-2 bg-surface-container-highest border-none rounded-lg text-label-sm focus:ring-2 focus:ring-primary w-full sm:w-[260px] outline-none"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="p-12 flex justify-center">
            <Icon name="sync" className="animate-spin text-primary" size={32} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Icon name="search_off" size={48} className="text-on-surface-variant/30 mx-auto mb-sm" />
            <p className="text-on-surface-variant">{t('gamif.admin.badges.empty')}</p>
          </div>
        ) : (
          <DataTable columns={columns} rows={filtered} rowKey={(b: IBadge) => b.id} />
        )}
      </div>
    </div>
  );
}

/* ── tiny KPI card ── */
function KpiMini({ icon, color, label, value }: { icon: string; color: string; label: string; value: string | number }) {
  return (
    <div className="bg-surface-container-lowest border border-outline-variant/50 rounded-xl p-md flex items-center gap-sm">
      <div className={`w-10 h-10 rounded-lg bg-surface-container-high grid place-items-center ${color}`}>
        <Icon name={icon} size={20} />
      </div>
      <div>
        <div className="text-[12px] text-on-surface-variant uppercase tracking-wider font-medium">{label}</div>
        <div className="font-manrope text-headline-md text-on-surface font-bold">{value}</div>
      </div>
    </div>
  );
}
