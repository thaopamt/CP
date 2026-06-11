import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Icon, StatusBadge } from '@cp/ui';
import { CourseContentKind, PublishStatus, type IClassCourseLink } from '@cp/shared';
import { useClass } from '../../api/class.queries';
import { useClassCourseProgress, useClassCourses } from '../../api/curriculum.queries';

type Tab = 'overview' | 'courses' | 'classmates';

/**
 * Student Class Detail Page — shows a student-friendly view of the class
 * they're enrolled in.
 */
export default function StudentClassDetailPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { classId } = useParams<{ classId: string }>();
  const classQuery = useClass(classId);
  const coursesQuery = useClassCourses(classId);

  const [tab, setTab] = useState<Tab>('overview');

  const cls = classQuery.data;

  // Loading state
  if (classQuery.isLoading || !cls) {
    return (
      <div className="grid place-items-center min-h-[50vh]">
        <span className="material-symbols-outlined animate-spin text-3xl text-primary">
          progress_activity
        </span>
      </div>
    );
  }

  // Error state
  if (classQuery.isError) {
    return (
      <div className="grid place-items-center min-h-[50vh] text-center">
        <div>
          <Icon name="error" size={48} className="text-error mb-md" />
          <p className="text-body-md text-on-surface mb-md">Class not found</p>
          <button
            onClick={() => navigate('/student/classes')}
            className="text-primary font-medium hover:underline"
          >
            ← Back to My Classes
          </button>
        </div>
      </div>
    );
  }

  const statusTone =
    cls.status === 'ACTIVE'
      ? 'success'
      : cls.status === 'UPCOMING'
        ? 'warning'
        : cls.status === 'ARCHIVED'
          ? 'neutral'
          : ('neutral' as const);

  return (
    <div className="flex flex-col gap-lg pt-md pb-lg">
      {/* ── Back navigation ────────────────────────────────────────── */}
      <button
        onClick={() => navigate('/student/classes')}
        className="flex items-center gap-xs text-label-sm text-on-surface-variant hover:text-primary transition-colors self-start group"
      >
        <Icon name="arrow_back" size={18} className="group-hover:-translate-x-0.5 transition-transform" />
        My Classes
      </button>

      {/* ── Hero header card ────────────────────────────────────────── */}
      <div className="relative bg-gradient-to-br from-primary-container via-primary to-primary-container rounded-3xl p-lg md:p-xl overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-on-primary/5 rounded-full" />
        <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-on-primary/5 rounded-full" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-start md:justify-between gap-md">
          <div className="flex items-start gap-md">
            <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-on-primary/15 backdrop-blur-sm grid place-items-center text-on-primary-container shrink-0">
              <Icon name="school" size={28} />
            </div>
            <div>
              <div className="flex items-center gap-sm mb-xs flex-wrap">
                <span className="text-label-sm font-mono text-on-primary-container/80 bg-on-primary/10 px-2 py-0.5 rounded-md">
                  {cls.code}
                </span>
                <StatusBadge tone={statusTone}>{t(`enums.classStatus.${cls.status}`)}</StatusBadge>
              </div>
              <h1 className="font-manrope text-headline-md md:text-headline-lg text-on-primary-container font-bold">
                {cls.name}
              </h1>
              {cls.description && (
                <p className="text-body-md text-on-primary-container/80 mt-xs max-w-xl">
                  {cls.description}
                </p>
              )}
            </div>
          </div>

          {/* Instructor chip */}
          {cls.instructor && (
            <div className="flex items-center gap-sm bg-on-primary/10 backdrop-blur-sm rounded-full px-md py-sm shrink-0">
              <div className="w-8 h-8 rounded-full bg-on-primary/20 grid place-items-center text-on-primary-container text-[12px] font-bold">
                {cls.instructor.fullName
                  .split(' ')
                  .map((w) => w[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2)}
              </div>
              <div>
                <div className="text-label-sm font-semibold text-on-primary-container leading-tight">
                  {cls.instructor.fullName}
                </div>
                <div className="text-[11px] text-on-primary-container/70">Instructor</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Quick stat cards ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
        <StatCard
          icon="groups"
          label="Students"
          value={`${cls.enrolledCount}`}
        />
        <StatCard
          icon="menu_book"
          label="Courses"
          value={`${coursesQuery.data?.length ?? 0}`}
        />
      </div>

      {/* ── Tab bar ────────────────────────────────────────────── */}
      <div className="flex gap-xs bg-surface-container-low rounded-2xl p-xs">
        {(
          [
            { key: 'overview', icon: 'info', label: 'Overview' },
            { key: 'courses', icon: 'menu_book', label: 'Courses' },
            { key: 'classmates', icon: 'groups', label: 'Classmates' },
          ] as const
        ).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={[
              'flex items-center gap-xs px-md py-sm rounded-xl text-label-sm transition-all flex-1 justify-center',
              tab === t.key
                ? 'bg-primary-container text-on-primary-container font-bold shadow-sm'
                : 'text-on-surface-variant hover:bg-surface-container-high',
            ].join(' ')}
          >
            <Icon name={t.icon} size={18} />
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Tab content ────────────────────────────────────────── */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-elev-1 overflow-hidden">
        {tab === 'overview' && (
          <div className="p-lg md:p-xl flex flex-col gap-lg">
            {/* Description */}
            <section>
              <h2 className="font-manrope text-headline-md text-on-surface font-bold mb-sm flex items-center gap-sm">
                <Icon name="description" size={22} className="text-primary" />
                About this Class
              </h2>
              <p className="text-body-md text-on-surface-variant leading-relaxed">
                {cls.description || 'No description available for this class.'}
              </p>
            </section>

            {/* Instructor card */}
            {cls.instructor && (
              <section>
                <h3 className="text-label-sm text-on-surface-variant uppercase tracking-wider mb-sm">
                  Instructor
                </h3>
                <div className="flex items-center gap-md bg-surface-container-low rounded-xl p-md">
                  <div className="w-12 h-12 rounded-full bg-primary-container text-on-primary-container grid place-items-center font-bold text-body-lg">
                    {cls.instructor.fullName
                      .split(' ')
                      .map((w) => w[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-on-surface font-semibold">{cls.instructor.fullName}</div>
                    <div className="text-label-sm text-on-surface-variant truncate">
                      {cls.instructor.email}
                    </div>
                  </div>
                  <a
                    href={`mailto:${cls.instructor.email}`}
                    className="p-2 rounded-full text-primary hover:bg-primary-container/30 transition-colors"
                    title="Send email"
                  >
                    <Icon name="mail" size={20} />
                  </a>
                </div>
              </section>
            )}
          </div>
        )}

        {tab === 'courses' && (
          <div className="p-lg md:p-xl">
            <div className="flex items-center justify-between mb-lg">
              <h3 className="font-manrope text-headline-md text-on-surface font-bold flex items-center gap-sm">
                <Icon name="menu_book" size={22} className="text-primary" />
                Courses in this Class
              </h3>
              {coursesQuery.data && (
                <span className="text-label-sm text-on-surface-variant bg-surface-container-high px-md py-xs rounded-full">
                  {coursesQuery.data.length} course{coursesQuery.data.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>

            {coursesQuery.isLoading ? (
              <div className="grid place-items-center py-xl">
                <Icon name="progress_activity" size={32} className="animate-spin text-primary" />
              </div>
            ) : !coursesQuery.data || coursesQuery.data.length === 0 ? (
              <div className="text-center py-xl">
                <div className="w-16 h-16 rounded-full bg-surface-container-high text-on-surface-variant mx-auto grid place-items-center mb-md">
                  <Icon name="menu_book" size={32} />
                </div>
                <p className="text-body-md text-on-surface-variant">
                  No courses have been added to this class yet.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-md">
                {coursesQuery.data.map((link, idx) => (
                  <StudentCourseCard
                    key={link.id}
                    classId={classId}
                    link={link}
                    order={idx + 1}
                    progressEnabled={tab === 'courses'}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'classmates' && (
          <div className="p-lg md:p-xl">
            <div className="flex items-center justify-between mb-md">
              <h3 className="font-manrope text-headline-md text-on-surface font-bold flex items-center gap-sm">
                <Icon name="groups" size={22} className="text-primary" />
                Classmates
              </h3>
              <span className="text-label-sm text-on-surface-variant bg-surface-container-high px-md py-xs rounded-full">
                {cls.enrolledCount} students
              </span>
            </div>
            <p className="text-body-md text-on-surface-variant text-center py-xl">
              <Icon name="lock" size={36} className="text-outline mx-auto mb-sm block" />
              Classmate list will be available once the backend is connected.
              <br />
              <span className="text-label-sm text-on-surface-variant/60 mt-xs block">
                {cls.enrolledCount} student{cls.enrolledCount !== 1 ? 's' : ''} enrolled
              </span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Sub-components ───────────────────────────────────────────── */

function StatCard({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-md flex flex-col gap-xs hover:shadow-sm transition-shadow">
      <div className="flex items-center gap-xs text-on-surface-variant">
        <Icon name={icon} size={18} className="text-primary" />
        <span className="text-[11px] uppercase tracking-wider">{label}</span>
      </div>
      <div className="font-manrope text-headline-md text-on-surface font-bold leading-tight truncate">
        {value}
      </div>
    </div>
  );
}

function StudentCourseCard({
  classId,
  link,
  order,
  progressEnabled,
}: {
  classId: string | undefined;
  link: IClassCourseLink;
  order: number;
  progressEnabled: boolean;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const course = link.course;
  const isMazeCourse = course.contentKind === CourseContentKind.MAZE;
  const progressQuery = useClassCourseProgress(classId, course.id, progressEnabled && !isMazeCourse);
  const progress = progressQuery.data;
  const percentage = progress?.percentage ?? 0;
  const completedAssignments = progress?.completedAssignments ?? 0;
  const totalAssignments = progress?.totalAssignments ?? course.assignmentCount;
  const statusColor =
    course.status === PublishStatus.PUBLISHED
      ? 'success'
      : course.status === PublishStatus.DRAFT
        ? 'warning'
        : 'neutral';

  return (
    <div
      onClick={() =>
        isMazeCourse
          ? navigate(`/student/maze?courseId=${course.id}`)
          : navigate(`/student/classes/${classId}/courses/${course.id}`)
      }
      className="bg-surface-container-low border border-outline-variant/50 rounded-xl p-md hover:shadow-md hover:border-primary/30 transition-all cursor-pointer group flex gap-md items-start"
    >
      <div className="w-10 h-10 rounded-lg bg-primary-container text-on-primary-container grid place-items-center font-manrope font-bold text-body-lg shrink-0">
        {order}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-sm flex-wrap mb-xs">
          <span className="text-[11px] font-mono text-on-surface-variant bg-surface-container-high px-1.5 py-0.5 rounded">
            {course.code}
          </span>
          <StatusBadge tone={statusColor}>{t(`enums.publishStatus.${course.status}`)}</StatusBadge>
          {link.isRequired && (
            <span className="text-[10px] font-semibold uppercase tracking-wider text-error bg-error-container/30 px-1.5 py-0.5 rounded">
              Required
            </span>
          )}
        </div>
        <h4 className="font-manrope text-on-surface font-bold text-body-lg leading-tight mb-xs">
          {course.title}
        </h4>
        {course.description && (
          <p className="text-label-sm text-on-surface-variant line-clamp-2 mb-sm">{course.description}</p>
        )}

        <div className="flex flex-wrap gap-sm">
          <span className="inline-flex items-center gap-xs text-[11px] text-on-surface-variant bg-surface-container-high px-2 py-1 rounded-md">
            <Icon name={isMazeCourse ? 'extension' : 'assignment'} size={14} />
            {isMazeCourse
              ? `${course.assignmentCount} màn`
              : `${course.assignmentCount} assignment${course.assignmentCount !== 1 ? 's' : ''}`}
          </span>
          {!isMazeCourse && (
            <span className="inline-flex items-center gap-xs text-[11px] text-on-surface-variant bg-surface-container-high px-2 py-1 rounded-md">
              <Icon name="stars" size={14} />
              {course.totalPoints} pts
            </span>
          )}
        </div>

        {isMazeCourse ? (
          <div className="mt-md inline-flex items-center gap-xs rounded-lg bg-primary-container/30 px-2 py-1 text-[11px] font-semibold text-primary">
            <Icon name="route" size={14} />
            Mở lộ trình mê cung
          </div>
        ) : (
          <div className="mt-md flex flex-col gap-xs">
            <div className="flex items-center justify-between gap-sm">
              <span className="inline-flex items-center gap-xs text-[11px] font-semibold text-on-surface-variant">
                <Icon name="query_stats" size={14} className="text-primary" />
                Progress
              </span>
              {progressQuery.isLoading ? (
                <span className="h-4 w-24 rounded-full bg-surface-container-high animate-pulse" />
              ) : progressQuery.isError ? (
                <span className="text-[11px] text-error">Progress unavailable</span>
              ) : (
                <span className="text-[11px] font-semibold text-on-surface">
                  {percentage}%
                </span>
              )}
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-surface-container-high">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{ width: `${Math.max(0, Math.min(100, percentage))}%` }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="shrink-0 self-center text-on-surface-variant/40">
        <Icon name="chevron_right" size={24} />
      </div>
    </div>
  );
}
