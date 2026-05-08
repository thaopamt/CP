import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Avatar,
  BulkActionBar,
  Button,
  Column,
  DataTable,
  EnrollmentStatusBadge,
  FilterToolbar,
  Icon,
  PageHeader,
  Pagination,
  SearchBox,
  SelectFilter,
} from '@cp/ui';
import { ENROLLMENT_STATUS_LABEL, EnrollmentStatus, IStudentProfile } from '@cp/shared';

import { useDeleteStudent, useStudentsList } from '../../../api/student.queries';

const PAGE_SIZE = 10;

const fullName = (s: Pick<IStudentProfile, 'firstName' | 'lastName'>) =>
  `${s.firstName} ${s.lastName}`.trim();
const initials = (s: Pick<IStudentProfile, 'firstName' | 'lastName'>) =>
  `${s.firstName[0] ?? ''}${s.lastName[0] ?? ''}`.toUpperCase();

export default function StudentsListPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const locale = i18n.language === 'vi' ? 'vi-VN' : 'en-US';

  const [search, setSearch] = useState('');
  const [grade, setGrade] = useState<number | 'all'>('all');
  const [status, setStatus] = useState<EnrollmentStatus | 'all'>('all');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string | number>>(new Set());

  const { data, isLoading, isError, error, isPlaceholderData } = useStudentsList({
    page,
    limit: PAGE_SIZE,
    search,
    grade,
    status,
  });
  const deleteStudent = useDeleteStudent();

  const rows = data?.items ?? [];
  const total = data?.total ?? 0;
  const pageCount = data?.pageCount ?? 1;

  function resetPage<T>(setter: (v: T) => void) {
    return (v: T) => {
      setter(v);
      setPage(1);
    };
  }

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

  const columns: Column<IStudentProfile>[] = useMemo(
    () => [
      {
        key: 'name',
        header: t('pages.admin.students.columns.student'),
        cell: (s) => (
          <button
            type="button"
            onClick={() => navigate(`/admin/students/${s.id}`)}
            className="text-left flex items-center gap-sm hover:text-primary"
          >
            <Avatar size="sm" initials={initials(s)} src={s.avatarUrl ?? undefined} />
            <div className="min-w-0">
              <div className="text-on-surface font-medium truncate">{fullName(s)}</div>
              <div className="text-[12px] text-on-surface-variant truncate">{s.email}</div>
            </div>
          </button>
        ),
      },
      {
        key: 'studentId',
        header: t('pages.admin.students.columns.studentId'),
        cell: (s) => <span className="text-on-surface-variant font-mono text-[12px]">{s.studentId}</span>,
      },
      {
        key: 'grade',
        header: t('pages.admin.students.columns.grade'),
        cell: (s) => <span className="text-on-surface-variant">{s.grade}</span>,
      },
      {
        key: 'enrolledAt',
        header: t('pages.admin.students.columns.enrolled'),
        cell: (s) => (
          <span className="text-on-surface-variant whitespace-nowrap">
            {new Date(s.enrolledAt).toLocaleDateString(locale)}
          </span>
        ),
      },
      {
        key: 'status',
        header: t('pages.admin.students.columns.status'),
        cell: (s) => <EnrollmentStatusBadge status={s.status} />,
      },
      {
        key: 'actions',
        header: '',
        align: 'right',
        cell: (s) => (
          <div className="opacity-0 group-hover:opacity-100 inline-flex gap-xs transition-opacity">
            <button
              type="button"
              onClick={() => navigate(`/admin/students/${s.id}`)}
              className="p-1 rounded text-on-surface-variant hover:text-primary"
              aria-label={t('common.viewAll')}
            >
              <Icon name="open_in_new" size={18} />
            </button>
            <button
              type="button"
              onClick={() => deleteStudent.mutate(s.id)}
              className="p-1 rounded text-on-surface-variant hover:text-error"
              aria-label={t('common.delete')}
              disabled={deleteStudent.isPending}
            >
              <Icon name="delete" size={18} />
            </button>
          </div>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t, locale, navigate, deleteStudent],
  );

  return (
    <div className="flex flex-col gap-lg">
      <PageHeader
        title={t('pages.admin.students.title')}
        subtitle={t('pages.admin.students.subtitle')}
        actions={
          <>
            <Button variant="ghost" leadingIcon={<Icon name="ios_share" size={18} />}>
              {t('common.export')}
            </Button>
            <Button
              variant="admin"
              leadingIcon={<Icon name="add" size={18} />}
              onClick={() => navigate('/admin/students/new')}
            >
              {t('pages.admin.students.addStudent')}
            </Button>
          </>
        }
      />

      <FilterToolbar>
        <SearchBox
          value={search}
          onChange={resetPage(setSearch)}
          placeholder={t('pages.admin.students.searchPlaceholder')}
        />
        <SelectFilter
          label={t('pages.admin.students.statusFilter')}
          value={status}
          onChange={(e) => resetPage(setStatus)(e.target.value as typeof status)}
          options={[
            { value: 'all', label: t('pages.admin.students.statusOptions.all') },
            { value: EnrollmentStatus.ACTIVE, label: ENROLLMENT_STATUS_LABEL[EnrollmentStatus.ACTIVE] },
            { value: EnrollmentStatus.PENDING, label: ENROLLMENT_STATUS_LABEL[EnrollmentStatus.PENDING] },
            { value: EnrollmentStatus.INACTIVE, label: ENROLLMENT_STATUS_LABEL[EnrollmentStatus.INACTIVE] },
            { value: EnrollmentStatus.GRADUATED, label: ENROLLMENT_STATUS_LABEL[EnrollmentStatus.GRADUATED] },
          ]}
        />
        <SelectFilter
          label={t('pages.admin.students.gradeFilter')}
          value={String(grade)}
          onChange={(e) => {
            const v = e.target.value;
            resetPage(setGrade)(v === 'all' ? 'all' : Number(v));
          }}
          options={[
            { value: 'all', label: t('pages.admin.students.gradeOptions.all') },
            { value: '9', label: t('pages.admin.students.gradeOptions.g9') },
            { value: '10', label: t('pages.admin.students.gradeOptions.g10') },
            { value: '11', label: t('pages.admin.students.gradeOptions.g11') },
            { value: '12', label: t('pages.admin.students.gradeOptions.g12') },
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
          label={t('pages.admin.students.bulk.selected', { count: selected.size })}
          actions={
            <>
              <Button variant="ghost" size="sm" leadingIcon={<Icon name="mail" size={16} />}>
                {t('pages.admin.students.bulk.message')}
              </Button>
              <Button variant="ghost" size="sm" leadingIcon={<Icon name="delete" size={16} />}>
                {t('pages.admin.students.bulk.remove')}
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
            rowKey={(s) => s.id}
            selectable
            selectedKeys={selected}
            onToggleRow={toggleRow}
            onToggleAll={toggleAll}
            emptyState={
              <span>
                {isLoading ? t('common.loading') : t('pages.admin.students.emptyFiltered')}
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
