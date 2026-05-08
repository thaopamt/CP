import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Avatar,
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
import { EnrollmentStatus, fullName, IStudentRow } from '@cp/shared';

const PAGE_SIZE = 8;

// Vietnamese first/last name pools used when locale is VI; English-friendly
// pool used otherwise. Mock data is regenerated whenever the locale flips.
const NAME_POOLS = {
  en: {
    first: ['Sarah', 'Michael', 'Aiko', 'Liam', 'Priya', 'Diego', 'Mei', 'Noah', 'Yara', 'Ezra'],
    last: ['Jenkins', 'Rossi', 'Tanaka', 'Carter', 'Singh', 'Vega', 'Lin', 'Park', 'Haddad', 'Cohen'],
  },
  vi: {
    first: ['Hà', 'Quân', 'Bảo Anh', 'Liêm', 'Linh', 'Diệu', 'Mai', 'Nam', 'Yến', 'Đức'],
    last: ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Đỗ', 'Hoàng', 'Vũ', 'Bùi', 'Đặng', 'Phan'],
  },
} as const;

function buildMockStudents(locale: 'en' | 'vi'): IStudentRow[] {
  const pool = NAME_POOLS[locale];
  return Array.from({ length: 26 }).map((_, i) => {
    const first = pool.first[i % pool.first.length];
    const last = pool.last[i % pool.last.length];
    const status = ([
      EnrollmentStatus.ACTIVE,
      EnrollmentStatus.ACTIVE,
      EnrollmentStatus.PENDING,
      EnrollmentStatus.ACTIVE,
      EnrollmentStatus.INACTIVE,
    ] as const)[i % 5];
    return {
      id: `stu-${i + 1}`,
      firstName: first,
      lastName: last,
      email: `${ascii(first)}.${ascii(last)}@cp.local`,
      studentId: `S-${(2024000 + i).toString()}`,
      grade: 9 + (i % 4),
      enrolledAt: new Date(2024, i % 12, (i % 27) + 1).toISOString(),
      status,
    };
  });
}

function ascii(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .replace(/\s+/g, '');
}

export default function AdminStudentsPage() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language === 'en' ? 'en' : 'vi';

  const mock = useMemo(() => buildMockStudents(locale), [locale]);

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'all' | EnrollmentStatus>('all');
  const [grade, setGrade] = useState<'all' | string>('all');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string | number>>(new Set());

  const filtered = useMemo(() => {
    return mock.filter((s) => {
      if (status !== 'all' && s.status !== status) return false;
      if (grade !== 'all' && String(s.grade) !== grade) return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        return (
          fullName(s).toLowerCase().includes(q) ||
          s.email.toLowerCase().includes(q) ||
          s.studentId.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [mock, search, status, grade]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const dateFmt = (iso: string) =>
    new Date(iso).toLocaleDateString(locale === 'vi' ? 'vi-VN' : 'en-US');

  const columns: Column<IStudentRow>[] = [
    {
      key: 'name',
      header: t('pages.admin.students.columns.student'),
      cell: (s) => (
        <div className="flex items-center gap-sm">
          <Avatar
            initials={`${s.firstName[0]}${s.lastName[0]}`.toUpperCase()}
            src={s.avatarUrl ?? undefined}
            size="sm"
          />
          <div className="min-w-0">
            <div className="text-on-surface font-medium truncate">{fullName(s)}</div>
            <div className="text-[12px] text-on-surface-variant truncate">{s.email}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'studentId',
      header: t('pages.admin.students.columns.studentId'),
      cell: (s) => <span className="text-on-surface-variant">{s.studentId}</span>,
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
        <span className="text-on-surface-variant whitespace-nowrap">{dateFmt(s.enrolledAt)}</span>
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
      cell: () => (
        <div className="opacity-0 group-hover:opacity-100 inline-flex gap-xs transition-opacity">
          <button className="p-1 rounded text-on-surface-variant hover:text-primary" aria-label={t('common.edit')}>
            <Icon name="edit" size={18} />
          </button>
          <button className="p-1 rounded text-on-surface-variant hover:text-error" aria-label={t('common.delete')}>
            <Icon name="delete" size={18} />
          </button>
        </div>
      ),
    },
  ];

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
      prev.size === pageRows.length ? new Set() : new Set(pageRows.map((r) => r.id)),
    );
  }

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
            <Button variant="admin" leadingIcon={<Icon name="add" size={18} />}>
              {t('pages.admin.students.addStudent')}
            </Button>
          </>
        }
      />

      <FilterToolbar>
        <SearchBox
          value={search}
          onChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          placeholder={t('pages.admin.students.searchPlaceholder')}
        />
        <SelectFilter
          label={t('pages.admin.students.statusFilter')}
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as typeof status);
            setPage(1);
          }}
          options={[
            { value: 'all', label: t('pages.admin.students.statusOptions.all') },
            { value: EnrollmentStatus.ACTIVE, label: t('enums.enrollmentStatus.ACTIVE') },
            { value: EnrollmentStatus.PENDING, label: t('enums.enrollmentStatus.PENDING') },
            { value: EnrollmentStatus.INACTIVE, label: t('enums.enrollmentStatus.INACTIVE') },
          ]}
        />
        <SelectFilter
          label={t('pages.admin.students.gradeFilter')}
          value={grade}
          onChange={(e) => {
            setGrade(e.target.value);
            setPage(1);
          }}
          options={[
            { value: 'all', label: t('pages.admin.students.gradeOptions.all') },
            { value: '9', label: t('pages.admin.students.gradeOptions.g9') },
            { value: '10', label: t('pages.admin.students.gradeOptions.g10') },
            { value: '11', label: t('pages.admin.students.gradeOptions.g11') },
            { value: '12', label: t('pages.admin.students.gradeOptions.g12') },
          ]}
        />
        <Button
          variant="ghost"
          leadingIcon={<Icon name="tune" size={18} />}
          className="md:ml-auto"
        >
          {t('common.moreFilters')}
        </Button>
      </FilterToolbar>

      <div className="bg-surface-container-lowest border border-outline-variant/50 rounded-xl shadow-elev-1 overflow-hidden">
        {selected.size > 0 && (
          <div className="flex items-center justify-between px-md py-sm bg-primary-container/20 text-on-primary-container">
            <span className="text-label-sm">
              {t('pages.admin.students.bulk.selected', { count: selected.size })}
            </span>
            <div className="flex gap-sm">
              <Button variant="ghost" size="sm" leadingIcon={<Icon name="mail" size={16} />}>
                {t('pages.admin.students.bulk.message')}
              </Button>
              <Button variant="ghost" size="sm" leadingIcon={<Icon name="delete" size={16} />}>
                {t('pages.admin.students.bulk.remove')}
              </Button>
            </div>
          </div>
        )}

        <DataTable
          rows={pageRows}
          columns={columns}
          rowKey={(s) => s.id}
          selectable
          selectedKeys={selected}
          onToggleRow={toggleRow}
          onToggleAll={toggleAll}
          emptyState={<span>{t('pages.admin.students.emptyFiltered')}</span>}
        />

        <footer className="flex flex-col sm:flex-row items-center justify-between gap-sm p-md border-t border-outline-variant/30">
          <div className="text-label-sm text-on-surface-variant">
            {t('pages.admin.students.showing', {
              from: pageRows.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1,
              to: (page - 1) * PAGE_SIZE + pageRows.length,
              total: filtered.length,
            })}
          </div>
          <Pagination page={page} pageCount={pageCount} onChange={setPage} />
        </footer>
      </div>
    </div>
  );
}
