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
import { AvatarUpload } from '../../components/AvatarUpload';

type TabType = 'profile' | 'stats' | 'preferences' | 'security';

export default function MePage() {
  const { i18n } = useTranslation();
  const toast = useToast();
  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);
  const { data: student, isLoading: isStudentLoading } = useCurrentStudent();
  const { data: dashboard, isLoading: isDashboardLoading } = useStudentDashboard();
  const updateCurrentStudent = useUpdateCurrentStudent();
  const updateDefaultLanguage = useUpdateDefaultLanguage();
  const changePassword = useChangePassword();

  const [activeTab, setActiveTab] = useState<TabType>('profile');

  // Profile Form State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');

  const [address, setAddress] = useState('');

  // Password Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const isSavingProfile = updateCurrentStudent.isPending;
  const isChangingPassword = changePassword.isPending;

  // Sync state with fetched student profile data
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
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        username: username.trim() || null,

        homeAddress: address.trim() || null,
      });
      updateUser({
        firstName: updated.firstName,
        lastName: updated.lastName,
        username: updated.username,
        avatarUrl: updated.avatarUrl,
      });
      toast.success(
        i18n.language === 'vi'
          ? 'Đã cập nhật thông tin cá nhân!'
          : 'Profile information updated!'
      );
    } catch (err) {
      const msg =
        (err as { response?: { data?: { message?: string | string[] } } })?.response?.data
          ?.message;
      toast.error(
        Array.isArray(msg)
          ? msg.join(', ')
          : msg ||
              (i18n.language === 'vi'
                ? 'Không cập nhật được thông tin cá nhân.'
                : 'Failed to update profile information.')
      );
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error(
        i18n.language === 'vi'
          ? 'Mật khẩu xác nhận không khớp!'
          : 'Passwords do not match!'
      );
      return;
    }
    try {
      await changePassword.mutateAsync({ currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast.success(
        i18n.language === 'vi'
          ? 'Đã đổi mật khẩu thành công!'
          : 'Password changed successfully!'
      );
    } catch (err) {
      const msg =
        (err as { response?: { data?: { message?: string | string[] } } })?.response?.data
          ?.message;
      toast.error(
        Array.isArray(msg)
          ? msg.join(', ')
          : msg ||
              (i18n.language === 'vi'
                ? 'Không đổi được mật khẩu.'
                : 'Failed to change password.')
      );
    }
  };

  const handleLanguageChange = (lang: string) => {
    updateDefaultLanguage.mutate(lang, {
      onSuccess: () => {
        toast.success(
          i18n.language === 'vi'
            ? 'Đã cập nhật ngôn ngữ lập trình mặc định!'
            : 'Default programming language updated!'
        );
      },
      onError: () => {
        toast.error(
          i18n.language === 'vi'
            ? 'Không cập nhật được cấu hình ngôn ngữ!'
            : 'Failed to update preferred language!'
        );
      },
    });
  };

  const handleInterfaceLanguageChange = (lang: 'vi' | 'en') => {
    void i18n.changeLanguage(lang);
    toast.success(
      lang === 'vi' ? 'Đã chuyển ngôn ngữ sang Tiếng Việt!' : 'Switched language to English!'
    );
  };

  if (isStudentLoading || isDashboardLoading) {
    return (
      <div className="min-h-screen text-gray-200 p-4 md:p-8 font-sans flex items-center justify-center bg-[#0f0f13]">
        <Icon name="sync" className="animate-spin text-emerald-400" size={48} />
      </div>
    );
  }

  const name = `${firstName} ${lastName}`.trim() || user?.firstName || 'Student';
  const level = dashboard?.level ?? 1;
  const xp = dashboard?.xp ?? 0;
  const xpForNext = dashboard?.xpForNext ?? 100;
  const streak = dashboard?.streak ?? 0;
  const xpPct = Math.min(100, Math.max(0, Math.round((xp / xpForNext) * 100)));

  return (
    <div className="min-h-screen text-gray-200 p-4 md:p-8 font-sans bg-[#0f0f13]">
      
      {/* ── Header Hero Banner ── */}
      <header className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-500/10 via-cyan-500/5 to-purple-500/10 border border-white/5 p-6 md:p-8 mb-10 shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl -z-10"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl -z-10"></div>
        
        <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8">
          <AvatarUpload
            currentAvatarUrl={user?.avatarUrl}
            displayName={name}
            variant="student"
          />

          <div className="flex-1 text-center md:text-left min-w-0">
            <div className="flex flex-col md:flex-row md:items-center gap-3 justify-center md:justify-start">
              <h1 className="text-3xl font-black tracking-tight text-white">{name}</h1>
              {student?.honorRoll && (
                <span className="self-center md:self-auto flex items-center gap-1.5 px-3 py-1 bg-amber-500/15 border border-amber-500/30 rounded-full text-amber-400 text-xs font-bold shadow-sm">
                  <Icon name="stars" size={14} />
                  {i18n.language === 'vi' ? 'Học Sinh Xuất Sắc' : 'Honor Scholar'}
                </span>
              )}
            </div>
            <p className="text-gray-400 font-medium mt-1 text-sm md:text-base">{student?.email || user?.email}</p>
            
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-4 text-xs font-semibold text-gray-400">

              <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full flex items-center gap-1.5">
                <Icon name="school" size={14} className="text-cyan-400" />
                {i18n.language === 'vi' ? `Khối ${student?.grade || 10}` : `Grade ${student?.grade || 10}`}
              </span>
              <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full flex items-center gap-1.5">
                <Icon name="calendar_month" size={14} className="text-purple-400" />
                {i18n.language === 'vi' ? `Niên khoá ${student?.cohortYear || 2026}` : `Class of ${student?.cohortYear || 2026}`}
              </span>
            </div>
          </div>

          <div className="shrink-0 flex items-center gap-6 bg-[#161622]/60 backdrop-blur-md border border-white/5 px-6 py-4 rounded-2xl shadow-xl">
            <div className="text-center">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{i18n.language === 'vi' ? 'Cấp độ' : 'Level'}</p>
              <p className="text-2xl font-black text-emerald-400 mt-1">{level}</p>
            </div>
            <div className="w-px h-10 bg-white/10"></div>
            <div className="text-center">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">XP</p>
              <p className="text-2xl font-black text-cyan-400 mt-1">{xp}</p>
            </div>
            <div className="w-px h-10 bg-white/10"></div>
            <div className="text-center">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{i18n.language === 'vi' ? 'Chuỗi ngày' : 'Streak'}</p>
              <p className="text-2xl font-black text-orange-400 mt-1 flex items-center justify-center gap-1">
                {streak}
                <Icon name="local_fire_department" size={18} className="text-orange-500" />
              </p>
            </div>
          </div>
        </div>

        {/* Level Progress Bar inside header */}
        <div className="mt-8 pt-6 border-t border-white/5">
          <div className="flex justify-between items-center text-xs font-semibold text-gray-400 mb-2">
            <span className="flex items-center gap-1">
              <Icon name="trending_up" size={14} className="text-emerald-400" />
              {i18n.language === 'vi' ? 'Tiến trình cấp độ tiếp theo' : 'Progress to Next Level'}
            </span>
            <span>{xp} / {xpForNext} XP ({xpPct}%)</span>
          </div>
          <div className="h-2.5 w-full bg-[#0a0a0f] rounded-full overflow-hidden border border-white/5">
            <div 
              className="h-full bg-gradient-to-r from-emerald-500 via-cyan-400 to-emerald-400 rounded-full relative transition-all duration-500"
              style={{ width: `${xpPct}%` }}
            >
              <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
            </div>
          </div>
        </div>
      </header>

      {/* ── Main Layout Bento Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8 items-start">
        
        {/* Navigation Sidebar */}
        <aside className="bg-[#121218] border border-white/5 rounded-2xl p-4 flex flex-col gap-2 shadow-xl">
          <TabPills
            value={activeTab}
            onChange={(val) => setActiveTab(val as TabType)}
            options={[
              { value: 'profile', label: i18n.language === 'vi' ? 'Hồ sơ cá nhân' : 'Profile Info' },
              { value: 'stats', label: i18n.language === 'vi' ? 'Tiến độ học tập' : 'Learning Progress' },
              { value: 'preferences', label: i18n.language === 'vi' ? 'Cấu hình hệ thống' : 'System Preferences' },
              { value: 'security', label: i18n.language === 'vi' ? 'Bảo mật tài khoản' : 'Account Security' },
            ]}
            className="flex-col !w-full gap-2"
          />
        </aside>

        {/* Dynamic Content Window */}
        <main className="bg-[#121218] border border-white/5 rounded-2xl p-6 md:p-8 shadow-xl">
          
          {/* Tab 1: Profile Info */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
                  <Icon name="person" className="text-emerald-400" />
                  {i18n.language === 'vi' ? 'Thông tin cá nhân' : 'Personal Information'}
                </h2>
                <p className="text-gray-400 text-xs md:text-sm">
                  {i18n.language === 'vi' ? 'Cập nhật thông tin chi tiết và hồ sơ thành viên của bạn.' : 'Update your personal profile and account credentials.'}
                </p>
              </div>

              <form onSubmit={handleSaveProfile} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">
                    {i18n.language === 'vi' ? 'Họ đệm' : 'Last Name'}
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full bg-[#161622] border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">
                    {i18n.language === 'vi' ? 'Tên' : 'First Name'}
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full bg-[#161622] border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">
                    Tên đăng nhập (Username)
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-[#161622] border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={student?.email || user?.email || ''}
                    disabled
                    className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-sm text-gray-500 cursor-not-allowed outline-none"
                  />
                </div>



                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">
                    {i18n.language === 'vi' ? 'Địa chỉ liên hệ' : 'Home Address'}
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full bg-[#161622] border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                  />
                </div>

                <div className="md:col-span-2 flex justify-end pt-4">
                  <button
                    type="submit"
                    disabled={isSavingProfile}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 rounded-xl text-sm font-bold text-white transition-all shadow-md hover:-translate-y-0.5"
                  >
                    {isSavingProfile ? (
                      <>
                        <Icon name="sync" className="animate-spin" size={18} />
                        <span>{i18n.language === 'vi' ? 'Đang lưu...' : 'Saving...'}</span>
                      </>
                    ) : (
                      <>
                        <Icon name="save" size={18} />
                        <span>{i18n.language === 'vi' ? 'Lưu thay đổi' : 'Save Changes'}</span>
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
              <div>
                <h2 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
                  <Icon name="analytics" className="text-cyan-400" />
                  {i18n.language === 'vi' ? 'Tiến độ học tập & Chỉ số' : 'Learning Progress & Stats'}
                </h2>
                <p className="text-gray-400 text-xs md:text-sm">
                  {i18n.language === 'vi' ? 'Theo dõi điểm tích luỹ, tỉ lệ điểm danh và hoạt động học tập.' : 'Track your cumulative GPA, attendance rate, and learning accomplishments.'}
                </p>
              </div>

              {/* KPI Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-[#161622] border border-white/5 rounded-2xl p-5 flex flex-col gap-2 relative overflow-hidden group hover:border-emerald-500/20 transition-all shadow-md">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/5 rounded-full blur-xl group-hover:bg-emerald-500/10 transition-all"></div>
                  <div className="flex items-center gap-2 text-emerald-400">
                    <Icon name="grade" size={20} />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">GPA tích luỹ</span>
                  </div>
                  <p className="text-3xl font-black text-white mt-1">{student?.cumulativeGpa ? student.cumulativeGpa.toFixed(2) : '3.65'}</p>
                  <p className="text-xs text-gray-400 mt-2 font-medium">
                    {i18n.language === 'vi' ? 'Nằm trong top 10% của lớp' : 'Top 10% of the class'}
                  </p>
                </div>

                <div className="bg-[#161622] border border-white/5 rounded-2xl p-5 flex flex-col gap-2 relative overflow-hidden group hover:border-cyan-500/20 transition-all shadow-md">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-cyan-500/5 rounded-full blur-xl group-hover:bg-cyan-500/10 transition-all"></div>
                  <div className="flex items-center gap-2 text-cyan-400">
                    <Icon name="event_available" size={20} />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">{i18n.language === 'vi' ? 'Điểm danh' : 'Attendance'}</span>
                  </div>
                  <p className="text-3xl font-black text-white mt-1">{student?.attendanceRate ? `${student.attendanceRate.toFixed(1)}%` : '96.5%'}</p>
                  <p className="text-xs text-gray-400 mt-2 font-medium">
                    {i18n.language === 'vi' ? `Vắng mặt: ${student?.daysAbsent ?? 0} buổi` : `Days Absent: ${student?.daysAbsent ?? 0}`}
                  </p>
                </div>

                <div className="bg-[#161622] border border-white/5 rounded-2xl p-5 flex flex-col gap-2 relative overflow-hidden group hover:border-purple-500/20 transition-all shadow-md">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-purple-500/5 rounded-full blur-xl group-hover:bg-purple-500/10 transition-all"></div>
                  <div className="flex items-center gap-2 text-purple-400">
                    <Icon name="rocket_launch" size={20} />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">{i18n.language === 'vi' ? 'Quest đã xong' : 'Quests Completed'}</span>
                  </div>
                  <p className="text-3xl font-black text-white mt-1">{student?.questsCompleted ?? dashboard?.dailyQuestsCompleted ?? 12}</p>
                  <p className="text-xs text-gray-400 mt-2 font-medium">
                    {i18n.language === 'vi' ? 'Tiếp tục hoàn thành quest!' : 'Keep going strong!'}
                  </p>
                </div>
              </div>

              {/* Achievements Badges */}
              <div>
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Icon name="emoji_events" className="text-amber-400" />
                  {i18n.language === 'vi' ? 'Huy hiệu thành tích' : 'Achievements & Badges'}
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(dashboard?.achievements ?? []).map((ach) => (
                    <div 
                      key={ach.id} 
                      className={`flex items-center gap-4 p-4 rounded-xl border transition-colors ${
                        ach.unlocked 
                          ? 'bg-white/5 border-white/10 hover:bg-white/10' 
                          : 'bg-transparent border-dashed border-white/5 opacity-50 grayscale'
                      }`}
                    >
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-lg ${
                        ach.unlocked 
                          ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white' 
                          : 'bg-gray-800 text-gray-500'
                      }`}>
                        <Icon name={ach.icon} size={24} />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-sm text-white truncate">{ach.label}</h4>
                        <p className="text-[11px] text-gray-400 font-medium leading-snug mt-0.5 break-words">{ach.caption}</p>
                      </div>
                      {ach.unlocked && <Icon name="check_circle" size={18} className="text-emerald-400 ml-auto shrink-0" />}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: System Preferences */}
          {activeTab === 'preferences' && (
            <div className="space-y-8">
              <div>
                <h2 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
                  <Icon name="settings" className="text-purple-400" />
                  {i18n.language === 'vi' ? 'Cấu hình hệ thống' : 'System Preferences'}
                </h2>
                <p className="text-gray-400 text-xs md:text-sm">
                  {i18n.language === 'vi' ? 'Tinh chỉnh môi trường lập trình và tuỳ chọn ngôn ngữ cổng thông tin của bạn.' : 'Configure your code workspace preferences and global app settings.'}
                </p>
              </div>

              <div className="flex flex-col gap-6">
                
                {/* Default Code Language */}
                <div className="bg-[#161622] border border-white/5 p-6 rounded-2xl shadow-md">
                  <h3 className="text-md font-bold text-white mb-2 flex items-center gap-2">
                    <Icon name="code" className="text-emerald-400" />
                    {i18n.language === 'vi' ? 'Ngôn ngữ lập trình mặc định' : 'Default Coding Language'}
                  </h3>
                  <p className="text-xs text-gray-400 mb-4">
                    {i18n.language === 'vi' ? 'Trình soạn thảo sẽ tự động chọn ngôn ngữ này khi bắt đầu một nhiệm vụ lập trình mới.' : 'This will be automatically pre-selected in your Workspace editor when loading new tasks.'}
                  </p>

                  <div className="flex flex-wrap gap-3">
                    {[
                      { value: 'cpp', label: 'C++ (G++ 20)', icon: 'terminal' },
                      { value: 'python', label: 'Python (3.10)', icon: 'terminal' },
                      { value: 'java', label: 'Java (JDK 17)', icon: 'terminal' }
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => handleLanguageChange(opt.value)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold border transition-all ${
                          dashboard?.defaultLanguage === opt.value
                            ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 shadow-md'
                            : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        <span className="material-symbols-outlined">{opt.icon}</span>
                        <span>{opt.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Portal Language */}
                <div className="bg-[#161622] border border-white/5 p-6 rounded-2xl shadow-md">
                  <h3 className="text-md font-bold text-white mb-2 flex items-center gap-2">
                    <Icon name="language" className="text-cyan-400" />
                    {i18n.language === 'vi' ? 'Ngôn ngữ giao diện' : 'UI Language'}
                  </h3>
                  <p className="text-xs text-gray-400 mb-4">
                    {i18n.language === 'vi' ? 'Chọn ngôn ngữ hiển thị trên toàn bộ hệ thống.' : 'Choose the global display language for all portal interfaces.'}
                  </p>

                  <div className="flex gap-3">
                    {[
                      { value: 'vi', label: 'Tiếng Việt', flag: 'VI' },
                      { value: 'en', label: 'English', flag: 'EN' }
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => handleInterfaceLanguageChange(opt.value as 'vi' | 'en')}
                        className={`flex items-center gap-3 px-5 py-3 rounded-xl text-sm font-bold border transition-all ${
                          i18n.language === opt.value
                            ? 'bg-cyan-500/10 border-cyan-500 text-cyan-400 shadow-md'
                            : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white'
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

          {/* Tab 4: Account Security */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
                  <Icon name="lock" className="text-orange-400" />
                  {i18n.language === 'vi' ? 'Bảo mật & Đổi mật khẩu' : 'Security & Password'}
                </h2>
                <p className="text-gray-400 text-xs md:text-sm">
                  {i18n.language === 'vi' ? 'Thay đổi mật khẩu đăng nhập để bảo vệ tài khoản.' : 'Update your password and manage account security.'}
                </p>
              </div>

              <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">
                    {i18n.language === 'vi' ? 'Mật khẩu hiện tại' : 'Current Password'}
                  </label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full bg-[#161622] border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">
                    {i18n.language === 'vi' ? 'Mật khẩu mới' : 'New Password'}
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-[#161622] border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">
                    {i18n.language === 'vi' ? 'Xác nhận mật khẩu mới' : 'Confirm New Password'}
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-[#161622] border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                    required
                  />
                </div>

                <div className="flex justify-end pt-4">
                  <button
                    type="submit"
                    disabled={isChangingPassword}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 rounded-xl text-sm font-bold text-white transition-all shadow-md hover:-translate-y-0.5"
                  >
                    {isChangingPassword ? (
                      <>
                        <Icon name="sync" className="animate-spin" size={18} />
                        <span>{i18n.language === 'vi' ? 'Đang thực hiện...' : 'Updating...'}</span>
                      </>
                    ) : (
                      <>
                        <Icon name="vpn_key" size={18} />
                        <span>{i18n.language === 'vi' ? 'Cập nhật mật khẩu' : 'Update Password'}</span>
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
