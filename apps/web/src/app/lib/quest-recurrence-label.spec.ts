import { describe, expect, it } from 'vitest';
import { QuestRecurrence } from '@cp/shared';

import { getQuestRecurrenceLabelKey } from './quest-recurrence-label';

describe('getQuestRecurrenceLabelKey', () => {
  it('maps biweekly quests to the biweekly student reset label', () => {
    expect(getQuestRecurrenceLabelKey(QuestRecurrence.BIWEEKLY)).toBe('gamif.student.quests.resetsBiweekly');
  });
});
