import { IAchievement } from '../student.types';
import { DayOfWeek } from '../class.types';
import { SubmissionStatus } from '../submission.types';

export interface IActiveQuest {
  id: string;
  title: string;
  subject: string;
  icon: string;
  duration: string; // e.g. "45 mins"
  progress: number; // 0 - 100
  difficulty?: string;
  xpReward?: number;
  route?: string;
  colorPrefix?: string; // used for frontend styling if needed
}

export interface IEnrolledCourse {
  id: string;
  classId?: string;
  className?: string;
  code?: string;
  title: string;
  progress: number; // 0 - 100
  completedAssignments?: number;
  totalAssignments?: number;
  route?: string;
  colorGradient: string; // Tailwind gradient classes
  icon: string;
}

export interface ICourseNextStep {
  id: string;
  classId: string;
  className: string | null;
  courseId: string;
  courseCode: string;
  courseTitle: string;
  courseProgress: number;
  completedAssignments: number;
  totalAssignments: number;
  assignmentId: string;
  assignmentTitle: string;
  assignmentDifficulty: string;
  assignmentPoints: number;
  assignmentProgress: number;
  estimatedMinutes?: number;
  route: string;
}

export interface ILeaderboardEntry {
  rank: number;
  name: string;
  points: string | number;
  isMe: boolean;
  avatarInitial: string;
}

export interface IDashboardScheduleSession {
  id: string;
  classId: string | null;
  className: string | null;
  classCode: string | null;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  startsInDays?: number;
}

export interface IRecentSubmissionSummary {
  id: string;
  assignmentId: string;
  assignmentTitle: string;
  status: SubmissionStatus;
  language: string;
  passedCount: number;
  totalCount: number;
  createdAt: string;
  route: string;
}

export interface IDashboardRecommendation {
  title: string;
  subtitle: string;
  icon: string;
  route: string;
  actionLabel: string;
  tone: 'primary' | 'success' | 'warning' | 'neutral';
  source?: 'course' | 'assignment' | 'schedule';
}

export interface IStudentDashboardData {
  studentName: string;
  level: number;
  xp: number;
  /** Total XP threshold to reach the next level (level * 1000). */
  xpForNext: number;
  /** XP accumulated within the current level — resets each level. */
  xpIntoLevel: number;
  /** XP span needed to clear one level (denominator for the progress bar). */
  xpPerLevel: number;
  streak: number;
  gems: number;
  /** Equipped cosmetics from the gem shop (null when nothing equipped in a slot). */
  nameColor?: string | null;
  equippedTitle?: string | null;
  equippedTheme?: string | null;
  dailyQuestsCompleted: number;
  dailyQuestsTarget: number;
  weeklyAccepted: number;
  totalAssignments: number;
  totalCompleted: number;
  overallProgress: number;
  defaultLanguage: string;
  activeQuests: IActiveQuest[];
  enrolledCourses: IEnrolledCourse[];
  courseNextSteps: ICourseNextStep[];
  achievements: IAchievement[];
  leaderboard: ILeaderboardEntry[];
  todaySchedule: IDashboardScheduleSession[];
  nextSession: IDashboardScheduleSession | null;
  recommendedNext: IDashboardRecommendation | null;
}

export interface IHeatmapData {
  date: string;          // Format: 'YYYY-MM-DD'
  activityCount: number; // Total submissions
  acceptedCount: number; // Total Accepted submissions
  solvedCount: number;   // Total distinct assignments Accepted
}
