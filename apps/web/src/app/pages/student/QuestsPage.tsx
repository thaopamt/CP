import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Icon } from '@cp/ui';
import { QuestType, StudentQuestStatus, IStudentQuest } from '@cp/shared';
import { useMyQuests, useClaimQuestReward } from '../../api/quests.queries';

type QuestFilter = 'all' | 'in_progress' | 'completed' | 'claimed';

export default function StudentQuestsPage() {
  const { t } = useTranslation();
  const { data: quests, isLoading } = useMyQuests();
  const claimMutation = useClaimQuestReward();
  const [filter, setFilter] = useState<QuestFilter>('all');

  const handleClaim = (studentQuestId: string) => {
    claimMutation.mutate(studentQuestId);
  };

  const allQuests = quests ?? [];

  // Stats
  const totalQuests = allQuests.length;
  const completedCount = allQuests.filter((q) => q.status === StudentQuestStatus.COMPLETED || q.status === StudentQuestStatus.CLAIMED).length;
  const claimableCount = allQuests.filter((q) => q.status === StudentQuestStatus.COMPLETED).length;
  const totalXpEarned = allQuests.filter((q) => q.status === StudentQuestStatus.CLAIMED).reduce((s, q) => s + q.quest.rewardXp, 0);

  // Filtered & grouped
  const filteredQuests = useMemo(() => {
    if (filter === 'in_progress') return allQuests.filter((q) => q.status === StudentQuestStatus.IN_PROGRESS);
    if (filter === 'completed') return allQuests.filter((q) => q.status === StudentQuestStatus.COMPLETED);
    if (filter === 'claimed') return allQuests.filter((q) => q.status === StudentQuestStatus.CLAIMED);
    return allQuests;
  }, [allQuests, filter]);

  const dailyQuests = useMemo(() => filteredQuests.filter((q) => q.quest.type === QuestType.DAILY), [filteredQuests]);
  const mainQuests = useMemo(() => filteredQuests.filter((q) => q.quest.type === QuestType.MAIN), [filteredQuests]);
  const bountyQuests = useMemo(() => filteredQuests.filter((q) => q.quest.type === QuestType.BOUNTY), [filteredQuests]);

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

  const filterOptions: { key: QuestFilter; label: string; icon: string }[] = [
    { key: 'all', label: t('pages.student.quests.filterAll'), icon: 'apps' },
    { key: 'in_progress', label: t('pages.student.quests.filterInProgress'), icon: 'pending' },
    { key: 'completed', label: t('pages.student.quests.filterCompleted'), icon: 'task_alt' },
    { key: 'claimed', label: t('pages.student.quests.filterClaimed'), icon: 'redeem' },
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
              {t('pages.student.quests.pageTitle')}
            </h1>
            <p className="text-gray-400 max-w-lg">{t('pages.student.quests.pageSubtitle')}</p>
          </div>

          {/* Quick stats */}
          <div className="flex gap-3">
            <StatPill icon="flag" color="text-cyan-400" bgColor="bg-cyan-400/10" value={`${completedCount}/${totalQuests}`} label={t('pages.student.quests.statCompleted')} />
            <StatPill icon="star" color="text-emerald-400" bgColor="bg-emerald-400/10" value={`${totalXpEarned}`} label="XP" />
            {claimableCount > 0 && (
              <StatPill icon="redeem" color="text-amber-400" bgColor="bg-amber-400/10" value={String(claimableCount)} label={t('pages.student.quests.statClaimable')} pulse />
            )}
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
        {/* Daily Quests */}
        <QuestColumn
          icon="today"
          iconColor="text-emerald-400"
          bgGlow="bg-emerald-400/5"
          title={t('pages.student.quests.dailyQuests')}
          quests={dailyQuests}
          emptyText={t('pages.student.quests.emptyDaily')}
          onClaim={handleClaim}
          claimPending={claimMutation.isPending}
          t={t}
        />

        {/* Main Quests */}
        <QuestColumn
          icon="auto_stories"
          iconColor="text-cyan-400"
          bgGlow="bg-cyan-400/5"
          title={t('pages.student.quests.mainStory')}
          quests={mainQuests}
          emptyText={t('pages.student.quests.emptyMain')}
          onClaim={handleClaim}
          claimPending={claimMutation.isPending}
          t={t}
        />

        {/* Bounties */}
        <QuestColumn
          icon="local_fire_department"
          iconColor="text-orange-400"
          bgGlow="bg-orange-400/5"
          title={t('pages.student.quests.bounties')}
          quests={bountyQuests}
          emptyText={t('pages.student.quests.emptyBounty')}
          onClaim={handleClaim}
          claimPending={claimMutation.isPending}
          t={t}
        />
      </div>
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
  onClaim,
  claimPending,
  t,
}: {
  icon: string;
  iconColor: string;
  bgGlow: string;
  title: string;
  quests: IStudentQuest[];
  emptyText: string;
  onClaim: (id: string) => void;
  claimPending: boolean;
  t: (key: string) => string;
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
        quests.map((sq) => (
          <QuestCard key={sq.id} sq={sq} onClaim={onClaim} claimPending={claimPending} t={t} />
        ))
      )}
    </div>
  );
}

/* ── Individual Quest Card ── */
function QuestCard({
  sq,
  onClaim,
  claimPending,
  t,
}: {
  sq: IStudentQuest;
  onClaim: (id: string) => void;
  claimPending: boolean;
  t: (key: string) => string;
}) {
  const isCompleted = sq.status === StudentQuestStatus.COMPLETED;
  const isClaimed = sq.status === StudentQuestStatus.CLAIMED;
  const isInProgress = sq.status === StudentQuestStatus.IN_PROGRESS;
  const progressPct = Math.min(100, Math.round((sq.progress / sq.quest.targetCount) * 100));

  let cardClass = 'border-white/5';
  if (isCompleted) cardClass = 'border-amber-400/40 shadow-[0_0_20px_rgba(251,191,36,0.15)]';
  if (isClaimed) cardClass = 'border-white/5 opacity-50';

  const progressColor = isCompleted ? 'bg-amber-400' : isClaimed ? 'bg-gray-500' : 'bg-cyan-400';
  const progressTrackColor = isCompleted ? 'bg-amber-400/20' : 'bg-[#0a0a0f]';

  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-[#16161e] border ${cardClass} p-5 transition-all duration-300 ${
        !isClaimed ? 'hover:-translate-y-1 hover:shadow-xl' : ''
      }`}
    >
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
              : isClaimed
                ? 'bg-white/5 border-white/10 text-gray-500'
                : 'bg-white/5 border-white/10 text-gray-400'
          }`}
        >
          <Icon name={sq.quest.icon} size={28} />
        </div>

        <div className="flex-1 min-w-0">
          {/* Title & description */}
          <h3 className={`font-bold text-lg mb-0.5 truncate ${isClaimed ? 'text-gray-500 line-through' : 'text-white'}`}>
            {sq.quest.title}
          </h3>
          {sq.quest.description && (
            <p className="text-[12px] text-gray-400 mb-3 line-clamp-2 leading-relaxed">{sq.quest.description}</p>
          )}

          {/* Progress */}
          <div className="flex justify-between text-xs font-semibold mb-1.5">
            <span className="text-gray-400">{t('pages.student.quests.progress')}</span>
            <span className={isCompleted ? 'text-amber-400' : isClaimed ? 'text-gray-500' : 'text-cyan-400'}>
              {sq.progress} / {sq.quest.targetCount}
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

            {isCompleted && (
              <button
                onClick={() => onClaim(sq.id)}
                disabled={claimPending}
                className="bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-amber-950 text-xs font-black px-4 py-1.5 rounded-lg transition-all duration-200 flex items-center gap-1 hover:shadow-[0_4px_15px_rgba(251,191,36,0.4)] hover:-translate-y-0.5 animate-pulse"
              >
                <Icon name="redeem" size={14} /> {t('pages.student.quests.claim')}
              </button>
            )}
            {isClaimed && (
              <span className="text-xs font-bold text-gray-500 flex items-center gap-1">
                <Icon name="check_circle" size={14} className="text-emerald-500/60" /> {t('pages.student.quests.claimed')}
              </span>
            )}
            {isInProgress && progressPct > 0 && (
              <span className="text-[11px] font-bold text-cyan-400/60">{progressPct}%</span>
            )}
          </div>
        </div>
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
