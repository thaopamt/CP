import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button, Icon, PageHeader, DataTable, StatusBadge, TabPills, useConfirm } from '@cp/ui';
import { QuestType, QuestStatus, QuestRecurrence, IQuest, QUEST_OBJECTIVE_META } from '@cp/shared';
import { useQuests, useDeleteQuest } from '../../../api/quests.queries';
import { usePortalBase } from '../../../hooks/usePortalBase';

type QuestTab = 'all' | QuestType;

const TYPE_CONFIG: Record<string, { icon: string; color: string; bgColor: string }> = {
  DAILY: { icon: 'today', color: 'text-emerald-400', bgColor: 'bg-emerald-400/10' },
  WEEKLY: { icon: 'date_range', color: 'text-sky-400', bgColor: 'bg-sky-400/10' },
  MAIN: { icon: 'auto_stories', color: 'text-cyan-400', bgColor: 'bg-cyan-400/10' },
  BOUNTY: { icon: 'local_fire_department', color: 'text-orange-400', bgColor: 'bg-orange-400/10' },
  EVENT: { icon: 'celebration', color: 'text-fuchsia-400', bgColor: 'bg-fuchsia-400/10' },
};

function statusTone(status: QuestStatus): 'success' | 'warning' | 'neutral' {
  if (status === QuestStatus.PUBLISHED) return 'success';
  if (status === QuestStatus.DRAFT) return 'warning';
  return 'neutral';
}

function formatDate(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function QuestsListPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const base = usePortalBase();
  const { data: quests, isLoading } = useQuests();
  const deleteMutation = useDeleteQuest();
  const [tab, setTab] = useState<QuestTab>('all');
  const [search, setSearch] = useState('');
  const confirm = useConfirm();

  const questList: IQuest[] = quests?.data ?? [];

  const filtered = useMemo(() => {
    let result = questList;
    if (tab !== 'all') result = result.filter((q) => q.type === tab);
    if (search.trim()) {
      const s = search.toLowerCase();
      result = result.filter(
        (q) => q.title.toLowerCase().includes(s) || q.description?.toLowerCase().includes(s),
      );
    }
    return result;
  }, [questList, tab, search]);

  const totalQuests = questList.length;
  const activeQuests = questList.filter((q) => q.isActive).length;
  const totalXp = questList.reduce((sum, q) => sum + q.rewardXp, 0);
  const totalGems = questList.reduce((sum, q) => sum + q.rewardGems, 0);

  const columns = [
    {
      key: 'title',
      header: t('gamif.admin.quests.colTitle'),
      cell: (q: IQuest) => {
        const cfg = TYPE_CONFIG[q.type];
        return (
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${cfg?.bgColor ?? 'bg-gray-500/10'} ${cfg?.color ?? 'text-gray-400'}`}
            >
              <Icon name={q.icon || 'military_tech'} size={20} />
            </div>
            <div className="min-w-0">
              <div className="font-semibold text-on-surface truncate">{q.title}</div>
              <div className="text-[11px] text-on-surface-variant flex items-center gap-1.5">
                <span className="inline-flex items-center gap-1">
                  <Icon name={cfg?.icon ?? 'help'} size={12} />
                  {t(`gamif.questType.${q.type}`)}
                </span>
                {q.description && (
                  <span className="truncate max-w-[240px]">· {q.description}</span>
                )}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      key: 'objective',
      header: t('gamif.admin.quests.colObjective'),
      cell: (q: IQuest) => {
        const unit = QUEST_OBJECTIVE_META[q.objectiveType]?.unit;
        return (
          <div className="min-w-0">
            <div className="text-body-sm text-on-surface truncate max-w-[220px]">
              {t(`gamif.objective.${q.objectiveType}`)}
            </div>
            <div className="text-[11px] text-on-surface-variant font-mono">
              ×{q.targetCount} {unit ? t(`gamif.unit.${unit}`) : ''}
            </div>
          </div>
        );
      },
    },
    {
      key: 'schedule',
      header: t('gamif.admin.quests.colSchedule'),
      cell: (q: IQuest) => {
        const start = formatDate(q.startsAt);
        const end = formatDate(q.endsAt);
        const window = start || end ? `${start ?? '…'} → ${end ?? '…'}` : null;
        return (
          <div className="text-[12px]">
            <span
              className={`inline-flex items-center gap-1 font-medium ${
                q.recurrence === QuestRecurrence.NONE ? 'text-on-surface-variant' : 'text-on-surface'
              }`}
            >
              <Icon name={q.recurrence === QuestRecurrence.NONE ? 'event_available' : 'autorenew'} size={13} />
              {t(`gamif.recurrence.${q.recurrence}`)}
            </span>
            {window && <div className="text-[11px] text-on-surface-variant mt-0.5">{window}</div>}
          </div>
        );
      },
    },
    {
      key: 'rewards',
      header: t('gamif.admin.quests.colRewards'),
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
      key: 'status',
      header: t('gamif.admin.quests.colStatus'),
      cell: (q: IQuest) => (
        <div className="flex flex-col items-start gap-1">
          <StatusBadge tone={statusTone(q.status)}>{t(`gamif.questStatus.${q.status}`)}</StatusBadge>
          <span className={`text-[11px] font-medium ${q.isActive ? 'text-tertiary' : 'text-on-surface-variant'}`}>
            {q.isActive ? t('gamif.admin.quests.active') : t('gamif.admin.quests.inactive')}
          </span>
        </div>
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
            onClick={() => navigate(`${base}/quests/${q.id}/edit`)}
          />
          <Button
            variant="ghost"
            size="sm"
            leadingIcon={<Icon name="delete" size={16} />}
            className="text-error hover:bg-error/10"
            onClick={async () => {
              const ok = await confirm({
                title: t('common.confirmDelete', 'Confirm'),
                message: t('gamif.admin.quests.deleteConfirm'),
                intent: 'danger',
              });
              if (ok) deleteMutation.mutate(q.id);
            }}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-lg">
      <PageHeader
        title={t('gamif.admin.quests.title')}
        subtitle={t('gamif.admin.quests.subtitle')}
        actions={
          <div className="flex items-center gap-sm">
            {base !== '/teacher' && (
              <Button
                variant="outline"
                leadingIcon={<Icon name="insights" size={18} />}
                onClick={() => navigate(`${base}/quests/analytics`)}
              >
                {t('gamif.admin.quests.analytics')}
              </Button>
            )}
            <Button leadingIcon={<Icon name="add" />} onClick={() => navigate(`${base}/quests/new`)}>
              {t('gamif.admin.quests.create')}
            </Button>
          </div>
        }
      />

      {/* KPI summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-md">
        <KpiMini icon="swords" color="text-primary" label={t('gamif.admin.quests.kpiTotal')} value={totalQuests} />
        <KpiMini icon="check_circle" color="text-tertiary" label={t('gamif.admin.quests.kpiActive')} value={activeQuests} />
        <KpiMini icon="star" color="text-emerald-500" label={t('gamif.admin.quests.kpiXp')} value={totalXp.toLocaleString()} />
        <KpiMini icon="diamond" color="text-fuchsia-500" label={t('gamif.admin.quests.kpiGems')} value={totalGems.toLocaleString()} />
      </div>

      {/* Filter bar */}
      <div className="bg-surface-container-lowest border border-outline-variant/50 rounded-xl shadow-sm overflow-hidden">
        <div className="px-md pt-md flex flex-col sm:flex-row sm:items-center gap-md border-b border-outline-variant/30 pb-md">
          <TabPills
            value={tab}
            onChange={setTab}
            options={[
              { value: 'all', label: t('common.all') },
              { value: QuestType.DAILY, label: t('gamif.questType.DAILY') },
              { value: QuestType.WEEKLY, label: t('gamif.questType.WEEKLY') },
              { value: QuestType.MAIN, label: t('gamif.questType.MAIN') },
              { value: QuestType.BOUNTY, label: t('gamif.questType.BOUNTY') },
              { value: QuestType.EVENT, label: t('gamif.questType.EVENT') },
            ]}
          />
          <div className="relative sm:ml-auto">
            <Icon name="search" size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('gamif.admin.quests.search')}
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
            <p className="text-on-surface-variant">{t('gamif.admin.quests.empty')}</p>
          </div>
        ) : (
          <DataTable columns={columns} rows={filtered} rowKey={(q: IQuest) => q.id} />
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
