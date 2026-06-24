import { Icon } from '@cp/ui';
import { ILeaderboardRankEntry } from '@cp/shared';

import { useMe } from '../api/me.queries';
import { useLeaderboard } from '../api/gamification.queries';

/** Two initials fallback when a player has no equipped character avatar. */
function initials(name: string): string {
  return (
    name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('') || '?'
  );
}

type RowVariant = 'above' | 'me' | 'below';

/** Medal flair for the top three ranks; plain chip otherwise. */
function rankChip(rank: number, isMe: boolean) {
  const medal =
    rank === 1
      ? 'bg-gradient-to-br from-amber-300 to-orange-500 text-amber-950'
      : rank === 2
        ? 'bg-gradient-to-br from-slate-200 to-slate-400 text-slate-800'
        : rank === 3
          ? 'bg-gradient-to-br from-orange-300 to-amber-700 text-orange-50'
          : isMe
            ? 'bg-primary/20 text-primary'
            : 'bg-surface-container-highest text-on-surface-variant';
  return (
    <span
      className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-black tabular-nums ${medal}`}
    >
      {rank}
    </span>
  );
}

function RankRow({
  entry,
  variant,
  avatarOverride,
}: {
  entry: ILeaderboardRankEntry;
  variant: RowVariant;
  /** Prefer the freshest avatar (e.g. from useMe) for the current player's row. */
  avatarOverride?: string | null;
}) {
  const isMe = variant === 'me';
  const avatarUrl = avatarOverride ?? entry.avatarUrl;

  return (
    <div
      className={`flex items-center gap-2.5 rounded-2xl px-2.5 py-2 transition-colors ${
        isMe
          ? 'bg-gradient-to-r from-primary/15 to-primary/5 ring-1 ring-inset ring-primary/40 dark:from-primary/20'
          : 'hover:bg-surface-container-high/70'
      }`}
    >
      {rankChip(entry.rank, isMe)}

      {/* Avatar */}
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={entry.name}
          className="h-9 w-9 shrink-0 rounded-full bg-surface-container-high object-contain"
        />
      ) : (
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-surface-container-highest text-[11px] font-black text-on-surface">
          {initials(entry.name)}
        </div>
      )}

      {/* Name + flair */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span
            className="truncate text-sm font-bold text-on-surface"
            style={entry.nameColor ? { color: entry.nameColor } : undefined}
          >
            {entry.name}
          </span>
          {isMe && (
            <span className="shrink-0 rounded-full bg-primary px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-on-primary">
              It's me
            </span>
          )}
        </div>
        {entry.title && (
          <p className="truncate text-[10px] font-semibold text-fuchsia-600 dark:text-fuchsia-300">
            {entry.title}
          </p>
        )}
      </div>

      {/* XP value */}
      <span className="flex shrink-0 items-center gap-0.5 text-sm font-black tabular-nums text-on-surface">
        <Icon name="bolt" size={13} className="text-amber-500" />
        {entry.value.toLocaleString()}
      </span>
    </div>
  );
}

/**
 * Compact ranking snapshot shown inside the "level complete" confirm popup.
 * Renders the current player's equipped character avatar, their leaderboard
 * position, and the players one rank above and below — each guarded so a
 * top-1 or last-place player simply omits the missing neighbour.
 */
export function CompletionRankingInfo() {
  const { data: me } = useMe();
  const { data: leaderboard, isLoading } = useLeaderboard({ limit: 100 });

  const entries = leaderboard?.entries ?? [];
  // Prefer the server-provided "me" entry (accurate even outside the top N),
  // then fall back to matching by id within the visible list.
  const myEntry =
    leaderboard?.me ??
    entries.find((entry) => entry.isMe || (me != null && entry.userId === me.id)) ??
    null;

  if (isLoading) {
    return (
      <div className="mt-4 -ml-14 flex items-center justify-center gap-2 rounded-2xl border border-outline-variant bg-surface-container-low px-4 py-3 text-on-surface-variant dark:border-white/5">
        <Icon name="sync" size={16} className="animate-spin text-primary" />
        <span className="text-xs font-medium">Đang tải bảng xếp hạng…</span>
      </div>
    );
  }

  if (!myEntry) return null;

  const myIndex = entries.findIndex((entry) => entry.userId === myEntry.userId);
  // Safe neighbour lookup — undefined when the player is top-1 or last.
  const above = myIndex > 0 ? entries[myIndex - 1] : undefined;
  const below = myIndex >= 0 && myIndex < entries.length - 1 ? entries[myIndex + 1] : undefined;

  const headerAvatar = me?.avatarUrl ?? myEntry.avatarUrl;

  return (
    <div className="mt-4 -ml-14 overflow-hidden rounded-3xl border border-outline-variant bg-surface-container-low shadow-elev-1 dark:border-white/5">
      {/* ── Hero: character avatar + headline rank ── */}
      <div className="relative flex items-center gap-3 bg-gradient-to-r from-primary/15 via-primary/5 to-transparent px-4 py-3.5">
        <div className="relative shrink-0">
          <div className="grid h-16 w-16 place-items-center rounded-2xl bg-surface-container-lowest/80 ring-2 ring-primary/30 shadow-elev-1">
            {headerAvatar ? (
              <img
                src={headerAvatar}
                alt={myEntry.name}
                className="h-14 w-14 rounded-xl object-contain"
              />
            ) : (
              <span className="text-xl font-black text-primary">{initials(myEntry.name)}</span>
            )}
          </div>
          <span className="absolute -bottom-1.5 -right-1.5 grid h-7 min-w-7 place-items-center rounded-full bg-gradient-to-br from-amber-300 to-orange-500 px-1.5 text-xs font-black tabular-nums text-amber-950 shadow-elev-1 ring-2 ring-surface-container-low">
            #{myEntry.rank}
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1 text-[11px] font-black uppercase tracking-wider text-primary">
            <Icon name="leaderboard" size={14} />
            Vị trí của em
          </p>
          <p className="mt-0.5 flex items-baseline gap-1.5">
            <span className="text-2xl font-black leading-none text-on-surface">#{myEntry.rank}</span>
            <span className="truncate text-xs font-bold text-on-surface-variant">
              {myEntry.value.toLocaleString()} điểm
            </span>
          </p>
        </div>
      </div>

      {/* ── Mini leaderboard: above / me / below ── */}
      <div className="space-y-1 px-2 pb-2 pt-1.5">
        {above && <RankRow entry={above} variant="above" />}
        <RankRow entry={myEntry} variant="me" avatarOverride={me?.avatarUrl} />
        {below && <RankRow entry={below} variant="below" />}

        {!above && (
          <p className="flex items-center justify-center gap-1 py-1.5 text-[11px] font-bold text-amber-600 dark:text-amber-300">
            <Icon name="trophy" size={14} /> Em đang dẫn đầu bảng xếp hạng!
          </p>
        )}
        {!below && above && (
          <p className="flex items-center justify-center gap-1 py-1.5 text-[11px] font-medium text-on-surface-variant">
            <Icon name="flag" size={14} /> Em đang ở cuối bảng — cố lên nhé!
          </p>
        )}
      </div>
    </div>
  );
}
