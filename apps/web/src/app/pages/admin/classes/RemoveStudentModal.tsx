import { useTranslation } from 'react-i18next';
import { Button, Icon } from '@cp/ui';
import { IClassEnrollment } from '@cp/shared';

interface RemoveStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  student: IClassEnrollment | null;
  isSubmitting?: boolean;
}

export function RemoveStudentModal({ isOpen, onClose, onConfirm, student, isSubmitting }: RemoveStudentModalProps) {
  const { t } = useTranslation();

  if (!isOpen || !student) return null;

  return (
    <div className="fixed inset-0 bg-inverse-surface/40 z-50 backdrop-blur-sm flex items-center justify-center p-md">
      <div className="bg-surface-container-lowest rounded-xl shadow-lg w-full max-w-md flex flex-col overflow-hidden border border-surface-variant animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center gap-sm p-lg pb-md">
          <div className="w-10 h-10 rounded-full bg-error-container/30 text-error flex items-center justify-center shrink-0">
            <Icon name="person_remove" />
          </div>
          <h2 className="font-headline-sm text-headline-sm text-on-surface">
            {t('pages.admin.classes.detail.roster.removeModal.title', 'Remove Student')}
          </h2>
        </div>
        
        <div className="px-lg pb-lg">
          <p className="text-body-md text-on-surface-variant">
            {t('pages.admin.classes.detail.roster.removeModal.desc', 'Are you sure you want to remove {{name}} from this class?', { name: student.studentName })}
          </p>
          <p className="text-body-sm text-on-surface-variant mt-sm">
            {t('pages.admin.classes.detail.roster.removeModal.warning', 'This action will drop the student from the current class roster. You can re-assign them later if needed.')}
          </p>
        </div>

        <div className="flex items-center justify-end gap-sm p-md border-t border-surface-variant bg-surface-container/50">
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            {t('common.cancel', 'Cancel')}
          </Button>
          <Button
            variant="admin"
            className="!bg-error !text-on-error hover:!bg-error/90 ring-error"
            disabled={isSubmitting}
            onClick={onConfirm}
            trailingIcon={isSubmitting ? <Icon name="progress_activity" size={18} className="animate-spin" /> : undefined}
          >
            {isSubmitting 
              ? t('pages.admin.classes.detail.roster.removeModal.removing', 'Removing...')
              : t('pages.admin.classes.detail.roster.removeModal.confirm', 'Remove')}
          </Button>
        </div>
      </div>
    </div>
  );
}
