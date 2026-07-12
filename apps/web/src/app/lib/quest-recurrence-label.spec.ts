import { describe, expect, it } from 'vitest';
import { QuestRecurrence } from '@cp/shared';

import { getQuestRecurrenceLabelKey } from './quest-recurrence-label';

describe('getQuestRecurrenceLabelKey', () => {
  it('maps biweekly quests to the biweekly student reset label', () => {
    expect(getQuestRecurrenceLabelKey(QuestRecurrence.BIWEEKLY)).toBe('gamif.student.quests.resetsBiweekly');
  });

  it('maps weekly and daily quests to their reset labels', () => {
    expect(getQuestRecurrenceLabelKey(QuestRecurrence.WEEKLY)).toBe('gamif.student.quests.resetsWeekly');
    expect(getQuestRecurrenceLabelKey(QuestRecurrence.DAILY)).toBe('gamif.student.quests.resetsDaily');
  });

  it('does not label one-time quests as recurring', () => {
    expect(getQuestRecurrenceLabelKey(QuestRecurrence.NONE)).toBe('');
  });
});
