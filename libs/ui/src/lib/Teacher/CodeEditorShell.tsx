import { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { SupportedLanguage } from '@cp/shared';
import { Icon } from '../Icon/Icon';
import { cn } from '../cn';

interface CodeEditorShellProps {
  language: SupportedLanguage;
  onLanguageChange?: (l: SupportedLanguage) => void;
  code: string;
  /** Optional read-only renderer. Defaults to a plain monospace pre. */
  highlight?: (code: string) => ReactNode;
  className?: string;
  /** When false, you can drop in a real editor later — controls the chrome only */
  readOnly?: boolean;
}

const LANG_LABEL: Record<SupportedLanguage, string> = {
  javascript: 'JavaScript',
  python: 'Python',
  java: 'Java',
};

const LANG_ORDER: SupportedLanguage[] = ['javascript', 'python', 'java'];

/**
 * VS Code-flavoured code preview chrome. Tab bar with language switcher
 * + line-numbered gutter + scrollable code body. Pair with `highlight`
 * to drop in a real syntax highlighter (Shiki, Prism, etc.) — without
 * one, you still get a clean dark-themed monospace block.
 */
export function CodeEditorShell({
  language,
  onLanguageChange,
  code,
  highlight,
  className,
  readOnly = true,
}: CodeEditorShellProps) {
  const { t } = useTranslation();
  const lines = code.split('\n');

  return (
    <div
      className={cn(
        'flex flex-col rounded-lg overflow-hidden border border-outline-variant',
        'bg-[#1e1e1e] text-[#d4d4d4]',
        className,
      )}
    >
      <div className="flex items-center gap-xs px-sm py-xs border-b border-black/40 bg-[#2d2d2d]">
        {LANG_ORDER.map((l) => {
          const active = l === language;
          return (
            <button
              key={l}
              type="button"
              onClick={() => onLanguageChange?.(l)}
              className={cn(
                'px-md py-xs rounded-t-md text-[12px] font-medium transition-colors',
                active
                  ? 'bg-[#1e1e1e] text-white'
                  : 'text-[#9d9d9d] hover:text-white',
              )}
            >
              {LANG_LABEL[l]}
            </button>
          );
        })}
        <div className="ml-auto flex items-center gap-xs text-[11px] text-[#9d9d9d]">
          <Icon name="terminal" size={14} />
          {readOnly ? t('ui.codeEditor.preview') : t('ui.codeEditor.editor')}
        </div>
      </div>

      <div className="relative flex-1 min-h-[280px] overflow-auto">
        <div className="absolute left-0 top-0 bottom-0 w-12 bg-[#1e1e1e] border-r border-black/40 select-none">
          <pre className="text-[11px] leading-relaxed text-[#6b6b6b] text-right pr-sm pt-md">
            {lines.map((_, i) => `${i + 1}\n`).join('')}
          </pre>
        </div>
        <pre className="pl-14 pr-md py-md text-[13px] leading-relaxed font-mono whitespace-pre overflow-x-auto">
          {highlight ? highlight(code) : code}
        </pre>
      </div>
    </div>
  );
}
