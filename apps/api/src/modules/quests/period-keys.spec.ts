import { QuestRecurrence } from '@cp/shared';
import { biweekKey, checkinDayKey, daysBetweenDayKeys, questPeriodKey } from './period-keys';

describe('checkinDayKey (Asia/Ho_Chi_Minh, UTC+7)', () => {
  it('maps 16:59:59Z to the same VN day and 17:00:00Z to the next VN day', () => {
    // 2026-07-11T16:59:59Z = 2026-07-11 23:59:59 VN
    expect(checkinDayKey(new Date('2026-07-11T16:59:59Z'))).toBe('2026-07-11');
    // 2026-07-11T17:00:00Z = 2026-07-12 00:00:00 VN
    expect(checkinDayKey(new Date('2026-07-11T17:00:00Z'))).toBe('2026-07-12');
  });

  it('treats early-morning VN time as the correct VN day (not the UTC yesterday)', () => {
    // 2026-07-03T23:00:00Z = 2026-07-04 06:00 VN
    expect(checkinDayKey(new Date('2026-07-03T23:00:00Z'))).toBe('2026-07-04');
  });
});

describe('daysBetweenDayKeys', () => {
  it('returns b - a in whole calendar days, including across months', () => {
    expect(daysBetweenDayKeys('2026-07-01', '2026-07-04')).toBe(3);
    expect(daysBetweenDayKeys('2026-07-11', '2026-07-11')).toBe(0);
    expect(daysBetweenDayKeys('2026-07-31', '2026-08-01')).toBe(1);
    expect(daysBetweenDayKeys('2026-07-04', '2026-07-01')).toBe(-3);
  });
});

describe('biweekKey', () => {
  it('uses the same global period for ISO weeks 29 and 30', () => {
    expect(biweekKey(new Date('2026-07-13T00:00:00Z'))).toBe('2026-B15');
    expect(biweekKey(new Date('2026-07-26T23:59:59Z'))).toBe('2026-B15');
  });

  it('rolls over globally when the next two-week ISO window starts', () => {
    expect(biweekKey(new Date('2026-07-27T00:00:00Z'))).toBe('2026-B16');
  });

  it('starts a new B01 cycle with a new ISO week-year', () => {
    expect(biweekKey(new Date('2026-12-28T00:00:00Z'))).toBe('2026-B27');
    expect(biweekKey(new Date('2027-01-04T00:00:00Z'))).toBe('2027-B01');
  });
});

describe('questPeriodKey', () => {
  it('maps quest recurrence values to their active period keys', () => {
    const now = new Date('2026-07-13T08:30:00Z');

    expect(questPeriodKey(QuestRecurrence.NONE, now)).toBe('static');
    expect(questPeriodKey(QuestRecurrence.DAILY, now)).toBe('2026-07-13');
    expect(questPeriodKey(QuestRecurrence.WEEKLY, now)).toBe('2026-W29');
    expect(questPeriodKey(QuestRecurrence.BIWEEKLY, now)).toBe('2026-B15');
  });
});
