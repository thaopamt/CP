import { useTranslation } from 'react-i18next';
import { ChallengeDifficulty } from '@cp/shared';
import { cn } from '../cn';

interface DifficultySelectorProps {
  value: ChallengeDifficulty;
  onChange: (v: ChallengeDifficulty) => void;
  className?: string;
}

const ORDER: ChallengeDifficulty[] = [
  ChallengeDifficulty.EASY,
  ChallengeDifficulty.MEDIUM,
  ChallengeDifficulty.HARD,
];

const ACTIVE_TONE: Record<ChallengeDifficulty, string> = {
  [ChallengeDifficulty.EASY]: 'bg-tertiary-container/40 text-tertiary border-tertiary',
  [ChallengeDifficulty.MEDIUM]:
    'bg-tertiary-fixed-dim/40 text-on-tertiary-fixed-variant border-tertiary-fixed',
  [ChallengeDifficulty.HARD]: 'bg-error-container/60 text-on-error-container border-error',
};

/**
 * Three-button segmented control. Pair with a label like
 * "<span className='text-label-sm text-on-surface-variant'>Difficulty</span>".
 */
export function DifficultySelector({ value, onChange, className }: DifficultySelectorProps) {
  const { t } = useTranslation();
  return (
    <div className={cn('inline-flex rounded-lg border border-outline-variant overflow-hidden', className)}>
      {ORDER.map((d) => {
        const active = d === value;
        return (
          <button
            key={d}
            type="button"
            onClick={() => onChange(d)}
            aria-pressed={active}
            className={cn(
              'px-md py-sm text-label-sm font-semibold border-l first:border-l-0 transition-colors',
              active
                ? ACTIVE_TONE[d]
                : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high border-outline-variant',
            )}
          >
            {t(`enums.challengeDifficulty.${d}`)}
          </button>
        );
      })}
    </div>
  );
}
