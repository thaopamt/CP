import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Avatar,
  Breadcrumb,
  Button,
  Column,
  DataTable,
  Icon,
  PageHeader,
  StatusBadge,
  TabPills,
  Timeline,
  TimelineItem,
} from '@cp/ui';
import {
  ClassStatus,
  DayOfWeek,
  IClassEnrollment,
  IClassMeeting,
  PaymentStatus,
} from '@cp/shared';

import { useClass, useEnrollmentsByClass, useEnrollStudent, useDropEnrollment } from '../../../api/class.queries';
import { AssignStudentsModal } from './AssignStudentsModal';
import { RemoveStudentModal } from './RemoveStudentModal';
import { useToast } from '../../../providers/ToastProvider';

type Tab = 'roster' | 'schedule' | 'activity';

export default function ClassDetailPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { classId } = useParams<{ classId: string }>();

  const classQuery = useClass(classId);
  const rosterQuery = useEnrollmentsByClass(classId);
  const enrollStudent = useEnrollStudent();
  const dropEnrollment = useDropEnrollment(classId ?? '');

  const [tab, setTab] = useState<Tab>('roster');
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [studentToRemove, setStudentToRemove] = useState<IClassEnrollment | null>(null);
  const toast = useToast();

  const handleAssignStudents = async (studentIds: string[]) => {
    if (!classId) return;
    setIsAssigning(true);
    try {
      await Promise.all(
        studentIds.map((id) => enrollStudent.mutateAsync({ classId, studentId: id }))
      );
      setIsAssignModalOpen(false);
      toast.success(t('pages.admin.classes.detail.assignModal.success', 'Students successfully assigned.'));
    } catch (err: any) {
      console.error('Failed to assign students:', err);
      toast.error(err?.response?.data?.message || err.message || t('common.error', 'An error occurred'));
    } finally {
      setIsAssigning(false);
    }
  };

  const handleConfirmRemove = async () => {
    if (!studentToRemove) return;
    try {
      await dropEnrollment.mutateAsync(studentToRemove.id);
      setStudentToRemove(null);
      toast.success(t('pages.admin.classes.detail.roster.removeSuccess', 'Student removed successfully.'));
    } catch (err: any) {
      console.error('Failed to remove student', err);
      toast.error(err?.response?.data?.message || err.message || t('common.error', 'An error occurred'));
    }
  };

  const dayLabel = (d: DayOfWeek) => t(`enums.dayOfWeek.${d}`);
  const initials = (name: string) =>
    name.split(' ').slice(0, 2).map((p) => p[0]).join('').toUpperCase();
  const formatTime = (timeStr?: string) => timeStr ? timeStr.split(':').slice(0, 2).join(':') : '';

  const cls = classQuery.data;

  // ── Hooks MUST be called unconditionally (Rules of Hooks) ────────────
  const scheduleByDay = useMemo(() => {
    if (!cls) return new Map<DayOfWeek, IClassMeeting[]>();
    const out = new Map<DayOfWeek, IClassMeeting[]>();
    for (const s of cls.sessions) {
      const arr = out.get(s.dayOfWeek) ?? [];
      arr.push(s);
      out.set(s.dayOfWeek, arr);
    }
    return out;
  }, [cls]);

  const activity: TimelineItem[] = useMemo(() => {
    if (!cls || cls.enrolledCount === 0) return [];
    return [
      {
        id: 'a1',
        icon: 'person_add',
        tone: 'primary',
        title: t('pages.admin.dashboard.activities.enroll.title'),
        meta: `${cls.enrolledCount} / ${cls.capacity} · ${cls.name}`,
        time: t('ui.helpQueue.hoursAgo', { count: 3 }),
      },
      {
        id: 'a2',
        icon: 'event_available',
        tone: 'tertiary',
        title: t('pages.teacher.dashboard.todaysAttendance'),
        meta: `${cls.attendanceRate ?? 0}% · ${cls.term}`,
        time: t('ui.helpQueue.daysAgo', { count: 1 }),
      },
    ];
  }, [cls, t]);

  const rosterColumns: Column<IClassEnrollment>[] = useMemo(() => [
    {
      key: 'student',
      header: t('pages.admin.classes.detail.roster.columns.student'),
      cell: (row: IClassEnrollment) => (
        <div className="flex items-center gap-sm">
          <Avatar size="sm" initials={initials(row.studentName)} />
          <div className="min-w-0">
            <div className="text-on-surface font-medium truncate">{row.studentName}</div>
            <div className="text-[12px] text-on-surface-variant truncate">{row.studentEmail}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'externalId',
      header: t('pages.admin.classes.detail.roster.columns.externalId'),
      cell: (row: IClassEnrollment) => <span className="text-on-surface-variant font-mono text-[12px]">{row.studentExternalId}</span>,
    },
    {
      key: 'attendance',
      header: t('pages.admin.classes.detail.roster.columns.attendance'),
      cell: (row: IClassEnrollment) => (
        <div className="min-w-[120px]">
          <div className="flex justify-between text-[11px] text-on-surface-variant mb-xs">
            <span>{row.attendancePercentage}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-surface-container-highest overflow-hidden">
            <div className="h-full bg-tertiary rounded-full" style={{ width: `${row.attendancePercentage}%` }} />
          </div>
        </div>
      ),
    },
    {
      key: 'payment',
      header: t('pages.admin.classes.detail.roster.columns.payment'),
      cell: (row: IClassEnrollment) => (
        <StatusBadge
          tone={
            row.paymentStatus === PaymentStatus.PAID
              ? 'success'
              : row.paymentStatus === PaymentStatus.OVERDUE
              ? 'error'
              : 'warning'
          }
        >
          {t(`enums.paymentStatus.${row.paymentStatus}`)}
        </StatusBadge>
      ),
    },
    {
      key: 'actions',
      header: '',
      cell: (row: IClassEnrollment) => (
        <div className="flex justify-end">
          <Button
            variant="ghost"
            className="text-error hover:bg-error-container/20 rounded-full w-8 h-8 p-0 flex items-center justify-center transition-colors"
            title={t('pages.admin.classes.detail.roster.removeStudent', 'Remove Student')}
            disabled={dropEnrollment.isPending && dropEnrollment.variables === row.id}
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation();
              setStudentToRemove(row);
            }}
          >
            {dropEnrollment.isPending && dropEnrollment.variables === row.id ? (
              <Icon name="progress_activity" size={18} className="animate-spin text-error" />
            ) : (
              <Icon name="person_remove" size={18} className="text-on-surface-variant hover:text-error" />
            )}
          </Button>
        </div>
      ),
    },
  ], [t, dropEnrollment]);

  // Loading / error gate — AFTER all hooks
  if (classQuery.isLoading || !cls) {
    return (
      <div className="grid place-items-center min-h-[40vh] text-on-surface-variant">
        <span className="material-symbols-outlined animate-spin text-3xl">progress_activity</span>
      </div>
    );
  }
  if (classQuery.isError) {
    return (
      <div className="grid place-items-center min-h-[40vh] text-center">
        <Icon name="error" size={36} className="mb-sm text-error" />
        <p className="text-body-md text-on-surface">
          {(classQuery.error as Error | undefined)?.message ?? t('common.notFound')}
        </p>
        <Button variant="ghost" className="mt-md" onClick={() => navigate('/admin/classes')}>
          {t('pages.admin.classes.detail.backToClasses')}
        </Button>
      </div>
    );
  }

  const roster = rosterQuery.data ?? [];
  const seatsAvailable = Math.max(0, cls.capacity - cls.enrolledCount);
  const nextSession = cls.sessions[0];

  return (
    <div className="flex flex-col gap-lg">
      <PageHeader
        breadcrumb={
          <Breadcrumb
            items={[
              { label: t('nav.admin.classes'), onClick: () => navigate('/admin/classes') },
              { label: t(`enums.classDepartment.${cls.department}`) },
              { label: `${cls.name} (${cls.code})` },
            ]}
          />
        }
        eyebrow={
          <div className="flex items-center gap-sm text-label-sm text-on-surface-variant">
            <span>{t(`enums.classDepartment.${cls.department}`)}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-outline-variant" />
            <span>{cls.term}</span>
          </div>
        }
        title={`${cls.name} (${cls.code})`}
        actions={
          <>
            <Button
              variant="admin"
              leadingIcon={<Icon name="library_books" size={18} />}
              onClick={() => navigate(`/admin/classes/${classId}/curriculum`)}
            >
              {t('pages.admin.classes.detail.manageCurriculum')}
            </Button>
            <Button variant="ghost" leadingIcon={<Icon name="edit" size={18} />} onClick={() => navigate(`/admin/classes/${classId}/edit`)}>
              {t('pages.admin.classes.detail.editClass')}
            </Button>
            <Button
              variant="ghost"
              leadingIcon={<Icon name="pause_circle" size={18} />}
              disabled={cls.status === ClassStatus.ARCHIVED}
            >
              {t('pages.admin.classes.detail.pauseClass')}
            </Button>
            <Button variant="ghost" leadingIcon={<Icon name="archive" size={18} />}>
              {t('pages.admin.classes.detail.archiveClass')}
            </Button>
          </>
        }
      />

      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-md">
        <KpiCard
          icon="check_circle"
          iconColor="text-tertiary"
          label={t('pages.admin.classes.detail.kpi.attendanceRate')}
          value={`${(cls.attendanceRate ?? 0).toFixed(1)}%`}
          caption={t('pages.admin.classes.detail.kpi.attendanceTrend', { value: 1.2 })}
        />
        <KpiCard
          icon="groups"
          iconColor="text-primary"
          label={t('pages.admin.classes.detail.kpi.activeStudents')}
          value={`${cls.enrolledCount} / ${cls.capacity}`}
          caption={t('pages.admin.classes.detail.kpi.seatsAvailable', { count: seatsAvailable })}
        />
        <KpiCard
          icon="event"
          iconColor="text-secondary"
          label={t('pages.admin.classes.detail.kpi.nextSession')}
          value={nextSession ? `${dayLabel(nextSession.dayOfWeek)} · ${formatTime(nextSession.startTime)}` : '—'}
          caption={t('pages.admin.classes.detail.kpi.nextSessionAt', {
            when: nextSession ? `${dayLabel(nextSession.dayOfWeek)} ${formatTime(nextSession.startTime)}` : '—',
            room: cls.room ?? '—',
          })}
          highlight
        />
        <div className="bg-surface-container-lowest border border-outline-variant/50 rounded-xl p-md flex items-center gap-md">
          {cls.instructor ? (
            <>
              <Avatar
                size="lg"
                initials={initials(cls.instructor.fullName)}
                src={cls.instructor.avatarUrl ?? undefined}
              />
              <div className="flex-1 min-w-0">
                <div className="text-[11px] text-on-surface-variant uppercase tracking-wider">
                  {t('pages.admin.classes.detail.kpi.instructor')}
                </div>
                <div className="text-on-surface font-semibold truncate">{cls.instructor.fullName}</div>
                <div className="text-[12px] text-on-surface-variant truncate">
                  {cls.instructor.title ?? cls.instructor.email}
                </div>
              </div>
              <a
                href={`mailto:${cls.instructor.email}`}
                className="p-2 rounded-full text-on-surface-variant hover:bg-surface-container-high"
                aria-label={t('pages.admin.classes.detail.kpi.contactInstructor')}
              >
                <Icon name="mail" />
              </a>
            </>
          ) : (
            <>
              <span className="w-12 h-12 rounded-full bg-surface-container-high text-on-surface-variant grid place-items-center">
                <Icon name="person_off" />
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-[11px] text-on-surface-variant uppercase tracking-wider">
                  {t('pages.admin.classes.detail.kpi.instructor')}
                </div>
                <div className="text-on-surface-variant italic">
                  {t('pages.admin.classes.list.unassignedInstructor')}
                </div>
              </div>
              <Button variant="ghost" size="sm" leadingIcon={<Icon name="person_add" size={16} />}>
                {t('common.add')}
              </Button>
            </>
          )}
        </div>
      </section>

      <div className="bg-surface-container-lowest border border-outline-variant/50 rounded-xl shadow-elev-1 overflow-hidden">
        <header className="px-md md:px-lg pt-md border-b border-outline-variant/30">
          <TabPills
            value={tab}
            onChange={setTab}
            options={[
              { value: 'roster', label: t('pages.admin.classes.detail.tabs.roster'), count: cls.enrolledCount },
              { value: 'schedule', label: t('pages.admin.classes.detail.tabs.schedule'), count: cls.sessions.length },
              { value: 'activity', label: t('pages.admin.classes.detail.tabs.activity') },
            ]}
            className="mb-md"
          />
        </header>

        {tab === 'roster' && (
          <div className="flex flex-col">
            <div className="flex justify-end items-center p-md border-b border-outline-variant/30">
              <Button
                variant="admin"
                size="sm"
                leadingIcon={<Icon name="person_add" size={16} />}
                onClick={() => setIsAssignModalOpen(true)}
              >
                {t('pages.admin.classes.detail.roster.addStudent', 'Add Student')}
              </Button>
            </div>
            <DataTable
              rows={roster}
              columns={rosterColumns}
              rowKey={(r) => r.id}
              emptyState={
                <span>
                  {rosterQuery.isLoading
                    ? t('common.loading')
                    : t('pages.admin.classes.detail.roster.empty')}
                </span>
              }
            />
          </div>
        )}

        {tab === 'schedule' && (
          <div className="p-md md:p-lg">
            {cls.sessions.length === 0 ? (
              <p className="text-label-sm text-on-surface-variant text-center py-xl">
                {t('pages.admin.classes.detail.schedule.empty')}
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-7 gap-sm">
                {(Object.values(DayOfWeek) as DayOfWeek[]).map((d) => {
                  const sessions = scheduleByDay.get(d) ?? [];
                  return (
                    <div key={d} className="bg-surface-container-low rounded-lg p-sm min-h-[140px]">
                      <div className="text-label-sm font-bold text-on-surface mb-sm">{dayLabel(d)}</div>
                      <div className="flex flex-col gap-xs">
                        {sessions.map((s) => (
                          <div
                            key={s.id}
                            className="rounded-md bg-primary-container/30 border-l-4 border-primary px-sm py-xs"
                          >
                            <div className="text-[12px] text-on-surface font-semibold">
                              {formatTime(s.startTime)}–{formatTime(s.endTime)}
                            </div>
                            <div className="text-[11px] text-on-surface-variant">{s.room ?? cls.room}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {tab === 'activity' && (
          <div className="p-md md:p-lg">
            {activity.length === 0 ? (
              <p className="text-label-sm text-on-surface-variant text-center py-xl">
                {t('pages.admin.classes.detail.activity.empty')}
              </p>
            ) : (
              <Timeline items={activity} />
            )}
          </div>
        )}
      </div>

      <AssignStudentsModal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        onAssign={handleAssignStudents}
        isSubmitting={isAssigning}
        enrolledStudentIds={roster.map(r => r.studentId)}
      />

      <RemoveStudentModal
        isOpen={studentToRemove !== null}
        onClose={() => setStudentToRemove(null)}
        onConfirm={handleConfirmRemove}
        student={studentToRemove}
        isSubmitting={dropEnrollment.isPending}
      />
    </div>
  );
}

function KpiCard({
  icon,
  iconColor,
  label,
  value,
  caption,
  highlight,
}: {
  icon: string;
  iconColor: string;
  label: string;
  value: string;
  caption: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={
        highlight
          ? 'bg-primary text-on-primary rounded-xl p-md flex flex-col gap-xs'
          : 'bg-surface-container-lowest border border-outline-variant/50 rounded-xl p-md flex flex-col gap-xs'
      }
    >
      <div className={highlight ? 'flex items-center gap-sm' : `flex items-center gap-sm ${iconColor}`}>
        <Icon name={icon} size={20} className={highlight ? 'text-on-primary' : iconColor} />
        <span
          className={
            highlight
              ? 'text-label-sm uppercase tracking-wider opacity-90'
              : 'text-label-sm uppercase tracking-wider text-on-surface-variant'
          }
        >
          {label}
        </span>
      </div>
      <div
        className={
          highlight ? 'font-manrope text-headline-lg text-on-primary' : 'font-manrope text-headline-lg text-on-surface'
        }
      >
        {value}
      </div>
      <div className={highlight ? 'text-label-sm opacity-90' : 'text-label-sm text-on-surface-variant'}>{caption}</div>
    </div>
  );
}
