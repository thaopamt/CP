import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Icon, useToast } from '@cp/ui';
import { useBlockStudent } from '../../../api/student.queries';

interface BlockStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: string;
}

export function BlockStudentModal({ isOpen, onClose, studentId }: BlockStudentModalProps) {
  const { t } = useTranslation();
  const toast = useToast();
  const blockStudent = useBlockStudent(studentId);
  const [reason, setReason] = useState('');

  if (!isOpen) return null;

  async function handleBlock() {
    try {
      const result = await blockStudent.mutateAsync(reason.trim());
      const deletedCount =
        result.submissionsDeleted +
        result.assignmentProgressDeleted +
        result.questsDeleted +
        result.badgesDeleted +
        result.shopItemsDeleted +
        result.mazeSubmissionsDeleted;
      toast.success(
        t('pages.admin.studentProfile.block.success', {
          defaultValue: 'Đã block học sinh và reset dữ liệu học tập ({{count}} bản ghi).',
          count: deletedCount,
        }),
      );
      setReason('');
      onClose();
    } catch {
      toast.error(t('pages.admin.studentProfile.block.error', 'Không thể block học sinh. Vui lòng thử lại.'));
    }
  }

  return (
    <div className="fixed inset-0 bg-inverse-surface/40 z-50 backdrop-blur-sm flex items-center justify-center p-md">
      <div className="bg-surface-container-lowest rounded-xl shadow-lg w-full max-w-md flex flex-col overflow-hidden border border-surface-variant animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center gap-sm p-lg pb-md">
          <div className="w-10 h-10 rounded-full bg-error-container/30 text-error flex items-center justify-center shrink-0">
            <Icon name="block" />
          </div>
          <h2 className="font-headline-sm text-headline-sm text-on-surface">
            {t('pages.admin.studentProfile.block.title', 'Block student')}
          </h2>
        </div>

        <div className="px-lg pb-lg space-y-4">
          <div className="space-y-2 text-left">
            <p className="text-body-md">
              {t(
                'pages.admin.studentProfile.block.message',
                'Học sinh sẽ không thể truy cập website. Hệ thống sẽ xóa bài đã làm, submissions, progress khóa học, quest, badge, maze, shop và đặt lại XP/gems/level.',
              )}
            </p>
            <p className="text-body-md font-medium">
              {t(
                'pages.admin.studentProfile.block.keep',
                'Thông tin cá nhân, học phí, lớp học, lịch học, điểm danh và dữ liệu finance sẽ được giữ nguyên.',
              )}
            </p>
            <p className="text-body-md text-error font-medium">
              {t(
                'pages.admin.studentProfile.block.noRestore',
                'Unblock sau này chỉ mở lại quyền truy cập, không khôi phục dữ liệu học tập đã reset.',
              )}
            </p>
          </div>

          <div className="space-y-1">
            <label className="text-label-md font-medium text-on-surface-variant">
              {t('pages.admin.studentProfile.block.reasonLabel', 'Lý do khóa tài khoản (Tùy chọn)')}
            </label>
            <textarea
              className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-md py-sm focus:ring-2 focus:ring-primary outline-none text-body-md h-24 resize-none"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t('pages.admin.studentProfile.block.reasonPlaceholder', 'Nhập lý do khóa tài khoản...')}
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-sm p-md border-t border-surface-variant bg-surface-container/50">
          <Button variant="ghost" onClick={onClose} disabled={blockStudent.isPending}>
            {t('common.cancel', 'Cancel')}
          </Button>
          <Button variant="filled" intent="danger" onClick={handleBlock} isLoading={blockStudent.isPending}>
            {t('pages.admin.studentProfile.block.confirm', 'Block student')}
          </Button>
        </div>
      </div>
    </div>
  );
}
