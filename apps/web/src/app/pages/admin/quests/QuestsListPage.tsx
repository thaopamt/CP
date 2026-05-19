import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button, Icon, PageHeader, DataTable, StatusBadge, TabPills } from '@cp/ui';
import { QuestType, IQuest } from '@cp/shared';
import { useQuests, useDeleteQuest } from '../../../api/quests.queries';

type QuestTab = 'all' | 'DAILY' | 'MAIN' | 'BOUNTY';

const TYPE_CONFIG: Record<string, { icon: string; color: string; bgColor: string }> = {
  DAILY: { icon: 'today', color: 'text-emerald-400', bgColor: 'bg-emerald-400/10' },
  MAIN: { icon: 'auto_stories', color: 'text-cyan-400', bgColor: 'bg-cyan-400/10' },
  BOUNTY: { icon: 'local_fire_department', color: 'text-orange-400', bgColor: 'bg-orange-400/10' },
};

export default function QuestsListPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: quests, isLoading } = useQuests();
  const deleteMutation = useDeleteQuest();
  const [tab, setTab] = useState<QuestTab>('all');
  const [search, setSearch] = useState('');

  const questList: IQuest[] = quests?.data || [];

  const filtered = useMemo(() => {
    let result = questList;
    if (tab !== 'all') result = result.filter((q) => q.type === tab);
    if (search.trim()) {
      const s = search.toLowerCase();
      result = result.filter((q) => q.title.toLowerCase().includes(s) || q.description?.toLowerCase().includes(s));
    }
    return result;
  }, [questList, tab, search]);

  // KPI stats
  const totalQuests = questList.length;
  const activeQuests = questList.filter((q) => q.isActive).length;
  const totalXp = questList.reduce((sum, q) => sum + q.rewardXp, 0);
  const totalGems = questList.reduce((sum, q) => sum + q.rewardGems, 0);

  const columns = [
    {
      key: 'title',
      header: t('pages.admin.questsList.columns.title'),
      cell: (q: IQuest) => (
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${TYPE_CONFIG[q.type]?.bgColor ?? 'bg-gray-500/10'} ${TYPE_CONFIG[q.type]?.color ?? 'text-gray-400'}`}>
            <Icon name={q.icon || 'military_tech'} size={20} />
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-on-surface truncate">{q.title}</div>
            {q.description && (
              <div className="text-[12px] text-on-surface-variant truncate max-w-[300px]">{q.description}</div>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'type',
      header: t('pages.admin.questsList.columns.type'),
      cell: (q: IQuest) => {
        const cfg = TYPE_CONFIG[q.type];
        return (
          <span className={`inline-flex items-center gap-1.5 text-[12px] font-bold px-2.5 py-1 rounded-full ${cfg?.bgColor ?? ''} ${cfg?.color ?? ''}`}>
            <Icon name={cfg?.icon ?? 'help'} size={14} />
            {t(`pages.admin.questForm.types.${q.type}`)}
          </span>
        );
      },
    },
    {
      key: 'targetCount',
      header: t('pages.admin.questsList.columns.target'),
      cell: (q: IQuest) => (
        <span className="font-mono text-on-surface-variant">{q.targetCount}</span>
      ),
    },
    {
      key: 'rewards',
      header: t('pages.admin.questsList.columns.rewards'),
      cell: (q: IQuest) => (
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 text-[12px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-md">
            <Icon name="star" size={12} /> {q.rewardXp} XP
          </span>
          <span className="inline-flex items-center gap-1 text-[12px] font-bold text-fuchsia-600 dark:text-fuchsia-400 bg-fuchsia-400/10 px-2 py-0.5 rounded-md">
            <Icon name="diamond" size={12} /> {q.rewardGems}
          </span>
        </div>
      ),
    },
    {
      key: 'isActive',
      header: t('pages.admin.questsList.columns.status'),
      cell: (q: IQuest) => (
        <StatusBadge tone={q.isActive ? 'success' : 'neutral'}>
          {q.isActive ? t('pages.admin.questsList.statusActive') : t('pages.admin.questsList.statusInactive')}
        </StatusBadge>
      ),
    },
    {
      key: 'actions',
      header: '',
      cell: (q: IQuest) => (
        <div className="flex gap-1 justify-end">
          <Button
            variant="ghost"
            size="sm"
            leadingIcon={<Icon name="edit" size={16} />}
            onClick={() => navigate(`/admin/quests/${q.id}/edit`)}
          />
          <Button
            variant="ghost"
            size="sm"
            leadingIcon={<Icon name="delete" size={16} />}
            className="text-error hover:bg-error/10"
            onClick={() => {
              if (window.confirm(t('pages.admin.questsList.deleteConfirm'))) {
                deleteMutation.mutate(q.id);
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
        title={t('pages.admin.questsList.title')}
        subtitle={t('pages.admin.questsList.subtitle')}
        actions={
          <Button leadingIcon={<Icon name="add" />} onClick={() => navigate('/admin/quests/new')}>
            {t('pages.admin.questsList.create')}
          </Button>
        }
      />

      {/* KPI summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-md">
        <KpiMini icon="swords" color="text-primary" label={t('pages.admin.questsList.kpi.total')} value={totalQuests} />
        <KpiMini icon="check_circle" color="text-tertiary" label={t('pages.admin.questsList.kpi.active')} value={activeQuests} />
        <KpiMini icon="star" color="text-emerald-500" label={t('pages.admin.questsList.kpi.totalXp')} value={totalXp.toLocaleString()} />
        <KpiMini icon="diamond" color="text-fuchsia-500" label={t('pages.admin.questsList.kpi.totalGems')} value={totalGems.toLocaleString()} />
      </div>

      {/* Filter bar */}
      <div className="bg-surface-container-lowest border border-outline-variant/50 rounded-xl shadow-sm overflow-hidden">
        <div className="px-md pt-md flex flex-col sm:flex-row sm:items-center gap-md border-b border-outline-variant/30 pb-md">
          <TabPills
            value={tab}
            onChange={setTab}
            options={[
              { value: 'all', label: t('common.all') },
              { value: 'DAILY', label: t('pages.admin.questForm.types.DAILY') },
              { value: 'MAIN', label: t('pages.admin.questForm.types.MAIN') },
              { value: 'BOUNTY', label: t('pages.admin.questForm.types.BOUNTY') },
            ]}
          />
          <div className="relative sm:ml-auto">
            <Icon name="search" size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('pages.admin.questsList.searchPlaceholder')}
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
            <p className="text-on-surface-variant">{t('pages.admin.questsList.empty')}</p>
          </div>
        ) : (
          <DataTable
            columns={columns}
            rows={filtered}
            rowKey={(q: IQuest) => q.id}
          />
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
