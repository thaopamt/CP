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
} from '@cp/ui';
import { useToast } from '@cp/ui';
import { IClassCourseLink, PublishStatus } from '@cp/shared';

import { useClass } from '../../../api/class.queries';
import {
  useAttachClassCourses,
  useClassCourses,
  useCoursesList,
  useDetachClassCourse,
  useReorderClassCourses,
} from '../../../api/curriculum.queries';

export default function ClassCurriculumPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { classId } = useParams<{ classId: string }>();
  const toast = useToast();

  const classQuery = useClass(classId);
  const linksQuery = useClassCourses(classId);
  const attach = useAttachClassCourses(classId ?? '');
  const detach = useDetachClassCourse(classId ?? '');
  const reorder = useReorderClassCourses(classId ?? '');

  const [pickerOpen, setPickerOpen] = useState(false);

  if (classQuery.isLoading) {
    return (
      <div className="grid place-items-center min-h-[40vh] text-on-surface-variant">
        <span className="material-symbols-outlined animate-spin text-3xl">progress_activity</span>
      </div>
    );
  }
  if (classQuery.isError || !classQuery.data) {
    return (
      <div className="grid place-items-center min-h-[40vh] text-center">
        <Icon name="error" size={36} className="mb-sm text-error" />
        <Button variant="ghost" className="mt-md" onClick={() => navigate('/admin/classes')}>
          {t('pages.admin.classes.detail.backToClasses')}
        </Button>
      </div>
    );
  }

  const cls = classQuery.data;
  const links = (linksQuery.data ?? []).slice().sort((a, b) => a.order - b.order);

  function moveUp(idx: number) {
    if (idx <= 0) return;
    const ids = links.map((l) => l.id);
    [ids[idx - 1], ids[idx]] = [ids[idx], ids[idx - 1]];
    reorder.mutate(ids);
  }
  function moveDown(idx: number) {
    if (idx >= links.length - 1) return;
    const ids = links.map((l) => l.id);
    [ids[idx], ids[idx + 1]] = [ids[idx + 1], ids[idx]];
    reorder.mutate(ids);
  }

  const totalCredits = links.reduce((acc, l) => acc + l.course.credits, 0);
  const totalWeeks = links.reduce((acc, l) => acc + l.course.durationWeeks, 0);
  const totalAssignments = links.reduce((acc, l) => acc + l.course.assignmentCount, 0);

  return (
    <div className="flex flex-col gap-lg">
      <PageHeader
        breadcrumb={
          <Breadcrumb
            items={[
              { label: t('nav.admin.classes'), onClick: () => navigate('/admin/classes') },
              { label: cls.code, onClick: () => navigate(`/admin/classes/${cls.id}`) },
              { label: t('pages.admin.classCurriculum.title') },
            ]}
          />
        }
        eyebrow={
          <div className="flex items-center gap-sm text-label-sm text-on-surface-variant">
            <span>{cls.name}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-outline-variant" />
            <span>{cls.term}</span>
          </div>
        }
        title={t('pages.admin.classCurriculum.title')}
        subtitle={t('pages.admin.classCurriculum.subtitle')}
        actions={
          <Button
            variant="admin"
            leadingIcon={<Icon name="library_add" size={18} />}
            onClick={() => setPickerOpen(true)}
          >
            {t('pages.admin.classCurriculum.addCourses')}
          </Button>
        }
      />

      {/* Summary stats */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-md">
        <SummaryStat
          icon="menu_book"
          label={t('pages.admin.classCurriculum.summary.courses')}
          value={links.length.toString()}
        />
        <SummaryStat
          icon="workspace_premium"
          label={t('pages.admin.classCurriculum.summary.credits')}
          value={totalCredits.toFixed(1)}
        />
        <SummaryStat
          icon="schedule"
          label={t('pages.admin.classCurriculum.summary.weeks')}
          value={t('pages.admin.coursesList.weeks', { count: totalWeeks })}
        />
        <SummaryStat
          icon="assignment"
          label={t('pages.admin.classCurriculum.summary.assignments')}
          value={totalAssignments.toString()}
        />
      </section>

      <section className="bg-surface-container-lowest border border-outline-variant/50 rounded-xl shadow-elev-1 overflow-hidden">
        <header className="flex items-center justify-between p-md md:p-lg border-b border-outline-variant/30">
          <div>
            <h3 className="font-manrope text-headline-md text-on-surface">
              {t('pages.admin.classCurriculum.sequenceTitle')}
            </h3>
            <p className="text-label-sm text-on-surface-variant">
              {t('pages.admin.classCurriculum.sequenceSubtitle')}
            </p>
          </div>
        </header>

        {linksQuery.isLoading ? (
          <div className="p-xl text-center text-on-surface-variant">{t('common.loading')}</div>
        ) : links.length === 0 ? (
          <div className="p-xl text-center">
            <Icon name="school" size={36} className="mx-auto mb-sm text-on-surface-variant/50" />
            <p className="text-body-md text-on-surface-variant">
              {t('pages.admin.classCurriculum.empty')}
            </p>
            <Button
              variant="admin"
              size="sm"
              className="mt-md"
              leadingIcon={<Icon name="library_add" size={16} />}
              onClick={() => setPickerOpen(true)}
            >
              {t('pages.admin.classCurriculum.addCourses')}
            </Button>
          </div>
        ) : (
          <ul className="divide-y divide-outline-variant/30">
            {links.map((link, idx) => (
              <CourseRow
                key={link.id}
                link={link}
                index={idx}
                isFirst={idx === 0}
                isLast={idx === links.length - 1}
                onMoveUp={() => moveUp(idx)}
                onMoveDown={() => moveDown(idx)}
                onDetach={() => detach.mutate(link.id)}
                onOpen={() => navigate(`/admin/courses/${link.course.id}`)}
                detaching={detach.isPending}
                reordering={reorder.isPending}
              />
            ))}
          </ul>
        )}
      </section>

      {pickerOpen && classId && (
        <CoursePickerDialog
          alreadyAttachedIds={new Set(links.map((l) => l.course.id))}
          onClose={() => setPickerOpen(false)}
          onConfirm={async (ids) => {
            try {
              await attach.mutateAsync(ids);
              setPickerOpen(false);
              toast.success(t('pages.admin.classCurriculum.picker.success', 'Courses attached successfully.'));
            } catch (err: any) {
              console.error('Attach error:', err);
              toast.error(err?.response?.data?.message || err.message || t('common.error', 'Failed to attach courses.'));
            }
          }}
          isSubmitting={attach.isPending}
        />
      )}
    </div>
  );
}

function SummaryStat({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="bg-surface-container-lowest border border-outline-variant/50 rounded-xl p-md flex items-start gap-md">
      <span className="w-9 h-9 rounded-lg bg-primary/10 text-primary grid place-items-center shrink-0">
        <Icon name={icon} size={20} />
      </span>
      <div className="min-w-0">
        <div className="text-[11px] text-on-surface-variant uppercase tracking-wider">{label}</div>
        <div className="font-manrope text-headline-md text-on-surface">{value}</div>
      </div>
    </div>
  );
}

function CourseRow({
  link,
  index,
  isFirst,
  isLast,
  onMoveUp,
  onMoveDown,
  onDetach,
  onOpen,
  detaching,
  reordering,
}: {
  link: IClassCourseLink;
  index: number;
  isFirst: boolean;
  isLast: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDetach: () => void;
  onOpen: () => void;
  detaching: boolean;
  reordering: boolean;
}) {
  const { t } = useTranslation();
  const c = link.course;
  return (
    <li className="flex items-center gap-md p-md md:p-lg group hover:bg-surface-container-high/30 transition-colors">
      <span className="w-8 h-8 rounded-full bg-primary-container text-on-primary-container grid place-items-center font-bold text-label-sm shrink-0">
        {index + 1}
      </span>
      <button type="button" onClick={onOpen} className="flex-1 min-w-0 text-left hover:text-primary">
        <div className="text-on-surface font-medium truncate">{c.title}</div>
        <div className="text-[12px] text-on-surface-variant flex items-center gap-sm flex-wrap">
          <span className="font-mono">{c.code}</span>
          <span className="w-1 h-1 rounded-full bg-outline-variant" />
          <span>{c.subject}</span>
          <span className="w-1 h-1 rounded-full bg-outline-variant" />
          <span>{t('pages.admin.coursesList.weeks', { count: c.durationWeeks })}</span>
          <span className="w-1 h-1 rounded-full bg-outline-variant" />
          <span>{c.credits.toFixed(1)} cr</span>
          <span className="w-1 h-1 rounded-full bg-outline-variant" />
          <span>{c.assignmentCount} bài tập · {c.totalPoints} pts</span>
        </div>
      </button>
      {link.isRequired && (
        <StatusBadge tone="info">{t('pages.admin.classCurriculum.required')}</StatusBadge>
      )}
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

function CoursePickerDialog({
  alreadyAttachedIds,
  onClose,
  onConfirm,
  isSubmitting,
}: {
  alreadyAttachedIds: Set<string>;
  onClose: () => void;
  onConfirm: (ids: string[]) => Promise<void>;
  isSubmitting: boolean;
}) {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const { data, isLoading } = useCoursesList({ search, limit: 50, status: PublishStatus.PUBLISHED });
  const items = useMemo(
    () => (data?.items ?? []).filter((c) => !alreadyAttachedIds.has(c.id)),
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
              {t('pages.admin.classCurriculum.picker.title')}
            </h2>
            <p className="text-label-sm text-on-surface-variant">
              {t('pages.admin.classCurriculum.picker.subtitle')}
            </p>
          </div>
          <button type="button" onClick={onClose} className="p-1 rounded hover:bg-surface-container-high">
            <Icon name="close" />
          </button>
        </header>

        <div className="p-md border-b border-outline-variant/30">
          <SearchBox value={search} onChange={setSearch} placeholder={t('pages.admin.coursesList.searchPlaceholder')} />
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="p-xl text-center text-on-surface-variant">{t('common.loading')}</div>
          ) : items.length === 0 ? (
            <div className="p-xl text-center text-on-surface-variant">
              {t('pages.admin.classCurriculum.picker.empty')}
            </div>
          ) : (
            <ul className="divide-y divide-outline-variant/30">
              {items.map((c) => {
                const isSelected = selected.has(c.id);
                return (
                  <li key={c.id}>
                    <label className="flex items-center gap-sm p-md cursor-pointer hover:bg-surface-container-high/30 transition-colors">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggle(c.id)}
                        className="rounded text-primary focus:ring-primary"
                      />
                      <span className="w-9 h-9 rounded-lg bg-primary/10 text-primary grid place-items-center shrink-0">
                        <Icon name="menu_book" size={20} />
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="text-on-surface font-medium truncate">{c.title}</div>
                        <div className="text-[12px] text-on-surface-variant flex items-center gap-xs flex-wrap">
                          <span className="font-mono">{c.code}</span>
                          <span className="w-1 h-1 rounded-full bg-outline-variant" />
                          <span>{c.subject}</span>
                          <span className="w-1 h-1 rounded-full bg-outline-variant" />
                          <span>{c.credits.toFixed(1)} cr</span>
                          <span className="w-1 h-1 rounded-full bg-outline-variant" />
                          <span>{c.assignmentCount} bài tập</span>
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
            {t('pages.admin.classCurriculum.picker.selected', { count: selected.size })}
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
              {t('pages.admin.classCurriculum.picker.confirm')}
            </Button>
          </div>
        </footer>
      </div>
    </div>
  );
}
