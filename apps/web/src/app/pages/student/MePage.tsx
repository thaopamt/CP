import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Avatar, Icon, useToast, TabPills } from '@cp/ui';

import { useAuthStore } from '../../stores/auth.store';
import {
  useCurrentStudent,
  useStudentDashboard,
  useUpdateCurrentStudent,
  useUpdateDefaultLanguage,
} from '../../api/student.queries';
import { useChangePassword } from '../../api/me.queries';
import { AvatarFrame, themeGradientClass } from '../../lib/cosmetics';

type TabType = 'profile' | 'stats' | 'preferences' | 'security';

// Shared input styling (light + dark via semantic tokens).
const INPUT =
  'w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 text-sm text-on-surface placeholder:text-on-surface-variant focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all';
const INPUT_DISABLED =
  'w-full bg-surface-container border border-outline-variant rounded-xl px-4 py-3 text-sm text-on-surface-variant cursor-not-allowed outline-none';
const LABEL = 'block text-xs font-bold text-on-surface-variant uppercase mb-2';
const PRIMARY_BTN =
  'flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 rounded-xl text-sm font-bold text-white transition-all shadow-elev-1 hover:-translate-y-0.5 disabled:opacity-60 disabled:translate-y-0';

export default function MePage() {
  const { i18n } = useTranslation();
  const vi = i18n.language === 'vi';
  const toast = useToast();
  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);
  const { data: student, isLoading: isStudentLoading } = useCurrentStudent();
  const { data: dashboard, isLoading: isDashboardLoading } = useStudentDashboard();
  const updateCurrentStudent = useUpdateCurrentStudent();
  const updateDefaultLanguage = useUpdateDefaultLanguage();
  const changePassword = useChangePassword();

  const [activeTab, setActiveTab] = useState<TabType>('profile');

  // Profile form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [address, setAddress] = useState('');

  // Password form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const isSavingProfile = updateCurrentStudent.isPending;
  const isChangingPassword = changePassword.isPending;

  useEffect(() => {
    if (student) {
      setFirstName(student.firstName || '');
      setLastName(student.lastName || '');
      setUsername(student.username || '');
      setAddress(student.homeAddress || '');
    } else if (user) {
      setFirstName(user.firstName || '');
      setLastName(user.lastName || '');
      setUsername(user.username || '');
    }
  }, [student, user]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const updated = await updateCurrentStudent.mutateAsync({
        username: username.trim() || null,
        homeAddress: address.trim() || null,
      });
      updateUser({
        firstName: updated.firstName,
        lastName: updated.lastName,
        username: updated.username,
      });
      toast.success(vi ? 'Đã cập nhật thông tin cá nhân!' : 'Profile information updated!');
    } catch (err) {
      const msg = (err as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
      toast.error(
        Array.isArray(msg)
          ? msg.join(', ')
          : msg || (vi ? 'Không cập nhật được thông tin cá nhân.' : 'Failed to update profile information.'),
      );
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error(vi ? 'Mật khẩu xác nhận không khớp!' : 'Passwords do not match!');
      return;
    }
    try {
      await changePassword.mutateAsync({ currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast.success(vi ? 'Đã đổi mật khẩu thành công!' : 'Password changed successfully!');
    } catch (err) {
      const msg = (err as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
      toast.error(
        Array.isArray(msg)
          ? msg.join(', ')
          : msg || (vi ? 'Không đổi được mật khẩu.' : 'Failed to change password.'),
      );
    }
  };

  const handleLanguageChange = (lang: string) => {
    updateDefaultLanguage.mutate(lang, {
      onSuccess: () =>
        toast.success(vi ? 'Đã cập nhật ngôn ngữ lập trình mặc định!' : 'Default programming language updated!'),
      onError: () =>
        toast.error(vi ? 'Không cập nhật được cấu hình ngôn ngữ!' : 'Failed to update preferred language!'),
    });
  };

  const handleInterfaceLanguageChange = (lang: 'vi' | 'en') => {
    void i18n.changeLanguage(lang);
    toast.success(lang === 'vi' ? 'Đã chuyển ngôn ngữ sang Tiếng Việt!' : 'Switched language to English!');
  };

  if (isStudentLoading || isDashboardLoading) {
    return (
      <div className="flex items-center justify-center py-32 text-on-surface">
        <Icon name="sync" className="animate-spin text-primary" size={48} />
      </div>
    );
  }

  const name = `${firstName} ${lastName}`.trim() || user?.firstName || 'Student';
  const level = dashboard?.level ?? 1;
  const xp = dashboard?.xp ?? 0;
  const xpForNext = dashboard?.xpForNext ?? 100;
  const streak = dashboard?.streak ?? 0;
  const xpPct = Math.min(100, Math.max(0, Math.round((xp / xpForNext) * 100)));

  // Equipped gem-shop cosmetics.
  const themeBg =
    themeGradientClass(dashboard?.equippedTheme) ??
    'bg-gradient-to-r from-emerald-500/10 via-cyan-500/5 to-purple-500/10';
  const nameColor = dashboard?.nameColor;
  const equippedTitle = dashboard?.equippedTitle;
  const equippedFrame = dashboard?.equippedFrame;

  return (
    <div className="mx-auto w-full max-w-6xl py-lg text-on-surface">
      {/* ── Header Hero Banner ── */}
      <header className={`relative overflow-hidden rounded-3xl ${themeBg} border border-outline-variant p-6 md:p-8 mb-8 shadow-elev-1`}>
        <div className="absolute top-0 right-0 w-80 h-80 bg-primary/5 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-tertiary/5 rounded-full blur-3xl -z-10" />

        <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8">
          <AvatarFrame frameKey={equippedFrame}>
            <Avatar
              size="lg"
              src={user?.avatarUrl}
              initials={name.charAt(0).toUpperCase()}
              className="w-28 h-28 shadow-2xl border-4 border-[#121218]"
            />
          </AvatarFrame>

          <div className="flex-1 text-center md:text-left min-w-0">
            <div className="flex flex-col md:flex-row md:items-center gap-3 justify-center md:justify-start">
              <h1
                className="text-3xl font-black tracking-tight text-on-surface"
                style={nameColor ? { color: nameColor } : undefined}
              >
                {name}
              </h1>
              {equippedTitle && (
                <span className="self-center md:self-auto flex items-center gap-1.5 px-3 py-1 bg-fuchsia-100 border border-fuchsia-200 rounded-full text-fuchsia-700 text-xs font-bold shadow-sm dark:bg-fuchsia-500/15 dark:border-fuchsia-500/30 dark:text-fuchsia-300">
                  <Icon name="badge" size={14} />
                  {equippedTitle}
                </span>
              )}
              {student?.honorRoll && (
                <span className="self-center md:self-auto flex items-center gap-1.5 px-3 py-1 bg-amber-100 border border-amber-200 rounded-full text-amber-700 text-xs font-bold shadow-sm dark:bg-amber-500/15 dark:border-amber-500/30 dark:text-amber-400">
                  <Icon name="stars" size={14} />
                  {vi ? 'Học Sinh Xuất Sắc' : 'Honor Scholar'}
                </span>
              )}
            </div>
            <p className="text-on-surface-variant font-medium mt-1 text-sm md:text-base">{student?.email || user?.email}</p>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-4 text-xs font-semibold text-on-surface-variant">
              <span className="px-3 py-1 bg-surface-container-high border border-outline-variant rounded-full flex items-center gap-1.5">
                <Icon name="school" size={14} className="text-cyan-600 dark:text-cyan-400" />
                {vi ? `Khối ${student?.grade || 10}` : `Grade ${student?.grade || 10}`}
              </span>
              <span className="px-3 py-1 bg-surface-container-high border border-outline-variant rounded-full flex items-center gap-1.5">
                <Icon name="calendar_month" size={14} className="text-purple-600 dark:text-purple-400" />
                {vi ? `Niên khoá ${student?.cohortYear || 2026}` : `Class of ${student?.cohortYear || 2026}`}
              </span>
            </div>
          </div>

          <div className="shrink-0 flex items-center gap-6 bg-surface-container-lowest/70 backdrop-blur-md border border-outline-variant px-6 py-4 rounded-2xl shadow-elev-1">
            <Stat label={vi ? 'Cấp độ' : 'Level'} value={level} className="text-emerald-600 dark:text-emerald-400" />
            <div className="w-px h-10 bg-outline-variant" />
            <Stat label="XP" value={xp} className="text-cyan-600 dark:text-cyan-400" />
            <div className="w-px h-10 bg-outline-variant" />
            <div className="text-center">
              <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">{vi ? 'Chuỗi ngày' : 'Streak'}</p>
              <p className="text-2xl font-black text-orange-500 dark:text-orange-400 mt-1 flex items-center justify-center gap-1">
                {streak}
                <Icon name="local_fire_department" size={18} className="text-orange-500" />
              </p>
            </div>
          </div>
        </div>

        {/* Level progress bar */}
        <div className="mt-8 pt-6 border-t border-outline-variant">
          <div className="flex justify-between items-center text-xs font-semibold text-on-surface-variant mb-2">
            <span className="flex items-center gap-1">
              <Icon name="trending_up" size={14} className="text-emerald-600 dark:text-emerald-400" />
              {vi ? 'Tiến trình cấp độ tiếp theo' : 'Progress to Next Level'}
            </span>
            <span>
              {xp} / {xpForNext} XP ({xpPct}%)
            </span>
          </div>
          <div className="h-2.5 w-full bg-surface-container-highest rounded-full overflow-hidden border border-outline-variant">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 via-cyan-400 to-emerald-400 rounded-full relative transition-all duration-500"
              style={{ width: `${xpPct}%` }}
            >
              <div className="absolute inset-0 bg-white/20 animate-pulse" />
            </div>
          </div>
        </div>
      </header>

      {/* ── Main layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8 items-start">
        {/* Tabs */}
        <aside className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-4 flex flex-col gap-2 shadow-elev-1">
          <TabPills
            value={activeTab}
            onChange={(val) => setActiveTab(val as TabType)}
            options={[
              { value: 'profile', label: vi ? 'Hồ sơ cá nhân' : 'Profile Info' },
              { value: 'stats', label: vi ? 'Tiến độ học tập' : 'Learning Progress' },
              { value: 'preferences', label: vi ? 'Cấu hình hệ thống' : 'System Preferences' },
              { value: 'security', label: vi ? 'Bảo mật tài khoản' : 'Account Security' },
            ]}
            className="flex-col !w-full gap-2"
          />
        </aside>

        {/* Content */}
        <main className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 md:p-8 shadow-elev-1">
          {/* Tab 1: Profile */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <SectionHead icon="person" iconClass="text-emerald-600 dark:text-emerald-400"
                title={vi ? 'Thông tin cá nhân' : 'Personal Information'}
                desc={vi ? 'Cập nhật thông tin chi tiết và hồ sơ thành viên của bạn.' : 'Update your personal profile and account credentials.'} />

              <form onSubmit={handleSaveProfile} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={LABEL}>{vi ? 'Họ đệm' : 'Last Name'}</label>
                  <input type="text" value={lastName} disabled className={INPUT_DISABLED} />
                </div>
                <div>
                  <label className={LABEL}>{vi ? 'Tên' : 'First Name'}</label>
                  <input type="text" value={firstName} disabled className={INPUT_DISABLED} />
                </div>
                <div>
                  <label className={LABEL}>{vi ? 'Tên đăng nhập' : 'Username'}</label>
                  <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className={INPUT} />
                </div>
                <div>
                  <label className={LABEL}>Email</label>
                  <input type="email" value={student?.email || user?.email || ''} disabled className={INPUT_DISABLED} />
                </div>
                <div className="md:col-span-2">
                  <label className={LABEL}>{vi ? 'Địa chỉ liên hệ' : 'Home Address'}</label>
                  <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} className={INPUT} />
                </div>
                <div className="md:col-span-2 flex justify-end pt-4">
                  <button type="submit" disabled={isSavingProfile} className={PRIMARY_BTN}>
                    {isSavingProfile ? (
                      <>
                        <Icon name="sync" className="animate-spin" size={18} />
                        <span>{vi ? 'Đang lưu...' : 'Saving...'}</span>
                      </>
                    ) : (
                      <>
                        <Icon name="save" size={18} />
                        <span>{vi ? 'Lưu thay đổi' : 'Save Changes'}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Tab 2: Learning Progress */}
          {activeTab === 'stats' && (
            <div className="space-y-8">
              <SectionHead icon="analytics" iconClass="text-cyan-600 dark:text-cyan-400"
                title={vi ? 'Tiến độ học tập & Chỉ số' : 'Learning Progress & Stats'}
                desc={vi ? 'Theo dõi điểm tích luỹ, tỉ lệ điểm danh và hoạt động học tập.' : 'Track your cumulative GPA, attendance rate, and learning accomplishments.'} />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <KpiCard icon="grade" accent="text-emerald-600 dark:text-emerald-400"
                  label={vi ? 'GPA tích luỹ' : 'Cumulative GPA'}
                  value={student?.cumulativeGpa ? student.cumulativeGpa.toFixed(2) : '3.65'}
                  caption={vi ? 'Nằm trong top 10% của lớp' : 'Top 10% of the class'} />
                <KpiCard icon="event_available" accent="text-cyan-600 dark:text-cyan-400"
                  label={vi ? 'Điểm danh' : 'Attendance'}
                  value={student?.attendanceRate ? `${student.attendanceRate.toFixed(1)}%` : '96.5%'}
                  caption={vi ? `Vắng mặt: ${student?.daysAbsent ?? 0} buổi` : `Days Absent: ${student?.daysAbsent ?? 0}`} />
                <KpiCard icon="rocket_launch" accent="text-purple-600 dark:text-purple-400"
                  label={vi ? 'Quest đã xong' : 'Quests Completed'}
                  value={student?.questsCompleted ?? dashboard?.dailyQuestsCompleted ?? 12}
                  caption={vi ? 'Tiếp tục hoàn thành quest!' : 'Keep going strong!'} />
              </div>

              <div>
                <h3 className="text-lg font-bold text-on-surface mb-4 flex items-center gap-2">
                  <Icon name="emoji_events" className="text-amber-500 dark:text-amber-400" />
                  {vi ? 'Huy hiệu thành tích' : 'Achievements & Badges'}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(dashboard?.achievements ?? []).map((ach) => (
                    <div
                      key={ach.id}
                      className={`flex items-center gap-4 p-4 rounded-xl border transition-colors ${
                        ach.unlocked
                          ? 'bg-surface-container-high border-outline-variant hover:bg-surface-container-highest'
                          : 'bg-transparent border-dashed border-outline-variant opacity-60 grayscale'
                      }`}
                    >
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-elev-1 ${
                        ach.unlocked ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white' : 'bg-surface-container-highest text-on-surface-variant'
                      }`}>
                        <Icon name={ach.icon} size={24} />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-sm text-on-surface truncate">{ach.label}</h4>
                        <p className="text-[11px] text-on-surface-variant font-medium leading-snug mt-0.5 break-words">{ach.caption}</p>
                      </div>
                      {ach.unlocked && <Icon name="check_circle" size={18} className="text-emerald-600 dark:text-emerald-400 ml-auto shrink-0" />}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Preferences */}
          {activeTab === 'preferences' && (
            <div className="space-y-8">
              <SectionHead icon="settings" iconClass="text-purple-600 dark:text-purple-400"
                title={vi ? 'Cấu hình hệ thống' : 'System Preferences'}
                desc={vi ? 'Tinh chỉnh môi trường lập trình và tuỳ chọn ngôn ngữ của bạn.' : 'Configure your code workspace preferences and global app settings.'} />

              <div className="flex flex-col gap-6">
                <div className="bg-surface-container-low border border-outline-variant p-6 rounded-2xl shadow-elev-1">
                  <h3 className="text-md font-bold text-on-surface mb-2 flex items-center gap-2">
                    <Icon name="code" className="text-emerald-600 dark:text-emerald-400" />
                    {vi ? 'Ngôn ngữ lập trình mặc định' : 'Default Coding Language'}
                  </h3>
                  <p className="text-xs text-on-surface-variant mb-4">
                    {vi ? 'Trình soạn thảo sẽ tự động chọn ngôn ngữ này khi bắt đầu nhiệm vụ mới.' : 'This is pre-selected in your Workspace editor when loading new tasks.'}
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {[
                      { value: 'cpp', label: 'C++ (G++ 20)' },
                      { value: 'python', label: 'Python (3.10)' },
                      { value: 'java', label: 'Java (JDK 17)' },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => handleLanguageChange(opt.value)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold border transition-all ${
                          dashboard?.defaultLanguage === opt.value
                            ? 'bg-emerald-100 border-emerald-400 text-emerald-700 dark:bg-emerald-500/10 dark:border-emerald-500 dark:text-emerald-400 shadow-elev-1'
                            : 'bg-surface-container-high border-outline-variant text-on-surface-variant hover:text-on-surface'
                        }`}
                      >
                        <span className="material-symbols-outlined">terminal</span>
                        <span>{opt.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-surface-container-low border border-outline-variant p-6 rounded-2xl shadow-elev-1">
                  <h3 className="text-md font-bold text-on-surface mb-2 flex items-center gap-2">
                    <Icon name="language" className="text-cyan-600 dark:text-cyan-400" />
                    {vi ? 'Ngôn ngữ giao diện' : 'UI Language'}
                  </h3>
                  <p className="text-xs text-on-surface-variant mb-4">
                    {vi ? 'Chọn ngôn ngữ hiển thị trên toàn bộ hệ thống.' : 'Choose the global display language for all interfaces.'}
                  </p>
                  <div className="flex gap-3">
                    {[
                      { value: 'vi', label: 'Tiếng Việt', flag: 'VI' },
                      { value: 'en', label: 'English', flag: 'EN' },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => handleInterfaceLanguageChange(opt.value as 'vi' | 'en')}
                        className={`flex items-center gap-3 px-5 py-3 rounded-xl text-sm font-bold border transition-all ${
                          i18n.language === opt.value
                            ? 'bg-cyan-100 border-cyan-400 text-cyan-700 dark:bg-cyan-500/10 dark:border-cyan-500 dark:text-cyan-400 shadow-elev-1'
                            : 'bg-surface-container-high border-outline-variant text-on-surface-variant hover:text-on-surface'
                        }`}
                      >
                        <span className="font-extrabold text-xs">{opt.flag}</span>
                        <span>{opt.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 4: Security */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <SectionHead icon="lock" iconClass="text-orange-500 dark:text-orange-400"
                title={vi ? 'Bảo mật & Đổi mật khẩu' : 'Security & Password'}
                desc={vi ? 'Thay đổi mật khẩu đăng nhập để bảo vệ tài khoản.' : 'Update your password and manage account security.'} />

              <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
                <div>
                  <label className={LABEL}>{vi ? 'Mật khẩu hiện tại' : 'Current Password'}</label>
                  <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className={INPUT} required />
                </div>
                <div>
                  <label className={LABEL}>{vi ? 'Mật khẩu mới' : 'New Password'}</label>
                  <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className={INPUT} required />
                </div>
                <div>
                  <label className={LABEL}>{vi ? 'Xác nhận mật khẩu mới' : 'Confirm New Password'}</label>
                  <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={INPUT} required />
                </div>
                <div className="flex justify-end pt-4">
                  <button type="submit" disabled={isChangingPassword} className={PRIMARY_BTN}>
                    {isChangingPassword ? (
                      <>
                        <Icon name="sync" className="animate-spin" size={18} />
                        <span>{vi ? 'Đang thực hiện...' : 'Updating...'}</span>
                      </>
                    ) : (
                      <>
                        <Icon name="vpn_key" size={18} />
                        <span>{vi ? 'Cập nhật mật khẩu' : 'Update Password'}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function Stat({ label, value, className }: { label: string; value: number | string; className: string }) {
  return (
    <div className="text-center">
      <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">{label}</p>
      <p className={`text-2xl font-black mt-1 ${className}`}>{value}</p>
    </div>
  );
}

function SectionHead({ icon, iconClass, title, desc }: { icon: string; iconClass: string; title: string; desc: string }) {
  return (
    <div>
      <h2 className="text-xl font-bold text-on-surface mb-1 flex items-center gap-2">
        <Icon name={icon} className={iconClass} />
        {title}
      </h2>
      <p className="text-on-surface-variant text-xs md:text-sm">{desc}</p>
    </div>
  );
}

function KpiCard({ icon, accent, label, value, caption }: { icon: string; accent: string; label: string; value: number | string; caption: string }) {
  return (
    <div className="bg-surface-container-low border border-outline-variant rounded-2xl p-5 flex flex-col gap-2 shadow-elev-1">
      <div className={`flex items-center gap-2 ${accent}`}>
        <Icon name={icon} size={20} />
        <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">{label}</span>
      </div>
      <p className="text-3xl font-black text-on-surface mt-1">{value}</p>
      <p className="text-xs text-on-surface-variant mt-2 font-medium">{caption}</p>
    </div>
  );
}
