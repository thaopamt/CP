import { cn } from '../cn';

interface CodeThumbnailProps {
  code: string;
  language?: string;
  /** Optional 1-indexed line numbers to highlight in error red */
  errorLines?: number[];
  /** Apply a desaturated/faded look (idle students) */
  faded?: boolean;
  className?: string;
}

/**
 * Compact dark-themed snippet preview shown inside a StudentCodeCard.
 * Renders raw text with line numbers; error lines get a red strip.
 */
export function CodeThumbnail({ code, language, errorLines, faded, className }: CodeThumbnailProps) {
  const lines = code.split('\n').slice(0, 12);
  const errorSet = new Set(errorLines ?? []);

  return (
    <div
      className={cn(
        'rounded-md overflow-hidden border border-black/40 bg-[#1e1e1e] text-[#d4d4d4]',
        faded && 'opacity-60 grayscale',
        className,
      )}
    >
      {language && (
        <div className="flex items-center justify-between px-sm py-1 border-b border-black/40 bg-[#2d2d2d] text-[10px] text-[#9d9d9d]">
          <span>{language}</span>
          <span>preview</span>
        </div>
      )}
      <div className="font-mono text-[11px] leading-snug p-sm overflow-hidden max-h-[140px]">
        {lines.map((line, i) => {
          const lineNo = i + 1;
          const hasError = errorSet.has(lineNo);
          return (
            <div
              key={i}
              className={cn(
                'flex',
                hasError && 'bg-error/30 -mx-sm px-sm',
              )}
            >
              <span className="w-6 shrink-0 text-right pr-sm text-[#6b6b6b] select-none">{lineNo}</span>
              <span className="whitespace-pre overflow-hidden">{line || ' '}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
