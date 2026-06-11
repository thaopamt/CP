import { FormEvent, ReactNode, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Avatar, Button, Icon, PageHeader, useToast } from '@cp/ui';
import { ROLE_LABEL } from '@cp/shared';

import { useChangePassword, useMe, useUpdateMe } from '../../api/me.queries';
import { useAuthStore } from '../../stores/auth.store';
import { AvatarUpload } from '../../components/AvatarUpload';

type ProfileDraft = {
  firstName: string;
  lastName: string;
  username: string;
  avatarUrl: string;
};

const INITIAL_PROFILE: ProfileDraft = {
  firstName: '',
  lastName: '',
  username: '',
  avatarUrl: '',
};

function getApiMessage(err: unknown, fallback: string): string {
  const msg =
    (err as { response?: { data?: { message?: string | string[] } } })?.response?.data
      ?.message;
  return Array.isArray(msg) ? msg.join(', ') : msg || fallback;
}

function formatDate(value?: string): string {
  if (!value) return '—';
  return new Intl.DateTimeFormat(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

export default function AdminMePage() {
  const { i18n } = useTranslation();
  const toast = useToast();
  const storedUser = useAuthStore((s) => s.user);
  const updateStoredUser = useAuthStore((s) => s.updateUser);
  const meQuery = useMe();
  const updateMe = useUpdateMe();
  const changePassword = useChangePassword();

  const [profile, setProfile] = useState<ProfileDraft>(INITIAL_PROFILE);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const me = meQuery.data ?? storedUser;
  const isVi = i18n.language === 'vi';

  useEffect(() => {
    if (!me) return;
    setProfile({
      firstName: me.firstName ?? '',
      lastName: me.lastName ?? '',
      username: me.username ?? '',
      avatarUrl: me.avatarUrl ?? '',
    });
  }, [me]);

  const displayName = useMemo(() => {
    const full = `${profile.firstName} ${profile.lastName}`.trim();
    return full || me?.email || 'Admin';
  }, [me?.email, profile.firstName, profile.lastName]);

  async function submitProfile(event: FormEvent) {
    event.preventDefault();
    try {
      const updated = await updateMe.mutateAsync({
        firstName: profile.firstName.trim(),
        lastName: profile.lastName.trim(),
        username: profile.username.trim() || null,
        avatarUrl: profile.avatarUrl.trim() || null,
      });
      updateStoredUser(updated);
      toast.success(isVi ? 'Đã cập nhật hồ sơ.' : 'Profile updated.');
    } catch (err) {
      toast.error(
        getApiMessage(
          err,
          isVi ? 'Không cập nhật được hồ sơ.' : 'Could not update profile.',
        ),
      );
    }
  }

  async function submitPassword(event: FormEvent) {
    event.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error(isVi ? 'Mật khẩu xác nhận không khớp.' : 'Passwords do not match.');
      return;
    }

    try {
      await changePassword.mutateAsync({ currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast.success(isVi ? 'Đã đổi mật khẩu.' : 'Password changed.');
    } catch (err) {
      toast.error(
        getApiMessage(
          err,
          isVi ? 'Không đổi được mật khẩu.' : 'Could not change password.',
        ),
      );
    }
  }

  if (meQuery.isLoading && !me) {
    return (
      <div className="grid min-h-[40vh] place-items-center text-on-surface-variant">
        <Icon name="progress_activity" size={36} className="animate-spin" />
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-lg pb-xl">
      <PageHeader
        title={isVi ? 'Tài khoản của tôi' : 'Me'}
        subtitle={me?.email}
      />

      <section className="grid grid-cols-1 gap-md lg:grid-cols-[280px_1fr]">
        <aside className="rounded-xl border border-outline-variant/60 bg-surface-container-lowest p-lg">
          <div className="flex flex-col items-center gap-md">
            <AvatarUpload
              currentAvatarUrl={me?.avatarUrl}
              displayName={displayName}
              variant="admin"
            />
            <div className="text-center min-w-0 w-full">
              <h2 className="truncate font-manrope text-headline-md text-on-surface">
                {displayName}
              </h2>
              <p className="truncate text-label-sm text-on-surface-variant">
                {me?.email ?? '—'}
              </p>
            </div>
          </div>

          <div className="mt-lg grid gap-sm text-label-sm">
            <InfoRow
              icon="admin_panel_settings"
              label={isVi ? 'Vai trò' : 'Role'}
              value={me ? ROLE_LABEL[me.role] : '—'}
            />
            <InfoRow
              icon="verified_user"
              label={isVi ? 'Trạng thái' : 'Status'}
              value={me?.isActive ? (isVi ? 'Đang hoạt động' : 'Active') : '—'}
            />
            <InfoRow
              icon="event"
              label={isVi ? 'Ngày tạo' : 'Created'}
              value={formatDate(me?.createdAt)}
            />
            <InfoRow
              icon="update"
              label={isVi ? 'Cập nhật' : 'Updated'}
              value={formatDate(me?.updatedAt)}
            />
          </div>
        </aside>

        <div className="flex flex-col gap-md">
          <section className="rounded-xl border border-outline-variant/60 bg-surface-container-lowest p-lg">
            <header className="mb-md flex items-center gap-sm">
              <Icon name="badge" className="text-primary" />
              <h3 className="font-manrope text-headline-md text-on-surface">
                {isVi ? 'Hồ sơ' : 'Profile'}
              </h3>
            </header>

            <form onSubmit={submitProfile} className="grid grid-cols-1 gap-md md:grid-cols-2">
              <Field label={isVi ? 'Tên' : 'First name'}>
                <input
                  value={profile.firstName}
                  onChange={(event) =>
                    setProfile((prev) => ({ ...prev, firstName: event.target.value }))
                  }
                  className="w-full rounded-lg border border-outline-variant bg-surface-container-low px-md py-sm outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </Field>
              <Field label={isVi ? 'Họ đệm' : 'Last name'}>
                <input
                  value={profile.lastName}
                  onChange={(event) =>
                    setProfile((prev) => ({ ...prev, lastName: event.target.value }))
                  }
                  className="w-full rounded-lg border border-outline-variant bg-surface-container-low px-md py-sm outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </Field>
              <Field label="Username">
                <input
                  value={profile.username}
                  onChange={(event) =>
                    setProfile((prev) => ({ ...prev, username: event.target.value }))
                  }
                  className="w-full rounded-lg border border-outline-variant bg-surface-container-low px-md py-sm outline-none focus:ring-2 focus:ring-primary"
                />
              </Field>
              <Field label="Email">
                <input
                  value={me?.email ?? ''}
                  disabled
                  className="w-full cursor-not-allowed rounded-lg border border-outline-variant bg-surface-container px-md py-sm text-on-surface-variant outline-none"
                />
              </Field>
              <div className="flex justify-end md:col-span-2">
                <Button
                  type="submit"
                  variant="admin"
                  disabled={updateMe.isPending}
                  leadingIcon={
                    <Icon
                      name={updateMe.isPending ? 'progress_activity' : 'save'}
                      size={18}
                      className={updateMe.isPending ? 'animate-spin' : undefined}
                    />
                  }
                >
                  {updateMe.isPending
                    ? isVi
                      ? 'Đang lưu...'
                      : 'Saving...'
                    : isVi
                      ? 'Lưu thay đổi'
                      : 'Save changes'}
                </Button>
              </div>
            </form>
          </section>

          <section className="rounded-xl border border-outline-variant/60 bg-surface-container-lowest p-lg">
            <header className="mb-md flex items-center gap-sm">
              <Icon name="lock" className="text-primary" />
              <h3 className="font-manrope text-headline-md text-on-surface">
                {isVi ? 'Mật khẩu' : 'Password'}
              </h3>
            </header>

            <form onSubmit={submitPassword} className="grid max-w-2xl grid-cols-1 gap-md">
              <Field label={isVi ? 'Mật khẩu hiện tại' : 'Current password'}>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                  className="w-full rounded-lg border border-outline-variant bg-surface-container-low px-md py-sm outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </Field>
              <Field label={isVi ? 'Mật khẩu mới' : 'New password'}>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  className="w-full rounded-lg border border-outline-variant bg-surface-container-low px-md py-sm outline-none focus:ring-2 focus:ring-primary"
                  required
                  minLength={6}
                />
              </Field>
              <Field label={isVi ? 'Xác nhận mật khẩu mới' : 'Confirm new password'}>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  className="w-full rounded-lg border border-outline-variant bg-surface-container-low px-md py-sm outline-none focus:ring-2 focus:ring-primary"
                  required
                  minLength={6}
                />
              </Field>

              <div className="flex justify-end">
                <Button
                  type="submit"
                  variant="admin"
                  disabled={changePassword.isPending}
                  leadingIcon={
                    <Icon
                      name={changePassword.isPending ? 'progress_activity' : 'vpn_key'}
                      size={18}
                      className={changePassword.isPending ? 'animate-spin' : undefined}
                    />
                  }
                >
                  {changePassword.isPending
                    ? isVi
                      ? 'Đang đổi...'
                      : 'Updating...'
                    : isVi
                      ? 'Đổi mật khẩu'
                      : 'Change password'}
                </Button>
              </div>
            </form>
          </section>
        </div>
      </section>
    </div>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={className}>
      <span className="mb-xs block text-label-sm font-semibold text-on-surface-variant">
        {label}
      </span>
      {children}
    </label>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-sm rounded-lg bg-surface-container-low px-md py-sm">
      <Icon name={icon} size={18} className="text-primary" />
      <span className="min-w-0 flex-1 text-on-surface-variant">{label}</span>
      <span className="truncate font-semibold text-on-surface">{value}</span>
    </div>
  );
}
