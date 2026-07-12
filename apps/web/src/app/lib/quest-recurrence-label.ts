import { QuestRecurrence } from '@cp/shared';

export function getQuestRecurrenceLabelKey(recurrence: QuestRecurrence): string {
  if (recurrence === QuestRecurrence.BIWEEKLY) {
    return 'gamif.student.quests.resetsBiweekly';
  }

  if (recurrence === QuestRecurrence.WEEKLY) {
    return 'gamif.student.quests.resetsWeekly';
  }

  return 'gamif.student.quests.resetsDaily';
}
