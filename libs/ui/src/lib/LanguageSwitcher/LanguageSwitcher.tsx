import { useTranslation } from 'react-i18next';
import { Icon } from '../Icon/Icon';
import { cn } from '../cn';

interface LanguageSwitcherProps {
  /** "compact" → just two pills (EN | VI). "full" → adds a Globe icon + label. */
  variant?: 'compact' | 'full';
  className?: string;
}

export function LanguageSwitcher({ variant = 'compact', className }: LanguageSwitcherProps) {
  const { i18n, t } = useTranslation();
  const current = i18n.language === 'en' ? 'en' : 'vi';
  const isEn = current === 'en';

  return (
    <button
      type="button"
      onClick={() => void i18n.changeLanguage(isEn ? 'vi' : 'en')}
      aria-label={t('ui.languageSwitcher.label')}
      title={isEn ? 'Switch to Tiếng Việt' : 'Switch to English'}
      className={cn(
        'p-2 rounded-full hover:bg-surface-container-high transition-colors flex items-center justify-center text-on-surface-variant gap-1',
        className,
      )}
    >
      <Icon name="language" size={20} />
      {(variant === 'full' || variant === 'compact') && (
        <span className="text-[11px] font-bold tracking-wider uppercase">
          {current}
        </span>
      )}
    </button>
  );
}
