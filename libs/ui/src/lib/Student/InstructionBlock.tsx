import { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Icon } from '../Icon/Icon';
import { cn } from '../cn';

type Variant = 'instructions' | 'hint' | 'note' | 'expected';

const VARIANT_TONE: Record<Variant, { container: string; icon: string; iconColor: string; key: string }> = {
  instructions: {
    container: 'bg-surface-container-low border-l-4 border-primary',
    icon: 'list_alt',
    iconColor: 'text-primary',
    key: 'pages.student.workspace.instructions',
  },
  hint: {
    container: 'bg-secondary-container/30 border-l-4 border-secondary',
    icon: 'lightbulb',
    iconColor: 'text-secondary',
    key: 'pages.student.workspace.hint',
  },
  note: {
    container: 'bg-tertiary-container/20 border-l-4 border-tertiary',
    icon: 'sticky_note_2',
    iconColor: 'text-tertiary',
    key: 'pages.student.workspace.hint',
  },
  expected: {
    container: 'bg-primary-container/20 border-l-4 border-primary-fixed',
    icon: 'check_circle',
    iconColor: 'text-primary',
    key: 'pages.student.workspace.expected',
  },
};

interface InstructionBlockProps {
  variant?: Variant;
  /** Override the default heading */
  title?: string;
  children: ReactNode;
  className?: string;
}

/**
 * Side-bar block used in the coding workspace problem panel.
 * Variants differ by colour and leading icon.
 */
export function InstructionBlock({ variant = 'instructions', title, children, className }: InstructionBlockProps) {
  const { t } = useTranslation();
  const tone = VARIANT_TONE[variant];
  return (
    <div className={cn('rounded-r-xl rounded-l-md p-md', tone.container, className)}>
      <header className="flex items-center gap-sm mb-sm">
        <Icon name={tone.icon} className={tone.iconColor} />
        <h4 className="font-manrope text-headline-md text-on-surface">{title ?? t(tone.key)}</h4>
      </header>
      <div className="text-body-md text-on-surface space-y-xs">{children}</div>
    </div>
  );
}
