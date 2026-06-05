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
  useConfirm,
} from '@cp/ui';
import {
  ClassStatus,
  IClassEnrollment,
  PaymentStatus,
  IClassCourseLink,
} from '@cp/shared';

import { useClass, useEnrollmentsByClass, useEnrollStudent, useDropEnrollment } from '../../../api/class.queries';
import {
  useAttachClassCourses,
  useClassCourses,
  useDetachClassCourse,
  useReorderClassCourses,
} from '../../../api/curriculum.queries';
import { AssignStudentsModal } from './AssignStudentsModal';
import { RemoveStudentModal } from './RemoveStudentModal';
import { CoursePickerDialog } from './ClassCurriculumPage';
import { useToast } from '@cp/ui';

type Tab = 'courses' | 'roster' | 'activity';

export default function ClassDetailPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { classId } = useParams<{ classId: string }>();

  const classQuery = useClass(classId);
  const rosterQuery = useEnrollmentsByClass(classId);
  const coursesQuery = useClassCourses(classId);
  const enrollStudent = useEnrollStudent();
  const dropEnrollment = useDropEnrollment(classId ?? '');
  const attachCourse = useAttachClassCourses(classId ?? '');
  const detachCourse = useDetachClassCourse(classId ?? '');
  const reorderCourses = useReorderClassCourses(classId ?? '');

  const [tab, setTab] = useState<Tab>('courses');
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isCoursePickerOpen, setIsCoursePickerOpen] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [studentToRemove, setStudentToRemove] = useState<IClassEnrollment | null>(null);
  const toast = useToast();
  const confirm = useConfirm();

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

  const initials = (name: string) =>
    name.split(' ').slice(0, 2).map((p) => p[0]).join('').toUpperCase();

  const cls = classQuery.data;

  const activity: TimelineItem[] = useMemo(() => {
    if (!cls || cls.enrolledCount === 0) return [];
    return [
      {
        id: 'a1',
        icon: 'person_add',
        tone: 'primary',
        title: t('pages.admin.dashboard.activities.enroll.title'),
        meta: t('pages.admin.classes.list.enrollmentLabel', { count: cls.enrolledCount }) + ` · ${cls.name}`,
        time: t('ui.helpQueue.hoursAgo', { count: 3 }),
      },
      {
        id: 'a2',
        icon: 'event_available',
        tone: 'tertiary',
        title: t('pages.teacher.dashboard.todaysAttendance'),
        meta: `${cls.attendanceRate ?? 0}%`,
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
  const classCourses = (coursesQuery.data ?? []).slice().sort((a, b) => a.order - b.order);

  function moveCourseUp(idx: number) {
    if (idx <= 0) return;
    const ids = classCourses.map((link) => link.id);
    [ids[idx - 1], ids[idx]] = [ids[idx], ids[idx - 1]];
    reorderCourses.mutate(ids);
  }

  function moveCourseDown(idx: number) {
    if (idx >= classCourses.length - 1) return;
    const ids = classCourses.map((link) => link.id);
    [ids[idx], ids[idx + 1]] = [ids[idx + 1], ids[idx]];
    reorderCourses.mutate(ids);
  }

  return (
    <div className="flex flex-col gap-lg">
      <PageHeader
        breadcrumb={
          <Breadcrumb
            items={[
              { label: t('nav.admin.classes'), onClick: () => navigate('/admin/classes') },
              { label: `${cls.name} (${cls.code})` },
            ]}
          />
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

      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-md">
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
          value={`${cls.enrolledCount}`}
          caption={t('pages.admin.classes.detail.kpi.rosterCount')}
        />

      </section>

      <div className="bg-surface-container-lowest border border-outline-variant/50 rounded-xl shadow-elev-1 overflow-hidden">
        <header className="px-md md:px-lg pt-md border-b border-outline-variant/30">
          <TabPills
            value={tab}
            onChange={setTab}
            options={[
              { value: 'courses', label: t('pages.admin.classes.detail.tabs.courses'), count: classCourses.length },
              { value: 'roster', label: t('pages.admin.classes.detail.tabs.roster'), count: cls.enrolledCount },
              { value: 'activity', label: t('pages.admin.classes.detail.tabs.activity') },
            ]}
            className="mb-md"
          />
        </header>

        {tab === 'courses' && (
          <div className="flex flex-col">
            <div className="flex flex-col gap-xs p-md border-b border-outline-variant/30 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="font-manrope text-headline-sm text-on-surface">
                  {t('pages.admin.classes.detail.courses.title')}
                </h3>
                <p className="text-label-sm text-on-surface-variant">
                  {t('pages.admin.classes.detail.courses.subtitle')}
                </p>
              </div>
              <Button
                variant="admin"
                size="sm"
                leadingIcon={<Icon name="library_add" size={16} />}
                onClick={() => setIsCoursePickerOpen(true)}
              >
                {t('pages.admin.classCurriculum.addCourses')}
              </Button>
            </div>
            {coursesQuery.isLoading ? (
              <div className="p-xl text-center text-on-surface-variant">{t('common.loading')}</div>
            ) : classCourses.length === 0 ? (
              <div className="p-xl text-center">
                <Icon name="school" size={36} className="mx-auto mb-sm text-on-surface-variant/50" />
                <p className="text-body-md text-on-surface-variant">
                  {t('pages.admin.classCurriculum.empty')}
                </p>
                <Button
                  variant="admin"
                  size="sm"
                  className="mt-md"
                  leadingIcon={<Icon name="library_add" size={16} />}
                  onClick={() => setIsCoursePickerOpen(true)}
                >
                  {t('pages.admin.classCurriculum.addCourses')}
                </Button>
              </div>
            ) : (
              <ul className="divide-y divide-outline-variant/30">
                {classCourses.map((link, idx) => (
                  <ClassCourseRow
                    key={link.id}
                    link={link}
                    index={idx}
                    isFirst={idx === 0}
                    isLast={idx === classCourses.length - 1}
                    onMoveUp={() => moveCourseUp(idx)}
                    onMoveDown={() => moveCourseDown(idx)}
                    onDetach={async () => {
                      const ok = await confirm({
                        title: t('common.confirmDelete', 'Confirm'),
                        message: t('pages.admin.classCurriculum.detachConfirm', 'Are you sure you want to remove this course from the class?'),
                        intent: 'danger',
                      });
                      if (ok) detachCourse.mutate(link.id);
                    }}
                    onOpen={() => navigate(`/admin/courses/${link.course.id}`)}
                    detaching={detachCourse.isPending}
                    reordering={reorderCourses.isPending}
                  />
                ))}
              </ul>
            )}
          </div>
        )}

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

      {isCoursePickerOpen && classId && (
        <CoursePickerDialog
          alreadyAttachedIds={new Set(classCourses.map((link) => link.course.id))}
          onClose={() => setIsCoursePickerOpen(false)}
          onConfirm={async (ids) => {
            try {
              await attachCourse.mutateAsync(ids);
              setIsCoursePickerOpen(false);
              toast.success(t('pages.admin.classCurriculum.picker.success', 'Courses attached successfully.'));
            } catch (err: any) {
              console.error('Attach course error:', err);
              toast.error(err?.response?.data?.message || err.message || t('common.error', 'Failed to attach courses.'));
            }
          }}
          isSubmitting={attachCourse.isPending}
        />
      )}
    </div>
  );
}

function ClassCourseRow({
  link,
  index,
  isFirst,
  isLast,
  onMoveUp,
  onMoveDown,
  onDetach,
  onOpen,
  detaching,
  reordering,
}: {
  link: IClassCourseLink;
  index: number;
  isFirst: boolean;
  isLast: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDetach: () => void;
  onOpen: () => void;
  detaching: boolean;
  reordering: boolean;
}) {
  const { t } = useTranslation();
  const course = link.course;

  return (
    <li className="flex items-center gap-md p-md md:p-lg group hover:bg-surface-container-high/30 transition-colors">
      <span className="w-8 h-8 rounded-full bg-primary-container text-on-primary-container grid place-items-center font-bold text-label-sm shrink-0">
        {index + 1}
      </span>
      <button type="button" onClick={onOpen} className="flex-1 min-w-0 text-left hover:text-primary">
        <div className="text-on-surface font-medium truncate">{course.title}</div>
        <div className="text-[12px] text-on-surface-variant flex items-center gap-sm flex-wrap">
          <span className="font-mono">{course.code}</span>
          <span className="w-1 h-1 rounded-full bg-outline-variant" />
          <span>{course.subject}</span>
          <span className="w-1 h-1 rounded-full bg-outline-variant" />
          <span>{t('pages.admin.coursesList.weeks', { count: course.durationWeeks })}</span>
          <span className="w-1 h-1 rounded-full bg-outline-variant" />
          <span>{t('pages.admin.coursesList.assignmentCount', { count: course.assignmentCount, points: course.totalPoints })}</span>
        </div>
      </button>
      <div className="flex items-center gap-xs">
        <button
          type="button"
          onClick={onMoveUp}
          disabled={isFirst || reordering}
          className="p-1 rounded text-on-surface-variant hover:text-primary disabled:opacity-30 disabled:hover:text-on-surface-variant"
          aria-label={t('pages.admin.courseDetail.moveUp')}
        >
          <Icon name="arrow_upward" size={18} />
        </button>
        <button
          type="button"
          onClick={onMoveDown}
          disabled={isLast || reordering}
          className="p-1 rounded text-on-surface-variant hover:text-primary disabled:opacity-30 disabled:hover:text-on-surface-variant"
          aria-label={t('pages.admin.courseDetail.moveDown')}
        >
          <Icon name="arrow_downward" size={18} />
        </button>
        <button
          type="button"
          onClick={onDetach}
          disabled={detaching}
          className="p-1 rounded text-on-surface-variant hover:text-error disabled:opacity-30"
          aria-label={t('common.delete')}
        >
          <Icon name="delete" size={18} />
        </button>
      </div>
    </li>
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
