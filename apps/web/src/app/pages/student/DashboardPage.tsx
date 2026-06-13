import { useMemo, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Avatar, Button, Icon } from '@cp/ui';
import {
  DayOfWeek,
  IDashboardScheduleSession,
  ICourseNextStep,
  IEnrolledCourse,
  ILeaderboardEntry,
  IRecentSubmissionSummary,
  IAchievement,
  SubmissionStatus,
} from '@cp/shared';
import { useAuthStore } from '../../stores/auth.store';
import { useStudentDashboard } from '../../api/student.queries';

const STATUS_META: Record<SubmissionStatus, { icon: string; className: string; label: string }> = {
  [SubmissionStatus.PENDING]: {
    icon: 'hourglass_top',
    className: 'bg-surface-container-high text-on-surface-variant',
    label: 'Pending',
  },
  [SubmissionStatus.ACCEPTED]: {
    icon: 'check_circle',
    className: 'bg-tertiary-container text-on-tertiary-container',
    label: 'Accepted',
  },
  [SubmissionStatus.WRONG_ANSWER]: {
    icon: 'cancel',
    className: 'bg-error-container text-on-error-container',
    label: 'Wrong answer',
  },
  [SubmissionStatus.COMPILATION_ERROR]: {
    icon: 'terminal',
    className: 'bg-error-container text-on-error-container',
    label: 'Compile error',
  },
  [SubmissionStatus.TIME_LIMIT_EXCEEDED]: {
    icon: 'timer_off',
    className: 'bg-error-container text-on-error-container',
    label: 'Time limit',
  },
  [SubmissionStatus.MEMORY_LIMIT_EXCEEDED]: {
    icon: 'memory',
    className: 'bg-error-container text-on-error-container',
    label: 'Memory limit',
  },
  [SubmissionStatus.RUNTIME_ERROR]: {
    icon: 'report',
    className: 'bg-error-container text-on-error-container',
    label: 'Runtime error',
  },
  [SubmissionStatus.INTERNAL_ERROR]: {
    icon: 'error',
    className: 'bg-error-container text-on-error-container',
    label: 'System error',
  },
};

const DAY_LABEL: Record<DayOfWeek, string> = {
  [DayOfWeek.MON]: 'Thứ 2',
  [DayOfWeek.TUE]: 'Thứ 3',
  [DayOfWeek.WED]: 'Thứ 4',
  [DayOfWeek.THU]: 'Thứ 5',
  [DayOfWeek.FRI]: 'Thứ 6',
  [DayOfWeek.SAT]: 'Thứ 7',
  [DayOfWeek.SUN]: 'CN',
};

const DIFFICULTY_CLASS: Record<string, string> = {
  EASY: 'bg-tertiary-container text-on-tertiary-container',
  MEDIUM: 'bg-secondary-container text-on-secondary-container',
  HARD: 'bg-error-container text-on-error-container',
};

export default function StudentDashboardPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const { data: dashboard, isLoading, error } = useStudentDashboard();

  const tr = (key: string, defaultValue: string, options?: Record<string, unknown>) =>
    t(key, { defaultValue, ...options });

  const name = dashboard?.studentName || user?.firstName || 'Explorer';
  const xpPct = useMemo(() => {
    if (!dashboard?.xpPerLevel) return 0;
    return Math.max(0, Math.min(100, Math.round((dashboard.xpIntoLevel / dashboard.xpPerLevel) * 100)));
  }, [dashboard?.xpIntoLevel, dashboard?.xpPerLevel]);

  if (error) {
    return (
      <div className="grid min-h-[60vh] place-items-center p-lg text-center text-error">
        <div>
          <Icon name="error" size={40} className="mx-auto mb-sm" />
          <p className="text-title-md font-semibold">{tr('pages.student.home.errorTitle', 'Không tải được Trang chủ')}</p>
          <p className="mt-xs text-body-sm text-on-surface-variant">
            {error instanceof Error ? error.message : String(error)}
          </p>
        </div>
      </div>
    );
  }

  if (isLoading || !dashboard) {
    return (
      <div className="grid min-h-[60vh] place-items-center text-on-surface-variant">
        <Icon name="progress_activity" className="animate-spin text-primary" size={44} />
      </div>
    );
  }

  const recommended = dashboard.recommendedNext;
  const enrolledCourses = dashboard.enrolledCourses ?? [];
  const courseNextSteps = dashboard.courseNextSteps ?? [];
  const todaySchedule = dashboard.todaySchedule ?? [];
  const recentSubmissions = dashboard.recentSubmissions ?? [];
  const achievements = dashboard.achievements ?? [];
  const leaderboard = dashboard.leaderboard ?? [];
  const recommendedSubtitle = recommended
    ? localizeRecommendationSubtitle(recommended.subtitle, tr)
    : '';

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-lg py-lg">
      <header className="flex flex-col gap-md md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-md">
          <Avatar size="lg" src={user?.avatarUrl} initials={name.charAt(0).toUpperCase()} />
          <div>
            <p className="text-label-sm font-semibold uppercase text-primary">
              {tr('pages.student.home.kicker', 'Trang chủ học viên')}
            </p>
            <h1 className="font-manrope text-headline-md font-extrabold text-on-surface md:text-headline-lg">
              {tr('pages.student.home.welcome', 'Chào mừng trở lại, {{name}}!', { name })}
            </h1>
            <p className="mt-xs text-body-md text-on-surface-variant">
              {tr('pages.student.home.streakLine', 'Bạn đang trong chuỗi học {{count}} ngày. Tiếp tục giữ phong độ nhé!', {
                count: dashboard.streak,
              })}
            </p>
          </div>
        </div>

        {dashboard.nextSession && (
          <div className="rounded-lg border border-outline-variant bg-surface-container-low px-md py-sm text-label-sm text-on-surface-variant">
            <span className="inline-flex items-center gap-xs">
              <Icon name="event" size={16} className="text-primary" />
              {tr('pages.student.home.nextClass', 'Buổi học kế tiếp')}: {dashboard.nextSession.startTime}
            </span>
          </div>
        )}
      </header>

      <section className="grid grid-cols-1 gap-md lg:grid-cols-[1.35fr_0.65fr]">
        <div className="rounded-lg border border-outline-variant bg-surface-container-lowest p-lg shadow-elev-1">
          {recommended ? (
            <button
              type="button"
              onClick={() => navigate(recommended.route)}
              className="group flex w-full flex-col gap-md text-left md:flex-row md:items-center md:justify-between"
            >
              <div className="flex items-start gap-md">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-primary-container text-on-primary-container transition group-hover:bg-primary">
                  <Icon name={recommended.icon} size={26} />
                </div>
                <div>
                  <p className="text-label-sm font-semibold text-primary">
                    {tr('pages.student.home.nextAction', 'Việc nên làm tiếp')}
                  </p>
                  <h2 className="mt-1 text-title-lg font-bold text-on-surface">{recommended.title}</h2>
                  <p className="mt-xs text-body-sm text-on-surface-variant">{recommendedSubtitle}</p>
                </div>
              </div>
              <Icon name="arrow_forward" size={22} className="hidden shrink-0 text-primary transition group-hover:translate-x-1 md:block" />
            </button>
          ) : (
            <EmptyState
              icon="auto_stories"
              title={tr('pages.student.home.noRecommendation', 'Chưa có việc cần làm ngay')}
              description={tr('pages.student.home.noRecommendationHint', 'Khi có bài học, lịch học hoặc nhiệm vụ mới, hệ thống sẽ ưu tiên ở đây.')}
              actionLabel={tr('pages.student.home.browseAssignments', 'Xem bài tập')}
              onAction={() => navigate('/student/assignments')}
            />
          )}
        </div>

        <div className="rounded-lg border border-outline-variant bg-surface-container-lowest p-lg shadow-elev-1">
          <div className="mb-sm flex items-center justify-between">
            <span className="text-label-sm font-semibold text-on-surface-variant">
              {tr('pages.student.home.levelProgress', 'Tiến độ cấp độ')}
            </span>
            <span className="text-label-sm font-bold text-primary">
              {tr('pages.student.home.levelLabel', 'Cấp {{level}}', { level: dashboard.level })}
            </span>
          </div>
          <div className="mb-sm flex items-end justify-between gap-md">
            <div>
              <div className="font-manrope text-display-sm font-black text-on-surface">
                {dashboard.xp.toLocaleString()}
              </div>
              <div className="text-label-sm text-on-surface-variant">XP</div>
            </div>
            <div className="text-right">
              <div className="text-label-sm text-on-surface-variant">
                {tr('pages.student.home.xpFraction', '{{current}} / {{next}} XP', {
                  current: dashboard.xp.toLocaleString(),
                  next: dashboard.xpForNext.toLocaleString(),
                })}
              </div>
              <div className="text-label-sm font-semibold text-primary">
                {tr('pages.student.home.nextLevel', 'Tiếp theo: Cấp {{next}}', {
                  next: dashboard.level + 1,
                })}
              </div>
            </div>
          </div>
          <ProgressBar value={xpPct} />
        </div>
      </section>

      <section className="grid grid-cols-2 gap-md lg:grid-cols-4">
        <KpiCard icon="insights" label={tr('pages.student.home.overallProgress', 'Tiến độ tổng thể')} value={`${dashboard.overallProgress}%`} />
        <KpiCard icon="flag" label={tr('pages.student.home.dailyGoal', 'Mục tiêu hôm nay')} value={`${dashboard.dailyQuestsCompleted}/${dashboard.dailyQuestsTarget}`} />
        <KpiCard icon="calendar_month" label={tr('pages.student.home.weeklyAccepted', 'Accepted tuần này')} value={`${dashboard.weeklyAccepted}`} />
        <KpiCard icon="diamond" label={tr('pages.student.home.gems', 'Gems')} value={dashboard.gems.toLocaleString()} />
      </section>

      <div className="grid grid-cols-1 gap-lg xl:grid-cols-[minmax(0,1fr)_360px]">
        <main className="flex flex-col gap-lg">
          <DashboardSection
            icon="route"
            title={tr('pages.student.home.learningPath', 'Lộ trình khóa học')}
            actionLabel={tr('pages.student.home.viewClasses', 'Xem lớp')}
            onAction={() => navigate('/student/classes')}
          >
            {courseNextSteps.length === 0 ? (
              <EmptyInline icon="task_alt" text={tr('pages.student.home.noLearningPath', 'Các khóa học hiện chưa có bài tiếp theo.')} />
            ) : (
              <div className="grid grid-cols-1 gap-md md:grid-cols-2">
                {courseNextSteps.map((step) => (
                  <CourseNextStepTile key={step.id} step={step} onOpen={() => navigate(step.route)} t={tr} />
                ))}
              </div>
            )}
          </DashboardSection>

          <DashboardSection
            icon="menu_book"
            title={tr('pages.student.home.enrolledCourses', 'Khóa học của tôi')}
            actionLabel={tr('pages.student.home.viewClasses', 'Xem lớp')}
            onAction={() => navigate('/student/classes')}
          >
            {enrolledCourses.length === 0 ? (
              <EmptyInline icon="school" text={tr('pages.student.home.noCourses', 'Bạn chưa được gán khóa học nào.')} />
            ) : (
              <div className="grid grid-cols-1 gap-md md:grid-cols-3">
                {enrolledCourses.map((course) => (
                  <CourseTile key={course.id} course={course} onOpen={() => course.route && navigate(course.route)} />
                ))}
              </div>
            )}
          </DashboardSection>
        </main>

        <aside className="flex flex-col gap-lg">
          <DashboardSection icon="event" title={tr('pages.student.home.todaySchedule', 'Lịch hôm nay')}>
            <ScheduleList sessions={todaySchedule} nextSession={dashboard.nextSession} />
          </DashboardSection>

          <DashboardSection
            icon="history"
            title={tr('pages.student.home.recentSubmissions', 'Bài nộp gần đây')}
            actionLabel={tr('pages.student.home.viewAll', 'Xem tất cả')}
            onAction={() => navigate('/student/submissions')}
          >
            <RecentSubmissionList submissions={recentSubmissions} onOpen={(route) => navigate(route)} />
          </DashboardSection>

          <DashboardSection
            icon="emoji_events"
            title={tr('pages.student.home.achievements', 'Thành tựu')}
            actionLabel={tr('pages.student.home.achievementsAll', 'Tất cả')}
            onAction={() => navigate('/student/badges')}
          >
            <AchievementList achievements={achievements} t={tr} />
          </DashboardSection>

          <DashboardSection
            icon="leaderboard"
            title={tr('pages.student.home.leaderboard', 'Bảng xếp hạng')}
            actionLabel={tr('pages.student.home.openLeaderboard', 'Mở')}
            onAction={() => navigate('/student/leaderboard')}
          >
            <LeaderboardList entries={leaderboard} />
          </DashboardSection>
        </aside>
      </div>
    </div>
  );
}

function DashboardSection({
  icon,
  title,
  actionLabel,
  onAction,
  children,
}: {
  icon: string;
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  children: ReactNode;
}) {
  return (
    <section className="rounded-lg border border-outline-variant bg-surface-container-lowest p-lg shadow-elev-1">
      <div className="mb-md flex items-center justify-between gap-md">
        <h2 className="flex min-w-0 items-center gap-sm text-title-md font-bold text-on-surface">
          <Icon name={icon} size={22} className="shrink-0 text-primary" />
          <span className="truncate">{title}</span>
        </h2>
        {actionLabel && onAction && (
          <button
            type="button"
            onClick={onAction}
            className="shrink-0 text-label-sm font-semibold text-primary hover:underline"
          >
            {actionLabel}
          </button>
        )}
      </div>
      {children}
    </section>
  );
}

function KpiCard({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <article className="rounded-lg border border-outline-variant bg-surface-container-lowest p-md shadow-elev-1">
      <div className="mb-sm flex items-center gap-sm text-on-surface-variant">
        <Icon name={icon} size={20} className="text-primary" />
        <span className="truncate text-label-sm font-semibold">{label}</span>
      </div>
      <div className="font-manrope text-headline-md font-black text-on-surface">{value}</div>
    </article>
  );
}

function CourseNextStepTile({
  step,
  onOpen,
  t,
}: {
  step: ICourseNextStep;
  onOpen: () => void;
  t: (key: string, defaultValue: string, options?: Record<string, unknown>) => string;
}) {
  const diffClass = DIFFICULTY_CLASS[step.assignmentDifficulty] ?? 'bg-surface-container-high text-on-surface-variant';

  return (
    <button
      type="button"
      onClick={onOpen}
      className="group rounded-lg border border-outline-variant bg-surface-container-low p-md text-left transition hover:border-primary/50 hover:bg-surface-container"
    >
      <div className="mb-md flex items-start justify-between gap-md">
        <div className="flex min-w-0 items-start gap-sm">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary-container text-on-primary-container">
            <Icon name={step.assignmentProgress > 0 ? 'pending_actions' : 'play_lesson'} size={22} />
          </div>
          <div className="min-w-0">
            <p className="mb-1 font-mono text-[11px] uppercase text-on-surface-variant">
              {step.courseCode}
            </p>
            <h3 className="line-clamp-2 font-semibold text-on-surface group-hover:text-primary">
              {step.assignmentTitle}
            </h3>
            <p className="mt-1 line-clamp-1 text-label-sm text-on-surface-variant">
              {step.courseTitle}
              {step.className ? ` · ${step.className}` : ''}
            </p>
          </div>
        </div>
        <span className={`shrink-0 rounded-md px-2 py-1 text-[11px] font-bold ${diffClass}`}>
          {step.assignmentDifficulty}
        </span>
      </div>
      <div className="mb-xs flex items-center justify-between text-label-sm text-on-surface-variant">
        <span className="inline-flex items-center gap-xs">
          <Icon name="stars" size={14} />
          {step.assignmentPoints} XP
          {step.estimatedMinutes ? ` · ${step.estimatedMinutes} phút` : ''}
        </span>
        <span>
          {step.completedAssignments}/{step.totalAssignments} {t('pages.student.home.lessonsShort', 'bài')}
        </span>
      </div>
      <ProgressBar value={step.courseProgress} />
      {step.assignmentProgress > 0 && (
        <p className="mt-xs text-[11px] font-semibold text-primary">
          {t('pages.student.home.assignmentInProgress', 'Đang làm dở {{progress}}%', {
            progress: step.assignmentProgress,
          })}
        </p>
      )}
    </button>
  );
}

function CourseTile({ course, onOpen }: { course: IEnrolledCourse; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="rounded-lg border border-outline-variant bg-surface-container-low p-md text-left transition hover:border-primary/50 hover:bg-surface-container"
    >
      <div className="mb-md flex items-start justify-between gap-md">
        <div className="min-w-0">
          <p className="mb-1 font-mono text-[11px] uppercase text-on-surface-variant">{course.code}</p>
          <h3 className="line-clamp-2 font-semibold text-on-surface">{course.title}</h3>
        </div>
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-secondary-container text-on-secondary-container">
          <Icon name={course.icon} size={22} />
        </div>
      </div>
      <div className="mb-xs flex items-center justify-between text-label-sm text-on-surface-variant">
        <span>
          {course.completedAssignments ?? 0}/{course.totalAssignments ?? 0} bài
        </span>
        <span className="font-semibold text-on-surface">{course.progress}%</span>
      </div>
      <ProgressBar value={course.progress} />
    </button>
  );
}

function ScheduleList({
  sessions,
  nextSession,
}: {
  sessions: IDashboardScheduleSession[];
  nextSession: IDashboardScheduleSession | null;
}) {
  if (sessions.length === 0 && !nextSession) {
    return <EmptyInline icon="event_busy" text="Chưa có lịch học." />;
  }

  return (
    <div className="flex flex-col gap-sm">
      {sessions.map((session) => (
        <ScheduleRow key={session.id} session={session} />
      ))}
      {sessions.length === 0 && nextSession && (
        <div>
          <p className="mb-sm text-label-sm font-semibold text-on-surface-variant">Buổi tiếp theo</p>
          <ScheduleRow session={nextSession} />
        </div>
      )}
    </div>
  );
}

function ScheduleRow({ session }: { session: IDashboardScheduleSession }) {
  return (
    <div className="rounded-lg border border-outline-variant/70 bg-surface-container-low p-sm">
      <div className="flex items-center justify-between gap-sm">
        <div className="min-w-0">
          <p className="truncate font-semibold text-on-surface">{session.className ?? 'Lớp học'}</p>
          <p className="text-label-sm text-on-surface-variant">
            {DAY_LABEL[session.dayOfWeek]} · {session.startTime}-{session.endTime}
          </p>
        </div>
        {session.classCode && (
          <span className="shrink-0 rounded-md bg-surface-container-high px-2 py-1 font-mono text-[11px] text-on-surface-variant">
            {session.classCode}
          </span>
        )}
      </div>
    </div>
  );
}

function RecentSubmissionList({
  submissions,
  onOpen,
}: {
  submissions: IRecentSubmissionSummary[];
  onOpen: (route: string) => void;
}) {
  if (submissions.length === 0) {
    return <EmptyInline icon="history" text="Chưa có bài nộp nào." />;
  }

  return (
    <div className="flex flex-col gap-sm">
      {submissions.map((submission) => {
        const meta = STATUS_META[submission.status];
        return (
          <button
            key={submission.id}
            type="button"
            onClick={() => onOpen(submission.route)}
            className="rounded-lg border border-outline-variant/70 bg-surface-container-low p-sm text-left transition hover:border-primary/40"
          >
            <div className="mb-xs flex items-start justify-between gap-sm">
              <p className="line-clamp-1 font-semibold text-on-surface">{submission.assignmentTitle}</p>
              <span className={`inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-[11px] font-bold ${meta.className}`}>
                <Icon name={meta.icon} size={13} />
                {meta.label}
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-on-surface-variant">
              <span>{submission.language}</span>
              <span>
                {submission.passedCount}/{submission.totalCount || 0} · {formatRelative(submission.createdAt)}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function AchievementList({ achievements, t }: { achievements: IAchievement[]; t: (key: string, defaultValue: string, options?: Record<string, unknown>) => string }) {
  if (achievements.length === 0) {
    return <EmptyInline icon="workspace_premium" text="Chưa có thành tựu." />;
  }

  return (
    <div className="flex flex-col gap-sm">
      {achievements.slice(0, 4).map((achievement) => (
        <div
          key={achievement.id}
          className={`flex items-center gap-sm rounded-lg border p-sm ${
            achievement.unlocked
              ? 'border-outline-variant bg-surface-container-low'
              : 'border-outline-variant/60 bg-surface-container-lowest opacity-60'
          }`}
        >
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary-container text-on-primary-container">
            <Icon name={achievement.icon} size={21} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold text-on-surface">
              {t(`pages.student.home.achievementList.${achievement.id}.label`, achievement.label)}
            </p>
            {achievement.caption && (
              <p className="line-clamp-1 text-label-sm text-on-surface-variant">
                {t(`pages.student.home.achievementList.${achievement.id}.caption`, achievement.caption)}
              </p>
            )}
          </div>
          <Icon name={achievement.unlocked ? 'check_circle' : 'lock'} size={18} className="text-on-surface-variant" />
        </div>
      ))}
    </div>
  );
}

function LeaderboardList({ entries }: { entries: ILeaderboardEntry[] }) {
  if (entries.length === 0) {
    return <EmptyInline icon="leaderboard" text="Chưa có xếp hạng." />;
  }

  return (
    <div className="flex flex-col gap-xs">
      {entries.slice(0, 5).map((entry) => (
        <div
          key={`${entry.rank}-${entry.name}`}
          className={`flex items-center gap-sm rounded-lg px-sm py-xs ${
            entry.isMe ? 'bg-primary-container text-on-primary-container' : 'bg-surface-container-low text-on-surface'
          }`}
        >
          <div className="w-7 shrink-0 text-center text-label-sm font-black">#{entry.rank}</div>
          <Avatar size="sm" initials={entry.avatarInitial} />
          <div className="min-w-0 flex-1 truncate text-label-sm font-semibold">{entry.name}</div>
          <div className="shrink-0 text-label-sm font-bold">{entry.points}</div>
        </div>
      ))}
    </div>
  );
}

function ProgressBar({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div className="h-2 overflow-hidden rounded-full bg-surface-container-highest" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
      <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${pct}%` }} />
    </div>
  );
}

function EmptyInline({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="rounded-lg border border-dashed border-outline-variant bg-surface-container-low p-lg text-center text-on-surface-variant">
      <Icon name={icon} size={28} className="mx-auto mb-sm" />
      <p className="text-body-sm">{text}</p>
    </div>
  );
}

function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}: {
  icon: string;
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <div className="flex flex-col items-start gap-md md:flex-row md:items-center md:justify-between">
      <div className="flex items-start gap-md">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-surface-container-high text-on-surface-variant">
          <Icon name={icon} size={26} />
        </div>
        <div>
          <h2 className="text-title-lg font-bold text-on-surface">{title}</h2>
          <p className="mt-xs text-body-sm text-on-surface-variant">{description}</p>
        </div>
      </div>
      <Button variant="outline" trailingIcon={<Icon name="arrow_forward" size={18} />} onClick={onAction}>
        {actionLabel}
      </Button>
    </div>
  );
}

function localizeRecommendationSubtitle(
  subtitle: string,
  t: (key: string, defaultValue: string, options?: Record<string, unknown>) => string,
) {
  if (subtitle === 'Continue from your course sequence') {
    return t('pages.student.home.recommendCourseContinue', 'Làm tiếp bài đang dang dở trong khóa học');
  }
  if (subtitle === 'Next assignment in your course') {
    return t('pages.student.home.recommendCourseNext', 'Bài kế tiếp theo thứ tự khóa học của lớp');
  }
  if (subtitle === 'Standalone assignment matched to your level') {
    return t('pages.student.home.recommendStandalone', 'Bài luyện tập phù hợp với mức hiện tại');
  }
  if (subtitle === 'Start a new assignment') {
    return t('pages.student.home.recommendStandalone', 'Bài luyện tập phù hợp với mức hiện tại');
  }
  return subtitle;
}

function formatRelative(iso: string): string {
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.max(0, Math.round(diffMs / 60_000));
  if (diffMin < 1) return 'vừa xong';
  if (diffMin < 60) return `${diffMin} phút`;
  const diffHour = Math.round(diffMin / 60);
  if (diffHour < 24) return `${diffHour} giờ`;
  return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit' }).format(date);
}
