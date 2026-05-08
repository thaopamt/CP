import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { IModule } from '@cp/shared';
import { Icon } from '../Icon/Icon';
import { cn } from '../cn';
import { LessonItem } from './LessonItem';

interface ModuleItemProps {
  module: IModule;
  defaultOpen?: boolean;
  onEditLesson?: (lessonId: string) => void;
  onAddLesson?: () => void;
  className?: string;
}

/**
 * Collapsible course module card with nested lesson rows.
 * Mirrors the prototype at admin_portal_course_builder/code.html.
 */
export function ModuleItem({
  module,
  defaultOpen = true,
  onEditLesson,
  onAddLesson,
  className,
}: ModuleItemProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div
      className={cn(
        'rounded-xl border border-outline-variant/50 bg-surface-container-lowest overflow-hidden',
        className,
      )}
    >
      <header className="flex items-center gap-sm p-md group">
        <button type="button" className="text-on-surface-variant cursor-grab" aria-label={t('ui.moduleItem.reorder')}>
          <Icon name="drag_indicator" size={20} />
        </button>
        <span className="px-md py-xs rounded-md bg-primary/10 text-primary text-[12px] font-bold uppercase tracking-wider">
          M{module.index}
        </span>
        <h4 className="flex-1 text-body-lg font-semibold text-on-surface truncate">{module.title}</h4>
        <span className="text-label-sm text-on-surface-variant whitespace-nowrap">
          {t('ui.moduleItem.lessonCount', { count: module.lessons.length })}
        </span>
        <button
          type="button"
          className="opacity-0 group-hover:opacity-100 p-1 rounded text-on-surface-variant hover:text-primary transition-opacity"
          aria-label={t('ui.moduleItem.moreActions')}
        >
          <Icon name="more_horiz" />
        </button>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="p-1 rounded text-on-surface-variant hover:bg-surface-container-high transition-transform"
          aria-label={open ? t('ui.moduleItem.collapse') : t('ui.moduleItem.expand')}
          aria-expanded={open}
        >
          <Icon
            name="expand_more"
            className={cn('transition-transform', open ? '' : '-rotate-90')}
          />
        </button>
      </header>

      {open && (
        <div className="px-md pb-md flex flex-col gap-xs border-t border-outline-variant/30 pt-md">
          {module.lessons.map((lesson) => (
            <LessonItem
              key={lesson.id}
              lesson={lesson}
              onEdit={() => onEditLesson?.(lesson.id)}
            />
          ))}
          <button
            type="button"
            onClick={onAddLesson}
            className="flex items-center justify-center gap-sm px-md py-sm text-label-sm text-primary border-2 border-dashed border-outline-variant rounded-lg hover:bg-primary/5 transition-colors"
          >
            <Icon name="add" size={18} />
            {t('ui.moduleItem.addLesson')}
          </button>
        </div>
      )}
    </div>
  );
}
