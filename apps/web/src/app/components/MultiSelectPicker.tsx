import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Icon } from '@cp/ui';

export interface PickerOption {
  id: string;
  label: string;
  sublabel?: string;
}

/**
 * Searchable checkbox list for assigning a set of entities (teachers,
 * students, …). Controlled via `selected` + `onChange`. Keeps its own
 * search-text state only.
 */
export function MultiSelectPicker({
  options,
  selected,
  onChange,
  searchPlaceholder,
  emptyText,
  loading,
  maxHeight = 'max-h-72',
}: {
  options: PickerOption[];
  selected: Set<string>;
  onChange: (next: Set<string>) => void;
  searchPlaceholder?: string;
  emptyText?: string;
  loading?: boolean;
  maxHeight?: string;
}) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(q) || (o.sublabel?.toLowerCase().includes(q) ?? false),
    );
  }, [options, query]);

  function toggle(id: string) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange(next);
  }

  return (
    <div className="flex flex-col gap-sm">
      <div className="relative">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">
          search
        </span>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={searchPlaceholder ?? `${t('common.search')}…`}
          className="w-full pl-10 pr-3 py-sm bg-surface-container-low border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary outline-none text-label-sm"
        />
      </div>

      <div
        className={`flex flex-col gap-px overflow-y-auto ${maxHeight} rounded-lg border border-outline-variant/60`}
      >
        {loading ? (
          <div className="grid place-items-center py-lg text-on-surface-variant">
            <span className="material-symbols-outlined animate-spin">progress_activity</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-lg text-center text-body-sm text-on-surface-variant">
            {emptyText ?? t('common.noResults', 'No results')}
          </div>
        ) : (
          filtered.map((o) => {
            const checked = selected.has(o.id);
            return (
              <label
                key={o.id}
                className={`flex items-center gap-sm px-md py-sm cursor-pointer transition-colors ${
                  checked ? 'bg-primary-container/30' : 'hover:bg-surface-container-high'
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(o.id)}
                  className="w-4 h-4 accent-primary shrink-0"
                />
                <span className="min-w-0">
                  <span className="block text-label-sm text-on-surface truncate">{o.label}</span>
                  {o.sublabel && (
                    <span className="block text-[12px] text-on-surface-variant truncate">
                      {o.sublabel}
                    </span>
                  )}
                </span>
                {checked && <Icon name="check" size={16} className="ml-auto text-primary shrink-0" />}
              </label>
            );
          })
        )}
      </div>

      <span className="text-[12px] text-on-surface-variant">
        {t('common.selectedCount', '{{count}} selected', { count: selected.size })}
      </span>
    </div>
  );
}
