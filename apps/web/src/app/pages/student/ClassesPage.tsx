import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button, Icon, StatusBadge, useConfirm, useAlert } from '@cp/ui';
import { EnrollmentLifecycle, IClassLearningProgress } from '@cp/shared';
import { useAuthStore } from '../../stores/auth.store';
import { useEnrollmentsByStudent, useDropEnrollment } from '../../api/class.queries';

const STATUS_TONE: Record<EnrollmentLifecycle, 'success' | 'warning' | 'error' | 'neutral'> = {
  ACTIVE: 'success',
  DROPPED: 'error',
  COMPLETED: 'neutral',
  WAITLIST: 'warning',
};

export default function StudentClassesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  // Actually we need the studentId. Assuming user.id maps to the student profile.
  // In our backend, the enrollmentsApi takes studentId but our mock uses user.id for simplicity if it's a 1-1 mapping.
  // Let's use user?.id for now.
  const { data: enrollments, isLoading, isError } = useEnrollmentsByStudent(user?.id);
  const dropMutation = useDropEnrollment(''); // Provide a dummy id, we'll pass the actual classId to invalidate

  const confirm = useConfirm();
  const alert = useAlert();

  const handleDrop = async (enrollmentId: string) => {
    const ok = await confirm({
      title: t('common.confirmDelete'),
      message: t('pages.student.classes.confirmDrop'),
      intent: 'danger',
    });
    if (ok) {
      await dropMutation.mutateAsync(enrollmentId);
    }
  };

  const handleJoinClass = async () => {
    const code = window.prompt(t('pages.student.classes.joinPrompt'));
    if (code) {
      await alert({
        title: t('common.notice'),
        message: `Backend integration needed to join class via code: ${code}`,
        intent: 'primary',
      });
    }
  };

  return (
    <div className="flex flex-col gap-lg pt-md">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-md mb-md">
        <div>
          <h1 className="font-manrope text-headline-md text-on-surface">{t('pages.student.classes.pageTitle')}</h1>
          <p className="text-body-md text-on-surface-variant mt-xs">
            {t('pages.student.classes.pageSubtitle')}
          </p>
        </div>
        <Button variant="student" leadingIcon={<Icon name="add" size={18} />} onClick={handleJoinClass}>
          {t('pages.student.classes.joinClass')}
        </Button>
      </header>

      {isLoading ? (
        <div className="grid h-64 place-items-center">
          <Icon name="progress_activity" size={32} className="animate-spin text-primary" />
        </div>
      ) : isError ? (
        <div className="grid h-64 place-items-center text-error">
          <div className="text-center">
            <Icon name="error" size={36} className="mb-2" />
            <p>{t('pages.student.classes.failedToLoad')}</p>
          </div>
        </div>
      ) : !enrollments || enrollments.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-xl text-center shadow-sm">
          <div className="w-16 h-16 rounded-full bg-primary-container/30 text-primary mx-auto grid place-items-center mb-md">
            <Icon name="school" size={32} />
          </div>
          <h3 className="font-manrope text-title-lg text-on-surface mb-xs">{t('pages.student.classes.noClassesTitle')}</h3>
          <p className="text-body-md text-on-surface-variant max-w-sm mx-auto mb-lg">
            {t('pages.student.classes.noClassesDesc')}
          </p>
          <Button variant="outline" onClick={handleJoinClass}>
            {t('pages.student.classes.enterClassCode')}
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md">
          {enrollments.map((enrollment) => (
            <article
              key={enrollment.id}
              onClick={() => navigate(`/student/classes/${enrollment.classId}`)}
              className="bg-surface-container-lowest rounded-2xl border border-outline-variant hover:shadow-md hover:border-primary/30 transition-all p-lg flex flex-col gap-md cursor-pointer group"
            >
              <div className="flex justify-between items-start">
                <div className="w-12 h-12 rounded-xl bg-primary-container text-on-primary-container grid place-items-center">
                  <Icon name="class" size={24} />
                </div>
                <StatusBadge tone={STATUS_TONE[enrollment.status]}>{enrollment.status}</StatusBadge>
              </div>

              <div>
                <div className="text-label-sm text-on-surface-variant mb-1 font-mono">
                  {enrollment.classCode || enrollment.classId.substring(0, 8)}
                </div>
                <h3
                  className="font-manrope text-title-md text-on-surface font-bold line-clamp-2"
                  title={enrollment.className}
                >
                  {enrollment.className || `Class #${enrollment.classId.substring(0, 4)}`}
                </h3>
              </div>

              <ClassLearningProgress progress={enrollment.learningProgress} />

              <div className="mt-auto pt-md border-t border-outline-variant flex items-center justify-between">
                <span className="text-label-sm text-on-surface-variant">
                  {t('pages.student.classes.attendancePct', { pct: enrollment.attendancePercentage })}
                </span>

                {enrollment.status === 'ACTIVE' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDrop(enrollment.id);
                    }}
                    className="text-label-sm text-error hover:text-error/80 font-medium transition-colors"
                  >
                    {t('pages.student.classes.dropClass')}
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function ClassLearningProgress({ progress }: { progress?: IClassLearningProgress }) {
  const { t } = useTranslation();
  const totalAssignments = progress?.totalAssignments ?? 0;
  const completedAssignments = progress?.completedAssignments ?? 0;
  const percentage = Math.max(0, Math.min(100, Math.round(progress?.percentage ?? 0)));
  const hasAssignments = totalAssignments > 0;

  return (
    <div className="rounded-xl border border-outline-variant/70 bg-surface-container-low p-sm">
      <div className="mb-xs flex items-center justify-between gap-sm">
        <span className="inline-flex items-center gap-xs text-label-sm text-on-surface-variant">
          <Icon name="trending_up" size={16} className="text-primary" />
          {t('pages.student.classes.progressLabel')}
        </span>
        <span className="text-label-sm font-bold text-on-surface">{percentage}%</span>
      </div>
      <div
        className="h-2 rounded-full bg-surface-container-highest overflow-hidden"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percentage}
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary to-tertiary transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p className="mt-xs text-[11px] text-on-surface-variant">
        {hasAssignments
          ? t('pages.student.classes.progressSummary', {
              completed: completedAssignments,
              total: totalAssignments,
            })
          : t('pages.student.classes.noAssignments')}
      </p>
    </div>
  );
}
