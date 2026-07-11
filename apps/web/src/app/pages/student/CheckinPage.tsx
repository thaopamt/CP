import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Icon } from '@cp/ui';
import { useCheckinStatus, useCheckIn, useMakeup, useWheelSpin, useCheckinLeaderboard } from '../../api/checkin.queries';
import { buildBoardWeeks, streakBonusGems } from '../../lib/checkin-board';
import type { ICheckinBoardCell, ICheckinWheelResult, ICheckinLeaderboardRow } from '@cp/shared';

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
  const makeup = useMakeup();
  const spin = useWheelSpin();
  const { data: leaderboard, isLoading: leaderboardLoading } = useCheckinLeaderboard(20);
  const [wheelResult, setWheelResult] = useState<ICheckinWheelResult | null>(null);

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

      <section className="flex flex-wrap items-center gap-sm">
        <Chip icon="ac_unit" label={t('checkin.freezeTokens')} value={status.freezeTokens} />
        <Chip icon="casino" label={t('checkin.spins')} value={status.pendingWheelSpins} />
      </section>

      <section className="rounded-3xl bg-surface-container-low p-md flex flex-col items-center gap-sm">
        <div className="w-full max-w-[22rem] flex flex-col gap-1">
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
                ) : cell.status === 'today' ? (
                  // Today's cell IS the check-in button (shown only when not yet checked in;
                  // once checked in the board marks the day 'checked').
                  <button
                    key={cell.dayKey}
                    type="button"
                    title={t('checkin.checkInCta')}
                    aria-label={t('checkin.checkInCta')}
                    disabled={checkIn.isPending}
                    onClick={() => checkIn.mutate()}
                    className="relative aspect-square grid place-items-center rounded-lg text-label-md font-bold bg-primary text-on-primary ring-2 ring-primary ring-offset-2 ring-offset-surface-container-low animate-pulse hover:animate-none hover:brightness-110 transition disabled:opacity-50"
                  >
                    {Number(cell.dayKey.slice(-2))}
                    <Icon
                      name="touch_app"
                      size={12}
                      className="absolute -bottom-1 -right-1 rounded-full bg-primary text-on-primary p-[1px]"
                    />
                  </button>
                ) : cell.status === 'missable' ? (
                  <button
                    key={cell.dayKey}
                    type="button"
                    disabled={status.makeupRemaining < 1 || makeup.isPending}
                    onClick={() => {
                      if (
                        window.confirm(
                          t('checkin.makeupConfirm', { cost: status.makeupCost, remaining: status.makeupRemaining }),
                        )
                      ) {
                        makeup.mutate(cell.dayKey);
                      }
                    }}
                    className={`aspect-square grid place-items-center rounded-lg text-label-md ${CELL_CLASS[cell.status]} hover:ring-2 hover:ring-primary/50 transition disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:ring-0`}
                  >
                    {Number(cell.dayKey.slice(-2))}
                  </button>
                ) : (
                  <span
                    key={cell.dayKey}
                    className={`aspect-square grid place-items-center rounded-lg text-label-md ${CELL_CLASS[cell.status]}`}
                  >
                    {Number(cell.dayKey.slice(-2))}
                  </span>
                ),
              )}
            </div>
          ))}
        </div>
        <p className="text-label-md font-semibold text-on-surface text-center">
          {status.checkedInToday
            ? `✓ ${t('checkin.checkedInToday')}`
            : t('checkin.rewardToast', { gems: 5 + streakBonusGems(status.currentStreak + 1), xp: 20 })}
        </p>
        <p className="text-label-sm text-on-surface-variant text-center">
          {t('checkin.makeupInfo', { remaining: status.makeupRemaining, cost: status.makeupCost })}
        </p>
      </section>

      <section className="rounded-3xl bg-surface-container-low p-md flex flex-col gap-sm">
        <h2 className="text-title-md font-bold text-on-surface flex items-center gap-2">
          <Icon name="casino" size={20} className="text-primary" />
          {t('checkin.wheelTitle')}
        </h2>
        <div className="flex items-center gap-md">
          <button
            type="button"
            disabled={status.pendingWheelSpins < 1 || spin.isPending}
            onClick={() => spin.mutate(undefined, { onSuccess: (result) => setWheelResult(result) })}
            className="px-lg py-3 rounded-full bg-tertiary text-on-tertiary font-bold disabled:opacity-50"
          >
            {t('checkin.spinCta')} ({status.pendingWheelSpins})
          </button>
          {status.pendingWheelSpins < 1 && (
            <span className="text-on-surface-variant text-label-md">{t('checkin.noSpins')}</span>
          )}
        </div>
        {wheelResult && (
          <p className="text-label-md font-semibold text-on-surface">{wheelPrizeText(t, wheelResult)}</p>
        )}
      </section>

      <section className="rounded-3xl bg-surface-container-low p-md flex flex-col gap-sm">
        <h2 className="text-title-md font-bold text-on-surface flex items-center gap-2">
          <Icon name="leaderboard" size={20} className="text-primary" />
          {t('checkin.leaderboardTitle')}
        </h2>
        {leaderboardLoading ? (
          <p className="text-on-surface-variant text-label-md">{t('common.loading')}</p>
        ) : !leaderboard || leaderboard.length === 0 ? (
          <p className="text-on-surface-variant text-label-md">{t('checkin.noEntries')}</p>
        ) : (
          <ul className="flex flex-col gap-1">
            {leaderboard.map((row) => (
              <LeaderboardRow key={row.userId} row={row} t={t} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Chip({ icon, label, value }: { icon: string; label: string; value: number }) {
  return (
    <div className="flex items-center gap-2 rounded-full bg-surface-container-low px-md py-2">
      <Icon name={icon} size={18} className="text-primary" />
      <span className="text-label-md text-on-surface-variant">{label}</span>
      <span className="text-label-md font-bold text-on-surface">{value}</span>
    </div>
  );
}

function LeaderboardRow({ row, t }: { row: ICheckinLeaderboardRow; t: (key: string, opts?: Record<string, unknown>) => string }) {
  return (
    <li className="flex items-center gap-sm py-2 px-sm rounded-xl hover:bg-surface-container-high">
      <span className="w-8 text-center text-label-md font-bold text-on-surface-variant">#{row.rank}</span>
      {row.avatarUrl ? (
        <img src={row.avatarUrl} alt={row.displayName} className="w-8 h-8 rounded-full object-cover" />
      ) : (
        <div className="w-8 h-8 rounded-full bg-surface-container-high grid place-items-center text-label-sm font-bold text-on-surface">
          {row.displayName.slice(0, 1).toUpperCase()}
        </div>
      )}
      <span className="flex-1 truncate text-label-md font-semibold text-on-surface">{row.displayName}</span>
      <span className="text-label-sm text-on-surface-variant">
        {row.currentStreak} {t('checkin.days')}
      </span>
      <span className="text-label-sm text-on-surface-variant">{row.totalCheckins}</span>
    </li>
  );
}

function wheelPrizeText(t: (key: string, opts?: Record<string, unknown>) => string, result: ICheckinWheelResult): string {
  const { prize } = result;
  if (prize.kind === 'item') {
    return t('checkin.wheelPrize', { amount: 1, kind: prize.itemCode ?? prize.kind });
  }
  return t('checkin.wheelPrize', {
    amount: prize.amount ?? 0,
    kind: prize.kind === 'gems' ? t('checkin.gemsLabel') : t('checkin.xpLabel'),
  });
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-surface-container-low p-md flex flex-col gap-1">
      <span className="text-label-sm text-on-surface-variant">{label}</span>
      <span className="text-title-lg font-extrabold text-on-surface">{value}</span>
    </div>
  );
}
