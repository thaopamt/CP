import { useTranslation } from 'react-i18next';
import { ClassStatus } from '@cp/shared';
import { StatusBadge } from './StatusBadge';

const TONE: Record<ClassStatus, 'success' | 'warning' | 'error' | 'neutral'> = {
  [ClassStatus.ACTIVE]: 'success',
  [ClassStatus.UPCOMING]: 'warning',
  [ClassStatus.FULL]: 'error',
  [ClassStatus.ARCHIVED]: 'neutral',
};

export function ClassStatusBadge({ status }: { status: ClassStatus }) {
  const { t } = useTranslation();
  return <StatusBadge tone={TONE[status]}>{t(`enums.classStatus.${status}`)}</StatusBadge>;
}
