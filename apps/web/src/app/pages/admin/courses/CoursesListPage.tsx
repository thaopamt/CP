import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Button,
  Column,
  DataTable,
  FilterToolbar,
  FormField,
  Icon,
  PageHeader,
  Pagination,
  SearchBox,
  SelectFilter,
  StatusBadge,
} from '@cp/ui';
import { ICourse, ICreateCoursePayload, PublishStatus } from '@cp/shared';

import {
  useCoursesList,
  useCreateCourse,
  useDeleteCourse,
} from '../../../api/curriculum.queries';

const PAGE_SIZE = 10;

export default function CoursesListPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<PublishStatus | 'all'>('all');
  const [page, setPage] = useState(1);
  const [creating, setCreating] = useState(false);

  const { data, isLoading, isError, error, isPlaceholderData } = useCoursesList({
    page,
    limit: PAGE_SIZE,
    search,
    status,
  });
  const deleteCourse = useDeleteCourse();

  const rows = data?.items ?? [];
  const total = data?.total ?? 0;
  const pageCount = data?.pageCount ?? 1;

  function resetPage<T>(setter: (v: T) => void) {
    return (v: T) => {
      setter(v);
      setPage(1);
    };
  }

  const columns: Column<ICourse>[] = useMemo(
    () => [
      {
        key: 'title',
        header: t('pages.admin.coursesList.columns.title'),
        cell: (c) => (
          <button
            type="button"
            onClick={() => navigate(`/admin/courses/${c.id}`)}
            className="text-left min-w-0 hover:text-primary"
          >
            <div className="text-on-surface font-medium truncate">{c.title}</div>
            <div className="text-[12px] text-on-surface-variant font-mono">{c.code} · {c.subject}</div>
          </button>
        ),
      },
      {
        key: 'credits',
        header: t('pages.admin.coursesList.columns.credits'),
        align: 'right',
        cell: (c) => <span className="text-on-surface font-semibold">{c.credits.toFixed(1)}</span>,
      },
      {
        key: 'duration',
        header: t('pages.admin.coursesList.columns.duration'),
        cell: (c) => (
          <span className="text-on-surface-variant whitespace-nowrap">
            {t('pages.admin.coursesList.weeks', { count: c.durationWeeks })}
          </span>
        ),
      },
      {
        key: 'assignments',
        header: t('pages.admin.coursesList.columns.assignments'),
        align: 'right',
        cell: (c) => (
          <span className="text-on-surface-variant">
            {t('pages.admin.coursesList.assignmentCount', {
              count: c.assignmentCount,
              points: c.totalPoints,
            })}
          </span>
        ),
      },
      {
        key: 'status',
        header: t('pages.admin.coursesList.columns.status'),
        cell: (c) => (
          <StatusBadge tone={c.status === PublishStatus.PUBLISHED ? 'success' : 'neutral'}>
            {t(`enums.publishStatus.${c.status}`)}
          </StatusBadge>
        ),
      },
      {
        key: 'actions',
        header: '',
        align: 'right',
        cell: (c) => (
          <div className="opacity-0 group-hover:opacity-100 inline-flex gap-xs transition-opacity">
            <button
              type="button"
              onClick={() => navigate(`/admin/courses/${c.id}`)}
              className="p-1 rounded text-on-surface-variant hover:text-primary"
              aria-label={t('common.viewAll')}
            >
              <Icon name="open_in_new" size={18} />
            </button>
            <button
              type="button"
              onClick={() => deleteCourse.mutate(c.id)}
              className="p-1 rounded text-on-surface-variant hover:text-error"
              aria-label={t('common.delete')}
              disabled={deleteCourse.isPending}
            >
              <Icon name="delete" size={18} />
            </button>
          </div>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t, navigate, deleteCourse],
  );

  return (
    <div className="flex flex-col gap-lg">
      <PageHeader
        title={t('pages.admin.coursesList.title')}
        subtitle={t('pages.admin.coursesList.subtitle')}
        actions={
          <Button variant="admin" leadingIcon={<Icon name="add" size={18} />} onClick={() => setCreating(true)}>
            {t('pages.admin.coursesList.create')}
          </Button>
        }
      />

      <FilterToolbar>
        <SearchBox
          value={search}
          onChange={resetPage(setSearch)}
          placeholder={t('pages.admin.coursesList.searchPlaceholder')}
        />
        <SelectFilter
          label={t('pages.admin.coursesList.statusFilter')}
          value={status}
          onChange={(e) => resetPage(setStatus)(e.target.value as typeof status)}
          options={[
            { value: 'all', label: t('common.all') },
            ...Object.values(PublishStatus).map((s) => ({
              value: s,
              label: t(`enums.publishStatus.${s}`),
            })),
          ]}
        />
      </FilterToolbar>

      <div className="bg-surface-container-lowest border border-outline-variant/50 rounded-xl shadow-elev-1 overflow-hidden relative">
        {isPlaceholderData && (
          <div className="absolute top-0 inset-x-0 h-0.5 bg-primary/50 animate-pulse z-10" aria-hidden />
        )}
        {isError ? (
          <div className="p-xl text-center">
            <Icon name="error" size={36} className="mx-auto mb-sm text-error" />
            <p className="text-body-md text-on-surface">{(error as Error).message}</p>
          </div>
        ) : (
          <DataTable
            rows={rows}
            columns={columns}
            rowKey={(c) => c.id}
            emptyState={
              <span>
                {isLoading ? t('common.loading') : t('pages.admin.coursesList.empty')}
              </span>
            }
          />
        )}

        <footer className="flex flex-col sm:flex-row items-center justify-between gap-sm p-md border-t border-outline-variant/30">
          <div className="text-label-sm text-on-surface-variant">
            {t('pages.admin.students.showing', {
              from: rows.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1,
              to: (page - 1) * PAGE_SIZE + rows.length,
              total,
            })}
          </div>
          <Pagination page={page} pageCount={pageCount} onChange={setPage} />
        </footer>
      </div>

      {creating && <CreateCourseDialog onClose={() => setCreating(false)} />}
    </div>
  );
}

function CreateCourseDialog({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const create = useCreateCourse();
  const [draft, setDraft] = useState<ICreateCoursePayload>({
    code: '',
    title: '',
    description: '',
    credits: 3,
    durationWeeks: 12,
    subject: '',
    status: PublishStatus.PUBLISHED,
  });
  const [error, setError] = useState<string | null>(null);

  function patch<K extends keyof ICreateCoursePayload>(key: K, value: ICreateCoursePayload[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  async function submit() {
    setError(null);
    try {
      const created = await create.mutateAsync(draft);
      onClose();
      navigate(`/admin/courses/${created.id}`);
    } catch (err) {
      const msg =
        (err as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
      setError(Array.isArray(msg) ? msg.join(', ') : (msg ?? (err as Error).message));
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-on-surface/40 backdrop-blur-sm p-md"
      onClick={onClose}
    >
      <div
        className="bg-surface-container-lowest rounded-2xl border border-outline-variant/50 shadow-elev-3 w-full max-w-lg p-lg flex flex-col gap-md"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between">
          <h2 className="font-manrope text-headline-md text-on-surface">
            {t('pages.admin.coursesList.createDialog.title')}
          </h2>
          <button type="button" onClick={onClose} className="p-1 rounded hover:bg-surface-container-high">
            <Icon name="close" />
          </button>
        </header>

        <div className="grid grid-cols-2 gap-md">
          <FormField label={t('pages.admin.coursesList.columns.title')} required className="col-span-2">
            <input
              type="text"
              value={draft.title}
              onChange={(e) => patch('title', e.target.value)}
              className="bg-surface-container-low border border-outline-variant rounded-lg px-md py-sm focus:ring-2 focus:ring-primary outline-none"
            />
          </FormField>
          <FormField label={t('pages.admin.coursesList.createDialog.code')} required>
            <input
              type="text"
              value={draft.code}
              onChange={(e) => patch('code', e.target.value)}
              placeholder="MATH-301"
              className="bg-surface-container-low border border-outline-variant rounded-lg px-md py-sm focus:ring-2 focus:ring-primary outline-none font-mono"
            />
          </FormField>
          <FormField label={t('pages.admin.coursesList.columns.subject')} required>
            <input
              type="text"
              value={draft.subject}
              onChange={(e) => patch('subject', e.target.value)}
              className="bg-surface-container-low border border-outline-variant rounded-lg px-md py-sm focus:ring-2 focus:ring-primary outline-none"
            />
          </FormField>
          <FormField label={t('pages.admin.coursesList.columns.credits')} required>
            <input
              type="number"
              step={0.5}
              min={0}
              value={draft.credits}
              onChange={(e) => patch('credits', Number(e.target.value) || 0)}
              className="bg-surface-container-low border border-outline-variant rounded-lg px-md py-sm focus:ring-2 focus:ring-primary outline-none"
            />
          </FormField>
          <FormField label={t('pages.admin.coursesList.columns.duration')} required>
            <input
              type="number"
              min={1}
              value={draft.durationWeeks}
              onChange={(e) => patch('durationWeeks', Number(e.target.value) || 1)}
              className="bg-surface-container-low border border-outline-variant rounded-lg px-md py-sm focus:ring-2 focus:ring-primary outline-none"
            />
          </FormField>
          <FormField label={t('pages.admin.coursesList.createDialog.description')} className="col-span-2">
            <textarea
              rows={3}
              value={draft.description ?? ''}
              onChange={(e) => patch('description', e.target.value)}
              className="bg-surface-container-low border border-outline-variant rounded-lg px-md py-sm focus:ring-2 focus:ring-primary outline-none resize-none"
            />
          </FormField>
        </div>

        {error && (
          <div className="bg-error-container/60 text-on-error-container rounded-md px-md py-sm text-label-sm">
            {error}
          </div>
        )}

        <footer className="flex justify-end gap-sm">
          <Button variant="ghost" onClick={onClose} disabled={create.isPending}>
            {t('common.cancel')}
          </Button>
          <Button
            variant="admin"
            onClick={submit}
            disabled={create.isPending || !draft.title.trim() || !draft.code.trim() || !draft.subject.trim()}
            trailingIcon={
              create.isPending ? <Icon name="progress_activity" size={18} className="animate-spin" /> : undefined
            }
          >
            {t('pages.admin.coursesList.createDialog.save')}
          </Button>
        </footer>
      </div>
    </div>
  );
}
