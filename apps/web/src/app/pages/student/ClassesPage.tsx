import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button, Icon, StatusBadge } from '@cp/ui';
import { EnrollmentLifecycle } from '@cp/shared';
import { useAuthStore } from '../../stores/auth.store';
import { useEnrollmentsByStudent, useDropEnrollment } from '../../api/class.queries';

const STATUS_TONE: Record<EnrollmentLifecycle, 'success' | 'warning' | 'error' | 'neutral'> = {
  ACTIVE: 'success',
  PENDING_PAYMENT: 'warning',
  DROPPED: 'error',
  COMPLETED: 'neutral',
  INVITED: 'neutral',
  WAITLISTED: 'warning',
};

export default function StudentClassesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = useAuthStore(s => s.user);
  
  // Actually we need the studentId. Assuming user.id maps to the student profile.
  // In our backend, the enrollmentsApi takes studentId but our mock uses user.id for simplicity if it's a 1-1 mapping.
  // Let's use user?.id for now.
  const { data: enrollments, isLoading, isError } = useEnrollmentsByStudent(user?.id);
  const dropMutation = useDropEnrollment(''); // Provide a dummy id, we'll pass the actual classId to invalidate

  const handleDrop = async (enrollmentId: string) => {
    if (window.confirm(t('Are you sure you want to drop this class?'))) {
      await dropMutation.mutateAsync(enrollmentId);
    }
  };

  const handleJoinClass = () => {
    const code = window.prompt(t('Enter class code to join:'));
    if (code) {
      alert(`Backend integration needed to join class via code: ${code}`);
    }
  };

  return (
    <div className="flex flex-col gap-lg pt-md">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-md mb-md">
        <div>
          <h1 className="font-manrope text-headline-md text-on-surface">My Classes</h1>
          <p className="text-body-md text-on-surface-variant mt-xs">
            Manage your class enrollments and progress
          </p>
        </div>
        <Button
          variant="student"
          leadingIcon={<Icon name="add" size={18} />}
          onClick={handleJoinClass}
        >
          Join a Class
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
            <p>Failed to load classes.</p>
          </div>
        </div>
      ) : !enrollments || enrollments.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-xl text-center shadow-sm">
          <div className="w-16 h-16 rounded-full bg-primary-container/30 text-primary mx-auto grid place-items-center mb-md">
            <Icon name="school" size={32} />
          </div>
          <h3 className="font-manrope text-title-lg text-on-surface mb-xs">No Classes Yet</h3>
          <p className="text-body-md text-on-surface-variant max-w-sm mx-auto mb-lg">
            You are not currently enrolled in any classes. Join a class using a code provided by your teacher.
          </p>
          <Button variant="outline" onClick={handleJoinClass}>
            Enter Class Code
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md">
          {enrollments.map(enrollment => (
            <article
              key={enrollment.id}
              onClick={() => navigate(`/student/classes/${enrollment.classId}`)}
              className="bg-surface-container-lowest rounded-2xl border border-outline-variant hover:shadow-md hover:border-primary/30 transition-all p-lg flex flex-col gap-md cursor-pointer group">
              <div className="flex justify-between items-start">
                <div className="w-12 h-12 rounded-xl bg-primary-container text-on-primary-container grid place-items-center">
                  <Icon name="class" size={24} />
                </div>
                <StatusBadge tone={STATUS_TONE[enrollment.status]}>
                  {enrollment.status}
                </StatusBadge>
              </div>
              
              <div>
                <div className="text-label-sm text-on-surface-variant mb-1 font-mono">{enrollment.classId.substring(0, 8)}</div>
                <h3 className="font-manrope text-title-md text-on-surface font-bold line-clamp-2">
                  Class #{enrollment.classId.substring(0, 4)}
                </h3>
              </div>

              <div className="mt-auto pt-md border-t border-outline-variant flex items-center justify-between">
                <span className="text-label-sm text-on-surface-variant">
                  {enrollment.attendancePercentage}% Attendance
                </span>
                
                {enrollment.status === 'ACTIVE' && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleDrop(enrollment.id); }}
                    className="text-label-sm text-error hover:text-error/80 font-medium transition-colors"
                  >
                    Drop Class
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
