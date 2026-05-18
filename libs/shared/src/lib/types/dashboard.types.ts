import { IAchievement } from '../student.types';

export interface IActiveQuest {
  id: string;
  title: string;
  subject: string;
  icon: string;
  duration: string; // e.g. "45 mins"
  progress: number; // 0 - 100
  colorPrefix?: string; // used for frontend styling if needed
}

export interface IEnrolledCourse {
  id: string;
  title: string;
  progress: number; // 0 - 100
  colorGradient: string; // Tailwind gradient classes
  icon: string;
}

export interface ILeaderboardEntry {
  rank: number;
  name: string;
  points: string | number;
  isMe: boolean;
  avatarInitial: string;
}

export interface IStudentDashboardData {
  level: number;
  xp: number;
  xpForNext: number;
  streak: number;
  gems: number;
  dailyQuestsCompleted: number;
  dailyQuestsTarget: number;
  activeQuests: IActiveQuest[];
  enrolledCourses: IEnrolledCourse[];
  achievements: IAchievement[];
  leaderboard: ILeaderboardEntry[];
}
