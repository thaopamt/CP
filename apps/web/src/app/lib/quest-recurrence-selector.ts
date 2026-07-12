import { QuestRecurrence } from '@cp/shared';

export const QUEST_RECURRENCE_SELECTOR_OPTIONS = [
  QuestRecurrence.NONE,
  QuestRecurrence.DAILY,
  QuestRecurrence.WEEKLY,
  QuestRecurrence.BIWEEKLY,
] as const;

export const QUEST_RECURRENCE_SELECTOR_CLASS_NAME = 'grid grid-cols-2 sm:grid-cols-4 gap-2 max-w-2xl';
