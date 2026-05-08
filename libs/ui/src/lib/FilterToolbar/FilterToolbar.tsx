import { ReactNode, SelectHTMLAttributes } from 'react';
import { useTranslation } from 'react-i18next';
import { Icon } from '../Icon/Icon';
import { cn } from '../cn';

interface SearchBoxProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}

export function SearchBox({ value, onChange, placeholder, className }: SearchBoxProps) {
  const { t } = useTranslation();
  return (
    <div className={cn('relative flex-1 min-w-0', className)}>
      <Icon
        name="search"
        className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant"
      />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? `${t('common.search')}…`}
        className="w-full pl-10 pr-md py-sm bg-surface-container-low border border-outline-variant rounded-lg text-label-sm focus:ring-2 focus:ring-primary outline-none"
      />
    </div>
  );
}

interface SelectFilterProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
}

export function SelectFilter({ label, options, className, ...rest }: SelectFilterProps) {
  return (
    <label className={cn('flex items-center gap-sm', className)}>
      {label && <span className="text-label-sm text-on-surface-variant">{label}</span>}
      <select
        {...rest}
        className="bg-surface-container-low border border-outline-variant rounded-lg px-md py-sm text-label-sm focus:ring-2 focus:ring-primary outline-none"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

interface FilterToolbarProps {
  children: ReactNode;
  className?: string;
}

/**
 * Layout shell for table/grid filter rows. Stacks on mobile, lays out
 * inline on md+. Children typically include a SearchBox followed by
 * one or more SelectFilters.
 */
export function FilterToolbar({ children, className }: FilterToolbarProps) {
  return (
    <div
      className={cn(
        'flex flex-col md:flex-row md:items-center gap-sm md:gap-md',
        'bg-surface-container-lowest border border-outline-variant/50 rounded-lg p-md',
        className,
      )}
    >
      {children}
    </div>
  );
}
