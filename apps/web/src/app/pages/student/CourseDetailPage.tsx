import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Icon, StatusBadge } from '@cp/ui';
import {
  AssignmentType,
  ASSIGNMENT_TYPE_ICON,
  PublishStatus,
} from '@cp/shared';
import { useCourse, useCourseAssignments } from '../../api/curriculum.queries';

const DIFFICULTY_TONE: Record<string, 'success' | 'warning' | 'error'> = {
  EASY: 'success',
  MEDIUM: 'warning',
  HARD: 'error',
};

const DIFFICULTY_LABEL: Record<string, string> = {
  EASY: 'Easy',
  MEDIUM: 'Medium',
  HARD: 'Hard',
};

/**
 * Student Course Detail Page — shows course info + ordered list of assignments.
 * Students can click an assignment to navigate to the workspace.
 */
export default function StudentCourseDetailPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { classId, courseId } = useParams<{ classId: string; courseId: string }>();

  const courseQuery = useCourse(courseId);
  const assignmentsQuery = useCourseAssignments(courseId);

  const course = courseQuery.data;
  const assignments = assignmentsQuery.data ?? [];

  // Loading
  if (courseQuery.isLoading || !course) {
    return (
      <div className="grid place-items-center min-h-[50vh]">
        <span className="material-symbols-outlined animate-spin text-3xl text-primary">
          progress_activity
        </span>
      </div>
    );
  }

  // Error
  if (courseQuery.isError) {
    return (
      <div className="grid place-items-center min-h-[50vh] text-center">
        <div>
          <Icon name="error" size={48} className="text-error mb-md" />
          <p className="text-body-md text-on-surface mb-md">Course not found</p>
          <button
            onClick={() => navigate(`/student/classes/${classId}`)}
            className="text-primary font-medium hover:underline"
          >
            ← Back to Class
          </button>
        </div>
      </div>
    );
  }

  const statusTone =
    course.status === PublishStatus.PUBLISHED
      ? 'success'
      : course.status === PublishStatus.DRAFT
      ? 'warning'
      : 'neutral';

  // Progress calculation (mock — placeholder for actual progress)
  const totalAssignments = assignments.length;
  const completedAssignments = 0; // TODO: integrate with student progress API
  const progressPercent =
    totalAssignments > 0 ? Math.round((completedAssignments / totalAssignments) * 100) : 0;

  return (
    <div className="flex flex-col gap-lg pt-md pb-lg">
      {/* ── Back navigation ───────────────────────────────────── */}
      <button
        onClick={() => navigate(`/student/classes/${classId}`)}
        className="flex items-center gap-xs text-label-sm text-on-surface-variant hover:text-primary transition-colors self-start group"
      >
        <Icon
          name="arrow_back"
          size={18}
          className="group-hover:-translate-x-0.5 transition-transform"
        />
        Back to Class
      </button>

      {/* ── Course hero ──────────────────────────────────────── */}
      <div className="relative bg-gradient-to-br from-secondary-container via-secondary to-secondary-container rounded-3xl p-lg md:p-xl overflow-hidden">
        {/* Decorative shapes */}
        <div className="absolute -top-10 -right-10 w-44 h-44 bg-on-secondary/5 rounded-full" />
        <div className="absolute -bottom-6 -left-6 w-28 h-28 bg-on-secondary/5 rounded-full" />
        <div className="absolute top-1/2 right-1/4 w-20 h-20 bg-on-secondary/3 rounded-full" />

        <div className="relative z-10">
          <div className="flex items-center gap-sm mb-sm flex-wrap">
            <span className="text-label-sm font-mono text-on-secondary-container/80 bg-on-secondary/10 px-2 py-0.5 rounded-md">
              {course.code}
            </span>
            <StatusBadge tone={statusTone}>
              {t(`enums.publishStatus.${course.status}`)}
            </StatusBadge>
          </div>

          <h1 className="font-manrope text-headline-md md:text-headline-lg text-on-secondary-container font-bold mb-xs">
            {course.title}
          </h1>

          {course.description && (
            <p className="text-body-md text-on-secondary-container/80 max-w-2xl">
              {course.description}
            </p>
          )}
        </div>
      </div>

      {/* ── Stats strip ──────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-md">
        <MiniStat icon="timer" label="Duration" value={`${course.durationWeeks} weeks`} />
        <MiniStat icon="school" label="Credits" value={`${course.credits}`} />
        <MiniStat
          icon="assignment"
          label="Assignments"
          value={`${course.assignmentCount}`}
        />
        <MiniStat icon="stars" label="Total Points" value={`${course.totalPoints}`} />
        <MiniStat icon="category" label="Subject" value={course.subject} />
      </div>

      {/* ── Progress bar ─────────────────────────────────────── */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-md">
        <div className="flex items-center justify-between mb-sm">
          <span className="text-label-sm text-on-surface-variant flex items-center gap-xs">
            <Icon name="trending_up" size={16} className="text-primary" />
            Your Progress
          </span>
          <span className="text-label-sm font-bold text-on-surface">
            {completedAssignments} / {totalAssignments} completed
          </span>
        </div>
        <div className="h-2.5 rounded-full bg-surface-container-highest overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-tertiary rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="text-[11px] text-on-surface-variant mt-xs text-right">
          {progressPercent}%
        </div>
      </div>

      {/* ── Assignment list ──────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-md">
          <h2 className="font-manrope text-headline-md text-on-surface font-bold flex items-center gap-sm">
            <Icon name="assignment" size={22} className="text-primary" />
            Assignments
          </h2>
          {assignments.length > 0 && (
            <span className="text-label-sm text-on-surface-variant bg-surface-container-high px-md py-xs rounded-full">
              {assignments.length} assignment{assignments.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {assignmentsQuery.isLoading ? (
          <div className="grid place-items-center py-xl">
            <Icon name="progress_activity" size={32} className="animate-spin text-primary" />
          </div>
        ) : assignments.length === 0 ? (
          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-xl text-center">
            <div className="w-16 h-16 rounded-full bg-surface-container-high text-on-surface-variant mx-auto grid place-items-center mb-md">
              <Icon name="assignment" size={32} />
            </div>
            <p className="text-body-md text-on-surface-variant">
              No assignments in this course yet.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-sm">
            {assignments.map((ca, idx) => {
              const a = ca.assignment;
              const typeIcon = ASSIGNMENT_TYPE_ICON[a.type] ?? 'assignment';
              const diffTone = DIFFICULTY_TONE[a.difficulty] ?? 'neutral';

              return (
                <div
                  key={ca.id}
                  onClick={() =>
                    a.type === AssignmentType.CODING
                      ? navigate(`/student/workspace/${a.id}`)
                      : navigate(`/student/assignments/${a.id}`)
                  }
                  className="bg-surface-container-lowest border border-outline-variant rounded-xl p-md hover:shadow-md hover:border-primary/30 transition-all cursor-pointer group flex gap-md items-center"
                >
                  {/* Order number */}
                  <div className="w-9 h-9 rounded-lg bg-surface-container-high text-on-surface-variant grid place-items-center font-manrope font-bold text-label-sm shrink-0 group-hover:bg-primary-container group-hover:text-on-primary-container transition-colors">
                    {idx + 1}
                  </div>

                  {/* Type icon */}
                  <div className="w-10 h-10 rounded-xl bg-primary-container/30 text-primary grid place-items-center shrink-0">
                    <Icon name={typeIcon} size={22} />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-sm flex-wrap mb-0.5">
                      <h4 className="text-on-surface font-semibold truncate group-hover:text-primary transition-colors">
                        {a.title}
                      </h4>
                      <StatusBadge tone={diffTone}>
                        {DIFFICULTY_LABEL[a.difficulty] ?? a.difficulty}
                      </StatusBadge>
                    </div>
                    {a.description && (
                      <p className="text-[12px] text-on-surface-variant line-clamp-1 mb-xs">
                        {a.description}
                      </p>
                    )}
                    <div className="flex items-center gap-md text-[11px] text-on-surface-variant">
                      <span className="flex items-center gap-xs">
                        <Icon name="category" size={12} />
                        {t(`enums.assignmentType.${a.type}`)}
                      </span>
                      <span className="flex items-center gap-xs">
                        <Icon name="stars" size={12} />
                        {a.points} pts
                      </span>
                      {a.estimatedMinutes && (
                        <span className="flex items-center gap-xs">
                          <Icon name="schedule" size={12} />
                          ~{a.estimatedMinutes} min
                        </span>
                      )}
                      {a.tags && a.tags.length > 0 && (
                        <span className="flex items-center gap-xs">
                          <Icon name="sell" size={12} />
                          {a.tags.slice(0, 2).join(', ')}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action arrow */}
                  <div className="shrink-0 text-on-surface-variant/40 group-hover:text-primary transition-colors">
                    <Icon
                      name={a.type === AssignmentType.CODING ? 'code' : 'arrow_forward'}
                      size={22}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

/* ── Sub-components ──────────────────────────────────────────── */

function MiniStat({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-md flex items-center gap-sm">
      <div className="w-9 h-9 rounded-lg bg-primary-container/30 text-primary grid place-items-center shrink-0">
        <Icon name={icon} size={18} />
      </div>
      <div className="min-w-0">
        <div className="text-[11px] text-on-surface-variant uppercase tracking-wider">
          {label}
        </div>
        <div className="font-manrope text-on-surface font-bold text-body-lg leading-tight truncate">
          {value}
        </div>
      </div>
    </div>
  );
}
