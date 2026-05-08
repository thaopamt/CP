import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ConsoleLineType, IConsoleLine } from '@cp/shared';
import { Icon } from '../Icon/Icon';
import { cn } from '../cn';

const LINE_TONE: Record<ConsoleLineType, string> = {
  info: 'text-[#d4d4d4]',
  success: 'text-[#7ec99c]',
  error: 'text-[#f48771]',
  warning: 'text-[#dcdcaa]',
};

const LINE_PREFIX: Record<ConsoleLineType, string> = {
  info: '›',
  success: '✓',
  error: '✗',
  warning: '!',
};

interface ConsoleOutputProps {
  lines: IConsoleLine[];
  /** Header label, defaults to translation `ui.console.title` */
  title?: string;
  onClear?: () => void;
  /** Auto-scroll to bottom when new lines arrive */
  autoScroll?: boolean;
  className?: string;
}

/**
 * Terminal-style log panel for the Coding Workspace bottom drawer.
 * Renders dark VS Code-flavoured output and auto-scrolls to the latest
 * line.
 */
export function ConsoleOutput({
  lines,
  title,
  onClear,
  autoScroll = true,
  className,
}: ConsoleOutputProps) {
  const { t } = useTranslation();
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoScroll && bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [lines, autoScroll]);

  return (
    <div className={cn('flex flex-col rounded-lg overflow-hidden border border-outline-variant bg-[#1e1e1e]', className)}>
      <header className="flex items-center justify-between px-sm py-xs border-b border-black/40 bg-[#2d2d2d] text-[#d4d4d4]">
        <div className="inline-flex items-center gap-xs text-[12px] font-semibold">
          <Icon name="terminal" size={14} />
          {title ?? t('ui.console.title')}
        </div>
        {onClear && (
          <button
            type="button"
            onClick={onClear}
            aria-label={t('ui.console.clear')}
            className="p-1 rounded text-[#9d9d9d] hover:text-white"
          >
            <Icon name="delete_sweep" size={14} />
          </button>
        )}
      </header>
      <div ref={bodyRef} className="flex-1 overflow-y-auto font-mono text-[12px] leading-relaxed p-sm text-[#d4d4d4]">
        {lines.length === 0 ? (
          <div className="text-[#9d9d9d] italic">{t('ui.console.empty')}</div>
        ) : (
          lines.map((line) => (
            <div key={line.id} className={cn('flex gap-xs', LINE_TONE[line.type])}>
              <span className="opacity-70 select-none">{LINE_PREFIX[line.type]}</span>
              <span className="whitespace-pre-wrap">{line.text}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
