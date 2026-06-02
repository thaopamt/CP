import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Breadcrumb,
  Button,
  Icon,
  PageHeader,
  SearchBox,
  StatusBadge,
  useConfirm,
} from '@cp/ui';
import { useToast } from '@cp/ui';
import {
  ICourseAssignment,
  PublishStatus,
} from '@cp/shared';

import {
  useAssignmentsList,
  useAttachAssignments,
  useCourse,
  useCourseAssignments,
  useDetachAssignment,
  useReorderCourseAssignments,
} from '../../../api/curriculum.queries';

const DIFFICULTY_TONE = {
  EASY: 'success' as const,
  MEDIUM: 'warning' as const,
  HARD: 'error' as const,
};

const assignmentIcon = (assignment: ICourseAssignment['assignment']) =>
  assignment.codingConfig ? 'terminal' : 'assignment';

const assignmentTypeLabel = (assignment: ICourseAssignment['assignment']) =>
  assignment.codingConfig ? 'Coding' : 'Assignment';

export default function CourseDetailPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { courseId } = useParams<{ courseId: string }>();
  const toast = useToast();

  const courseQuery = useCourse(courseId);
  const assignmentsQuery = useCourseAssignments(courseId);
  const attach = useAttachAssignments(courseId ?? '');
  const detach = useDetachAssignment(courseId ?? '');
  const reorder = useReorderCourseAssignments(courseId ?? '');

  const [pickerOpen, setPickerOpen] = useState(false);
  const confirm = useConfirm();

  if (courseQuery.isLoading) {
    return (
      <div className="grid place-items-center min-h-[40vh] text-on-surface-variant">
        <span className="material-symbols-outlined animate-spin text-3xl">progress_activity</span>
      </div>
    );
  }
  if (courseQuery.isError || !courseQuery.data) {
    return (
      <div className="grid place-items-center min-h-[40vh] text-center">
        <Icon name="error" size={36} className="mb-sm text-error" />
        <p className="text-body-md text-on-surface">
          {(courseQuery.error as Error | undefined)?.message ?? t('common.notFound')}
        </p>
        <Button variant="ghost" className="mt-md" onClick={() => navigate('/admin/courses')}>
          {t('pages.admin.courseDetail.backToCourses')}
        </Button>
      </div>
    );
  }

  const course = courseQuery.data;
  const sequence = (assignmentsQuery.data ?? []).slice().sort((a, b) => a.order - b.order);

  function moveUp(idx: number) {
    if (idx <= 0) return;
    const ids = sequence.map((s) => s.id);
    [ids[idx - 1], ids[idx]] = [ids[idx], ids[idx - 1]];
    reorder.mutate(ids);
  }
  function moveDown(idx: number) {
    if (idx >= sequence.length - 1) return;
    const ids = sequence.map((s) => s.id);
    [ids[idx], ids[idx + 1]] = [ids[idx + 1], ids[idx]];
    reorder.mutate(ids);
  }

  return (
    <div className="flex flex-col gap-lg">
      <PageHeader
        breadcrumb={
          <Breadcrumb
            items={[
              { label: t('nav.admin.courses'), onClick: () => navigate('/admin/courses') },
              { label: course.title },
            ]}
          />
        }
        eyebrow={
          <div className="flex items-center gap-sm text-label-sm text-on-surface-variant">
            <span className="font-mono">{course.code}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-outline-variant" />
            <span>{course.subject}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-outline-variant" />
            <span>{t('pages.admin.coursesList.weeks', { count: course.durationWeeks })}</span>
          </div>
        }
        title={course.title}
        actions={
          <>
            <StatusBadge tone={course.status === PublishStatus.PUBLISHED ? 'success' : 'neutral'}>
              {t(`enums.publishStatus.${course.status}`)}
            </StatusBadge>
            <Button variant="admin" leadingIcon={<Icon name="library_add" size={18} />} onClick={() => setPickerOpen(true)}>
              {t('pages.admin.courseDetail.addAssignments')}
            </Button>
          </>
        }
      />

      {course.description && (
        <p className="text-body-md text-on-surface-variant max-w-3xl">{course.description}</p>
      )}

      <section className="bg-surface-container-lowest border border-outline-variant/50 rounded-xl shadow-elev-1 overflow-hidden">
        <header className="flex items-center justify-between p-md md:p-lg border-b border-outline-variant/30">
          <div>
            <h3 className="font-manrope text-headline-md text-on-surface">
              {t('pages.admin.courseDetail.sequenceTitle')}
            </h3>
            <p className="text-label-sm text-on-surface-variant">
              {t('pages.admin.courseDetail.sequenceSubtitle', {
                count: sequence.length,
                points: course.totalPoints,
              })}
            </p>
          </div>
        </header>

        {assignmentsQuery.isLoading ? (
          <div className="p-xl text-center text-on-surface-variant">{t('common.loading')}</div>
        ) : sequence.length === 0 ? (
          <div className="p-xl text-center">
            <Icon name="assignment" size={36} className="mx-auto mb-sm text-on-surface-variant/50" />
            <p className="text-body-md text-on-surface-variant">
              {t('pages.admin.courseDetail.empty')}
            </p>
            <Button
              variant="admin"
              size="sm"
              className="mt-md"
              leadingIcon={<Icon name="library_add" size={16} />}
              onClick={() => setPickerOpen(true)}
            >
              {t('pages.admin.courseDetail.addAssignments')}
            </Button>
          </div>
        ) : (
          <ul className="divide-y divide-outline-variant/30">
            {sequence.map((row, idx) => (
              <SequenceRow
                key={row.id}
                row={row}
                index={idx}
                isFirst={idx === 0}
                isLast={idx === sequence.length - 1}
                onMoveUp={() => moveUp(idx)}
                onMoveDown={() => moveDown(idx)}
                onDetach={async () => {
                  const ok = await confirm({
                    title: t('common.confirmDelete', 'Confirm'),
                    message: t('pages.admin.courseDetail.detachConfirm', 'Are you sure you want to remove this assignment from the course?'),
                    intent: 'danger'
                  });
                  if (ok) detach.mutate(row.id);
                }}
                detaching={detach.isPending}
                reordering={reorder.isPending}
              />
            ))}
          </ul>
        )}
      </section>

      {pickerOpen && courseId && (
        <AssignmentPickerDialog
          courseId={courseId}
          alreadyAttachedIds={new Set(sequence.map((s) => s.assignment.id))}
          onClose={() => setPickerOpen(false)}
          onConfirm={async (ids) => {
            try {
              await attach.mutateAsync(ids);
              setPickerOpen(false);
              toast.success(t('pages.admin.courseDetail.picker.success', 'Assignments attached successfully.'));
            } catch (err: any) {
              console.error('Attach error:', err);
              toast.error(err?.response?.data?.message || err.message || t('common.error', 'Failed to attach assignments.'));
            }
          }}
          isSubmitting={attach.isPending}
        />
      )}
    </div>
  );
}

function SequenceRow({
  row,
  index,
  isFirst,
  isLast,
  onMoveUp,
  onMoveDown,
  onDetach,
  detaching,
  reordering,
}: {
  row: ICourseAssignment;
  index: number;
  isFirst: boolean;
  isLast: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDetach: () => void;
  detaching: boolean;
  reordering: boolean;
}) {
  const { t } = useTranslation();
  const a = row.assignment;
  return (
    <li className="flex items-center gap-md p-md md:p-lg group hover:bg-surface-container-high/30 transition-colors">
      <span className="w-8 h-8 rounded-full bg-primary-container text-on-primary-container grid place-items-center font-bold text-label-sm shrink-0">
        {index + 1}
      </span>
      <span className="w-9 h-9 rounded-lg bg-primary/10 text-primary grid place-items-center shrink-0">
        <Icon name={assignmentIcon(a)} size={20} />
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-on-surface font-medium truncate">{a.title}</div>
        <div className="text-[12px] text-on-surface-variant flex items-center gap-sm flex-wrap">
          <span>{assignmentTypeLabel(a)}</span>
          <span className="w-1 h-1 rounded-full bg-outline-variant" />
          <span>{t(`enums.difficultyLevel.${a.difficulty}`)}</span>
          <span className="w-1 h-1 rounded-full bg-outline-variant" />
          <span className="font-semibold text-tertiary">{a.points} pts</span>
        </div>
      </div>
      <div className="flex items-center gap-xs">
        <button
          type="button"
          onClick={onMoveUp}
          disabled={isFirst || reordering}
          className="p-1 rounded text-on-surface-variant hover:text-primary disabled:opacity-30 disabled:hover:text-on-surface-variant"
          aria-label={t('pages.admin.courseDetail.moveUp')}
        >
          <Icon name="arrow_upward" size={18} />
        </button>
        <button
          type="button"
          onClick={onMoveDown}
          disabled={isLast || reordering}
          className="p-1 rounded text-on-surface-variant hover:text-primary disabled:opacity-30 disabled:hover:text-on-surface-variant"
          aria-label={t('pages.admin.courseDetail.moveDown')}
        >
          <Icon name="arrow_downward" size={18} />
        </button>
        <button
          type="button"
          onClick={onDetach}
          disabled={detaching}
          className="p-1 rounded text-on-surface-variant hover:text-error disabled:opacity-30"
          aria-label={t('common.delete')}
        >
          <Icon name="delete" size={18} />
        </button>
      </div>
    </li>
  );
}

function AssignmentPickerDialog({
  alreadyAttachedIds,
  onClose,
  onConfirm,
  isSubmitting,
}: {
  courseId: string;
  alreadyAttachedIds: Set<string>;
  onClose: () => void;
  onConfirm: (ids: string[]) => Promise<void>;
  isSubmitting: boolean;
}) {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const { data, isLoading } = useAssignmentsList({ search, limit: 50 });
  const items = useMemo(
    () => (data?.items ?? []).filter((a) => !alreadyAttachedIds.has(a.id)),
    [data, alreadyAttachedIds],
  );

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-on-surface/40 backdrop-blur-sm p-md"
      onClick={onClose}
    >
      <div
        className="bg-surface-container-lowest rounded-2xl border border-outline-variant/50 shadow-elev-3 w-full max-w-2xl flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between p-md border-b border-outline-variant/30">
          <div>
            <h2 className="font-manrope text-headline-md text-on-surface">
              {t('pages.admin.courseDetail.picker.title')}
            </h2>
            <p className="text-label-sm text-on-surface-variant">
              {t('pages.admin.courseDetail.picker.subtitle')}
            </p>
          </div>
          <button type="button" onClick={onClose} className="p-1 rounded hover:bg-surface-container-high">
            <Icon name="close" />
          </button>
        </header>

        <div className="p-md border-b border-outline-variant/30">
          <SearchBox
            value={search}
            onChange={setSearch}
            placeholder={t('pages.admin.assignmentsList.searchPlaceholder')}
          />
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="p-xl text-center text-on-surface-variant">{t('common.loading')}</div>
          ) : items.length === 0 ? (
            <div className="p-xl text-center text-on-surface-variant">
              {t('pages.admin.courseDetail.picker.empty')}
            </div>
          ) : (
            <ul className="divide-y divide-outline-variant/30">
              {items.map((a) => {
                const isSelected = selected.has(a.id);
                return (
                  <li key={a.id}>
                    <label className="flex items-center gap-sm p-md cursor-pointer hover:bg-surface-container-high/30 transition-colors">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggle(a.id)}
                        className="rounded text-primary focus:ring-primary"
                      />
                      <span className="w-9 h-9 rounded-lg bg-primary/10 text-primary grid place-items-center shrink-0">
                        <Icon name={assignmentIcon(a)} size={20} />
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="text-on-surface font-medium truncate">{a.title}</div>
                        <div className="text-[12px] text-on-surface-variant flex items-center gap-xs flex-wrap">
                          <StatusBadge tone={DIFFICULTY_TONE[a.difficulty]}>
                            {t(`enums.difficultyLevel.${a.difficulty}`)}
                          </StatusBadge>
                          <span>{assignmentTypeLabel(a)}</span>
                          <span className="w-1 h-1 rounded-full bg-outline-variant" />
                          <span className="font-semibold text-tertiary">{a.points} pts</span>
                        </div>
                      </div>
                    </label>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <footer className="flex items-center justify-between p-md border-t border-outline-variant/30">
          <span className="text-label-sm text-on-surface-variant">
            {t('pages.admin.courseDetail.picker.selected', { count: selected.size })}
          </span>
          <div className="flex gap-sm">
            <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
              {t('common.cancel')}
            </Button>
            <Button
              variant="admin"
              onClick={() => onConfirm(Array.from(selected))}
              disabled={isSubmitting || selected.size === 0}
              trailingIcon={
                isSubmitting ? <Icon name="progress_activity" size={18} className="animate-spin" /> : undefined
              }
            >
              {t('pages.admin.courseDetail.picker.confirm')}
            </Button>
          </div>
        </footer>
      </div>
    </div>
  );
}
