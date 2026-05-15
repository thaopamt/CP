import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Icon } from '@cp/ui';

interface ResetPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (password: string) => Promise<void>;
  isSubmitting?: boolean;
}

export function ResetPasswordModal({ isOpen, onClose, onConfirm, isSubmitting }: ResetPasswordModalProps) {
  const { t } = useTranslation();
  const [password, setPassword] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-inverse-surface/40 z-50 backdrop-blur-sm flex items-center justify-center p-md">
      <div className="bg-surface-container-lowest rounded-xl shadow-lg w-full max-w-md flex flex-col overflow-hidden border border-surface-variant animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center gap-sm p-lg pb-md">
          <div className="w-10 h-10 rounded-full bg-primary-container/30 text-primary flex items-center justify-center shrink-0">
            <Icon name="lock_reset" />
          </div>
          <h2 className="font-headline-sm text-headline-sm text-on-surface">
            {t('pages.admin.studentProfile.resetPasswordModal.title', 'Reset Password')}
          </h2>
        </div>
        
        <div className="px-lg pb-lg">
          <p className="text-body-md text-on-surface-variant mb-md">
            {t('pages.admin.studentProfile.resetPasswordModal.desc', 'Enter a new password for this student. The password must be at least 6 characters long.')}
          </p>
          <input
            type="text"
            placeholder={t('pages.admin.studentProfile.resetPasswordModal.placeholder', 'New Password')}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-md py-sm focus:ring-2 focus:ring-primary outline-none"
          />
        </div>

        <div className="flex items-center justify-end gap-sm p-md border-t border-surface-variant bg-surface-container/50">
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            {t('common.cancel', 'Cancel')}
          </Button>
          <Button
            variant="admin"
            disabled={isSubmitting || password.length < 6}
            onClick={() => onConfirm(password).then(() => setPassword(''))}
            trailingIcon={isSubmitting ? <Icon name="progress_activity" size={18} className="animate-spin" /> : undefined}
          >
            {isSubmitting 
              ? t('pages.admin.studentProfile.resetPasswordModal.saving', 'Saving...')
              : t('pages.admin.studentProfile.resetPasswordModal.confirm', 'Reset Password')}
          </Button>
        </div>
      </div>
    </div>
  );
}
