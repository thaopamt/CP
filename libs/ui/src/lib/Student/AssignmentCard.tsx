import { useTranslation } from 'react-i18next';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { AssignmentTab, IAssignment } from '@cp/shared';
import { Button } from '../Button/Button';
import { Icon } from '../Icon/Icon';
import { cn } from '../cn';
import { DifficultyBadge } from './DifficultyBadge';

interface AssignmentCardProps {
  assignment: IAssignment;
  onAction?: () => void;
  className?: string;
}

const ACCENT_TONE: Record<AssignmentTab, string> = {
  [AssignmentTab.TODO]: 'bg-tertiary-container',
  [AssignmentTab.IN_REVIEW]: 'bg-secondary-container',
  [AssignmentTab.COMPLETED]: 'bg-primary-container',
};

const ACTION_KEY: Record<AssignmentTab, string> = {
  [AssignmentTab.TODO]: 'ui.assignment.start',
  [AssignmentTab.IN_REVIEW]: 'ui.assignment.viewSubmission',
  [AssignmentTab.COMPLETED]: 'ui.assignment.reviewFeedback',
};

/**
 * Assignment / mission card used in the Student Assignments hub.
 * Left accent stripe colour-codes the status; in-progress items show
 * a thin progress bar above the action button.
 */
export function AssignmentCard({ assignment, onAction, className }: AssignmentCardProps) {
  const { t } = useTranslation();
  return (
    <article
      className={cn(
        'group relative bg-surface-container-lowest rounded-2xl border border-outline-variant/40 hover:shadow-elev-3 transition-all overflow-hidden',
        onAction && 'cursor-pointer',
        className,
      )}
      onClick={onAction}
    >
      <span
        className={cn(
          'absolute top-0 left-0 h-full w-1 group-hover:w-1.5 transition-all',
          ACCENT_TONE[assignment.status],
        )}
        aria-hidden
      />
      <div className="flex flex-col sm:flex-row gap-md p-md sm:p-lg pl-lg">
        <div className="flex items-start gap-sm sm:flex-col sm:items-center sm:gap-xs sm:w-24 shrink-0">
          <div
            className={cn(
              'w-12 h-12 rounded-xl grid place-items-center bg-primary-container/40',
              assignment.iconColor ?? 'text-primary',
            )}
          >
            <Icon name={assignment.icon} size={24} />
          </div>
          <div className="text-[12px] text-on-surface-variant uppercase tracking-wider sm:text-center">
            {assignment.category}
          </div>
        </div>

        <div className="flex-1 min-w-0 flex flex-col gap-sm">
          <header className="flex flex-col sm:flex-row sm:items-center gap-sm">
            <h3 className="font-lexend text-student-card-title text-on-surface flex-1 min-w-0">
              {assignment.title}
            </h3>
            <div className="flex items-center gap-xs">
              <DifficultyBadge difficulty={assignment.difficulty} />
              <span className="inline-flex items-center gap-xs text-label-sm text-tertiary font-bold">
                <Icon name="bolt" size={16} />
                {t('ui.assignment.xpReward', { count: assignment.xpReward })}
              </span>
            </div>
          </header>

          <div className="text-body-md text-on-surface-variant line-clamp-2 prose prose-sm dark:prose-invert max-w-none prose-p:m-0 prose-headings:m-0 prose-ul:m-0 prose-ol:m-0 prose-code:bg-black/20 prose-code:px-1 prose-code:rounded prose-code:before:content-none prose-code:after:content-none">
            <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
              {assignment.description || ''}
            </ReactMarkdown>
          </div>

          {assignment.progress != null && assignment.status !== AssignmentTab.COMPLETED && (
            <div className="mt-xs">
              <div className="flex justify-between text-[11px] text-on-surface-variant mb-xs">
                <span>{t('ui.assignment.progress')}</span>
                <span>{assignment.progress}%</span>
              </div>
              <div className="h-2 rounded-full bg-surface-container-highest overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: `${assignment.progress}%` }} />
              </div>
            </div>
          )}

          {assignment.status !== AssignmentTab.TODO && (
            <footer className="flex items-center justify-end gap-md mt-xs">
              <Button
                variant="outline"
                size="sm"
                onClick={onAction}
              >
                {t(ACTION_KEY[assignment.status])}
              </Button>
            </footer>
          )}
        </div>
      </div>
    </article>
  );
}

