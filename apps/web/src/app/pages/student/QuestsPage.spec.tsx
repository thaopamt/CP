/* @vitest-environment jsdom */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import {
  IStudentQuest,
  QuestObjectiveType,
  QuestRecurrence,
  QuestStatus,
  QuestType,
  StudentQuestStatus,
} from '@cp/shared';

import StudentQuestsPage from './QuestsPage';

const questQueryMocks = vi.hoisted(() => ({
  useMyQuests: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('@cp/ui', async () => {
  const React = await import('react');
  return {
    Icon: ({ name }: { name: string }) => React.createElement('span', { 'data-icon': name }),
  };
});

vi.mock('../../api/quests.queries', () => ({
  useMyQuests: questQueryMocks.useMyQuests,
}));

const roots: Root[] = [];

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

afterEach(() => {
  for (const root of roots.splice(0)) {
    act(() => root.unmount());
  }
  document.body.innerHTML = '';
  questQueryMocks.useMyQuests.mockReset();
});

function renderStudentQuestsPage(quests: IStudentQuest[]) {
  questQueryMocks.useMyQuests.mockReturnValue({ data: quests, isLoading: false });

  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  roots.push(root);

  act(() => {
    root.render(<StudentQuestsPage />);
  });

  return container;
}

function makeStudentQuest(recurrence: QuestRecurrence): IStudentQuest {
  const now = '2026-07-12T00:00:00.000Z';

  return {
    id: 'student-quest-1',
    userId: 'student-1',
    questId: 'quest-1',
    progress: 1,
    status: StudentQuestStatus.IN_PROGRESS,
    progressData: null,
    periodKey: '2026-B15',
    startedAt: now,
    completedAt: null,
    claimedAt: null,
    createdAt: now,
    updatedAt: now,
    quest: {
      id: 'quest-1',
      title: 'Biweekly bounty',
      description: 'Complete a biweekly bounty.',
      type: QuestType.BOUNTY,
      status: QuestStatus.PUBLISHED,
      objectiveType: QuestObjectiveType.SUBMIT_ACCEPTED,
      objectiveConfig: null,
      targetCount: 2,
      rewardXp: 100,
      rewardGems: 25,
      rewardBadgeId: null,
      icon: 'local_fire_department',
      category: null,
      sortOrder: 0,
      recurrence,
      startsAt: null,
      endsAt: null,
      prerequisiteQuestId: null,
      classIds: null,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
  };
}

describe('StudentQuestsPage recurrence labels', () => {
  it('renders the biweekly reset label on a recurring quest card', () => {
    const container = renderStudentQuestsPage([makeStudentQuest(QuestRecurrence.BIWEEKLY)]);
    const recurrenceLabel = container.querySelector('[data-testid="quest-recurrence-label"]');

    expect(recurrenceLabel?.getAttribute('aria-label')).toBe('gamif.student.quests.resetsBiweekly');
  });
});
