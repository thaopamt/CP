import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Avatar,
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
  useConfirm,
  useToast,
} from '@cp/ui';
import { IUser, UserRole, fullName } from '@cp/shared';

import {
  useCreateTeacher,
  useDeleteTeacher,
  useResetTeacherPassword,
  useUpdateTeacher,
  useUsersList,
} from '../../api/users.queries';

const PAGE_SIZE = 10;

type StatusFilter = 'all' | 'active' | 'inactive';

const initials = (u: Pick<IUser, 'firstName' | 'lastName'>) =>
  `${u.firstName[0] ?? ''}${u.lastName[0] ?? ''}`.toUpperCase();

function apiError(err: unknown): string {
  const msg = (err as { response?: { data?: { message?: string | string[] } } })?.response?.data
    ?.message;
  return Array.isArray(msg) ? msg.join(', ') : (msg ?? (err as Error).message);
}

export default function AdminUsersPage() {
  const { t } = useTranslation();
  const confirm = useConfirm();
  const toast = useToast();

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [page, setPage] = useState(1);

  const [editing, setEditing] = useState<IUser | null | 'new'>(null);
  const [resetting, setResetting] = useState<IUser | null>(null);

  const { data, isLoading } = useUsersList({
    page,
    limit: PAGE_SIZE,
    role: UserRole.TEACHER,
    status,
    search,
  });
  const deleteTeacher = useDeleteTeacher();

  const rows = data?.items ?? [];
  const total = data?.total ?? 0;
  const pageCount = data?.pageCount ?? 1;

  function onSearch(v: string) {
    setSearch(v);
    setPage(1);
  }
  function onStatus(v: StatusFilter) {
    setStatus(v);
    setPage(1);
  }

  async function onDelete(u: IUser) {
    const ok = await confirm({
      title: t('common.confirmDelete', 'Confirm delete'),
      message: t('pages.admin.users.deleteConfirm'),
      intent: 'danger',
    });
    if (!ok) return;
    try {
      await deleteTeacher.mutateAsync(u.id);
      toast.success(t('pages.admin.users.toast.deleted'));
    } catch (err) {
      toast.error(apiError(err));
    }
  }

  const columns: Column<IUser>[] = useMemo(
    () => [
      {
        key: 'teacher',
        header: t('pages.admin.users.columns.teacher'),
        cell: (u) => (
          <button
            type="button"
            onClick={() => setEditing(u)}
            className="text-left flex items-center gap-sm hover:text-primary"
          >
            <Avatar size="sm" initials={initials(u)} src={u.avatarUrl ?? undefined} />
            <div className="min-w-0">
              <div className="text-on-surface font-medium truncate">{fullName(u)}</div>
              {u.username && (
                <div className="text-[12px] text-on-surface-variant truncate">{u.username}</div>
              )}
            </div>
          </button>
        ),
      },
      {
        key: 'email',
        header: t('pages.admin.users.columns.email'),
        cell: (u) => <span className="text-on-surface-variant truncate">{u.email}</span>,
      },
      {
        key: 'status',
        header: t('pages.admin.users.columns.status'),
        cell: (u) => (
          <StatusBadge tone={u.isActive ? 'success' : 'neutral'}>
            {u.isActive ? t('pages.admin.users.active') : t('pages.admin.users.inactive')}
          </StatusBadge>
        ),
      },
      {
        key: 'created',
        header: t('pages.admin.users.columns.created'),
        cell: (u) => {
          const d = new Date(u.createdAt);
          const day = String(d.getDate()).padStart(2, '0');
          const month = String(d.getMonth() + 1).padStart(2, '0');
          return (
            <span className="text-on-surface-variant whitespace-nowrap">
              {`${day}/${month}/${d.getFullYear()}`}
            </span>
          );
        },
      },
      {
        key: 'actions',
        header: '',
        align: 'right',
        cell: (u) => (
          <div className="opacity-0 group-hover:opacity-100 inline-flex gap-xs transition-opacity">
            <button
              type="button"
              onClick={() => setEditing(u)}
              className="p-1 rounded text-on-surface-variant hover:text-primary"
              aria-label={t('pages.admin.users.actions.edit')}
            >
              <Icon name="edit" size={18} />
            </button>
            <button
              type="button"
              onClick={() => setResetting(u)}
              className="p-1 rounded text-on-surface-variant hover:text-primary"
              aria-label={t('pages.admin.users.actions.resetPassword')}
            >
              <Icon name="key" size={18} />
            </button>
            <button
              type="button"
              onClick={() => onDelete(u)}
              className="p-1 rounded text-on-surface-variant hover:text-error"
              aria-label={t('pages.admin.users.actions.delete')}
            >
              <Icon name="delete" size={18} />
            </button>
          </div>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t],
  );

  const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, total);

  return (
    <div className="flex flex-col gap-lg">
      <PageHeader
        title={t('pages.admin.users.title')}
        subtitle={t('pages.admin.users.subtitle')}
        actions={
          <Button leadingIcon={<Icon name="add" />} onClick={() => setEditing('new')}>
            {t('pages.admin.users.addTeacher')}
          </Button>
        }
      />

      <FilterToolbar>
        <SearchBox
          value={search}
          onChange={onSearch}
          placeholder={t('pages.admin.users.searchPlaceholder')}
        />
        <SelectFilter
          label={t('pages.admin.users.statusFilter')}
          value={status}
          onChange={(e) => onStatus(e.target.value as StatusFilter)}
          options={[
            { value: 'all', label: t('pages.admin.users.statusOptions.all') },
            { value: 'active', label: t('pages.admin.users.statusOptions.active') },
            { value: 'inactive', label: t('pages.admin.users.statusOptions.inactive') },
          ]}
        />
      </FilterToolbar>

      <DataTable
        rows={rows}
        columns={columns}
        rowKey={(u) => u.id}
        emptyState={
          <span>
            {isLoading ? t('common.loading') : t('pages.admin.users.emptyFiltered')}
          </span>
        }
      />

      <div className="flex items-center justify-between">
        <span className="text-label-sm text-on-surface-variant">
          {t('pages.admin.users.showing', { from, to, total })}
        </span>
        <Pagination page={page} pageCount={pageCount} onChange={setPage} />
      </div>

      {editing !== null && (
        <TeacherDialog
          teacher={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={(msg) => {
            setEditing(null);
            toast.success(msg);
          }}
          onError={(msg) => toast.error(msg)}
        />
      )}

      {resetting && (
        <ResetPasswordDialog
          teacher={resetting}
          onClose={() => setResetting(null)}
          onDone={() => {
            setResetting(null);
            toast.success(t('pages.admin.users.toast.passwordReset'));
          }}
          onError={(msg) => toast.error(msg)}
        />
      )}
    </div>
  );
}

const inputCls =
  'bg-surface-container-low border border-outline-variant rounded-lg px-md py-sm focus:ring-2 focus:ring-primary outline-none';

function TeacherDialog({
  teacher,
  onClose,
  onSaved,
  onError,
}: {
  teacher: IUser | null;
  onClose: () => void;
  onSaved: (msg: string) => void;
  onError: (msg: string) => void;
}) {
  const { t } = useTranslation();
  const isEdit = !!teacher;
  const create = useCreateTeacher();
  const update = useUpdateTeacher(teacher?.id ?? '');

  const [firstName, setFirstName] = useState(teacher?.firstName ?? '');
  const [lastName, setLastName] = useState(teacher?.lastName ?? '');
  const [email, setEmail] = useState(teacher?.email ?? '');
  const [username, setUsername] = useState(teacher?.username ?? '');
  const [password, setPassword] = useState('');
  const [isActive, setIsActive] = useState(teacher?.isActive ?? true);

  const pending = create.isPending || update.isPending;

  async function submit() {
    try {
      if (isEdit) {
        await update.mutateAsync({
          firstName,
          lastName,
          email,
          username: username.trim() || null,
          isActive,
        });
        onSaved(t('pages.admin.users.toast.updated'));
      } else {
        await create.mutateAsync({
          firstName,
          lastName,
          email,
          password,
          username: username.trim() || null,
        });
        onSaved(t('pages.admin.users.toast.created'));
      }
    } catch (err) {
      onError(apiError(err));
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
            {isEdit
              ? t('pages.admin.users.createDialog.editTitle')
              : t('pages.admin.users.createDialog.title')}
          </h2>
          <button type="button" onClick={onClose} className="p-1 rounded hover:bg-surface-container-high">
            <Icon name="close" />
          </button>
        </header>

        <div className="grid grid-cols-2 gap-md">
          <FormField label={t('pages.admin.users.createDialog.firstName')} required>
            <input className={inputCls} value={firstName} onChange={(e) => setFirstName(e.target.value)} />
          </FormField>
          <FormField label={t('pages.admin.users.createDialog.lastName')} required>
            <input className={inputCls} value={lastName} onChange={(e) => setLastName(e.target.value)} />
          </FormField>
          <FormField label={t('pages.admin.users.createDialog.email')} required className="col-span-2">
            <input
              type="email"
              className={inputCls}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </FormField>
          <FormField label={t('pages.admin.users.createDialog.username')} className="col-span-2">
            <input className={inputCls} value={username ?? ''} onChange={(e) => setUsername(e.target.value)} />
          </FormField>
          {!isEdit && (
            <FormField
              label={t('pages.admin.users.createDialog.password')}
              hint={t('pages.admin.users.createDialog.passwordHint')}
              required
              className="col-span-2"
            >
              <input
                type="password"
                className={inputCls}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </FormField>
          )}
          {isEdit && (
            <label className="col-span-2 flex items-center gap-sm cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 accent-primary"
              />
              <span className="text-label-sm text-on-surface">
                {t('pages.admin.users.createDialog.isActive')}
              </span>
            </label>
          )}
        </div>

        <footer className="flex justify-end gap-sm">
          <Button variant="outline" onClick={onClose}>
            {t('common.cancel', 'Cancel')}
          </Button>
          <Button onClick={submit} disabled={pending}>
            {isEdit
              ? t('pages.admin.users.createDialog.save')
              : t('pages.admin.users.createDialog.create')}
          </Button>
        </footer>
      </div>
    </div>
  );
}

function ResetPasswordDialog({
  teacher,
  onClose,
  onDone,
  onError,
}: {
  teacher: IUser;
  onClose: () => void;
  onDone: () => void;
  onError: (msg: string) => void;
}) {
  const { t } = useTranslation();
  const reset = useResetTeacherPassword(teacher.id);
  const [password, setPassword] = useState('');

  async function submit() {
    try {
      await reset.mutateAsync(password);
      onDone();
    } catch (err) {
      onError(apiError(err));
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-on-surface/40 backdrop-blur-sm p-md"
      onClick={onClose}
    >
      <div
        className="bg-surface-container-lowest rounded-2xl border border-outline-variant/50 shadow-elev-3 w-full max-w-md p-lg flex flex-col gap-md"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between">
          <h2 className="font-manrope text-headline-md text-on-surface">
            {t('pages.admin.users.resetDialog.title')}
          </h2>
          <button type="button" onClick={onClose} className="p-1 rounded hover:bg-surface-container-high">
            <Icon name="close" />
          </button>
        </header>
        <p className="text-body-sm text-on-surface-variant">{fullName(teacher)} · {teacher.email}</p>
        <FormField
          label={t('pages.admin.users.resetDialog.newPassword')}
          hint={t('pages.admin.users.createDialog.passwordHint')}
          required
        >
          <input
            type="password"
            className={inputCls}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </FormField>
        <footer className="flex justify-end gap-sm">
          <Button variant="outline" onClick={onClose}>
            {t('common.cancel', 'Cancel')}
          </Button>
          <Button onClick={submit} disabled={reset.isPending || password.length < 6}>
            {t('pages.admin.users.resetDialog.submit')}
          </Button>
        </footer>
      </div>
    </div>
  );
}
