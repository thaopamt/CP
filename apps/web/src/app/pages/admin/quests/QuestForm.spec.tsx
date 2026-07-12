/* @vitest-environment jsdom */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { QuestRecurrence } from '@cp/shared';

import { QuestForm } from './QuestForm';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('@cp/ui', async () => {
  const React = await import('react');
  return {
    Button: ({ children, leadingIcon, ...props }: { children: React.ReactNode; leadingIcon?: React.ReactNode }) =>
      React.createElement('button', props, leadingIcon, children),
    Icon: ({ name }: { name: string }) => React.createElement('span', { 'data-icon': name }),
  };
});

vi.mock('../../../api/quests.queries', () => ({
  useQuestOptions: () => ({ data: [] }),
}));

vi.mock('../../../api/badges.queries', () => ({
  useBadges: () => ({ data: { data: [] } }),
}));

vi.mock('../../../api/class.queries', () => ({
  useClassesList: () => ({ data: { items: [] } }),
}));

const roots: Root[] = [];

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

afterEach(() => {
  for (const root of roots.splice(0)) {
    act(() => root.unmount());
  }
  document.body.innerHTML = '';
});

function renderQuestForm() {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  roots.push(root);

  act(() => {
    root.render(<QuestForm onSubmit={vi.fn()} />);
  });

  return container;
}

describe('QuestForm recurrence selector', () => {
  it('renders all four recurrence options inside the four-column responsive selector', () => {
    const container = renderQuestForm();
    const selector = container.querySelector('[data-testid="quest-recurrence-selector"]');

    expect(selector?.className).toContain('grid-cols-2');
    expect(selector?.className).toContain('sm:grid-cols-4');
    expect(Array.from(selector?.querySelectorAll('button') ?? []).map((button) => button.textContent)).toEqual([
      `gamif.recurrence.${QuestRecurrence.NONE}`,
      `gamif.recurrence.${QuestRecurrence.DAILY}`,
      `gamif.recurrence.${QuestRecurrence.WEEKLY}`,
      `gamif.recurrence.${QuestRecurrence.BIWEEKLY}`,
    ]);
  });
});
