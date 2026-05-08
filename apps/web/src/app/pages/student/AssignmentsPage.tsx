import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AssignmentCard,
  Button,
  FeedbackItem,
  Icon,
  PageHeader,
  TabPills,
} from '@cp/ui';
import {
  AssignmentTab,
  DifficultyLevel,
  IAssignment,
  IFeedback,
} from '@cp/shared';

const CATEGORY_KEYS = ['all', 'webDev', 'python', 'logic', 'math'] as const;
type CategoryKey = (typeof CATEGORY_KEYS)[number];

export default function StudentAssignmentsPage() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<AssignmentTab>(AssignmentTab.TODO);
  const [category, setCategory] = useState<CategoryKey>('all');

  const assignments: IAssignment[] = useMemo(() => {
    return [
      {
        id: 'as1',
        title: t('pages.student.assignments.seed.portfolio.title'),
        description: t('pages.student.assignments.seed.portfolio.description'),
        category: t('pages.student.assignments.categories.webDev'),
        difficulty: DifficultyLevel.MEDIUM,
        icon: 'web',
        iconColor: 'text-tertiary',
        xpReward: 250,
        dueAt: new Date(Date.now() + 3 * 24 * 60 * 60_000).toISOString(),
        status: AssignmentTab.TODO,
      },
      {
        id: 'as2',
        title: t('pages.student.assignments.seed.robot.title'),
        description: t('pages.student.assignments.seed.robot.description'),
        category: t('pages.student.assignments.categories.python'),
        difficulty: DifficultyLevel.EASY,
        icon: 'smart_toy',
        iconColor: 'text-primary',
        xpReward: 120,
        dueAt: new Date(Date.now() + 1 * 24 * 60 * 60_000).toISOString(),
        status: AssignmentTab.TODO,
        progress: 30,
      },
      {
        id: 'as3',
        title: t('pages.student.assignments.seed.sudoku.title'),
        description: t('pages.student.assignments.seed.sudoku.description'),
        category: t('pages.student.assignments.categories.logic'),
        difficulty: DifficultyLevel.HARD,
        icon: 'apps',
        iconColor: 'text-secondary',
        xpReward: 400,
        dueAt: new Date(Date.now() + 6 * 24 * 60 * 60_000).toISOString(),
        status: AssignmentTab.TODO,
      },
      {
        id: 'as4',
        title: t('pages.student.assignments.seed.linear.title'),
        description: t('pages.student.assignments.seed.linear.description'),
        category: t('pages.student.assignments.categories.math'),
        difficulty: DifficultyLevel.MEDIUM,
        icon: 'functions',
        iconColor: 'text-primary',
        xpReward: 180,
        dueAt: new Date(Date.now() - 1 * 24 * 60 * 60_000).toISOString(),
        status: AssignmentTab.IN_REVIEW,
      },
      {
        id: 'as5',
        title: t('pages.student.assignments.seed.lab.title'),
        description: t('pages.student.assignments.seed.lab.description'),
        category: t('pages.student.assignments.categories.logic'),
        difficulty: DifficultyLevel.MEDIUM,
        icon: 'science',
        iconColor: 'text-tertiary',
        xpReward: 220,
        dueAt: new Date(Date.now() - 7 * 24 * 60 * 60_000).toISOString(),
        status: AssignmentTab.COMPLETED,
      },
    ];
  }, [t]);

  const feedback: IFeedback[] = useMemo(
    () => [
      {
        id: 'fb1',
        assignmentId: 'as5',
        assignmentTitle: t('pages.student.assignments.seed.lab.title'),
        teacherName: t('pages.student.assignments.feedback.vega.teacher'),
        postedAt: new Date(Date.now() - 2 * 60 * 60_000).toISOString(),
        text: t('pages.student.assignments.feedback.vega.text'),
      },
      {
        id: 'fb2',
        assignmentId: 'as4',
        assignmentTitle: t('pages.student.assignments.seed.linear.title'),
        teacherName: t('pages.student.assignments.feedback.davis.teacher'),
        postedAt: new Date(Date.now() - 26 * 60 * 60_000).toISOString(),
        text: t('pages.student.assignments.feedback.davis.text'),
      },
    ],
    [t],
  );

  const counts = useMemo(() => {
    const c: Record<AssignmentTab, number> = {
      [AssignmentTab.TODO]: 0,
      [AssignmentTab.IN_REVIEW]: 0,
      [AssignmentTab.COMPLETED]: 0,
    };
    for (const a of assignments) c[a.status]++;
    return c;
  }, [assignments]);

  const visible = useMemo(() => {
    return assignments.filter((a) => {
      if (a.status !== tab) return false;
      if (category !== 'all') {
        const want = t(`pages.student.assignments.categories.${category}`);
        if (a.category !== want) return false;
      }
      return true;
    });
  }, [assignments, tab, category, t]);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-lg pt-lg">
      <section className="flex flex-col gap-md">
        <PageHeader
          title={t('pages.student.assignments.title')}
          subtitle={t('pages.student.assignments.subtitle')}
        />

        <TabPills
          value={tab}
          onChange={setTab}
          options={[
            { value: AssignmentTab.TODO, label: t('pages.student.assignments.tabs.todo'), count: counts[AssignmentTab.TODO] },
            { value: AssignmentTab.IN_REVIEW, label: t('pages.student.assignments.tabs.inReview'), count: counts[AssignmentTab.IN_REVIEW] },
            { value: AssignmentTab.COMPLETED, label: t('pages.student.assignments.tabs.completed'), count: counts[AssignmentTab.COMPLETED] },
          ]}
        />

        <div className="flex flex-wrap items-center gap-sm">
          {CATEGORY_KEYS.map((c) => {
            const active = c === category;
            return (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                className={
                  active
                    ? 'inline-flex items-center px-md py-xs rounded-full bg-primary text-on-primary text-label-sm font-semibold'
                    : 'inline-flex items-center px-md py-xs rounded-full bg-surface-container-low border border-outline-variant text-on-surface-variant text-label-sm font-semibold hover:bg-surface-container-high'
                }
              >
                {t(`pages.student.assignments.categories.${c}`)}
              </button>
            );
          })}
          <Button
            variant="ghost"
            size="sm"
            leadingIcon={<Icon name="tune" size={16} />}
            className="ml-auto"
          >
            {t('common.moreFilters')}
          </Button>
        </div>

        <div className="flex flex-col gap-md">
          {visible.length === 0 ? (
            <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/40 p-xl text-center text-on-surface-variant">
              <Icon name="task_alt" size={36} className="mx-auto mb-sm text-on-surface-variant/50" />
              {t('pages.student.assignments.emptyState')}
            </div>
          ) : (
            visible.map((a) => <AssignmentCard key={a.id} assignment={a} />)
          )}
        </div>
      </section>

      <aside className="hidden xl:flex flex-col gap-md">
        <div className="bg-primary-container/40 border border-primary-container rounded-2xl p-md">
          <header className="flex items-center gap-sm mb-sm">
            <Icon name="forum" className="text-primary" />
            <h3 className="font-manrope text-headline-md text-on-surface">
              {t('pages.student.assignments.latestFeedback')}
            </h3>
          </header>
          <p className="text-label-sm text-on-surface-variant">
            {t('pages.student.assignments.feedbackHint')}
          </p>
        </div>

        <div className="flex flex-col gap-sm">
          {feedback.map((f) => (
            <FeedbackItem key={f.id} feedback={f} />
          ))}
        </div>
      </aside>
    </div>
  );
}
