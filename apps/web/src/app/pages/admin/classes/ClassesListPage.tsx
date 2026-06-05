import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Avatar,
  BulkActionBar,
  Button,
  ClassStatusBadge,
  Column,
  DataTable,
  FilterToolbar,
  Icon,
  PageHeader,
  Pagination,
  SearchBox,
  SelectFilter,
  useConfirm,
} from '@cp/ui';
import {
  ClassStatus,
  IClass,
} from '@cp/shared';

import { useClassesList, useDeleteClass } from '../../../api/class.queries';

const PAGE_SIZE = 10;

export default function ClassesListPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<ClassStatus | 'all'>('all');
  const confirm = useConfirm();
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string | number>>(new Set());

  const { data, isLoading, isError, error, isPlaceholderData } = useClassesList({
    page,
    limit: PAGE_SIZE,
    search,
    status,
  });
  const deleteClass = useDeleteClass();

  const initials = (name: string) =>
    name.split(' ').slice(0, 2).map((p) => p[0]).join('').toUpperCase();

  const rows = data?.items ?? [];
  const total = data?.total ?? 0;
  const pageCount = data?.pageCount ?? 1;

  function toggleRow(key: string | number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }
  function toggleAll() {
    setSelected((prev) =>
      prev.size === rows.length ? new Set() : new Set(rows.map((r) => r.id)),
    );
  }

  function resetPage<T>(setter: (v: T) => void) {
    return (v: T) => {
      setter(v);
      setPage(1);
    };
  }

  const columns: Column<IClass>[] = useMemo(
    () => [
      {
        key: 'class',
        header: t('pages.admin.classes.list.columns.class'),
        cell: (row) => (
          <button
            type="button"
            onClick={() => navigate(`/admin/classes/${row.id}`)}
            className="text-left min-w-0 hover:text-primary"
          >
            <div className="text-on-surface font-medium truncate">{row.name}</div>
            <div className="text-[12px] text-on-surface-variant">{row.code}</div>
          </button>
        ),
      },

      {
        key: 'enrollment',
        header: t('pages.admin.classes.list.columns.enrollment'),
        cell: (row) => (
          <span className="text-on-surface-variant whitespace-nowrap">
            {t('pages.admin.classes.list.enrollmentLabel', { count: row.enrolledCount })}
          </span>
        ),
      },
      {
        key: 'status',
        header: t('pages.admin.classes.list.columns.status'),
        cell: (row) => <ClassStatusBadge status={row.status} />,
      },
      {
        key: 'actions',
        header: '',
        align: 'right',
        cell: (row) => (
          <div className="opacity-0 group-hover:opacity-100 inline-flex gap-xs transition-opacity">
            <button
              type="button"
              onClick={() => navigate(`/admin/classes/${row.id}/curriculum`)}
              className="p-1 rounded text-on-surface-variant hover:text-primary"
              aria-label={t('pages.admin.classes.detail.manageCurriculum')}
              title={t('pages.admin.classes.detail.manageCurriculum')}
            >
              <Icon name="library_books" size={18} />
            </button>
            <button
              type="button"
              onClick={() => navigate(`/admin/classes/${row.id}`)}
              className="p-1 rounded text-on-surface-variant hover:text-primary"
              aria-label={t('common.viewAll')}
            >
              <Icon name="open_in_new" size={18} />
            </button>
            <button
              type="button"
              onClick={async () => {
                const ok = await confirm({
                  title: t('common.confirmDelete', 'Confirm Delete'),
                  message: t('pages.admin.classesList.deleteConfirm', 'Are you sure you want to delete this class?'),
                  intent: 'danger'
                });
                if (ok) deleteClass.mutate(row.id);
              }}
              className="p-1 rounded text-on-surface-variant hover:text-error"
              aria-label={t('common.delete')}
              disabled={deleteClass.isPending}
            >
              <Icon name="delete" size={18} />
            </button>
          </div>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t, navigate, deleteClass],
  );

  return (
    <div className="flex flex-col gap-lg">
      <PageHeader
        title={t('pages.admin.classes.list.title')}
        subtitle={t('pages.admin.classes.list.subtitle')}
        actions={
          <Button
            variant="admin"
            leadingIcon={<Icon name="add" size={18} />}
            onClick={() => navigate('/admin/classes/new')}
          >
            {t('pages.admin.classes.list.createClass')}
          </Button>
        }
      />

      <FilterToolbar>
        <SearchBox
          value={search}
          onChange={resetPage(setSearch)}
          placeholder={t('pages.admin.classes.list.searchPlaceholder')}
        />

        <SelectFilter
          label={t('pages.admin.classes.list.filters.statusLabel')}
          value={status}
          onChange={(e) => resetPage(setStatus)(e.target.value as typeof status)}
          options={[
            { value: 'all', label: t('pages.admin.classes.list.filters.statusAll') },
            ...Object.values(ClassStatus)
              .filter((s) => s !== ClassStatus.FULL)
              .map((s) => ({
                value: s,
                label: t(`enums.classStatus.${s}`),
              })),
          ]}
        />
        <Button variant="ghost" leadingIcon={<Icon name="tune" size={18} />} className="md:ml-auto">
          {t('common.moreFilters')}
        </Button>
      </FilterToolbar>

      <div className="bg-surface-container-lowest border border-outline-variant/50 rounded-xl shadow-elev-1 overflow-hidden relative">
        {isPlaceholderData && (
          <div className="absolute top-0 inset-x-0 h-0.5 bg-primary/50 animate-pulse z-10" aria-hidden />
        )}
        <BulkActionBar
          count={selected.size}
          label={t('pages.admin.classes.list.bulk.selected', { count: selected.size })}
          actions={
            <>
              <Button variant="ghost" size="sm" leadingIcon={<Icon name="edit" size={16} />}>
                {t('pages.admin.classes.list.bulk.edit')}
              </Button>
              <Button variant="ghost" size="sm" leadingIcon={<Icon name="archive" size={16} />}>
                {t('pages.admin.classes.list.bulk.archive')}
              </Button>
            </>
          }
        />

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
            selectable
            selectedKeys={selected}
            onToggleRow={toggleRow}
            onToggleAll={toggleAll}
            emptyState={
              <span>
                {isLoading ? t('common.loading') : t('pages.admin.classes.list.empty')}
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
    </div>
  );
}
