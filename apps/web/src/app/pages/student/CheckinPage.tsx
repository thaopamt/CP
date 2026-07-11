import { useTranslation } from 'react-i18next';
import { useCheckinStatus, useCheckIn } from '../../api/checkin.queries';
import { buildBoardWeeks, streakBonusGems } from '../../lib/checkin-board';
import type { ICheckinBoardCell } from '@cp/shared';

const CELL_CLASS: Record<ICheckinBoardCell['status'], string> = {
  checked: 'bg-primary text-on-primary',
  today: 'bg-tertiary-container text-on-tertiary-container ring-2 ring-primary',
  future: 'bg-surface-container-high text-on-surface-variant',
  missed: 'bg-surface-container text-on-surface-variant/50 line-through',
  makeup: 'bg-secondary-container text-on-secondary-container', // Phase 2 (never emitted in Phase 1)
  missable: 'bg-surface-container text-on-surface-variant', // Phase 2 (never emitted in Phase 1)
};

export default function CheckinPage() {
  const { t } = useTranslation();
  const { data: status, isLoading } = useCheckinStatus();
  const checkIn = useCheckIn();

  if (isLoading || !status) {
    return <div className="p-lg text-on-surface-variant">…</div>;
  }

  const weeks = buildBoardWeeks(status);
  const weekdayKeys = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;

  return (
    <div className="max-w-3xl mx-auto py-lg flex flex-col gap-lg">
      <header className="flex flex-col gap-xs">
        <h1 className="text-headline-md font-extrabold text-primary">{t('checkin.title')}</h1>
        <p className="text-on-surface-variant">{t('checkin.subtitle')}</p>
      </header>

      <section className="grid grid-cols-3 gap-md">
        <Stat label={t('checkin.currentStreak')} value={`${status.currentStreak} ${t('checkin.days')}`} />
        <Stat label={t('checkin.longestStreak')} value={`${status.longestStreak} ${t('checkin.days')}`} />
        <Stat label={t('checkin.totalCheckins')} value={String(status.totalCheckins)} />
      </section>

      <section className="rounded-3xl bg-surface-container-low p-md flex flex-col gap-sm">
        <div className="grid grid-cols-7 gap-1 text-center text-label-sm text-on-surface-variant">
          {weekdayKeys.map((k) => (
            <span key={k}>{t(`checkin.weekdays.${k}`)}</span>
          ))}
        </div>
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 gap-1">
            {week.cells.map((cell, ci) =>
              cell === null ? (
                <span key={ci} />
              ) : (
                <span
                  key={cell.dayKey}
                  className={`aspect-square grid place-items-center rounded-xl text-label-md ${CELL_CLASS[cell.status]}`}
                >
                  {Number(cell.dayKey.slice(-2))}
                </span>
              ),
            )}
          </div>
        ))}
      </section>

      <div className="flex items-center gap-md">
        <button
          type="button"
          disabled={status.checkedInToday || checkIn.isPending}
          onClick={() => checkIn.mutate()}
          className="px-lg py-3 rounded-full bg-primary text-on-primary font-bold disabled:opacity-50"
        >
          {status.checkedInToday ? t('checkin.checkedInToday') : t('checkin.checkInCta')}
        </button>
        <span className="text-on-surface-variant text-label-md">
          {t('checkin.rewardToast', { gems: 5 + streakBonusGems(status.currentStreak + 1), xp: 20 })}
        </span>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-surface-container-low p-md flex flex-col gap-1">
      <span className="text-label-sm text-on-surface-variant">{label}</span>
      <span className="text-title-lg font-extrabold text-on-surface">{value}</span>
    </div>
  );
}
