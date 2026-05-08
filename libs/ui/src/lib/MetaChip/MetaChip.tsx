import { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Icon } from '../Icon/Icon';
import { cn } from '../cn';

interface MetaChipProps {
  children: ReactNode;
  onRemove?: () => void;
  className?: string;
}

/**
 * Small dismissible pill — used for prerequisites/tags in the Course Builder.
 */
export function MetaChip({ children, onRemove, className }: MetaChipProps) {
  const { t } = useTranslation();
  return (
    <span
      className={cn(
        'inline-flex items-center gap-xs px-md py-xs rounded-full bg-secondary-container/40 text-on-secondary-container text-label-sm',
        className,
      )}
    >
      {children}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="grid place-items-center w-4 h-4 rounded-full hover:bg-secondary/20"
          aria-label={t('common.delete')}
        >
          <Icon name="close" size={14} />
        </button>
      )}
    </span>
  );
}
