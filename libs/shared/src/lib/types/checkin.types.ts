// ───────────────────────────────────────────────────────────────────────────
// Daily Check-in (điểm danh) — student self check-in gamification loop.
//
// One `daily_checkins` row per (user, dayKey); one `checkin_states` row per
// user. `status` values `makeup`/`missable` are Phase-2-only; `missed` is
// Phase-1-only (see design §4.3). The union carries all six for stability.
// ───────────────────────────────────────────────────────────────────────────

export interface ICheckinBoardCell {
  dayKey: string; // 'YYYY-MM-DD'
  status: 'checked' | 'makeup' | 'missable' | 'missed' | 'future' | 'today';
}

export interface ICheckinStatus {
  today: string; // checkinDayKey(now), VN day
  checkedInToday: boolean;
  monthKey: string; // 'YYYY-MM'
  board: ICheckinBoardCell[]; // whole current month
  currentStreak: number;
  longestStreak: number;
  totalCheckins: number;
  monthlyCheckins: number; // display-only
  freezeTokens: number;
  pendingWheelSpins: number;
  makeupRemaining: number;
  makeupCost: number;
}

export interface ICheckinReward {
  gems: number;
  xp: number;
}

export interface ICheckinResult {
  status: ICheckinStatus; // state after the action
  reward: ICheckinReward; // gems/xp granted by this action
  weeklyMilestone: boolean;
  allTimeMilestone: number | null; // 7|30|100|null
  perfectMonth: boolean;
  badgesEarned: string[]; // badge codes
  spinsGranted: number;
  leveledUp: boolean;
  alreadyCheckedIn?: boolean; // POST /checkin idempotent (HTTP 200, reward {0,0})
}

export interface ICheckinWheelResult {
  segmentIndex: number;
  prize: { kind: 'gems' | 'xp' | 'item'; amount?: number; itemCode?: string };
  status: ICheckinStatus;
}

export interface ICheckinLeaderboardRow {
  userId: string;
  displayName: string; // computed `${firstName} ${lastName}`.trim()
  avatarUrl: string | null;
  currentStreak: number;
  longestStreak: number;
  totalCheckins: number;
  rank: number;
}
