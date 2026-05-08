import { useTranslation } from 'react-i18next';
import { Icon } from '../Icon/Icon';
import { cn } from '../cn';

interface LanguageSwitcherProps {
  /** "compact" → just two pills (EN | VI). "full" → adds a Globe icon + label. */
  variant?: 'compact' | 'full';
  className?: string;
}

const ORDER = ['vi', 'en'] as const;

/**
 * Two-button locale toggle. Reads/writes via react-i18next so persistence
 * is handled by the listener in apps/web/src/app/i18n/index.ts.
 */
export function LanguageSwitcher({ variant = 'compact', className }: LanguageSwitcherProps) {
  const { i18n, t } = useTranslation();
  const current = i18n.language === 'en' ? 'en' : 'vi';

  return (
    <div
      role="group"
      aria-label={t('ui.languageSwitcher.label')}
      className={cn(
        'inline-flex items-center gap-xs rounded-full border border-outline-variant bg-surface-container-low p-[2px]',
        className,
      )}
    >
      {variant === 'full' && (
        <Icon name="language" size={16} className="text-on-surface-variant ml-xs" />
      )}
      {ORDER.map((lng) => {
        const active = lng === current;
        return (
          <button
            key={lng}
            type="button"
            onClick={() => {
              if (!active) void i18n.changeLanguage(lng);
            }}
            aria-pressed={active}
            className={cn(
              'min-w-[36px] px-sm py-xs rounded-full text-[11px] font-bold tracking-wider uppercase transition-colors',
              active
                ? 'bg-primary text-on-primary'
                : 'text-on-surface-variant hover:bg-surface-container-high',
            )}
          >
            {t(`ui.languageSwitcher.short.${lng}`)}
          </button>
        );
      })}
    </div>
  );
}
