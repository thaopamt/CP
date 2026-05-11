import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Avatar, Button, Icon, SearchBox } from '@cp/ui';
import { EnrollmentStatus } from '@cp/shared';
import { useStudentsList } from '../../../api/student.queries';

interface AssignStudentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAssign: (studentIds: string[]) => Promise<void>;
  className?: string;
  isSubmitting?: boolean;
  enrolledStudentIds?: string[];
}

export function AssignStudentsModal({
  isOpen,
  onClose,
  onAssign,
  className = '',
  isSubmitting,
  enrolledStudentIds = [],
}: AssignStudentsModalProps) {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Using a simplified query without pagination just for the modal search.
  // In a real app, you might want to add pagination or infinite scrolling here.
  const { data, isLoading } = useStudentsList({
    page: 1,
    limit: 50, // Fetch up to 50 for the modal
    search,
    status: EnrollmentStatus.ACTIVE, // Only assign active students
  });

  const students = data?.items ?? [];
  const total = data?.total ?? 0;

  if (!isOpen) return null;

  function toggleRow(id: string) {
    if (enrolledStudentIds.includes(id)) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    const unEnrolled = students.filter(s => !enrolledStudentIds.includes(s.userId));
    if (selected.size === unEnrolled.length && unEnrolled.length > 0) {
      setSelected(new Set());
    } else {
      setSelected(new Set(unEnrolled.map((s) => s.userId)));
    }
  }

  function handleConfirm() {
    if (selected.size === 0) return;
    onAssign(Array.from(selected)).then(() => {
      setSelected(new Set());
    });
  }

  return (
    <div className="fixed inset-0 bg-inverse-surface/40 z-50 backdrop-blur-sm flex items-center justify-center p-md">
      <div className={`bg-surface-container-lowest rounded-xl shadow-lg w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden border border-surface-variant ${className}`}>
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-lg border-b border-surface-variant">
          <div>
            <h2 className="font-headline-md text-headline-md text-on-surface">
              {t('pages.admin.classes.detail.assignModal.title', 'Assign Students')}
            </h2>
            <p className="font-body-md text-body-md text-on-surface-variant mt-xs">
              {t('pages.admin.classes.detail.assignModal.subtitle', 'Select students to add to this class')}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label={t('common.close', 'Close')}
            className="p-sm text-on-surface-variant hover:bg-surface-variant rounded-full transition-colors"
          >
            <Icon name="close" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-hidden flex flex-col bg-surface-container-low p-lg gap-md">
          {/* Search */}
          <div className="flex gap-md w-full">
            <div className="flex-1">
              <SearchBox
                value={search}
                onChange={setSearch}
                placeholder={t('pages.admin.classes.detail.assignModal.searchPlaceholder', 'Search by name or ID...')}
              />
            </div>
          </div>

          {/* List Container */}
          <div className="flex-1 overflow-y-auto bg-surface-container-lowest border border-surface-variant rounded-lg flex flex-col">
            {/* List Header */}
            <div className="grid grid-cols-[auto_1fr_auto_auto] gap-md p-md bg-surface-container sticky top-0 border-b border-surface-variant font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider z-10">
              <div className="flex items-center justify-center w-8">
                <input
                  type="checkbox"
                  checked={students.length > 0 && selected.size === students.filter(s => !enrolledStudentIds.includes(s.userId)).length && students.filter(s => !enrolledStudentIds.includes(s.userId)).length > 0}
                  onChange={toggleAll}
                  className="rounded border-outline-variant text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                />
              </div>
              <div>{t('pages.admin.classes.detail.assignModal.columns.studentName', 'Student Name')}</div>
              <div className="w-24 text-right">{t('pages.admin.classes.detail.assignModal.columns.idNumber', 'ID Number')}</div>
              <div className="w-24 text-right">{t('pages.admin.classes.detail.assignModal.columns.grade', 'Grade')}</div>
            </div>

            {/* List Items */}
            {isLoading ? (
              <div className="p-xl flex justify-center text-on-surface-variant">
                <Icon name="progress_activity" className="animate-spin" size={24} />
              </div>
            ) : students.length === 0 ? (
              <div className="p-xl text-center text-on-surface-variant">
                {search ? t('pages.admin.classes.detail.assignModal.noSearchResults', 'No students match your search.') : t('pages.admin.classes.detail.assignModal.noStudents', 'No active students found.')}
              </div>
            ) : (
              <div className="flex flex-col divide-y divide-surface-variant">
                {students.map((s) => {
                  const isChecked = selected.has(s.userId);
                  const isEnrolled = enrolledStudentIds.includes(s.userId);

                  return (
                    <label
                      key={s.id}
                      className={`grid grid-cols-[auto_1fr_auto_auto] gap-md p-md transition-colors items-center ${
                        isEnrolled ? 'opacity-50 cursor-not-allowed bg-surface-container-highest' : 'hover:bg-surface-container-low cursor-pointer'
                      } ${
                        isChecked && !isEnrolled ? 'bg-primary-fixed/20' : ''
                      }`}
                    >
                      <div className="flex items-center justify-center w-8">
                        {isEnrolled ? (
                          <Icon name="check_circle" className="text-on-surface-variant" size={20} />
                        ) : (
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleRow(s.userId)}
                            className="rounded border-outline-variant text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                          />
                        )}
                      </div>
                      <div className="flex items-center gap-sm min-w-0">
                        <Avatar size="sm" initials={`${s.firstName[0] ?? ''}${s.lastName[0] ?? ''}`.toUpperCase()} src={s.avatarUrl ?? undefined} />
                        <span className="font-body-md text-body-md font-medium text-on-surface truncate flex items-center gap-xs">
                          {s.firstName} {s.lastName}
                          {isEnrolled && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-surface-variant text-on-surface-variant uppercase tracking-wider ml-sm">
                              {t('pages.admin.classes.detail.assignModal.alreadyEnrolled', 'Enrolled')}
                            </span>
                          )}
                        </span>
                      </div>
                      <div className="w-24 text-right font-body-md text-body-md text-on-surface-variant truncate">
                        {s.studentId}
                      </div>
                      <div className="w-24 text-right">
                        <span className="inline-flex items-center px-2 py-1 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-[12px] whitespace-nowrap">
                          {t('pages.admin.students.gradeOptions.g' + s.grade)}
                        </span>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {/* Selection Status */}
          <div className="flex justify-between items-center text-on-surface-variant font-label-sm text-label-sm">
            <span>{t('pages.admin.classes.detail.assignModal.selectedCount', { count: selected.size })}</span>
            <span>{t('pages.admin.classes.detail.assignModal.showingCount', { showing: students.length, total: total })}</span>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end p-lg border-t border-surface-variant gap-md bg-surface-container-lowest">
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            {t('common.cancel', 'Cancel')}
          </Button>
          <Button
            variant="admin"
            disabled={selected.size === 0 || isSubmitting}
            onClick={handleConfirm}
            trailingIcon={isSubmitting ? <Icon name="progress_activity" size={18} className="animate-spin" /> : undefined}
          >
            {isSubmitting
              ? t('pages.admin.classes.detail.assignModal.assigning', 'Assigning...')
              : t('pages.admin.classes.detail.assignModal.confirm', 'Confirm Assignment')}
          </Button>
        </div>
      </div>
    </div>
  );
}
