import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Icon } from '../Icon/Icon';
import { cn } from '../cn';

interface MarkdownEditorProps {
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  className?: string;
}

/**
 * Lightweight Markdown editor — textarea with a format toolbar (bold,
 * italic, code) and a Preview toggle. Keeps the implementation
 * dependency-free (no markdown parser); the preview just renders the raw
 * source in a monospace block. Swap to `react-markdown` if you need
 * rendering later.
 */
export function MarkdownEditor({ value, onChange, rows = 12, className }: MarkdownEditorProps) {
  const { t } = useTranslation();
  const [preview, setPreview] = useState(false);

  function wrap(prefix: string, suffix = prefix) {
    onChange(`${value}${prefix}${suffix}`);
  }

  return (
    <div className={cn('rounded-lg border border-outline-variant bg-surface-container-lowest overflow-hidden', className)}>
      <div className="flex items-center gap-xs px-sm py-xs border-b border-outline-variant bg-surface-container-low">
        <FormatBtn icon="format_bold" label={t('ui.markdownEditor.bold')} onClick={() => wrap('**')} />
        <FormatBtn icon="format_italic" label={t('ui.markdownEditor.italic')} onClick={() => wrap('*')} />
        <FormatBtn icon="code" label={t('ui.markdownEditor.inlineCode')} onClick={() => wrap('`')} />
        <FormatBtn icon="format_list_bulleted" label={t('ui.markdownEditor.list')} onClick={() => onChange(`${value}\n- `)} />
        <div className="ml-auto">
          <button
            type="button"
            onClick={() => setPreview((p) => !p)}
            className={cn(
              'inline-flex items-center gap-xs px-md py-xs rounded-md text-label-sm transition-colors',
              preview ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:bg-surface-container-high',
            )}
          >
            <Icon name={preview ? 'edit' : 'visibility'} size={16} />
            {preview ? t('ui.markdownEditor.edit') : t('ui.markdownEditor.preview')}
          </button>
        </div>
      </div>
      {preview ? (
        <pre className="whitespace-pre-wrap font-inter text-body-md text-on-surface p-md min-h-[180px]">
          {value || <span className="text-on-surface-variant">{t('ui.markdownEditor.emptyPreview')}</span>}
        </pre>
      ) : (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={rows}
          spellCheck={false}
          className="w-full resize-none p-md font-mono text-[13px] leading-relaxed text-on-surface bg-surface-container-lowest outline-none"
          placeholder={t('ui.markdownEditor.placeholder')}
        />
      )}
    </div>
  );
}

function FormatBtn({ icon, label, onClick }: { icon: string; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className="p-1 rounded text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
    >
      <Icon name={icon} size={18} />
    </button>
  );
}
