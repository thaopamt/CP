import { useMemo, useState } from 'react';

import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Avatar,
  BarChart,
  Breadcrumb,
  Button,
  EnrollmentStatusBadge,
  Icon,
  PageHeader,
  StatusBadge,
  TabPills,
  TrendBadge,
  useConfirm,
  useToast,
  ContributionHeatmap,
} from '@cp/ui';
import { IGuardian, ISubjectGrade, UserRole, fullName as formatName } from '@cp/shared';

import {
  useStudent,
  useResetPasswordStudent,
  useResetStudentLearningData,
  useStudentHeatmapAdmin,
} from '../../../api/student.queries';
import {
  useStudentTeachers,
  useSetStudentTeachers,
} from '../../../api/teacherAssignments.queries';
import { useUsersList } from '../../../api/users.queries';
import { usePortalBase } from '../../../hooks/usePortalBase';
import { MultiSelectPicker } from '../../../components/MultiSelectPicker';
import { ResetPasswordModal } from './ResetPasswordModal';
import StudentScheduleTab from './StudentScheduleTab';
import StudentAttendanceHistoryTab from './StudentAttendanceHistoryTab';

type Tab = 'academics' | 'courses' | 'attendance' | 'activity' | 'schedule';

export default function StudentProfilePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const base = usePortalBase();
  const { studentId: idParam } = useParams<{ studentId: string }>();
  const toast = useToast();
  const confirm = useConfirm();

  const studentQuery = useStudent(idParam);
  const studentTeachersQuery = useStudentTeachers(idParam);
  const [tab, setTab] = useState<Tab>('academics');
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [manageTeachersOpen, setManageTeachersOpen] = useState(false);
  const resetPassword = useResetPasswordStudent(idParam as string);
  const resetLearningData = useResetStudentLearningData(idParam as string);
  const heatmapQuery = useStudentHeatmapAdmin(idParam as string);

  const subjectGrades: ISubjectGrade[] = useMemo(
    () => [
      { subject: 'Math', percentage: 92 },
      { subject: 'Science', percentage: 88 },
      { subject: 'English', percentage: 96 },
      { subject: 'History', percentage: 85 },
      { subject: 'Art', percentage: 98 },
    ],
    [],
  );

  if (studentQuery.isLoading) {
    return (
      <div className="grid place-items-center min-h-[40vh] text-on-surface-variant">
        <span className="material-symbols-outlined animate-spin text-3xl">progress_activity</span>
      </div>
    );
  }

  if (studentQuery.isError || !studentQuery.data) {
    return (
      <div className="grid place-items-center min-h-[40vh] text-center">
        <Icon name="error" size={36} className="mb-sm text-error" />
        <p className="text-body-md text-on-surface">
          {(studentQuery.error as Error | undefined)?.message ?? t('common.notFound')}
        </p>
        <Button variant="ghost" className="mt-md" onClick={() => navigate(`${base}/students`)}>
          {t('pages.admin.studentProfile.backToDirectory')}
        </Button>
      </div>
    );
  }

  const s = studentQuery.data;
  const fullName = `${s.firstName} ${s.lastName}`.trim();
  const initials = `${s.firstName[0] ?? ''}${s.lastName[0] ?? ''}`.toUpperCase();

  async function handleResetLearningData() {
    const ok = await confirm({
      title: t('pages.admin.studentProfile.resetLearning.title', 'Reset học tập'),
      message: (
        <div className="space-y-2 text-left">
          <p>
            {t(
              'pages.admin.studentProfile.resetLearning.message',
              'Thao tác này sẽ xóa bài đã làm, submissions, progress khóa học, quest, badge, maze, shop và đặt lại XP/gems/level của học sinh này.',
            )}
          </p>
          <p className="font-medium">
            {t(
              'pages.admin.studentProfile.resetLearning.keep',
              'Thông tin cá nhân, học phí, lớp học, lịch học và điểm danh sẽ được giữ nguyên.',
            )}
          </p>
        </div>
      ),
      confirmLabel: t('pages.admin.studentProfile.resetLearning.confirm', 'Reset học tập'),
      cancelLabel: t('common.cancel', 'Cancel'),
      intent: 'danger',
    });
    if (!ok) return;

    try {
      const result = await resetLearningData.mutateAsync();
      const deletedCount =
        result.submissionsDeleted +
        result.assignmentProgressDeleted +
        result.questsDeleted +
        result.badgesDeleted +
        result.shopItemsDeleted +
        result.mazeSubmissionsDeleted;
      toast.success(
        t('pages.admin.studentProfile.resetLearning.success', {
          defaultValue: 'Đã reset dữ liệu học tập ({{count}} bản ghi).',
          count: deletedCount,
        }),
      );
    } catch {
      toast.error(
        t(
          'pages.admin.studentProfile.resetLearning.error',
          'Không thể reset dữ liệu học tập. Vui lòng thử lại.',
        ),
      );
    }
  }

  return (
    <div className="flex flex-col gap-lg">
      <PageHeader
        breadcrumb={
          <Breadcrumb
            items={[
              { label: t('nav.admin.students'), onClick: () => navigate(`${base}/students`) },
              { label: fullName },
            ]}
          />
        }
        eyebrow={
          <div className="flex items-center gap-sm text-label-sm text-on-surface-variant">
            <span>{t('pages.admin.studentProfile.gradeShort', { grade: s.grade })}</span>
          </div>
        }
        title={
          <div className="flex items-center gap-md">
            <span className="relative">
              <Avatar size="lg" initials={initials} src={s.avatarUrl ?? undefined} />
              {s.honorRoll && (
                <span
                  className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-tertiary-container text-tertiary border-2 border-surface grid place-items-center"
                  aria-label={t('pages.admin.studentProfile.honorRoll')}
                  title={t('pages.admin.studentProfile.honorRoll')}
                >
                  <Icon name="stars" size={12} />
                </span>
              )}
            </span>
            <div className="min-w-0">
              <div className="font-manrope text-headline-lg text-on-surface truncate">{fullName}</div>
              <div className="flex items-center gap-sm mt-xs">
                <EnrollmentStatusBadge status={s.status} />
              </div>
            </div>
          </div>
        }
        actions={
          <>
            <Button
              variant="ghost"
              leadingIcon={<Icon name="edit" size={18} />}
              onClick={() => navigate(`${base}/students/${idParam}/edit`)}
            >
              {t('pages.admin.studentProfile.edit')}
            </Button>
            <Button 
              variant="ghost" 
              leadingIcon={<Icon name="lock_reset" size={18} />}
              onClick={() => setIsResetModalOpen(true)}
            >
              {t('pages.admin.studentProfile.resetPassword')}
            </Button>
            {base === '/admin' && (
              <Button
                variant="danger"
                leadingIcon={<Icon name="restart_alt" size={18} />}
                disabled={resetLearningData.isPending}
                onClick={handleResetLearningData}
              >
                {t('pages.admin.studentProfile.resetLearning.action', 'Reset học tập')}
              </Button>
            )}
            <Button variant="admin" leadingIcon={<Icon name="mail" size={18} />}>
              {t('pages.admin.studentProfile.message')}
            </Button>
          </>
        }
      />

      {/* Main bento: left = demographics + guardians, right = KPIs + tabs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-lg">
        {/* Left column */}
        <aside className="lg:col-span-4 flex flex-col gap-md">
          <div className="bg-surface-container-lowest border border-outline-variant/50 rounded-xl p-md">
            <header className="flex items-center justify-between mb-sm">
              <h3 className="font-manrope text-headline-md text-on-surface">
                {t('pages.admin.studentProfile.guardians.title')}
              </h3>
              <Button variant="ghost" size="sm" leadingIcon={<Icon name="add" size={16} />}>
                {t('common.add')}
              </Button>
            </header>
            {s.guardians.length === 0 ? (
              <p className="text-label-sm text-on-surface-variant text-center py-md italic">
                {t('pages.admin.studentProfile.guardians.empty')}
              </p>
            ) : (
              <ul className="flex flex-col divide-y divide-outline-variant/30">
                {s.guardians.map((g) => (
                  <GuardianRow key={g.id} guardian={g} />
                ))}
              </ul>
            )}
          </div>

          {/* Assigned teachers */}
          <div className="bg-surface-container-lowest border border-outline-variant/50 rounded-xl p-md">
            <header className="flex items-center justify-between mb-sm">
              <h3 className="font-manrope text-headline-md text-on-surface">
                {t('pages.admin.students.assignedTeachers')}
              </h3>
              {base === '/admin' && (
                <Button
                  variant="ghost"
                  size="sm"
                  leadingIcon={<Icon name="edit" size={16} />}
                  onClick={() => setManageTeachersOpen(true)}
                >
                  {t('common.manage', 'Quản lý')}
                </Button>
              )}
            </header>
            {(studentTeachersQuery.data?.length ?? 0) === 0 ? (
              <p className="text-label-sm text-on-surface-variant text-center py-md italic">
                {t('pages.admin.students.noTeachers')}
              </p>
            ) : (
              <ul className="flex flex-col divide-y divide-outline-variant/30">
                {studentTeachersQuery.data?.map((teacher) => (
                  <li key={teacher.id} className="flex items-center gap-sm py-sm">
                    <Avatar
                      size="sm"
                      initials={`${teacher.firstName[0] ?? ''}${teacher.lastName[0] ?? ''}`.toUpperCase()}
                      src={teacher.avatarUrl ?? undefined}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-on-surface font-medium truncate">{formatName(teacher)}</div>
                      <div className="text-[12px] text-on-surface-variant truncate">{teacher.email}</div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>

        {/* Right column */}
        <section className="lg:col-span-8 flex flex-col gap-md">
          {/* KPI row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
            <KpiCard
              icon="grade"
              iconColor="text-primary"
              label={t('pages.admin.studentProfile.kpi.gpa')}
              value={s.cumulativeGpa.toFixed(2)}
              caption={
                <TrendBadge
                  trend="up"
                  label={t('pages.admin.studentProfile.kpi.gpaTrend', { value: 0.2 })}
                />
              }
            />
            <KpiCard
              icon="event_available"
              iconColor="text-tertiary"
              label={t('pages.admin.studentProfile.kpi.attendance')}
              value={`${s.attendanceRate.toFixed(1)}%`}
              caption={
                <span className="text-label-sm text-on-surface-variant">
                  {t('pages.admin.studentProfile.kpi.daysAbsent', { count: s.daysAbsent })}
                </span>
              }
            />
            <KpiCard
              icon="rocket_launch"
              iconColor="text-secondary"
              label={t('pages.admin.studentProfile.kpi.questsCompleted')}
              value={String(s.questsCompleted)}
              caption={
                <span className="text-label-sm text-on-surface-variant">
                  {s.cohortPercentile ?? '—'}
                </span>
              }
              decoration
            />
          </div>

          {/* Tabbed panel */}
          <div className="bg-surface-container-lowest border border-outline-variant/50 rounded-xl shadow-elev-1 overflow-hidden">
            <header className="px-md md:px-lg pt-md border-b border-outline-variant/30">
              <TabPills
                value={tab}
                onChange={setTab}
                options={[
                  { value: 'academics', label: t('pages.admin.studentProfile.tabs.academics') },
                  { value: 'courses', label: t('pages.admin.studentProfile.tabs.courses') },
                  { value: 'attendance', label: t('pages.admin.studentProfile.tabs.attendance') },
                  { value: 'activity', label: t('pages.admin.studentProfile.tabs.activity') },
                  { value: 'schedule', label: t('pages.admin.studentProfile.tabs.schedule') },
                ]}
                className="mb-md"
              />
            </header>

            {tab === 'academics' && (
              <div className="p-md md:p-lg">
                <header className="flex items-center justify-between mb-md">
                  <h4 className="font-manrope text-headline-md text-on-surface">
                    {t('pages.admin.studentProfile.academics.title')}
                  </h4>
                  <select className="bg-surface-container-low border border-outline-variant rounded-md px-md py-xs text-label-sm">
                    <option>2023–2024 · Fall</option>
                    <option>2023–2024 · Spring</option>
                  </select>
                </header>
                <BarChart
                  data={subjectGrades.map((g) => ({ label: g.subject, value: g.percentage }))}
                  barClassName="bg-primary/80"
                  height={220}
                />
              </div>
            )}

            {tab === 'courses' && (
              <div className="p-md md:p-lg text-center text-on-surface-variant">
                {t('pages.admin.studentProfile.courses.empty')}
              </div>
            )}
            {tab === 'attendance' && (
              <StudentAttendanceHistoryTab studentId={s.userId} />
            )}
            {tab === 'activity' && (
              <div className="p-md md:p-lg">
                <header className="flex items-center justify-between mb-md">
                  <h4 className="font-manrope text-headline-md text-on-surface">
                    {t('pages.student.home.learningActivity', 'Hoạt động học tập (365 ngày)')}
                  </h4>
                </header>
                {heatmapQuery.isLoading ? (
                  <div className="h-[140px] animate-pulse rounded bg-surface-container-high" />
                ) : heatmapQuery.data ? (
                  <ContributionHeatmap data={heatmapQuery.data} metric="activityCount" />
                ) : (
                  <div className="text-center text-on-surface-variant py-lg">
                    {t('pages.admin.studentProfile.activity.empty', 'Chưa có hoạt động.')}
                  </div>
                )}
              </div>
            )}
            {tab === 'schedule' && (
              <StudentScheduleTab studentId={s.userId} />
            )}
          </div>
        </section>
      </div>
      <ResetPasswordModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        isSubmitting={resetPassword.isPending}
        onConfirm={async (newPassword) => {
          try {
            await resetPassword.mutateAsync(newPassword);
            toast.success(t('pages.admin.studentProfile.resetPasswordSuccess', 'Password reset successfully'));
            setIsResetModalOpen(false);
          } catch (err) {
            toast.error(t('pages.admin.studentProfile.resetPasswordError', 'Failed to reset password'));
          }
        }}
      />
      {manageTeachersOpen && (
        <ManageTeachersDialog
          studentId={idParam as string}
          currentIds={(studentTeachersQuery.data ?? []).map((u) => u.id)}
          onClose={() => setManageTeachersOpen(false)}
          onSaved={() => {
            setManageTeachersOpen(false);
            toast.success(t('pages.admin.students.teachersUpdated', 'Đã cập nhật giáo viên'));
          }}
          onError={(msg) => toast.error(msg)}
        />
      )}
    </div>
  );
}

function ManageTeachersDialog({
  studentId,
  currentIds,
  onClose,
  onSaved,
  onError,
}: {
  studentId: string;
  currentIds: string[];
  onClose: () => void;
  onSaved: () => void;
  onError: (msg: string) => void;
}) {
  const { t } = useTranslation();
  const teachersQuery = useUsersList({ role: UserRole.TEACHER, limit: 1000 });
  const save = useSetStudentTeachers(studentId);
  const [selected, setSelected] = useState<Set<string>>(new Set(currentIds));

  async function submit() {
    try {
      await save.mutateAsync([...selected]);
      onSaved();
    } catch (err) {
      const msg = (err as { response?: { data?: { message?: string | string[] } } })?.response?.data
        ?.message;
      onError(Array.isArray(msg) ? msg.join(', ') : (msg ?? (err as Error).message));
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
            {t('pages.admin.students.assignedTeachers')}
          </h2>
          <button type="button" onClick={onClose} className="p-1 rounded hover:bg-surface-container-high">
            <Icon name="close" />
          </button>
        </header>
        <MultiSelectPicker
          loading={teachersQuery.isLoading}
          options={(teachersQuery.data?.items ?? []).map((u) => ({
            id: u.id,
            label: formatName(u),
            sublabel: u.email,
          }))}
          selected={selected}
          onChange={setSelected}
          emptyText={t('pages.admin.students.noTeachers')}
        />
        <footer className="flex justify-end gap-sm">
          <Button variant="outline" onClick={onClose}>
            {t('common.cancel', 'Cancel')}
          </Button>
          <Button onClick={submit} disabled={save.isPending}>
            {t('common.save', 'Save')}
          </Button>
        </footer>
      </div>
    </div>
  );
}

function GuardianRow({ guardian: g }: { guardian: IGuardian }) {
  const initials = g.fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();
  return (
    <li className="flex items-center gap-sm py-sm">
      <Avatar size="sm" initials={initials} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-xs">
          <span className="text-on-surface font-medium truncate">{g.fullName}</span>
          {g.isPrimary && (
            <StatusBadge tone="info" className="!py-0 !px-xs">
              Primary
            </StatusBadge>
          )}
        </div>
        {g.phoneNumber && (
          <div className="text-[12px] text-on-surface-variant">
            {g.phoneNumber}
          </div>
        )}
      </div>
      {g.phoneNumber && (
        <a
          href={`tel:${g.phoneNumber}`}
          className="p-1 rounded text-on-surface-variant hover:text-primary"
          aria-label="Call"
        >
          <Icon name="call" size={18} />
        </a>
      )}

    </li>
  );
}

function KpiCard({
  icon,
  iconColor,
  label,
  value,
  caption,
  decoration,
}: {
  icon: string;
  iconColor: string;
  label: string;
  value: string;
  caption: React.ReactNode;
  decoration?: boolean;
}) {
  return (
    <div className="relative overflow-hidden bg-surface-container-lowest border border-outline-variant/50 rounded-xl p-md flex flex-col gap-xs">
      {decoration && (
        <div
          className="absolute -right-4 -top-4 w-24 h-24 bg-primary-container/40 rounded-full blur-xl"
          aria-hidden
        />
      )}
      <div className={`flex items-center gap-sm relative ${iconColor}`}>
        <Icon name={icon} size={20} />
        <span className="text-label-sm uppercase tracking-wider text-on-surface-variant">{label}</span>
      </div>
      <div className="font-manrope text-headline-lg text-on-surface relative">{value}</div>
      <div className="relative">{caption}</div>
    </div>
  );
}
