import { useMemo, useState } from 'react';
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
import {
  ASSIGNMENT_TYPE_ICON,
  ASSIGNMENT_TYPE_LABEL,
  AssignmentType,
  IAssignmentDef,
  ICreateAssignmentDefPayload,
  PublishStatus,
} from '@cp/shared';

import {
  useAssignmentsList,
  useCreateAssignment,
  useDeleteAssignment,
} from '../../../api/curriculum.queries';

const PAGE_SIZE = 10;

const DIFFICULTY_TONE: Record<'EASY' | 'MEDIUM' | 'HARD', 'success' | 'warning' | 'error'> = {
  EASY: 'success',
  MEDIUM: 'warning',
  HARD: 'error',
};

export default function AssignmentsListPage() {
  const { t } = useTranslation();

  const [search, setSearch] = useState('');
  const [type, setType] = useState<AssignmentType | 'all'>('all');
  const [difficulty, setDifficulty] = useState<'EASY' | 'MEDIUM' | 'HARD' | 'all'>('all');
  const [page, setPage] = useState(1);
  const [creating, setCreating] = useState(false);

  const { data, isLoading, isError, error, isPlaceholderData } = useAssignmentsList({
    page,
    limit: PAGE_SIZE,
    search,
    type,
    difficulty,
  });
  const deleteAssignment = useDeleteAssignment();

  const rows = data?.items ?? [];
  const total = data?.total ?? 0;
  const pageCount = data?.pageCount ?? 1;

  function resetPage<T>(setter: (v: T) => void) {
    return (v: T) => {
      setter(v);
      setPage(1);
    };
  }

  const columns: Column<IAssignmentDef>[] = useMemo(
    () => [
      {
        key: 'title',
        header: t('pages.admin.assignmentsList.columns.title'),
        cell: (a) => (
          <div className="min-w-0">
            <div className="text-on-surface font-medium truncate">{a.title}</div>
            <div className="text-[12px] text-on-surface-variant truncate">{a.description}</div>
          </div>
        ),
      },
      {
        key: 'type',
        header: t('pages.admin.assignmentsList.columns.type'),
        cell: (a) => (
          <span className="inline-flex items-center gap-xs">
            <Icon name={ASSIGNMENT_TYPE_ICON[a.type]} size={16} className="text-primary" />
            <span className="text-on-surface">{t(`enums.assignmentType.${a.type}`, ASSIGNMENT_TYPE_LABEL[a.type])}</span>
          </span>
        ),
      },
      {
        key: 'difficulty',
        header: t('pages.admin.assignmentsList.columns.difficulty'),
        cell: (a) => (
          <StatusBadge tone={DIFFICULTY_TONE[a.difficulty]}>
            {t(`enums.difficultyLevel.${a.difficulty}`)}
          </StatusBadge>
        ),
      },
      {
        key: 'subject',
        header: t('pages.admin.assignmentsList.columns.subject'),
        cell: (a) => <span className="text-on-surface-variant">{a.subject}</span>,
      },
      {
        key: 'points',
        header: t('pages.admin.assignmentsList.columns.points'),
        align: 'right',
        cell: (a) => <span className="text-on-surface font-semibold">{a.points}</span>,
      },
      {
        key: 'status',
        header: t('pages.admin.assignmentsList.columns.status'),
        cell: (a) => (
          <StatusBadge tone={a.status === PublishStatus.PUBLISHED ? 'success' : 'neutral'}>
            {t(`enums.publishStatus.${a.status}`)}
          </StatusBadge>
        ),
      },
      {
        key: 'actions',
        header: '',
        align: 'right',
        cell: (a) => (
          <div className="opacity-0 group-hover:opacity-100 inline-flex gap-xs transition-opacity">
            <button
              type="button"
              onClick={() => deleteAssignment.mutate(a.id)}
              className="p-1 rounded text-on-surface-variant hover:text-error"
              aria-label={t('common.delete')}
              disabled={deleteAssignment.isPending}
            >
              <Icon name="delete" size={18} />
            </button>
          </div>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t, deleteAssignment],
  );

  return (
    <div className="flex flex-col gap-lg">
      <PageHeader
        title={t('pages.admin.assignmentsList.title')}
        subtitle={t('pages.admin.assignmentsList.subtitle')}
        actions={
          <Button variant="admin" leadingIcon={<Icon name="add" size={18} />} onClick={() => setCreating(true)}>
            {t('pages.admin.assignmentsList.create')}
          </Button>
        }
      />

      <FilterToolbar>
        <SearchBox
          value={search}
          onChange={resetPage(setSearch)}
          placeholder={t('pages.admin.assignmentsList.searchPlaceholder')}
        />
        <SelectFilter
          label={t('pages.admin.assignmentsList.typeFilter')}
          value={type}
          onChange={(e) => resetPage(setType)(e.target.value as typeof type)}
          options={[
            { value: 'all', label: t('common.all') },
            ...Object.values(AssignmentType).map((v) => ({
              value: v,
              label: t(`enums.assignmentType.${v}`, ASSIGNMENT_TYPE_LABEL[v]),
            })),
          ]}
        />
        <SelectFilter
          label={t('pages.admin.assignmentsList.difficultyFilter')}
          value={difficulty}
          onChange={(e) => resetPage(setDifficulty)(e.target.value as typeof difficulty)}
          options={[
            { value: 'all', label: t('common.all') },
            { value: 'EASY', label: t('enums.difficultyLevel.EASY') },
            { value: 'MEDIUM', label: t('enums.difficultyLevel.MEDIUM') },
            { value: 'HARD', label: t('enums.difficultyLevel.HARD') },
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
            rowKey={(a) => a.id}
            emptyState={
              <span>
                {isLoading ? t('common.loading') : t('pages.admin.assignmentsList.empty')}
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

      {creating && <CreateAssignmentDialog onClose={() => setCreating(false)} />}
    </div>
  );
}

function CreateAssignmentDialog({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  const create = useCreateAssignment();
  const [draft, setDraft] = useState<ICreateAssignmentDefPayload>({
    title: '',
    description: '',
    type: AssignmentType.QUIZ,
    difficulty: 'MEDIUM',
    subject: '',
    points: 10,
    status: PublishStatus.PUBLISHED,
  });
  const [error, setError] = useState<string | null>(null);

  function patch<K extends keyof ICreateAssignmentDefPayload>(
    key: K,
    value: ICreateAssignmentDefPayload[K],
  ) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  async function submit() {
    setError(null);
    try {
      await create.mutateAsync(draft);
      onClose();
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
            {t('pages.admin.assignmentsList.createDialog.title')}
          </h2>
          <button type="button" onClick={onClose} className="p-1 rounded hover:bg-surface-container-high">
            <Icon name="close" />
          </button>
        </header>

        <FormField label={t('pages.admin.assignmentsList.createDialog.title')} required>
          <input
            type="text"
            value={draft.title}
            onChange={(e) => patch('title', e.target.value)}
            className="bg-surface-container-low border border-outline-variant rounded-lg px-md py-sm focus:ring-2 focus:ring-primary outline-none"
          />
        </FormField>
        <FormField label={t('pages.admin.assignmentsList.createDialog.description')}>
          <textarea
            rows={3}
            value={draft.description ?? ''}
            onChange={(e) => patch('description', e.target.value)}
            className="bg-surface-container-low border border-outline-variant rounded-lg px-md py-sm focus:ring-2 focus:ring-primary outline-none resize-none"
          />
        </FormField>
        <div className="grid grid-cols-2 gap-md">
          <SelectFilter
            label={t('pages.admin.assignmentsList.columns.type')}
            value={draft.type}
            onChange={(e) => patch('type', e.target.value as AssignmentType)}
            options={Object.values(AssignmentType).map((v) => ({
              value: v,
              label: t(`enums.assignmentType.${v}`, ASSIGNMENT_TYPE_LABEL[v]),
            }))}
          />
          <SelectFilter
            label={t('pages.admin.assignmentsList.columns.difficulty')}
            value={draft.difficulty}
            onChange={(e) => patch('difficulty', e.target.value as 'EASY' | 'MEDIUM' | 'HARD')}
            options={[
              { value: 'EASY', label: t('enums.difficultyLevel.EASY') },
              { value: 'MEDIUM', label: t('enums.difficultyLevel.MEDIUM') },
              { value: 'HARD', label: t('enums.difficultyLevel.HARD') },
            ]}
          />
          <FormField label={t('pages.admin.assignmentsList.columns.subject')} required>
            <input
              type="text"
              value={draft.subject}
              onChange={(e) => patch('subject', e.target.value)}
              className="bg-surface-container-low border border-outline-variant rounded-lg px-md py-sm focus:ring-2 focus:ring-primary outline-none"
            />
          </FormField>
          <FormField label={t('pages.admin.assignmentsList.columns.points')} required>
            <input
              type="number"
              min={0}
              value={draft.points}
              onChange={(e) => patch('points', Number(e.target.value) || 0)}
              className="bg-surface-container-low border border-outline-variant rounded-lg px-md py-sm focus:ring-2 focus:ring-primary outline-none"
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
            disabled={create.isPending || !draft.title.trim() || !draft.subject.trim()}
            trailingIcon={
              create.isPending ? <Icon name="progress_activity" size={18} className="animate-spin" /> : undefined
            }
          >
            {t('pages.admin.assignmentsList.createDialog.save')}
          </Button>
        </footer>
      </div>
    </div>
  );
}
