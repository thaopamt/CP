import { describe, expect, it } from 'vitest';
import { QuestRecurrence } from '@cp/shared';

import { QUEST_RECURRENCE_SELECTOR_CLASS_NAME, QUEST_RECURRENCE_SELECTOR_OPTIONS } from './quest-recurrence-selector';

describe('quest recurrence selector config', () => {
  it('exposes all four recurrence options and the four-column responsive grid class', () => {
    expect(QUEST_RECURRENCE_SELECTOR_OPTIONS).toEqual([
      QuestRecurrence.NONE,
      QuestRecurrence.DAILY,
      QuestRecurrence.WEEKLY,
      QuestRecurrence.BIWEEKLY,
    ]);
    expect(QUEST_RECURRENCE_SELECTOR_CLASS_NAME).toBe('grid grid-cols-2 sm:grid-cols-4 gap-2 max-w-2xl');
  });
});
