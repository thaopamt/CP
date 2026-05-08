import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ITestCase } from '@cp/shared';
import { Icon } from '../Icon/Icon';
import { cn } from '../cn';

interface TestCasePanelProps {
  index: number;
  testCase: ITestCase;
  onChange: (next: ITestCase) => void;
  onDelete: () => void;
  defaultOpen?: boolean;
  className?: string;
}

/**
 * Collapsible card for a single test case. Input + expected output
 * are textareas; an `isPublic` checkbox controls whether students
 * can see the case.
 */
export function TestCasePanel({
  index,
  testCase,
  onChange,
  onDelete,
  defaultOpen = false,
  className,
}: TestCasePanelProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className={cn('rounded-xl border border-outline-variant/60 bg-surface-container-lowest overflow-hidden', className)}>
      <header className="flex items-center gap-sm p-sm group">
        <button type="button" className="text-on-surface-variant cursor-grab" aria-label={t('ui.testCase.reorder')}>
          <Icon name="drag_indicator" size={20} />
        </button>
        <span className="px-md py-xs rounded-md bg-primary/10 text-primary text-[12px] font-bold uppercase tracking-wider">
          {t('ui.testCase.label', { index })}
        </span>
        <span className="text-label-sm text-on-surface">
          {testCase.isPublic ? t('ui.testCase.visible') : t('ui.testCase.hidden')}
        </span>

        <label className="ml-auto inline-flex items-center gap-xs text-label-sm text-on-surface-variant">
          <input
            type="checkbox"
            checked={testCase.isPublic}
            onChange={(e) => onChange({ ...testCase, isPublic: e.target.checked })}
            className="rounded text-primary focus:ring-primary"
          />
          {t('ui.testCase.public')}
        </label>
        <button
          type="button"
          onClick={onDelete}
          aria-label={t('ui.testCase.delete')}
          className="p-1 rounded text-on-surface-variant hover:text-error transition-colors"
        >
          <Icon name="delete" size={18} />
        </button>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-label={open ? t('ui.testCase.collapse') : t('ui.testCase.expand')}
          className="p-1 rounded text-on-surface-variant hover:bg-surface-container-high"
        >
          <Icon name="expand_more" className={cn('transition-transform', open ? '' : '-rotate-90')} />
        </button>
      </header>

      {open && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-sm p-sm border-t border-outline-variant/30">
          <Field
            label={t('ui.testCase.input')}
            value={testCase.input}
            onChange={(v) => onChange({ ...testCase, input: v })}
          />
          <Field
            label={t('ui.testCase.expected')}
            value={testCase.expectedOutput}
            onChange={(v) => onChange({ ...testCase, expectedOutput: v })}
          />
        </div>
      )}
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="flex flex-col gap-xs">
      <span className="text-label-sm text-on-surface-variant">{label}</span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
        spellCheck={false}
        className="rounded-md border border-outline-variant bg-surface-container-low font-mono text-[12px] p-sm focus:ring-2 focus:ring-primary outline-none resize-none"
      />
    </label>
  );
}
