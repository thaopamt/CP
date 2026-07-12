import { useMemo, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Icon } from '@cp/ui';
import {
  QuestType,
  QuestRecurrence,
  StudentQuestStatus,
  IStudentQuest,
  QUEST_OBJECTIVE_META,
} from '@cp/shared';
import { useMyQuests } from '../../api/quests.queries';
import { getQuestRecurrenceLabelKey } from '../../lib/quest-recurrence-label';

type QuestFilter = 'all' | 'in_progress' | 'done' | 'locked';
type TFn = (key: string, opts?: Record<string, unknown>) => string;

export default function StudentQuestsPage() {
  const { t } = useTranslation();
  const { data: quests, isLoading } = useMyQuests();
  const [filter, setFilter] = useState<QuestFilter>('all');
  const [selected, setSelected] = useState<IStudentQuest | null>(null);

  const allQuests = quests ?? [];

  // Resolve a prerequisite quest's title for the detail panel.
  const questTitleById = useMemo(() => {
    const m = new Map<string, string>();
    allQuests.forEach((q) => m.set(q.questId, q.quest.title));
    return m;
  }, [allQuests]);

  // Keep the open detail panel in sync with freshly refetched data.
  const selectedLive = selected ? (allQuests.find((q) => q.id === selected.id) ?? selected) : null;

  // Stats — rewards are auto-granted on completion, so "done" == COMPLETED|CLAIMED.
  const isDone = (q: IStudentQuest) =>
    q.status === StudentQuestStatus.COMPLETED || q.status === StudentQuestStatus.CLAIMED;
  const totalQuests = allQuests.length;
  const completedCount = allQuests.filter(isDone).length;
  const totalXpEarned = allQuests.filter(isDone).reduce((s, q) => s + q.quest.rewardXp, 0);

  // Filtered & grouped
  const filteredQuests = useMemo(() => {
    if (filter === 'in_progress') return allQuests.filter((q) => q.status === StudentQuestStatus.IN_PROGRESS);
    if (filter === 'done')
      return allQuests.filter(
        (q) => q.status === StudentQuestStatus.COMPLETED || q.status === StudentQuestStatus.CLAIMED,
      );
    if (filter === 'locked') return allQuests.filter((q) => q.status === StudentQuestStatus.LOCKED);
    return allQuests;
  }, [allQuests, filter]);

  const byType = (type: QuestType) => filteredQuests.filter((q) => q.quest.type === type);
  const dailyQuests = useMemo(() => byType(QuestType.DAILY), [filteredQuests]);
  const weeklyQuests = useMemo(() => byType(QuestType.WEEKLY), [filteredQuests]);
  const mainQuests = useMemo(() => byType(QuestType.MAIN), [filteredQuests]);
  const bountyQuests = useMemo(() => byType(QuestType.BOUNTY), [filteredQuests]);
  const eventQuests = useMemo(() => byType(QuestType.EVENT), [filteredQuests]);

  // Keep every quest category visible in one peer grid.
  const columns = useMemo(() => {
    const cols: {
      key: string;
      icon: string;
      iconColor: string;
      bgGlow: string;
      title: string;
      quests: IStudentQuest[];
    }[] = [
        {
          key: 'daily',
          icon: 'today',
          iconColor: 'text-emerald-700 dark:text-emerald-200',
          bgGlow: 'bg-emerald-50 dark:bg-emerald-500/[0.12]',
          title: t('gamif.student.quests.daily'),
          quests: dailyQuests,
        },
        {
          key: 'weekly',
          icon: 'date_range',
          iconColor: 'text-sky-700 dark:text-sky-200',
          bgGlow: 'bg-sky-50 dark:bg-sky-500/[0.12]',
          title: t('gamif.student.quests.weekly'),
          quests: weeklyQuests,
        },
        {
          key: 'main',
          icon: 'auto_stories',
          iconColor: 'text-cyan-700 dark:text-cyan-200',
          bgGlow: 'bg-cyan-50 dark:bg-cyan-500/[0.12]',
          title: t('gamif.student.quests.main'),
          quests: mainQuests,
        },
        {
          key: 'bounty',
          icon: 'local_fire_department',
          iconColor: 'text-orange-700 dark:text-orange-200',
          bgGlow: 'bg-orange-50 dark:bg-orange-500/[0.13]',
          title: t('gamif.student.quests.bounty'),
          quests: bountyQuests,
        },
        {
          key: 'event',
          icon: 'celebration',
          iconColor: 'text-fuchsia-700 dark:text-fuchsia-200',
          bgGlow: 'bg-fuchsia-50 dark:bg-fuchsia-500/[0.12]',
          title: t('gamif.student.quests.event'),
          quests: eventQuests,
        },
      ];
    return cols;
  }, [t, dailyQuests, weeklyQuests, mainQuests, bountyQuests, eventQuests]);

  if (isLoading) {
    return (
      <div className="grid min-h-[60vh] place-items-center text-on-surface-variant">
        <div className="flex flex-col items-center gap-4">
          <Icon name="sync" className="animate-spin text-primary" size={48} />
          <span className="text-sm font-medium">{t('gamif.student.quests.loading')}</span>
        </div>
      </div>
    );
  }

  const filterOptions: { key: QuestFilter; label: string; icon: string }[] = [
    { key: 'all', label: t('gamif.student.quests.filterAll'), icon: 'apps' },
    { key: 'in_progress', label: t('gamif.student.quests.filterInProgress'), icon: 'pending' },
    { key: 'done', label: t('gamif.student.quests.filterDone'), icon: 'task_alt' },
    { key: 'locked', label: t('gamif.student.quests.filterLocked'), icon: 'lock' },
  ];

  return (
    <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-lg py-lg text-on-surface">
      {/* ── Hero Header ── */}
      <header>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="font-manrope text-headline-md md:text-headline-lg font-extrabold text-on-surface mb-2 flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-tertiary-container text-on-tertiary-container flex items-center justify-center shadow-elev-1 dark:bg-amber-400/15 dark:text-amber-100 dark:ring-1 dark:ring-amber-200/25 dark:shadow-[0_0_34px_rgba(251,191,36,0.14)]">
                <Icon name="swords" size={28} />
              </div>
              {t('gamif.student.quests.title')}
            </h1>
            <p className="text-body-md text-on-surface-variant max-w-lg">
              {t('gamif.student.quests.subtitle')}
            </p>
          </div>

          {/* Quick stats */}
          <div className="flex gap-3 flex-wrap">
            <StatPill
              icon="flag"
              color="text-cyan-700 dark:text-cyan-300"
              bgColor="bg-cyan-50 dark:bg-cyan-400/10"
              value={`${completedCount}/${totalQuests}`}
              label={t('gamif.student.quests.statCompleted')}
            />
            <StatPill
              icon="star"
              color="text-emerald-700 dark:text-emerald-300"
              bgColor="bg-emerald-50 dark:bg-emerald-400/10"
              value={`${totalXpEarned}`}
              label="XP"
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
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all duration-200 ${filter === opt.key
              ? 'bg-primary text-on-primary shadow-elev-1 dark:bg-primary-container dark:text-on-primary-container dark:ring-1 dark:ring-primary/30'
              : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface dark:hover:bg-white/[0.08] dark:hover:text-on-surface'
              }`}
          >
            <Icon name={opt.icon} size={16} />
            {opt.label}
          </button>
        ))}
      </div>

      {/* ── Quest Columns ── */}
      <div className="-mx-md overflow-x-auto px-md pb-2 md:-mx-lg md:px-lg lg:-mx-xl lg:px-xl xl:mx-0 xl:px-0">
        <div className="grid min-w-[1120px] grid-cols-5 items-start gap-md 2xl:min-w-0">
          {columns.map((col) => (
            <QuestColumn
              key={col.key}
              icon={col.icon}
              iconColor={col.iconColor}
              bgGlow={col.bgGlow}
              title={col.title}
              quests={col.quests}
              emptyText={t('gamif.student.quests.emptyColumn')}
              onOpen={setSelected}
              t={t}
            />
          ))}
        </div>
      </div>

      {/* ── Detail modal ── */}
      {selectedLive && (
        <QuestDetailModal
          sq={selectedLive}
          prereqTitle={
            selectedLive.quest.prerequisiteQuestId
              ? (questTitleById.get(selectedLive.quest.prerequisiteQuestId) ?? null)
              : null
          }
          onClose={() => setSelected(null)}
          t={t}
        />
      )}
    </div>
  );
}

/* ── Quest Column Component ── */
function QuestColumn({
  icon,
  iconColor,
  bgGlow,
  title,
  quests,
  emptyText,
  onOpen,
  t,
}: {
  icon: string;
  iconColor: string;
  bgGlow: string;
  title: string;
  quests: IStudentQuest[];
  emptyText: string;
  onOpen: (sq: IStudentQuest) => void;
  t: TFn;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-3">
      {/* Section header */}
      <div
        className={`flex min-w-0 items-center gap-2 px-3 py-2.5 rounded-lg ${bgGlow} border border-outline-variant/70 shadow-elev-1 dark:border-white/10 dark:shadow-[0_18px_42px_rgba(0,0,0,0.22)]`}
      >
        <div
          className={`w-7 h-7 rounded-lg bg-surface-container-lowest flex shrink-0 items-center justify-center ${iconColor} dark:bg-white/[0.06] dark:ring-1 dark:ring-white/10`}
        >
          <Icon name={icon} size={18} />
        </div>
        <h2 className="min-w-0 flex-1 truncate text-sm font-bold text-on-surface md:text-base xl:text-sm 2xl:text-base">
          {title}
        </h2>
        <span className="shrink-0 text-[11px] font-mono text-on-surface-variant bg-surface-container-high px-1.5 py-0.5 rounded-md dark:bg-white/[0.07] dark:text-on-surface">
          {quests.length}
        </span>
      </div>

      {/* Cards */}
      {quests.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-outline-variant bg-surface-container-low px-3 py-8 text-center dark:border-white/10 dark:bg-[#17131d]/70">
          <div className="w-12 h-12 rounded-lg bg-surface-container-high flex items-center justify-center mb-3 dark:bg-white/[0.06]">
            <Icon name="inbox" size={26} className="text-on-surface-variant" />
          </div>
          <p className="text-sm text-on-surface-variant">{emptyText}</p>
        </div>
      ) : (
        quests.map((sq) => <QuestCard key={sq.id} sq={sq} onOpen={onOpen} t={t} />)
      )}
    </div>
  );
}

/* ── Individual Quest Card ── */
function QuestCard({ sq, onOpen, t }: { sq: IStudentQuest; onOpen: (sq: IStudentQuest) => void; t: TFn }) {
  const isLocked = sq.status === StudentQuestStatus.LOCKED;
  const isCompleted = sq.status === StudentQuestStatus.COMPLETED;
  const isClaimed = sq.status === StudentQuestStatus.CLAIMED;
  const isDone = isCompleted || isClaimed;
  const isInProgress = sq.status === StudentQuestStatus.IN_PROGRESS;
  const progressPct = Math.min(100, Math.round((sq.progress / Math.max(1, sq.quest.targetCount)) * 100));

  const objectiveLabel = t(`gamif.objective.${sq.quest.objectiveType}`);
  const unit = t(`gamif.unit.${QUEST_OBJECTIVE_META[sq.quest.objectiveType].unit}`);
  const recurs = sq.quest.recurrence !== QuestRecurrence.NONE;
  const recurrenceLabel = t(getQuestRecurrenceLabelKey(sq.quest.recurrence));

  let cardClass =
    'border-outline-variant bg-surface-container-lowest dark:border-white/10 dark:bg-[#18151f]/95 dark:shadow-[0_14px_34px_rgba(0,0,0,0.22)]';
  if (isCompleted)
    cardClass =
      'border-amber-400/60 bg-amber-50/80 shadow-elev-1 dark:border-amber-300/35 dark:bg-amber-400/[0.12] dark:ring-1 dark:ring-amber-200/15 dark:shadow-[0_18px_44px_rgba(0,0,0,0.28)]';
  if (isClaimed)
    cardClass =
      'border-outline-variant/70 bg-surface-container-low opacity-70 dark:border-white/10 dark:bg-[#15121b]/80 dark:opacity-65';
  if (isLocked)
    cardClass =
      'border-outline-variant/60 bg-surface-container-low opacity-75 dark:border-white/10 dark:bg-[#15121b]/70 dark:opacity-80';

  const progressColor = isCompleted
    ? 'bg-amber-500 dark:bg-amber-300'
    : isClaimed
      ? 'bg-outline'
      : 'bg-primary';
  const progressTrackColor = isCompleted
    ? 'bg-amber-100 dark:bg-amber-300/20'
    : 'bg-surface-container-highest dark:bg-white/[0.08]';

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen(sq)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen(sq);
        }
      }}
      className={`group relative overflow-hidden rounded-lg border ${cardClass} p-3 transition-all duration-300 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/40 md:p-4 xl:p-3 2xl:p-4 ${!isClaimed && !isLocked
        ? 'hover:-translate-y-1 hover:border-primary/40 hover:shadow-elev-2 dark:hover:border-primary/50 dark:hover:shadow-[0_20px_54px_rgba(0,0,0,0.34)]'
        : 'hover:border-outline dark:hover:border-white/20'
        }`}
    >
      {/* View-detail affordance */}
      <div className="flex gap-3 items-start relative z-10">
        {/* Icon */}
        <div
          className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border transition-all duration-500 md:w-12 md:h-12 xl:w-10 xl:h-10 2xl:w-12 2xl:h-12 ${isCompleted
            ? 'bg-amber-100 border-amber-300 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300'
            : 'bg-surface-container-high border-outline-variant/70 text-on-surface-variant group-hover:bg-primary-container group-hover:text-on-primary-container dark:bg-white/[0.06] dark:border-white/10 dark:group-hover:bg-primary/20 dark:group-hover:text-primary-fixed-dim'
            } ${isLocked ? 'grayscale' : ''}`}
        >
          <Icon name={isLocked ? 'lock' : sq.quest.icon} size={22} />
        </div>

        <div className="flex-1 min-w-0">
          {/* Title & objective */}
          <div className="flex min-w-0 items-start justify-between gap-2">
            <h3
              className={`min-w-0 flex-1 truncate text-sm font-bold md:text-base xl:text-sm 2xl:text-base ${isClaimed || isLocked ? 'text-on-surface-variant' : 'text-on-surface'} ${isClaimed ? 'line-through' : ''}`}
            >
              {sq.quest.title}
            </h3>
            {recurs && !isLocked && (
              <span
                title={recurrenceLabel}
                aria-label={recurrenceLabel}
                className="shrink-0 flex items-center gap-1 text-[10px] font-bold text-sky-700 bg-sky-100 px-1.5 py-0.5 rounded-md whitespace-nowrap dark:border dark:border-sky-300/20 dark:bg-sky-400/[0.12] dark:text-sky-200"
              >
                <Icon name="refresh" size={11} />
                <span className="hidden 2xl:inline">{recurrenceLabel}</span>
              </span>
            )}
          </div>

          <p className="mb-2 flex items-center gap-1 truncate text-[10px] font-semibold uppercase text-on-surface-variant md:text-[11px] xl:text-[10px] 2xl:text-[11px]">
            <Icon name="adjust" size={12} /> {objectiveLabel}
          </p>

          {sq.quest.description && (
            <p className="text-[11px] text-on-surface-variant mb-3 line-clamp-2 leading-relaxed md:text-[12px] xl:text-[11px] 2xl:text-[12px]">
              {sq.quest.description}
            </p>
          )}

          {isLocked ? (
            <div className="flex items-center gap-2 text-xs font-semibold text-on-surface-variant bg-surface-container-high rounded-lg px-2.5 py-2 dark:border dark:border-white/10 dark:bg-white/[0.06]">
              <Icon name="lock" size={14} /> {t('gamif.student.quests.locked')}
            </div>
          ) : (
            <>
              {/* Progress */}
              <div className="flex justify-between gap-2 text-xs font-semibold mb-1.5">
                <span className="text-on-surface-variant">{t('gamif.student.quests.progress')}</span>
                <span
                  className={`shrink-0 ${isCompleted ? 'text-amber-700 dark:text-amber-300' : isClaimed ? 'text-on-surface-variant' : 'text-primary'}`}
                >
                  {sq.progress} / {sq.quest.targetCount} {unit}
                </span>
              </div>

              <div className={`w-full h-2 ${progressTrackColor} rounded-full overflow-hidden mb-3`}>
                <div
                  className={`h-full rounded-full transition-all duration-1000 ease-out ${progressColor}`}
                  style={{ width: `${progressPct}%` }}
                />
              </div>

              {/* Footer: rewards + actions */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap gap-1.5">
                  <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-1 rounded-md dark:border-emerald-300/20 dark:bg-emerald-400/[0.12] dark:text-emerald-200">
                    <Icon name="star" size={11} /> +{sq.quest.rewardXp} XP
                  </span>
                  <span className="flex items-center gap-1 text-[11px] font-bold text-fuchsia-700 bg-fuchsia-50 border border-fuchsia-100 px-2 py-1 rounded-md dark:border-fuchsia-300/20 dark:bg-fuchsia-400/[0.12] dark:text-fuchsia-200">
                    <Icon name="diamond" size={11} /> {sq.quest.rewardGems}
                  </span>

                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Quest Detail Modal ── */
function QuestDetailModal({
  sq,
  prereqTitle,
  onClose,
  t,
}: {
  sq: IStudentQuest;
  prereqTitle: string | null;
  onClose: () => void;
  t: TFn;
}) {
  const quest = sq.quest;
  const cfg = quest.objectiveConfig ?? {};
  const meta = QUEST_OBJECTIVE_META[quest.objectiveType];
  const unit = t(`gamif.unit.${meta.unit}`);
  const objectiveLabel = t(`gamif.objective.${quest.objectiveType}`);
  const isLocked = sq.status === StudentQuestStatus.LOCKED;
  const isCompleted = sq.status === StudentQuestStatus.COMPLETED || sq.status === StudentQuestStatus.CLAIMED;
  const progressPct = Math.min(100, Math.round((sq.progress / Math.max(1, quest.targetCount)) * 100));

  const fmt = (d?: string | null) => (d ? new Date(d).toLocaleString() : '—');
  const fmtDay = (d?: string | null) => (d ? new Date(d).toLocaleDateString() : '—');

  const statusTone: Record<string, string> = {
    LOCKED:
      'text-on-surface-variant bg-surface-container-high border border-outline-variant/60 dark:border-white/10 dark:bg-white/[0.06]',
    IN_PROGRESS:
      'text-sky-700 bg-sky-100 border border-sky-200 dark:border-sky-300/20 dark:bg-sky-400/[0.12] dark:text-sky-200',
    COMPLETED:
      'text-amber-700 bg-amber-100 border border-amber-200 dark:border-amber-300/20 dark:bg-amber-400/[0.12] dark:text-amber-200',
    CLAIMED:
      'text-emerald-700 bg-emerald-100 border border-emerald-200 dark:border-emerald-300/20 dark:bg-emerald-400/[0.12] dark:text-emerald-200',
    EXPIRED:
      'text-rose-700 bg-rose-100 border border-rose-200 dark:border-rose-300/20 dark:bg-rose-400/[0.12] dark:text-rose-200',
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-0 sm:p-4 dark:bg-black/70"
      onClick={onClose}
    >
      <div
        className="relative w-full sm:max-w-lg max-h-[92vh] overflow-y-auto bg-surface-container-lowest border border-outline-variant rounded-t-xl sm:rounded-xl shadow-elev-3 dark:border-white/10 dark:bg-[#18151f] dark:shadow-[0_24px_80px_rgba(0,0,0,0.5)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-surface-container-lowest/95 backdrop-blur border-b border-outline-variant px-6 py-4 flex items-start gap-4 dark:border-white/10 dark:bg-[#18151f]/95">
          <div
            className={`w-14 h-14 rounded-lg flex items-center justify-center shrink-0 border ${isCompleted
              ? 'bg-amber-100 border-amber-300 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300'
              : 'bg-primary-container border-primary/20 text-on-primary-container dark:bg-primary/20 dark:border-primary/30 dark:text-primary-fixed-dim'
              } ${isLocked ? 'grayscale' : ''}`}
          >
            <Icon name={isLocked ? 'lock' : quest.icon} size={30} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-bold uppercase text-on-surface-variant bg-surface-container-high px-2 py-0.5 rounded-md dark:border dark:border-white/10 dark:bg-white/[0.06]">
                {t(`gamif.questType.${quest.type}`)}
              </span>
              <span
                className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md ${statusTone[sq.status]}`}
              >
                {t(`gamif.sqStatus.${sq.status}`)}
              </span>
            </div>
            <h2 className="text-xl font-black text-on-surface mt-1 leading-tight">{quest.title}</h2>
          </div>
          <button
            onClick={onClose}
            aria-label={t('gamif.student.quests.detail.close')}
            className="shrink-0 w-8 h-8 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface-variant hover:text-on-surface flex items-center justify-center transition-colors dark:bg-white/[0.06] dark:hover:bg-white/[0.1]"
          >
            <Icon name="close" size={18} />
          </button>
        </div>

        <div className="px-6 py-5 flex flex-col gap-5">
          {quest.description && (
            <p className="text-sm text-on-surface-variant leading-relaxed">{quest.description}</p>
          )}

          {/* Progress */}
          {!isLocked && (
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1.5">
                <span className="text-on-surface-variant">{t('gamif.student.quests.progress')}</span>
                <span className={isCompleted ? 'text-amber-700 dark:text-amber-300' : 'text-primary'}>
                  {sq.progress} / {quest.targetCount} {unit}
                </span>
              </div>
              <div className="w-full h-2.5 bg-surface-container-highest rounded-full overflow-hidden dark:bg-white/[0.08]">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${isCompleted ? 'bg-amber-500 dark:bg-amber-300' : 'bg-primary'}`}
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          )}

          {/* Objective */}
          <DetailSection icon="adjust" title={t('gamif.student.quests.detail.secObjective')}>
            <DetailRow label={objectiveLabel} value={`${quest.targetCount} ${unit}`} />
            {cfg.difficulty && (
              <DetailRow label={t('gamif.student.quests.detail.configDifficulty')} value={cfg.difficulty} />
            )}
            {cfg.tag && <DetailRow label={t('gamif.student.quests.detail.configTag')} value={cfg.tag} />}
            {cfg.assignmentIds && cfg.assignmentIds.length > 0 && (
              <DetailRow
                label={t('gamif.student.quests.detail.configScope')}
                value={`${cfg.assignmentIds.length} ${t('gamif.unit.assignments')}`}
              />
            )}
            {cfg.mazeLevelIds && cfg.mazeLevelIds.length > 0 && (
              <DetailRow
                label={t('gamif.student.quests.detail.configScope')}
                value={`${cfg.mazeLevelIds.length} ${t('gamif.unit.mazes')}`}
              />
            )}
          </DetailSection>

          {/* Schedule */}
          {(quest.recurrence !== QuestRecurrence.NONE || quest.startsAt || quest.endsAt) && (
            <DetailSection icon="event" title={t('gamif.student.quests.detail.secSchedule')}>
              {quest.recurrence !== QuestRecurrence.NONE && (
                <DetailRow
                  label={t('gamif.student.quests.detail.recurrence')}
                  value={t(`gamif.recurrence.${quest.recurrence}`)}
                />
              )}
              {(quest.startsAt || quest.endsAt) && (
                <DetailRow
                  label={t('gamif.student.quests.detail.window')}
                  value={`${fmtDay(quest.startsAt)} → ${fmtDay(quest.endsAt)}`}
                />
              )}
            </DetailSection>
          )}

          {/* Requirement */}
          <DetailSection icon="lock_open" title={t('gamif.student.quests.detail.secRequirement')}>
            {prereqTitle ? (
              <DetailRow label={t('gamif.student.quests.detail.prerequisite')} value={prereqTitle} />
            ) : (
              <p className="text-xs text-on-surface-variant">
                {t('gamif.student.quests.detail.noPrerequisite')}
              </p>
            )}
            {isLocked && (
              <p className="text-xs text-amber-700 dark:text-amber-300 mt-1 flex items-center gap-1">
                <Icon name="info" size={13} /> {t('gamif.student.quests.detail.lockedNote')}
              </p>
            )}
          </DetailSection>

          {/* Rewards */}
          <DetailSection icon="redeem" title={t('gamif.student.quests.detail.secRewards')}>
            <div className="flex gap-2 flex-wrap">
              <span className="flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-md dark:border-emerald-300/20 dark:bg-emerald-400/[0.12] dark:text-emerald-200">
                <Icon name="star" size={13} /> +{quest.rewardXp} XP
              </span>
              <span className="flex items-center gap-1 text-xs font-bold text-fuchsia-700 bg-fuchsia-50 border border-fuchsia-100 px-2.5 py-1 rounded-md dark:border-fuchsia-300/20 dark:bg-fuchsia-400/[0.12] dark:text-fuchsia-200">
                <Icon name="diamond" size={13} /> {quest.rewardGems}
              </span>
              {quest.rewardBadgeId && (
                <span className="flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-100 px-2.5 py-1 rounded-md dark:border-amber-300/20 dark:bg-amber-400/[0.12] dark:text-amber-200">
                  <Icon name="workspace_premium" size={13} /> {t('gamif.student.quests.detail.rewardBadge')}
                </span>
              )}
            </div>
          </DetailSection>

          {/* Timeline */}
          {(sq.startedAt || sq.completedAt || sq.claimedAt) && (
            <DetailSection icon="schedule" title={t('gamif.student.quests.detail.secTimeline')}>
              {sq.startedAt && (
                <DetailRow label={t('gamif.student.quests.detail.startedAt')} value={fmt(sq.startedAt)} />
              )}
              {sq.completedAt && (
                <DetailRow label={t('gamif.student.quests.detail.completedAt')} value={fmt(sq.completedAt)} />
              )}
              {sq.claimedAt && (
                <DetailRow label={t('gamif.student.quests.detail.claimedAt')} value={fmt(sq.claimedAt)} />
              )}
            </DetailSection>
          )}
        </div>

        {/* Footer actions */}
        <div className="sticky bottom-0 bg-surface-container-lowest/95 backdrop-blur border-t border-outline-variant px-6 py-4 flex items-center justify-between gap-3 dark:border-white/10 dark:bg-[#18151f]/95">
          {isCompleted ? (
            <span className="text-sm font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
              {t('gamif.student.quests.rewardEarned')}
            </span>
          ) : (
            <span />
          )}
          <button
            onClick={onClose}
            className="text-sm font-semibold text-on-surface-variant hover:text-on-surface px-4 py-2 rounded-lg bg-surface-container-high hover:bg-surface-container-highest transition-colors dark:bg-white/[0.06] dark:hover:bg-white/[0.1]"
          >
            {t('gamif.student.quests.detail.close')}
          </button>
        </div>
      </div>
    </div>
  );
}

function DetailSection({ icon, title, children }: { icon: string; title: string; children: ReactNode }) {
  return (
    <div>
      <h3 className="text-[11px] font-bold uppercase text-on-surface-variant mb-2 flex items-center gap-1.5">
        <Icon name={icon} size={14} /> {title}
      </h3>
      <div className="bg-surface-container-low border border-outline-variant/70 rounded-lg px-4 py-3 flex flex-col gap-1.5 dark:border-white/10 dark:bg-white/[0.04]">
        {children}
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="text-on-surface-variant">{label}</span>
      <span className="text-on-surface font-semibold text-right">{value}</span>
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
  pulse,
}: {
  icon: string;
  color: string;
  bgColor: string;
  value: string;
  label: string;
  pulse?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-container-lowest border border-outline-variant shadow-elev-1 dark:border-white/10 dark:bg-[#18151f]/95 dark:shadow-[0_16px_42px_rgba(0,0,0,0.24)] ${pulse ? 'animate-pulse' : ''}`}
    >
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
