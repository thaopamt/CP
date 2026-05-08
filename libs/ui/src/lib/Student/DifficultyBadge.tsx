import { useTranslation } from 'react-i18next';
import { DifficultyLevel } from '@cp/shared';
import { StatusBadge } from '../StatusBadge/StatusBadge';

const TONE: Record<DifficultyLevel, 'success' | 'warning' | 'error'> = {
  [DifficultyLevel.EASY]: 'success',
  [DifficultyLevel.MEDIUM]: 'warning',
  [DifficultyLevel.HARD]: 'error',
};

export function DifficultyBadge({ difficulty }: { difficulty: DifficultyLevel }) {
  const { t } = useTranslation();
  return <StatusBadge tone={TONE[difficulty]}>{t(`enums.difficultyLevel.${difficulty}`)}</StatusBadge>;
}
