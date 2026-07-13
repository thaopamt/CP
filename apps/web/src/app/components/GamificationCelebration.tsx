import { useCallback, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Icon } from '@cp/ui';
import { IGamificationEvent } from '@cp/shared';

import { useGamificationSocket } from '../hooks/useGamificationSocket';

/**
 * Full-screen celebration popup that fires when a background submission grade
 * completes a quest / unlocks a badge / levels the student up. Subscribes to
 * the gamification socket (toast suppressed — this popup replaces it) and shows
 * one event at a time from a small queue.
 *
 * Mount once inside the student shell.
 */
export function GamificationCelebration() {
  const { t } = useTranslation();
  const [queue, setQueue] = useState<IGamificationEvent[]>([]);

  const enqueue = useCallback((event: IGamificationEvent) => {
    setQueue((q) => [...q, event]);
  }, []);

  // Drive the popup from live events; suppress the hook's default toast.
  useGamificationSocket(enqueue, { showToast: false });

  const current = queue[0] ?? null;
  const dismiss = useCallback(() => setQueue((q) => q.slice(1)), []);

  return (
    <AnimatePresence>
      {current && (
        <CelebrationCardInner key={current.at} event={current} onClose={dismiss} t={t} />
      )}
    </AnimatePresence>
  );
}

type TFn = (key: string, opts?: Record<string, unknown>) => string;

const THEME: Record<
  IGamificationEvent['type'],
  { ring: string; glow: string; headingKey: string; emoji: string }
> = {
  'quest:completed': {
    ring: 'from-emerald-400 to-teal-500',
    glow: 'shadow-[0_0_60px_rgba(16,185,129,0.45)]',
    headingKey: 'gamif.student.celebration.questDone',
    emoji: '⚔️',
  },
  'badge:earned': {
    ring: 'from-amber-300 to-orange-500',
    glow: 'shadow-[0_0_60px_rgba(251,191,36,0.5)]',
    headingKey: 'gamif.student.celebration.badgeEarned',
    emoji: '🏅',
  },
  'level:up': {
    ring: 'from-violet-400 to-fuchsia-500',
    glow: 'shadow-[0_0_60px_rgba(139,92,246,0.5)]',
    headingKey: 'gamif.student.celebration.levelUp',
    emoji: '⬆️',
  },
};

// Extracted inner component, returning motion.div directly so AnimatePresence can track it
import { forwardRef } from 'react';

const CelebrationCardInner = forwardRef<HTMLDivElement, {
  event: IGamificationEvent;
  onClose: () => void;
  t: TFn;
}>(function CelebrationCardInner({ event, onClose, t }, ref) {
  const theme = THEME[event.type] ?? THEME['quest:completed'];

  return (
    <motion.div
      ref={ref}
      className="fixed inset-0 z-[100] grid place-items-center bg-black/60 backdrop-blur-sm px-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="relative w-full max-w-sm rounded-3xl bg-surface-container-lowest border border-outline-variant dark:border-white/10 p-8 text-center overflow-hidden shadow-elev-3"
        initial={{ scale: 0.7, y: 30, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.8, y: 20, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 320, damping: 24 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glowing icon disc */}
        <motion.div
          className={`mx-auto mb-5 w-24 h-24 rounded-full grid place-items-center bg-gradient-to-br ${theme.ring} ${theme.glow}`}
          initial={{ rotate: -12, scale: 0.6 }}
          animate={{ rotate: 0, scale: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 14, delay: 0.05 }}
        >
          <Icon name={event.icon || 'celebration'} size={48} className="text-white" />
        </motion.div>

        <p className="text-xs font-black uppercase tracking-[0.2em] text-on-surface-variant mb-1">
          {theme.emoji} {t(theme.headingKey)}
        </p>
        <h2 className="text-2xl font-black text-on-surface mb-2">{event.title}</h2>
        <p className="text-sm text-on-surface-variant mb-5">
          {event.type === 'level:up'
            ? t('gamif.student.celebration.levelReached', { level: event.level ?? '' })
            : event.message}
        </p>

        {/* Reward chips */}
        {(event.rewardXp || event.rewardGems) && (
          <div className="flex items-center justify-center gap-3 mb-6">
            {!!event.rewardXp && (
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-cyan-100 text-cyan-700 dark:bg-cyan-400/10 dark:text-cyan-300 text-sm font-bold">
                <Icon name="star" size={16} /> +{event.rewardXp} XP
              </span>
            )}
            {!!event.rewardGems && (
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300 text-sm font-bold">
                <Icon name="diamond" size={16} /> +{event.rewardGems}
              </span>
            )}
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full py-3 rounded-2xl bg-primary text-on-primary hover:opacity-90 font-bold transition-opacity"
        >
          {t('gamif.student.celebration.awesome')}
        </button>
      </motion.div>
    </motion.div>
  );
});
