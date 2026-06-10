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
  const selectedLive = selected ? allQuests.find((q) => q.id === selected.id) ?? selected : null;

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

  // Determine which columns to render: always Daily / Main / Bounty,
  // plus Weekly / Event when there's anything to show in them.
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
        iconColor: 'text-emerald-400',
        bgGlow: 'bg-emerald-400/5',
        title: t('gamif.student.quests.daily'),
        quests: dailyQuests,
      },
    ];
    if (weeklyQuests.length > 0) {
      cols.push({
        key: 'weekly',
        icon: 'date_range',
        iconColor: 'text-sky-400',
        bgGlow: 'bg-sky-400/5',
        title: t('gamif.student.quests.weekly'),
        quests: weeklyQuests,
      });
    }
    cols.push({
      key: 'main',
      icon: 'auto_stories',
      iconColor: 'text-cyan-400',
      bgGlow: 'bg-cyan-400/5',
      title: t('gamif.student.quests.main'),
      quests: mainQuests,
    });
    cols.push({
      key: 'bounty',
      icon: 'local_fire_department',
      iconColor: 'text-orange-400',
      bgGlow: 'bg-orange-400/5',
      title: t('gamif.student.quests.bounty'),
      quests: bountyQuests,
    });
    if (eventQuests.length > 0) {
      cols.push({
        key: 'event',
        icon: 'celebration',
        iconColor: 'text-fuchsia-400',
        bgGlow: 'bg-fuchsia-400/5',
        title: t('gamif.student.quests.event'),
        quests: eventQuests,
      });
    }
    return cols;
  }, [t, dailyQuests, weeklyQuests, mainQuests, bountyQuests, eventQuests]);

  if (isLoading) {
    return (
      <div className="min-h-screen p-8 flex items-center justify-center bg-[#0f0f13]">
        <div className="flex flex-col items-center gap-4">
          <Icon name="sync" className="animate-spin text-emerald-400" size={48} />
          <span className="text-gray-500 text-sm font-medium">{t('gamif.student.quests.loading')}</span>
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
    <div className="min-h-screen text-gray-200 p-4 md:p-8 font-sans" style={{ backgroundColor: '#0f0f13' }}>
      {/* ── Hero Header ── */}
      <header className="mb-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-white mb-2 flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-[0_4px_15px_rgba(251,191,36,0.3)]">
                <Icon name="swords" size={28} className="text-white" />
              </div>
              {t('gamif.student.quests.title')}
            </h1>
            <p className="text-gray-400 max-w-lg">{t('gamif.student.quests.subtitle')}</p>
          </div>

          {/* Quick stats */}
          <div className="flex gap-3 flex-wrap">
            <StatPill
              icon="flag"
              color="text-cyan-400"
              bgColor="bg-cyan-400/10"
              value={`${completedCount}/${totalQuests}`}
              label={t('gamif.student.quests.statCompleted')}
            />
            <StatPill icon="star" color="text-emerald-400" bgColor="bg-emerald-400/10" value={`${totalXpEarned}`} label="XP" />
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

      {/* ── Quest Columns ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
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

      {/* ── Detail modal ── */}
      {selectedLive && (
        <QuestDetailModal
          sq={selectedLive}
          prereqTitle={
            selectedLive.quest.prerequisiteQuestId
              ? questTitleById.get(selectedLive.quest.prerequisiteQuestId) ?? null
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
    <div className="flex flex-col gap-4">
      {/* Section header */}
      <div className={`flex items-center gap-3 px-4 py-3 rounded-xl ${bgGlow} border border-white/5`}>
        <div className={`w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center ${iconColor}`}>
          <Icon name={icon} size={20} />
        </div>
        <h2 className="text-lg font-bold text-white flex-1">{title}</h2>
        <span className="text-xs font-mono text-gray-500 bg-white/5 px-2 py-0.5 rounded-full">{quests.length}</span>
      </div>

      {/* Cards */}
      {quests.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-3">
            <Icon name="inbox" size={32} className="text-gray-600" />
          </div>
          <p className="text-sm text-gray-500">{emptyText}</p>
        </div>
      ) : (
        quests.map((sq) => <QuestCard key={sq.id} sq={sq} onOpen={onOpen} t={t} />)
      )}
    </div>
  );
}

/* ── Individual Quest Card ── */
function QuestCard({
  sq,
  onOpen,
  t,
}: {
  sq: IStudentQuest;
  onOpen: (sq: IStudentQuest) => void;
  t: TFn;
}) {
  const isLocked = sq.status === StudentQuestStatus.LOCKED;
  const isCompleted = sq.status === StudentQuestStatus.COMPLETED;
  const isClaimed = sq.status === StudentQuestStatus.CLAIMED;
  const isDone = isCompleted || isClaimed;
  const isInProgress = sq.status === StudentQuestStatus.IN_PROGRESS;
  const progressPct = Math.min(100, Math.round((sq.progress / Math.max(1, sq.quest.targetCount)) * 100));

  const objectiveLabel = t(`gamif.objective.${sq.quest.objectiveType}`);
  const unit = t(`gamif.unit.${QUEST_OBJECTIVE_META[sq.quest.objectiveType].unit}`);
  const recurs = sq.quest.recurrence !== QuestRecurrence.NONE;
  const recurrenceLabel =
    sq.quest.recurrence === QuestRecurrence.WEEKLY
      ? t('gamif.student.quests.resetsWeekly')
      : t('gamif.student.quests.resetsDaily');

  let cardClass = 'border-white/5';
  if (isCompleted) cardClass = 'border-amber-400/40 shadow-[0_0_20px_rgba(251,191,36,0.15)]';
  if (isClaimed) cardClass = 'border-white/5 opacity-50';
  if (isLocked) cardClass = 'border-white/5 opacity-60';

  const progressColor = isCompleted ? 'bg-amber-400' : isClaimed ? 'bg-gray-500' : 'bg-cyan-400';
  const progressTrackColor = isCompleted ? 'bg-amber-400/20' : 'bg-[#0a0a0f]';

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
      className={`group relative overflow-hidden rounded-2xl bg-[#16161e] border ${cardClass} p-5 transition-all duration-300 cursor-pointer focus:outline-none focus:ring-2 focus:ring-cyan-400/40 ${
        !isClaimed && !isLocked ? 'hover:-translate-y-1 hover:shadow-xl' : 'hover:border-white/15'
      }`}
    >
      {/* View-detail affordance */}
      <span className="absolute top-3 right-3 z-20 text-gray-600 group-hover:text-cyan-400 transition-colors">
        <Icon name="chevron_right" size={18} />
      </span>

      {/* Glow effect for completed */}
      {isCompleted && (
        <>
          <div className="absolute top-0 right-0 -mt-6 -mr-6 w-28 h-28 bg-amber-400/10 rounded-full blur-2xl" />
          <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-20 h-20 bg-amber-400/5 rounded-full blur-xl" />
        </>
      )}

      <div className="flex gap-4 items-start relative z-10">
        {/* Icon */}
        <div
          className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 border transition-all duration-500 ${
            isCompleted
              ? 'bg-amber-400/15 border-amber-400/30 text-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.2)]'
              : 'bg-white/5 border-white/10 text-gray-400'
          } ${isLocked ? 'grayscale' : ''}`}
        >
          <Icon name={isLocked ? 'lock' : sq.quest.icon} size={28} />
        </div>

        <div className="flex-1 min-w-0">
          {/* Title & objective */}
          <div className="flex items-start justify-between gap-2">
            <h3 className={`font-bold text-lg mb-0.5 truncate ${isClaimed || isLocked ? 'text-gray-500' : 'text-white'} ${isClaimed ? 'line-through' : ''}`}>
              {sq.quest.title}
            </h3>
            {recurs && !isLocked && (
              <span className="shrink-0 flex items-center gap-1 text-[10px] font-bold text-sky-300 bg-sky-400/10 px-2 py-0.5 rounded-full whitespace-nowrap">
                <Icon name="refresh" size={11} /> {recurrenceLabel}
              </span>
            )}
          </div>

          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 mb-2 flex items-center gap-1">
            <Icon name="adjust" size={12} /> {objectiveLabel}
          </p>

          {sq.quest.description && (
            <p className="text-[12px] text-gray-400 mb-3 line-clamp-2 leading-relaxed">{sq.quest.description}</p>
          )}

          {isLocked ? (
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 bg-white/5 rounded-lg px-3 py-2">
              <Icon name="lock" size={14} /> {t('gamif.student.quests.locked')}
            </div>
          ) : (
            <>
              {/* Progress */}
              <div className="flex justify-between text-xs font-semibold mb-1.5">
                <span className="text-gray-400">{t('gamif.student.quests.progress')}</span>
                <span className={isCompleted ? 'text-amber-400' : isClaimed ? 'text-gray-500' : 'text-cyan-400'}>
                  {sq.progress} / {sq.quest.targetCount} {unit}
                </span>
              </div>

              <div className={`w-full h-2 ${progressTrackColor} rounded-full overflow-hidden mb-4`}>
                <div
                  className={`h-full rounded-full transition-all duration-1000 ease-out ${progressColor}`}
                  style={{ width: `${progressPct}%` }}
                />
              </div>

              {/* Footer: rewards + actions */}
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-md">
                    <Icon name="star" size={11} /> +{sq.quest.rewardXp} XP
                  </span>
                  <span className="flex items-center gap-1 text-[11px] font-bold text-fuchsia-400 bg-fuchsia-400/10 px-2 py-1 rounded-md">
                    <Icon name="diamond" size={11} /> {sq.quest.rewardGems}
                  </span>
                </div>

                {isDone && (
                  <span
                    className={`text-xs font-bold flex items-center gap-1 ${
                      isClaimed ? 'text-gray-500' : 'text-emerald-400'
                    }`}
                  >
                    <Icon name="check_circle" size={14} className={isClaimed ? 'text-emerald-500/60' : ''} />{' '}
                    {t('gamif.student.quests.rewardEarned')}
                  </span>
                )}
                {isInProgress && progressPct > 0 && (
                  <span className="text-[11px] font-bold text-cyan-400/60">{progressPct}%</span>
                )}
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
  const isCompleted =
    sq.status === StudentQuestStatus.COMPLETED || sq.status === StudentQuestStatus.CLAIMED;
  const progressPct = Math.min(100, Math.round((sq.progress / Math.max(1, quest.targetCount)) * 100));

  const fmt = (d?: string | null) => (d ? new Date(d).toLocaleString() : '—');
  const fmtDay = (d?: string | null) => (d ? new Date(d).toLocaleDateString() : '—');

  const statusTone: Record<string, string> = {
    LOCKED: 'text-gray-400 bg-white/5',
    IN_PROGRESS: 'text-cyan-300 bg-cyan-400/10',
    COMPLETED: 'text-amber-300 bg-amber-400/10',
    CLAIMED: 'text-emerald-300 bg-emerald-400/10',
    EXPIRED: 'text-rose-300 bg-rose-400/10',
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full sm:max-w-lg max-h-[92vh] overflow-y-auto bg-[#16161e] border border-white/10 rounded-t-3xl sm:rounded-3xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-[#16161e]/95 backdrop-blur border-b border-white/5 px-6 py-4 flex items-start gap-4">
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border ${
              isCompleted
                ? 'bg-amber-400/15 border-amber-400/30 text-amber-400'
                : 'bg-white/5 border-white/10 text-cyan-300'
            } ${isLocked ? 'grayscale' : ''}`}
          >
            <Icon name={isLocked ? 'lock' : quest.icon} size={30} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-bold uppercase tracking-wide text-gray-400 bg-white/5 px-2 py-0.5 rounded-full">
                {t(`gamif.questType.${quest.type}`)}
              </span>
              <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${statusTone[sq.status]}`}>
                {t(`gamif.sqStatus.${sq.status}`)}
              </span>
            </div>
            <h2 className="text-xl font-black text-white mt-1 leading-tight">{quest.title}</h2>
          </div>
          <button
            onClick={onClose}
            aria-label={t('gamif.student.quests.detail.close')}
            className="shrink-0 w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <Icon name="close" size={18} />
          </button>
        </div>

        <div className="px-6 py-5 flex flex-col gap-5">
          {quest.description && <p className="text-sm text-gray-300 leading-relaxed">{quest.description}</p>}

          {/* Progress */}
          {!isLocked && (
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1.5">
                <span className="text-gray-400">{t('gamif.student.quests.progress')}</span>
                <span className={isCompleted ? 'text-amber-400' : 'text-cyan-400'}>
                  {sq.progress} / {quest.targetCount} {unit}
                </span>
              </div>
              <div className="w-full h-2.5 bg-[#0a0a0f] rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${isCompleted ? 'bg-amber-400' : 'bg-cyan-400'}`}
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
              <p className="text-xs text-gray-500">{t('gamif.student.quests.detail.noPrerequisite')}</p>
            )}
            {isLocked && (
              <p className="text-xs text-amber-400/80 mt-1 flex items-center gap-1">
                <Icon name="info" size={13} /> {t('gamif.student.quests.detail.lockedNote')}
              </p>
            )}
          </DetailSection>

          {/* Rewards */}
          <DetailSection icon="redeem" title={t('gamif.student.quests.detail.secRewards')}>
            <div className="flex gap-2 flex-wrap">
              <span className="flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-400/10 px-2.5 py-1 rounded-md">
                <Icon name="star" size={13} /> +{quest.rewardXp} XP
              </span>
              <span className="flex items-center gap-1 text-xs font-bold text-fuchsia-400 bg-fuchsia-400/10 px-2.5 py-1 rounded-md">
                <Icon name="diamond" size={13} /> {quest.rewardGems}
              </span>
              {quest.rewardBadgeId && (
                <span className="flex items-center gap-1 text-xs font-bold text-amber-300 bg-amber-400/10 px-2.5 py-1 rounded-md">
                  <Icon name="workspace_premium" size={13} /> {t('gamif.student.quests.detail.rewardBadge')}
                </span>
              )}
            </div>
          </DetailSection>

          {/* Timeline */}
          {(sq.startedAt || sq.completedAt || sq.claimedAt) && (
            <DetailSection icon="schedule" title={t('gamif.student.quests.detail.secTimeline')}>
              {sq.startedAt && <DetailRow label={t('gamif.student.quests.detail.startedAt')} value={fmt(sq.startedAt)} />}
              {sq.completedAt && (
                <DetailRow label={t('gamif.student.quests.detail.completedAt')} value={fmt(sq.completedAt)} />
              )}
              {sq.claimedAt && <DetailRow label={t('gamif.student.quests.detail.claimedAt')} value={fmt(sq.claimedAt)} />}
            </DetailSection>
          )}
        </div>

        {/* Footer actions */}
        <div className="sticky bottom-0 bg-[#16161e]/95 backdrop-blur border-t border-white/5 px-6 py-4 flex items-center justify-between gap-3">
          {isCompleted ? (
            <span className="text-sm font-bold text-emerald-400 flex items-center gap-1.5">
              <Icon name="check_circle" size={18} /> {t('gamif.student.quests.rewardEarned')}
            </span>
          ) : (
            <span />
          )}
          <button
            onClick={onClose}
            className="text-sm font-semibold text-gray-300 hover:text-white px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
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
      <h3 className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-2 flex items-center gap-1.5">
        <Icon name={icon} size={14} /> {title}
      </h3>
      <div className="bg-white/[0.03] border border-white/5 rounded-xl px-4 py-3 flex flex-col gap-1.5">{children}</div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="text-gray-400">{label}</span>
      <span className="text-gray-100 font-semibold text-right">{value}</span>
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
    <div className={`flex items-center gap-2 px-4 py-2 rounded-xl bg-[#16161e] border border-white/5 ${pulse ? 'animate-pulse' : ''}`}>
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
