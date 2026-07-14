import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useCheckinStatus, useCheckIn } from '../api/checkin.queries';
import { shouldOpenCheckinPopup, streakBonusGems, nextStreakMilestone } from '../lib/checkin-board';
import { useAuthStore } from '../stores/auth.store';

/**
 * Self-contained, zero-prop. Opens at most once per VN day (server-authoritative
 * `status.today`) and only when the student has not yet checked in today. The
 * gate decision is the pure `shouldOpenCheckinPopup` helper (unit-tested).
 */
export default function CheckinPopup() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const { data: status } = useCheckinStatus();
  const checkIn = useCheckIn();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!status || !user) return;
    const popupKey = `checkin:lastPopupDay:${user.id}`;
    const decision = shouldOpenCheckinPopup({
      checkedInToday: status.checkedInToday,
      today: status.today,
      lastPopupDay: localStorage.getItem(popupKey),
    });
    if (!decision) return;
    setOpen(true);
  }, [status, user]);

  useEffect(() => {
    if (status?.checkedInToday) {
      setOpen(false);
    }
  }, [status?.checkedInToday]);

  const dismiss = () => {
    if (user && status) {
      const popupKey = `checkin:lastPopupDay:${user.id}`;
      localStorage.setItem(popupKey, status.today);
    }
    setOpen(false);
  };
  const nextMs = status ? nextStreakMilestone(status.currentStreak) : null;

  return (
    <AnimatePresence>
      {open && status && (
        <motion.div 
          className="fixed inset-0 z-[90] grid place-items-center bg-black/40 backdrop-blur-sm" 
          role="dialog" 
          aria-modal="true"
          onClick={dismiss}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div 
            className="w-[min(92vw,26rem)] rounded-3xl bg-surface p-lg flex flex-col gap-md shadow-elev-3"
            onClick={(e) => e.stopPropagation()}
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            <div className="flex items-center gap-sm">
              <span className="material-symbols-outlined text-primary text-[32px]">event_available</span>
              <h2 className="text-title-lg font-extrabold text-on-surface">{t('checkin.popup.title')}</h2>
            </div>
            <p className="text-on-surface-variant">{t('checkin.popup.body')}</p>
            <div className="flex flex-col gap-1 rounded-2xl bg-surface-container-low p-md">
              <p className="text-label-md font-semibold text-on-surface">
                {t('checkin.popup.streak', { days: status.currentStreak })}
              </p>
              <p className="text-label-md text-primary font-bold">
                {t('checkin.popup.reward', { gems: 5 + streakBonusGems(status.currentStreak + 1), xp: 20 })}
              </p>
              {nextMs !== null && (
                <p className="text-label-sm text-on-surface-variant">
                  {t('checkin.nudge.streak', { n: nextMs - status.currentStreak, milestone: nextMs })}
                </p>
              )}
            </div>
            <div className="flex items-center justify-end gap-sm">
              <button type="button" onClick={dismiss} className="px-md py-2 rounded-full text-on-surface-variant">
                {t('checkin.popup.later')}
              </button>
              <button
                type="button"
                disabled={checkIn.isPending}
                onClick={() =>
                  checkIn.mutate(undefined, {
                    onSuccess: dismiss,
                  })
                }
                className="px-lg py-2 rounded-full bg-primary text-on-primary font-bold disabled:opacity-50"
              >
                {t('checkin.checkInCta')}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
