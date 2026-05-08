import { KeyboardEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Icon } from '../Icon/Icon';
import { MetaChip } from '../MetaChip/MetaChip';
import { cn } from '../cn';

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  className?: string;
}

/**
 * Chip-based tag input. Press Enter or comma to commit a tag,
 * Backspace on an empty input removes the last tag.
 */
export function TagInput({ tags, onChange, placeholder, className }: TagInputProps) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState('');

  function commit() {
    const v = draft.trim().replace(/,$/, '');
    if (!v) return;
    if (tags.includes(v)) {
      setDraft('');
      return;
    }
    onChange([...tags, v]);
    setDraft('');
  }

  function onKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      commit();
    } else if (e.key === 'Backspace' && draft.length === 0 && tags.length > 0) {
      e.preventDefault();
      onChange(tags.slice(0, -1));
    }
  }

  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-xs p-sm rounded-lg bg-surface-container-low border border-outline-variant focus-within:ring-2 focus-within:ring-primary',
        className,
      )}
    >
      {tags.map((t, i) => (
        <MetaChip key={`${t}-${i}`} onRemove={() => onChange(tags.filter((_, idx) => idx !== i))}>
          {t}
        </MetaChip>
      ))}
      <div className="flex-1 min-w-[120px] flex items-center gap-xs">
        <Icon name="add" size={16} className="text-on-surface-variant" />
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKey}
          onBlur={commit}
          placeholder={placeholder ?? t('pages.teacher.challenges.tagsPlaceholder')}
          className="flex-1 bg-transparent outline-none text-label-sm text-on-surface placeholder:text-on-surface-variant"
        />
      </div>
    </div>
  );
}
