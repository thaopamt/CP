import { useTranslation } from 'react-i18next';
import { AttendanceStatus } from '@cp/shared';
import { StatusBadge } from '../StatusBadge/StatusBadge';

const TONE: Record<AttendanceStatus, 'success' | 'error' | 'warning' | 'neutral'> = {
  [AttendanceStatus.PRESENT]: 'success',
  [AttendanceStatus.ABSENT]: 'error',
  [AttendanceStatus.LATE]: 'warning',
  [AttendanceStatus.UNMARKED]: 'neutral',
};

export function AttendanceStatusBadge({ status }: { status: AttendanceStatus }) {
  const { t } = useTranslation();
  return <StatusBadge tone={TONE[status]}>{t(`enums.attendanceStatus.${status}`)}</StatusBadge>;
}
