import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Icon } from '@cp/ui';
import { QuestType, StudentQuestStatus } from '@cp/shared';
import { useMyQuests, useClaimQuestReward } from '../../api/quests.queries';

export default function StudentQuestsPage() {
  const { t } = useTranslation();
  const { data: quests, isLoading } = useMyQuests();
  const claimMutation = useClaimQuestReward();

  const handleClaim = (studentQuestId: string) => {
    claimMutation.mutate(studentQuestId);
  };

  const dailyQuests = useMemo(() => quests?.filter(q => q.quest.type === QuestType.DAILY) || [], [quests]);
  const mainQuests = useMemo(() => quests?.filter(q => q.quest.type === QuestType.MAIN) || [], [quests]);
  const bountyQuests = useMemo(() => quests?.filter(q => q.quest.type === QuestType.BOUNTY) || [], [quests]);

  if (isLoading) {
    return (
      <div className="min-h-screen p-8 flex items-center justify-center bg-[#0f0f13]">
        <Icon name="sync" className="animate-spin text-emerald-400" size={48} />
      </div>
    );
  }

  const renderQuestCard = (sq: any) => {
    const isCompleted = sq.status === StudentQuestStatus.COMPLETED;
    const isClaimed = sq.status === StudentQuestStatus.CLAIMED;
    const progressPct = Math.min(100, Math.round((sq.progress / sq.quest.targetCount) * 100));

    let cardBorder = 'border-white/5';
    if (isCompleted) cardBorder = 'border-amber-400/50 shadow-[0_0_15px_rgba(251,191,36,0.2)]';
    if (isClaimed) cardBorder = 'border-white/10 opacity-60';

    return (
      <div key={sq.id} className={`relative overflow-hidden rounded-2xl bg-[#16161e] border ${cardBorder} p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl`}>
        {/* Glow effect */}
        {isCompleted && <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-amber-400/10 rounded-full blur-2xl"></div>}
        
        <div className="flex gap-4 items-start relative z-10">
          <div className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 border ${isCompleted ? 'bg-amber-400/10 border-amber-400/30 text-amber-400' : 'bg-white/5 border-white/10 text-gray-400'}`}>
            <Icon name={sq.quest.icon} size={28} />
          </div>
          
          <div className="flex-1">
            <h3 className={`font-bold text-lg mb-1 ${isClaimed ? 'text-gray-400' : 'text-white'}`}>{sq.quest.title}</h3>
            <p className="text-xs text-gray-400 mb-3">{sq.quest.description}</p>
            
            <div className="flex justify-between text-xs font-semibold mb-1">
              <span className="text-gray-400">Progress</span>
              <span className={isCompleted ? 'text-amber-400' : 'text-cyan-400'}>
                {sq.progress} / {sq.quest.targetCount}
              </span>
            </div>
            
            <div className="w-full h-2 bg-[#0a0a0f] rounded-full overflow-hidden mb-4">
              <div 
                className={`h-full rounded-full transition-all duration-1000 ${isCompleted ? 'bg-amber-400' : 'bg-cyan-400'}`}
                style={{ width: `${progressPct}%` }}
              ></div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex gap-3">
                <span className="flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-md">
                  XP +{sq.quest.rewardXp}
                </span>
                <span className="flex items-center gap-1 text-xs font-bold text-fuchsia-400 bg-fuchsia-400/10 px-2 py-1 rounded-md">
                  <Icon name="diamond" size={12} /> {sq.quest.rewardGems}
                </span>
              </div>
              
              {isCompleted && (
                <button 
                  onClick={() => handleClaim(sq.id)}
                  disabled={claimMutation.isPending}
                  className="bg-amber-400 hover:bg-amber-300 text-amber-950 text-xs font-black px-4 py-1.5 rounded-lg transition-colors flex items-center gap-1 animate-pulse"
                >
                  <Icon name="redeem" size={14} /> Claim
                </button>
              )}
              {isClaimed && (
                <span className="text-xs font-bold text-gray-500 flex items-center gap-1">
                  <Icon name="check_circle" size={14} /> Claimed
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen text-gray-200 p-4 md:p-8 font-sans" style={{ backgroundColor: '#0f0f13' }}>
      <header className="mb-10 text-center md:text-left">
        <h1 className="text-3xl md:text-4xl font-black text-white mb-2 flex items-center justify-center md:justify-start gap-3">
          <Icon name="swords" className="text-amber-400" size={36} /> 
          Quest Board
        </h1>
        <p className="text-gray-400">Complete challenges, earn rewards, and level up your skills!</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Daily Quests */}
        <div className="lg:col-span-1 flex flex-col gap-5">
          <div className="flex items-center gap-2 mb-2">
            <Icon name="today" className="text-emerald-400" />
            <h2 className="text-xl font-bold text-white">Daily Quests</h2>
          </div>
          {dailyQuests.length === 0 ? (
            <p className="text-sm text-gray-500 italic">No daily quests available.</p>
          ) : (
            dailyQuests.map(renderQuestCard)
          )}
        </div>

        {/* Main Quests */}
        <div className="lg:col-span-1 flex flex-col gap-5">
          <div className="flex items-center gap-2 mb-2">
            <Icon name="menu_book" className="text-cyan-400" />
            <h2 className="text-xl font-bold text-white">Main Story</h2>
          </div>
          {mainQuests.length === 0 ? (
            <p className="text-sm text-gray-500 italic">No main quests available.</p>
          ) : (
            mainQuests.map(renderQuestCard)
          )}
        </div>

        {/* Bounties */}
        <div className="lg:col-span-1 flex flex-col gap-5">
          <div className="flex items-center gap-2 mb-2">
            <Icon name="local_fire_department" className="text-orange-400" />
            <h2 className="text-xl font-bold text-white">Bounties</h2>
          </div>
          {bountyQuests.length === 0 ? (
            <p className="text-sm text-gray-500 italic">No bounties available right now.</p>
          ) : (
            bountyQuests.map(renderQuestCard)
          )}
        </div>

      </div>
    </div>
  );
}
