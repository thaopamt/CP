import { QuestRecurrence, QuestType } from '@cp/shared';
import { QUESTS } from './seed-quests';

describe('quest seed catalog', () => {
  it('contains a richer daily catalog with varied objectives', () => {
    const daily = QUESTS.filter((quest) => quest.type === QuestType.DAILY);
    const titles = new Set(daily.map((quest) => quest.title));

    expect(daily.length).toBeGreaterThanOrEqual(16);
    expect([...titles]).toEqual(
      expect.arrayContaining([
        'Tăng tốc buổi học',
        'Bứt phá 6 bài',
        'Song kiếm HARD',
        'Mê cung đôi',
        'Python cơ bản mỗi ngày',
      ]),
    );
  });

  it('uses BIWEEKLY recurrence for repeatable bounty and event quests', () => {
    const biweekly = QUESTS.filter(
      (quest) => quest.recurrence === QuestRecurrence.BIWEEKLY,
    );
    const biweeklyTitles = new Set(biweekly.map((quest) => quest.title));

    expect(biweekly.some((quest) => quest.type === QuestType.BOUNTY)).toBe(true);
    expect(biweekly.some((quest) => quest.type === QuestType.EVENT)).toBe(true);
    expect([...biweeklyTitles]).toEqual(
      expect.arrayContaining([
        'Tiền thưởng 2 tuần: 20 bài',
        'Đường đua HARD 2 tuần',
        'Sự kiện cuối tuần',
        'Tuần lễ mê cung',
      ]),
    );
  });

  it('does not put date windows on BIWEEKLY quests', () => {
    const biweekly = QUESTS.filter(
      (quest) => quest.recurrence === QuestRecurrence.BIWEEKLY,
    );

    expect(biweekly.every((quest) => quest.daysWindow == null)).toBe(true);
  });
});
