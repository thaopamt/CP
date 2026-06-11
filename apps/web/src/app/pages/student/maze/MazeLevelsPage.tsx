import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, Icon, PageHeader } from '@cp/ui';
import { DifficultyBadge } from '@cp/ui';
import { DifficultyLevel, IMazeCourseGroup, IMazeLevel } from '@cp/shared';

import { useStudentMazePath } from '../../../api/maze.queries';

type StatusFilter = 'all' | 'todo' | 'attempted' | 'solved';

const STATUS_FILTERS: Array<{ key: StatusFilter; icon: string; labelKey: string; fallback: string }> = [
  { key: 'all', icon: 'view_list', labelKey: 'maze.student.filters.all', fallback: 'Tất cả' },
  { key: 'todo', icon: 'radio_button_unchecked', labelKey: 'maze.student.filters.todo', fallback: 'Chưa làm' },
  { key: 'attempted', icon: 'history', labelKey: 'maze.student.filters.attempted', fallback: 'Đang làm' },
  { key: 'solved', icon: 'task_alt', labelKey: 'maze.student.filters.solved', fallback: 'Đã xong' },
];

export default function MazeLevelsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: path, isLoading } = useStudentMazePath();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const selectedCourseId = searchParams.get('courseId');
  const selectedCourse = useMemo(
    () => path?.courses.find((course) => course.courseId === selectedCourseId) ?? null,
    [path?.courses, selectedCourseId],
  );

  const visibleGroups = useMemo(() => {
    if (!path) return [];
    return path.courses
      .filter((course) => !selectedCourseId || course.courseId === selectedCourseId)
      .map((course) => ({
        ...course,
        levels: course.levels.filter((level) => matchesStatus(level, statusFilter)),
      }))
      .filter((course) => course.levels.length > 0 || statusFilter === 'all');
  }, [path, selectedCourseId, statusFilter]);

  const progressPercent = path && path.totalCount > 0 ? Math.round((path.solvedCount / path.totalCount) * 100) : 0;
  const nextLevel = selectedCourse ? selectedCourse.nextLevel : path?.nextLevel ?? null;

  function setCourseFilter(courseId: string | null) {
    const next = new URLSearchParams(searchParams);
    if (courseId) next.set('courseId', courseId);
    else next.delete('courseId');
    setSearchParams(next, { replace: true });
  }

  return (
    <div className="flex flex-col gap-lg pt-lg max-w-6xl mx-auto w-full">
      <PageHeader title={t('maze.student.title')} subtitle={t('maze.student.subtitle')} />

      {isLoading ? (
        <div className="grid place-items-center py-16 text-on-surface-variant">
          <span className="material-symbols-outlined animate-spin text-3xl">progress_activity</span>
        </div>
      ) : !path || path.totalCount === 0 ? (
        <Card className="p-8 text-center text-on-surface-variant">{t('maze.student.empty')}</Card>
      ) : (
        <>
          <section className="rounded-xl border border-outline-variant bg-surface-container-lowest p-md md:p-lg">
            <div className="flex flex-col gap-md lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-sm text-label-sm font-semibold text-on-surface-variant">
                  <Icon name="route" size={18} className="text-primary" />
                  {t('maze.student.pathProgress', {
                    completed: path.solvedCount,
                    total: path.totalCount,
                    defaultValue: '{{completed}} / {{total}} màn đã xong',
                  })}
                </div>
                <div className="mt-sm h-2.5 max-w-xl overflow-hidden rounded-full bg-surface-container-high">
                  <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progressPercent}%` }} />
                </div>
              </div>

              {nextLevel ? (
                <button
                  type="button"
                  onClick={() => navigate(`/student/maze/${nextLevel.id}`)}
                  className="flex min-h-16 w-full items-center justify-between gap-md rounded-xl border border-primary/30 bg-primary-container/30 px-md py-sm text-left transition hover:border-primary lg:max-w-md"
                >
                  <span className="min-w-0">
                    <span className="block text-label-sm font-semibold text-primary">
                      {t('maze.student.continue', 'Tiếp tục học')}
                    </span>
                    <span className="mt-0.5 block truncate font-bold text-on-surface">{nextLevel.title}</span>
                  </span>
                  <Icon name="play_arrow" size={24} className="shrink-0 text-primary" />
                </button>
              ) : (
                <div className="flex min-h-16 items-center gap-sm rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-md py-sm text-emerald-700 dark:text-emerald-300">
                  <Icon name="verified" />
                  <span className="text-label-sm font-semibold">
                    {t('maze.student.courseDone', 'Khóa đang chọn đã hoàn thành')}
                  </span>
                </div>
              )}
            </div>
          </section>

          <section className="flex flex-col gap-sm rounded-xl border border-outline-variant bg-surface-container-lowest p-sm">
            <div className="flex gap-xs overflow-x-auto pb-1">
              <button
                type="button"
                onClick={() => setCourseFilter(null)}
                className={courseButtonClass(!selectedCourseId)}
              >
                <Icon name="apps" size={16} />
                <span>{t('maze.student.allCourses', 'Tất cả khóa')}</span>
              </button>
              {path.courses.map((course) => (
                <button
                  key={course.courseId ?? course.courseTitle}
                  type="button"
                  onClick={() => setCourseFilter(course.courseId)}
                  className={courseButtonClass(course.courseId === selectedCourseId)}
                >
                  <span className="max-w-48 truncate">{course.courseTitle}</span>
                  <span className="rounded-full bg-surface-container-high px-1.5 py-0.5 text-[11px]">
                    {course.solvedCount}/{course.totalCount}
                  </span>
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-xs border-t border-outline-variant/40 pt-sm">
              {STATUS_FILTERS.map((filter) => (
                <button
                  key={filter.key}
                  type="button"
                  onClick={() => setStatusFilter(filter.key)}
                  className={statusButtonClass(statusFilter === filter.key)}
                >
                  <Icon name={filter.icon} size={16} />
                  {t(filter.labelKey, filter.fallback)}
                </button>
              ))}
            </div>
          </section>

          <div className="flex flex-col gap-md">
            {visibleGroups.length === 0 ? (
              <Card className="p-8 text-center text-on-surface-variant">
                {t('maze.student.noLevelsForFilter', 'Không có màn nào khớp bộ lọc hiện tại.')}
              </Card>
            ) : (
              visibleGroups.map((course) => (
                <CourseSection
                  key={`${course.courseId ?? course.courseTitle}-${selectedCourseId ?? 'all'}-${statusFilter}`}
                  course={course}
                  defaultOpen={Boolean(selectedCourseId) || course.nextLevel?.id === path.nextLevel?.id || course.solvedCount < course.totalCount}
                  onOpenLevel={(level) => navigate(`/student/maze/${level.id}`)}
                />
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}

function CourseSection({
  course,
  defaultOpen,
  onOpenLevel,
}: {
  course: IMazeCourseGroup;
  defaultOpen: boolean;
  onOpenLevel: (level: IMazeLevel) => void;
}) {
  const { t } = useTranslation();
  const progress = course.totalCount > 0 ? Math.round((course.solvedCount / course.totalCount) * 100) : 0;

  return (
    <details
      open={defaultOpen}
      className="group rounded-xl border border-outline-variant bg-surface-container-lowest"
    >
      <summary className="flex cursor-pointer list-none items-center gap-md px-md py-md">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary-container/50 text-primary">
          <Icon name="extension" size={22} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-sm">
            {course.courseCode && (
              <span className="rounded bg-surface-container-high px-1.5 py-0.5 font-mono text-[11px] text-on-surface-variant">
                {course.courseCode}
              </span>
            )}
            <span className="text-label-sm font-semibold text-on-surface-variant">
              {t('maze.student.completedSummary', {
                completed: course.solvedCount,
                total: course.totalCount,
              })}
            </span>
          </div>
          <h2 className="mt-0.5 truncate font-manrope text-body-lg font-bold text-on-surface">
            {course.courseTitle}
          </h2>
          {course.courseDescription && (
            <p className="mt-0.5 line-clamp-1 text-label-sm text-on-surface-variant">{course.courseDescription}</p>
          )}
        </div>
        <div className="hidden w-28 shrink-0 sm:block">
          <div className="h-2 overflow-hidden rounded-full bg-surface-container-high">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
          </div>
          <div className="mt-1 text-right text-[11px] font-semibold text-on-surface-variant">{progress}%</div>
        </div>
        <Icon
          name="expand_more"
          size={22}
          className="shrink-0 text-on-surface-variant transition-transform group-open:rotate-180"
        />
      </summary>

      <div className="border-t border-outline-variant/40 p-sm">
        <div className="flex flex-col gap-xs">
          {course.levels.map((level) => (
            <LevelRow key={level.id} level={level} onOpen={() => onOpenLevel(level)} />
          ))}
        </div>
      </div>
    </details>
  );
}

function LevelRow({ level, onOpen }: { level: IMazeLevel; onOpen: () => void }) {
  const { t } = useTranslation();
  const solved = !!level.solved;
  const attempted = !solved && (level.attempts ?? 0) > 0;

  return (
    <button
      type="button"
      onClick={onOpen}
      className={[
        'grid min-h-16 grid-cols-[2.5rem_minmax(0,1fr)_auto] items-center gap-sm rounded-lg border px-sm py-sm text-left transition',
        solved
          ? 'border-emerald-500/30 bg-emerald-500/5 hover:border-emerald-500/60'
          : attempted
            ? 'border-amber-500/30 bg-amber-500/5 hover:border-amber-500/60'
            : 'border-outline-variant/50 bg-surface-container-low hover:border-primary/40',
      ].join(' ')}
    >
      <div className="grid h-9 w-9 place-items-center rounded-lg bg-surface-container-high font-manrope text-label-sm font-bold text-on-surface-variant">
        {level.order}
      </div>
      <div className="min-w-0">
        <div className="flex min-w-0 flex-wrap items-center gap-xs">
          <h3 className="truncate font-semibold text-on-surface">{level.title}</h3>
          <DifficultyBadge difficulty={level.difficulty as DifficultyLevel} />
        </div>
        {level.description && (
          <p className="mt-0.5 line-clamp-1 text-label-sm text-on-surface-variant">{level.description}</p>
        )}
      </div>
      <div className="flex items-center gap-sm">
        <span
          className={[
            'hidden rounded-full px-2 py-1 text-[11px] font-semibold sm:inline-flex',
            solved
              ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
              : attempted
                ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300'
                : 'bg-surface-container-high text-on-surface-variant',
          ].join(' ')}
        >
          {solved
            ? t('maze.student.completed')
            : attempted
              ? t('maze.student.attempted')
              : t('maze.student.notStarted', 'Chưa làm')}
        </span>
        <Icon name={solved ? 'replay' : attempted ? 'restart_alt' : 'play_arrow'} className="text-primary" />
      </div>
    </button>
  );
}

function matchesStatus(level: IMazeLevel, status: StatusFilter): boolean {
  const solved = !!level.solved;
  const attempted = !solved && (level.attempts ?? 0) > 0;
  if (status === 'solved') return solved;
  if (status === 'attempted') return attempted;
  if (status === 'todo') return !solved && !attempted;
  return true;
}

function courseButtonClass(active: boolean): string {
  return [
    'inline-flex h-9 shrink-0 items-center gap-xs rounded-lg px-sm text-label-sm font-semibold transition',
    active
      ? 'bg-primary-container text-on-primary-container'
      : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high',
  ].join(' ');
}

function statusButtonClass(active: boolean): string {
  return [
    'inline-flex h-8 items-center gap-xs rounded-lg px-sm text-label-sm font-semibold transition',
    active
      ? 'bg-primary text-on-primary'
      : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high',
  ].join(' ');
}
