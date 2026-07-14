import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Icon, useToast } from '@cp/ui';
import { IWeeklyWinnerPendingReward } from '@cp/shared';
import { useClaimReward } from '../api/gamification.queries';

interface WeeklyWinnerModalProps {
  reward: IWeeklyWinnerPendingReward;
  isOpen: boolean;
  onClose: () => void;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  delay: number;
  duration: number;
  rotate: number;
}

const AVATAR_MAPPING: Record<
  string,
  { nameVi: string; nameEn: string; image: string; colors: string; textGlow: string; bgGlow: string }
> = {
  CHAR_WEEKLY_CHAMPION: {
    nameVi: 'Chiến thần Bảng tuần',
    nameEn: 'Weekly Champion',
    image: '/character/male/15-divine.svg',
    colors: 'from-amber-400 via-orange-500 to-yellow-500',
    textGlow: 'text-amber-500 drop-shadow-[0_2px_8px_rgba(245,158,11,0.5)]',
    bgGlow: 'bg-amber-400/20 shadow-[0_0_50px_rgba(245,158,11,0.4)]',
  },
  CHAR_WEEKLY_ELITE: {
    nameVi: 'Cao thủ Bảng tuần',
    nameEn: 'Weekly Elite',
    image: '/character/male/12-royal.svg',
    colors: 'from-fuchsia-500 via-pink-500 to-violet-500',
    textGlow: 'text-fuchsia-500 drop-shadow-[0_2px_8px_rgba(217,70,239,0.5)]',
    bgGlow: 'bg-fuchsia-400/20 shadow-[0_0_50px_rgba(217,70,239,0.4)]',
  },
  CHAR_WEEKLY_CHALLENGER: {
    nameVi: 'Đấu sĩ Bảng tuần',
    nameEn: 'Weekly Challenger',
    image: '/character/male/6-platinum.svg',
    colors: 'from-sky-400 via-blue-500 to-indigo-500',
    textGlow: 'text-sky-500 drop-shadow-[0_2px_8px_rgba(14,165,233,0.5)]',
    bgGlow: 'bg-sky-400/20 shadow-[0_0_50px_rgba(14,165,233,0.4)]',
  },
};

export function WeeklyWinnerModal({ reward, isOpen, onClose }: WeeklyWinnerModalProps) {
  const { i18n } = useTranslation();
  const toast = useToast();
  const claimRewardMutation = useClaimReward();
  const [particles, setParticles] = useState<Particle[]>([]);

  const isVi = i18n.language === 'vi';
  const rank = reward.rank;
  const avatarCode = reward.rewards.avatarCode || 'CHAR_WEEKLY_CHALLENGER';
  const avatarDetails = AVATAR_MAPPING[avatarCode] || AVATAR_MAPPING.CHAR_WEEKLY_CHALLENGER;

  // Generate confetti particles when modal opens
  useEffect(() => {
    if (isOpen) {
      const colors = ['#f59e0b', '#ec4899', '#3b82f6', '#10b981', '#a855f7', '#f43f5e'];
      const tempParticles: Particle[] = Array.from({ length: 40 }).map((_, i) => ({
        id: i,
        x: (Math.random() - 0.5) * 320, // random offset from center horizontal
        y: Math.random() * -300 - 50, // random distance shooting up
        size: Math.random() * 12 + 6,
        color: colors[Math.floor(Math.random() * colors.length)],
        delay: Math.random() * 0.4,
        duration: Math.random() * 1.5 + 1.2,
        rotate: Math.random() * 360,
      }));
      setParticles(tempParticles);
    }
  }, [isOpen]);

  const handleClaim = async () => {
    try {
      await claimRewardMutation.mutateAsync();
      toast.success(
        isVi
          ? 'Chúc mừng! Nhận phần thưởng tuần thành công.'
          : 'Congratulations! Weekly reward claimed successfully.'
      );
      onClose();
    } catch (error) {
      toast.error(
        isVi ? 'Đã xảy ra lỗi khi nhận thưởng. Vui lòng thử lại.' : 'Error claiming reward. Please try again.'
      );
    }
  };

  const getRankTitle = () => {
    if (rank === 1) return isVi ? 'Chiến Thần Vô Địch' : 'Grand Champion';
    if (rank === 2 || rank === 3) return isVi ? 'Cao Thủ Vinh Quang' : 'Royal Elite';
    return isVi ? 'Đấu Sĩ Kiên Cường' : 'Challenger';
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[100] grid place-items-center bg-black/60 backdrop-blur-md px-4 overflow-y-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop click does not close to prevent accidental dismissals of important rewards */}
          <div className="absolute inset-0" onClick={() => {}} />

          <motion.div
            className="relative w-full max-w-lg rounded-3xl bg-[#13111C] border border-[#2B273F] p-8 text-center shadow-2xl overflow-hidden my-8"
            initial={{ scale: 0.85, y: 30, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.85, y: 20, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Ambient background rays / glow */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl">
              <div className={`absolute -top-32 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full blur-[100px] opacity-40 ${avatarDetails.bgGlow}`} />
            </div>

            {/* Confetti Animation Layer */}
            <div className="absolute inset-x-0 bottom-1/2 pointer-events-none flex justify-center">
              {particles.map((p) => (
                <motion.div
                  key={p.id}
                  className="absolute rounded-sm"
                  style={{
                    width: p.size,
                    height: p.size,
                    backgroundColor: p.color,
                    borderRadius: p.id % 3 === 0 ? '50%' : p.id % 3 === 1 ? '0%' : '0 100% 100% 100%',
                  }}
                  initial={{ x: 0, y: 150, opacity: 0, rotate: 0 }}
                  animate={{
                    x: p.x,
                    y: p.y,
                    opacity: [0, 1, 1, 0],
                    rotate: p.rotate + 360,
                  }}
                  transition={{
                    delay: p.delay,
                    duration: p.duration,
                    ease: 'easeOut',
                  }}
                />
              ))}
            </div>

            {/* Winner Trophy Icon / Rank Badge */}
            <motion.div
              className={`mx-auto mb-4 w-20 h-20 rounded-2xl grid place-items-center bg-gradient-to-br ${avatarDetails.colors} shadow-lg`}
              initial={{ rotate: -15, scale: 0.6 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ type: 'spring', stiffness: 280, damping: 15, delay: 0.1 }}
            >
              <Icon name="emoji_events" size={44} className="text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.2)]" />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <span className={`inline-block px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider bg-white/5 border border-white/10 ${avatarDetails.textGlow}`}>
                🏆 {isVi ? `Hạng #${rank}` : `Rank #${rank}`} • {getRankTitle()}
              </span>
            </motion.div>

            {/* Celebration Header */}
            <motion.h2
              className="text-2xl md:text-3xl font-black text-white mt-4 mb-2 tracking-tight"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
            >
              {isVi ? 'Vinh Danh Bảng Tuần!' : 'Weekly Leaderboard Hero!'}
            </motion.h2>

            <motion.p
              className="text-sm text-slate-300 max-w-sm mx-auto mb-6 leading-relaxed"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              {isVi
                ? `Chúc mừng bạn đã xuất sắc lọt top vinh danh tuần qua với tổng số ${reward.weeklyXp.toLocaleString()} XP tích luỹ!`
                : `Congratulations on climbing to the top! You earned an impressive ${reward.weeklyXp.toLocaleString()} XP last week!`}
            </motion.p>

            {/* Main Rewards Display Grid */}
            <motion.div
              className="grid grid-cols-3 gap-3 mb-8 bg-white/[0.02] border border-white/5 rounded-2xl p-4"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.35, type: 'spring', stiffness: 200, damping: 20 }}
            >
              {/* XP reward */}
              <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-white/[0.02] border border-white/5">
                <div className="w-10 h-10 rounded-full bg-cyan-500/10 border border-cyan-500/20 grid place-items-center mb-1">
                  <Icon name="star" size={20} className="text-cyan-400" />
                </div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">XP</span>
                <span className="text-sm font-black text-cyan-400 mt-0.5">+{reward.rewards.xp}</span>
              </div>

              {/* Gems reward */}
              <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-white/[0.02] border border-white/5">
                <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/20 grid place-items-center mb-1">
                  <Icon name="diamond" size={18} className="text-amber-400" />
                </div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  {isVi ? 'Đá quý' : 'Gems'}
                </span>
                <span className="text-sm font-black text-amber-400 mt-0.5">+{reward.rewards.gems}</span>
              </div>

              {/* Weekly Avatar reward */}
              <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-white/[0.02] border border-white/5 relative">
                <div className="w-10 h-10 rounded-full bg-fuchsia-500/10 border border-fuchsia-500/20 grid place-items-center mb-1 overflow-hidden">
                  <img
                    src={avatarDetails.image}
                    alt={avatarDetails.nameVi}
                    className="w-8 h-8 object-contain"
                  />
                </div>
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider text-center truncate w-full">
                  {isVi ? avatarDetails.nameVi : avatarDetails.nameEn}
                </span>
                <span className="text-[8px] font-extrabold text-fuchsia-400 bg-fuchsia-500/10 border border-fuchsia-500/20 px-1 py-0.5 rounded mt-1 whitespace-nowrap flex items-center gap-0.5">
                  <Icon name="schedule" size={8} />
                  {isVi ? '7 ngày' : '7 days'}
                </span>
              </div>
            </motion.div>

            {/* Claim Action Button */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              className="flex flex-col gap-3"
            >
              <button
                type="button"
                onClick={handleClaim}
                disabled={claimRewardMutation.isPending}
                className={`relative w-full py-3.5 rounded-2xl bg-gradient-to-r ${avatarDetails.colors} text-white font-black text-sm uppercase tracking-wider hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 shadow-lg`}
              >
                {claimRewardMutation.isPending ? (
                  <>
                    <Icon name="sync" className="animate-spin text-white" size={18} />
                    {isVi ? 'Đang Nhận...' : 'Claiming...'}
                  </>
                ) : (
                  <>
                    <Icon name="redeem" size={18} />
                    {isVi ? 'Nhận Thưởng' : 'Claim Reward'}
                  </>
                )}
              </button>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
