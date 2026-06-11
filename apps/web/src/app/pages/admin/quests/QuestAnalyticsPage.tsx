import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button, Icon, PageHeader, DataTable } from '@cp/ui';
import { IQuestAnalyticsRow } from '@cp/shared';
import { useQuestAnalytics } from '../../../api/gamification.queries';
import { usePortalBase } from '../../../hooks/usePortalBase';

export default function QuestAnalyticsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const base = usePortalBase();
  const { data, isLoading } = useQuestAnalytics();

  if (isLoading) {
    return (
      <div className="p-12 flex justify-center">
        <Icon name="sync" className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  const rows = data?.rows ?? [];
  const funnel = data?.funnel ?? { inProgress: 0, completed: 0, claimed: 0 };
  const funnelMax = Math.max(funnel.inProgress, funnel.completed, funnel.claimed, 1);

  const funnelBars: Array<{ key: string; label: string; value: number; color: string }> = [
    { key: 'inProgress', label: t('gamif.admin.analytics.funnelInProgress'), value: funnel.inProgress, color: 'bg-sky-500' },
    { key: 'completed', label: t('gamif.admin.analytics.funnelCompleted'), value: funnel.completed, color: 'bg-emerald-500' },
    { key: 'claimed', label: t('gamif.admin.analytics.funnelClaimed'), value: funnel.claimed, color: 'bg-fuchsia-500' },
  ];

  const columns = [
    {
      key: 'quest',
      header: t('gamif.admin.analytics.colQuest'),
      cell: (r: IQuestAnalyticsRow) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-surface-container-high grid place-items-center text-primary shrink-0">
            <Icon name={r.icon || 'military_tech'} size={18} />
          </div>
          <span className="font-semibold text-on-surface truncate max-w-[260px]">{r.title}</span>
        </div>
      ),
    },
    {
      key: 'assigned',
      header: t('gamif.admin.analytics.colAssigned'),
      cell: (r: IQuestAnalyticsRow) => <span className="font-mono text-on-surface-variant">{r.assignedCount}</span>,
    },
    {
      key: 'inProgress',
      header: t('gamif.admin.analytics.colInProgress'),
      cell: (r: IQuestAnalyticsRow) => <span className="font-mono text-on-surface-variant">{r.inProgressCount}</span>,
    },
    {
      key: 'completed',
      header: t('gamif.admin.analytics.colCompleted'),
      cell: (r: IQuestAnalyticsRow) => <span className="font-mono text-on-surface-variant">{r.completedCount}</span>,
    },
    {
      key: 'claimed',
      header: t('gamif.admin.analytics.colClaimed'),
      cell: (r: IQuestAnalyticsRow) => <span className="font-mono text-on-surface-variant">{r.claimedCount}</span>,
    },
    {
      key: 'rate',
      header: t('gamif.admin.analytics.colRate'),
      cell: (r: IQuestAnalyticsRow) => {
        const pct = Math.max(0, Math.min(100, Math.round(r.completionRate)));
        return (
          <div className="flex items-center gap-2 min-w-[120px]">
            <div className="flex-1 h-2 rounded-full bg-surface-container-high overflow-hidden">
              <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-[12px] font-semibold text-on-surface tabular-nums w-9 text-right">{pct}%</span>
          </div>
        );
      },
    },
    {
      key: 'xp',
      header: t('gamif.admin.analytics.colXp'),
      cell: (r: IQuestAnalyticsRow) => (
        <span className="inline-flex items-center gap-1 text-[12px] font-bold text-emerald-600 dark:text-emerald-400">
          <Icon name="star" size={12} /> {r.xpAwarded.toLocaleString()}
        </span>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-lg">
      <PageHeader
        title={t('gamif.admin.analytics.title')}
        subtitle={t('gamif.admin.analytics.subtitle')}
        breadcrumb={
          <Button variant="ghost" leadingIcon={<Icon name="arrow_back" />} onClick={() => navigate(`${base}/quests`)}>
            {t('gamif.admin.quests.title')}
          </Button>
        }
      />

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-md">
        <KpiMini icon="assignment" color="text-primary" label={t('gamif.admin.analytics.kpiAssigned')} value={(data?.totalAssignments ?? 0).toLocaleString()} />
        <KpiMini icon="check_circle" color="text-emerald-500" label={t('gamif.admin.analytics.kpiCompleted')} value={(data?.totalCompleted ?? 0).toLocaleString()} />
        <KpiMini icon="redeem" color="text-fuchsia-500" label={t('gamif.admin.analytics.kpiClaimed')} value={(data?.totalClaimed ?? 0).toLocaleString()} />
        <KpiMini icon="star" color="text-amber-500" label={t('gamif.admin.analytics.kpiXp')} value={(data?.totalXpAwarded ?? 0).toLocaleString()} />
        <KpiMini icon="diamond" color="text-fuchsia-400" label={t('gamif.admin.analytics.kpiGems')} value={(data?.totalGemsAwarded ?? 0).toLocaleString()} />
      </div>

      {/* Funnel */}
      <div className="bg-surface-container-lowest border border-outline-variant/50 rounded-xl shadow-sm p-lg">
        <h3 className="font-manrope text-headline-sm text-on-surface font-bold mb-md flex items-center gap-sm">
          <Icon name="filter_alt" size={18} className="text-primary" />
          {t('gamif.admin.analytics.funnel')}
        </h3>
        <div className="flex flex-col gap-md">
          {funnelBars.map((bar) => (
            <div key={bar.key} className="flex items-center gap-md">
              <span className="w-24 shrink-0 text-[12px] font-medium text-on-surface-variant">{bar.label}</span>
              <div className="flex-1 h-7 rounded-lg bg-surface-container-high overflow-hidden">
                <div
                  className={`h-full ${bar.color} rounded-lg transition-all duration-500 flex items-center justify-end pr-2`}
                  style={{ width: `${Math.max((bar.value / funnelMax) * 100, bar.value > 0 ? 6 : 0)}%` }}
                >
                  {bar.value > 0 && <span className="text-[11px] font-bold text-white">{bar.value.toLocaleString()}</span>}
                </div>
              </div>
              {bar.value === 0 && <span className="text-[11px] text-on-surface-variant w-8">0</span>}
            </div>
          ))}
        </div>
      </div>

      {/* Per-quest table */}
      <div className="bg-surface-container-lowest border border-outline-variant/50 rounded-xl shadow-sm overflow-hidden">
        <div className="px-lg py-md border-b border-outline-variant/30">
          <h3 className="font-manrope text-headline-sm text-on-surface font-bold flex items-center gap-sm">
            <Icon name="table_rows" size={18} className="text-secondary" />
            {t('gamif.admin.analytics.perQuest')}
          </h3>
        </div>
        {rows.length === 0 ? (
          <div className="p-12 text-center">
            <Icon name="query_stats" size={48} className="text-on-surface-variant/30 mx-auto mb-sm" />
            <p className="text-on-surface-variant">{t('gamif.admin.analytics.empty')}</p>
          </div>
        ) : (
          <DataTable columns={columns} rows={rows} rowKey={(r: IQuestAnalyticsRow) => r.questId} />
        )}
      </div>
    </div>
  );
}

function KpiMini({ icon, color, label, value }: { icon: string; color: string; label: string; value: string | number }) {
  return (
    <div className="bg-surface-container-lowest border border-outline-variant/50 rounded-xl p-md flex items-center gap-sm">
      <div className={`w-10 h-10 rounded-lg bg-surface-container-high grid place-items-center ${color}`}>
        <Icon name={icon} size={20} />
      </div>
      <div className="min-w-0">
        <div className="text-[12px] text-on-surface-variant uppercase tracking-wider font-medium truncate">{label}</div>
        <div className="font-manrope text-headline-md text-on-surface font-bold">{value}</div>
      </div>
    </div>
  );
}
