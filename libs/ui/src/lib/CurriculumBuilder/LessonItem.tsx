import { useTranslation } from 'react-i18next';
import { ILesson, LESSON_ICON } from '@cp/shared';
import { Icon } from '../Icon/Icon';
import { cn } from '../cn';

interface LessonItemProps {
  lesson: ILesson;
  onEdit?: () => void;
  className?: string;
}

/**
 * One row inside a curriculum module. Drag handle on the left, type icon,
 * title + duration metadata; an edit button reveals on hover.
 */
export function LessonItem({ lesson, onEdit, className }: LessonItemProps) {
  const { t } = useTranslation();
  return (
    <div
      className={cn(
        'group flex items-center gap-sm px-md py-sm rounded-lg bg-surface-container hover:bg-surface-container-high transition-colors',
        className,
      )}
    >
      <button
        type="button"
        className="text-on-surface-variant cursor-grab active:cursor-grabbing"
        aria-label={t('ui.lessonItem.reorder')}
      >
        <Icon name="drag_indicator" size={20} />
      </button>
      <Icon name={LESSON_ICON[lesson.type]} className="text-primary" />
      <div className="flex-1 min-w-0">
        <div className="text-body-md text-on-surface truncate">{lesson.title}</div>
        <div className="text-[12px] text-on-surface-variant">
          {lesson.type.toLowerCase()} · {lesson.durationMin} {t('ui.classScheduleCard.durationMin', { count: lesson.durationMin }).replace(/^\d+\s*/, '')}
        </div>
      </div>
      <button
        type="button"
        onClick={onEdit}
        className="opacity-0 group-hover:opacity-100 p-1 rounded text-on-surface-variant hover:text-primary transition-opacity"
        aria-label={t('ui.lessonItem.edit')}
      >
        <Icon name="edit" size={18} />
      </button>
    </div>
  );
}
