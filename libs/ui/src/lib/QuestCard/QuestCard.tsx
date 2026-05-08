import { useTranslation } from 'react-i18next';
import { Button } from '../Button/Button';
import { Icon } from '../Icon/Icon';
import { cn } from '../cn';

type QuestState = 'in-progress' | 'new' | 'done';

interface QuestCardProps {
  title: string;
  subject: string;
  icon: string;
  /** Tailwind classes for icon container, e.g. "bg-primary-container text-primary" */
  iconClass?: string;
  duration: string;
  /** 0–100 */
  progress?: number;
  state?: QuestState;
  onAction?: () => void;
}

const ACTION_KEY: Record<QuestState, string> = {
  'in-progress': 'ui.quest.continue',
  new: 'ui.quest.start',
  done: 'ui.quest.review',
};

/**
 * Student dashboard quest card. Mirrors the prototype at
 *   student_portal_foundation/code.html "My Quests" section.
 *
 * Visual variants:
 *   - in-progress : full-color, primary CTA
 *   - new         : neutral CTA, 0% progress
 *   - done        : faded, line-through title, outline CTA
 */
export function QuestCard({
  title,
  subject,
  icon,
  iconClass = 'bg-primary-container text-primary',
  duration,
  progress = 0,
  state = 'new',
  onAction,
}: QuestCardProps) {
  const { t } = useTranslation();
  const isDone = state === 'done';
  return (
    <div
      className={cn(
        'bg-surface-container-lowest rounded-3xl p-md shadow-elev-2 relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300',
        isDone && 'opacity-80',
      )}
    >
      {/* decorative corner */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full" />

      <div className="flex items-start justify-between mb-md relative">
        <div className={cn('w-12 h-12 rounded-2xl grid place-items-center', iconClass)}>
          <Icon name={icon} className="text-[24px]" />
        </div>
        <span className="px-md py-xs rounded-full bg-tertiary-container/30 text-tertiary text-[10px] uppercase font-bold tracking-wider">
          {duration}
        </span>
      </div>

      <h3
        className={cn(
          'font-lexend text-student-card-title font-semibold mb-xs',
          isDone && 'line-through decoration-outline-variant',
        )}
      >
        {title}
      </h3>
      <p className="text-label-sm text-on-surface-variant mb-md">{subject}</p>

      {state !== 'done' && (
        <div className="mb-md">
          <div className="flex justify-between text-label-sm text-on-surface-variant mb-xs">
            <span>{t('ui.assignment.progress')}</span>
            <span>{progress}%</span>
          </div>
          <div className="bg-surface-container-highest rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-primary h-full rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {state === 'done' ? (
        <Button variant="outline" className="w-full" onClick={onAction}>
          <Icon name="check_circle" className="text-[18px]" />
          {t(ACTION_KEY[state])}
        </Button>
      ) : (
        <Button
          variant={state === 'in-progress' ? 'student' : 'ghost'}
          className={cn('w-full', state === 'new' && 'bg-surface-container text-on-surface')}
          onClick={onAction}
        >
          {t(ACTION_KEY[state])}
        </Button>
      )}
    </div>
  );
}
