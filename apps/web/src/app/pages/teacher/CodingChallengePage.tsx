import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Button,
  CodeEditorShell,
  DifficultySelector,
  Icon,
  MarkdownEditor,
  SelectFilter,
  StatusBadge,
  TagInput,
  TestCasePanel,
} from '@cp/ui';
import {
  ChallengeCategory,
  ChallengeDifficulty,
  ICodingChallenge,
  ITestCase,
  SupportedLanguage,
} from '@cp/shared';

export default function TeacherCodingChallengePage() {
  const { t } = useTranslation();

  const initial: ICodingChallenge = useMemo(
    () => ({
      id: 'cc-1',
      title: t('pages.teacher.challenges.seed.title'),
      category: ChallengeCategory.DATA_STRUCTURES,
      difficulty: ChallengeDifficulty.MEDIUM,
      description: t('pages.teacher.challenges.seed.description'),
      tags: t('pages.teacher.challenges.seed.tags', { returnObjects: true }) as string[],
      language: 'javascript',
      starterCode: `class TreeNode {
  constructor(value) {
    this.value = value;
    this.left = null;
    this.right = null;
  }
}

class BST {
  constructor() {
    this.root = null;
  }

  // TODO: implement
  insert(value) {}

  // TODO: implement
  search(value) {}

  // TODO: implement
  inOrderTraversal() {}
}
`,
      testCases: [
        { id: 'tc-1', input: '[5, 3, 8, 1, 4]', expectedOutput: '[1, 3, 4, 5, 8]', isPublic: true },
        { id: 'tc-2', input: '[10, 5, 15, 2, 7]', expectedOutput: '[2, 5, 7, 10, 15]', isPublic: false },
      ],
    }),
    [t],
  );

  const [challenge, setChallenge] = useState<ICodingChallenge>(initial);

  function patch(p: Partial<ICodingChallenge>) {
    setChallenge((prev) => ({ ...prev, ...p }));
  }

  function updateCase(idx: number, next: ITestCase) {
    setChallenge((prev) => {
      const cases = prev.testCases.slice();
      cases[idx] = next;
      return { ...prev, testCases: cases };
    });
  }

  function addCase() {
    setChallenge((prev) => ({
      ...prev,
      testCases: [
        ...prev.testCases,
        { id: `tc-${prev.testCases.length + 1}`, input: '', expectedOutput: '', isPublic: false },
      ],
    }));
  }

  function removeCase(idx: number) {
    setChallenge((prev) => ({ ...prev, testCases: prev.testCases.filter((_, i) => i !== idx) }));
  }

  return (
    <div className="flex flex-col gap-md">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-md">
        <div className="flex items-center gap-md min-w-0">
          <button
            type="button"
            className="p-1 rounded text-on-surface-variant hover:bg-surface-container-high"
            aria-label={t('common.more')}
          >
            <Icon name="arrow_back" />
          </button>
          <div className="min-w-0">
            <h2 className="font-manrope text-headline-lg text-on-surface truncate">
              {challenge.title || t('pages.teacher.challenges.defaultTitle')}
            </h2>
            <div className="flex items-center gap-sm mt-xs">
              <StatusBadge tone="warning">{t('pages.teacher.challenges.draftBadge')}</StatusBadge>
              <span className="text-[12px] text-on-surface-variant inline-flex items-center gap-xs">
                <Icon name="cloud_done" size={14} />
                {t('pages.teacher.challenges.autoSaved')}
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-sm">
          <Button variant="ghost" leadingIcon={<Icon name="save" size={18} />}>
            {t('pages.teacher.challenges.saveDraft')}
          </Button>
          <Button variant="teacher" leadingIcon={<Icon name="rocket_launch" size={18} />}>
            {t('pages.teacher.challenges.publish')}
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-md">
        <section className="flex flex-col gap-md">
          <div className="bg-surface-container-lowest border border-outline-variant/50 rounded-xl p-md flex flex-col gap-md">
            <h3 className="font-manrope text-headline-md text-on-surface">
              {t('pages.teacher.challenges.metadata')}
            </h3>

            <label className="flex flex-col gap-xs">
              <span className="text-label-sm text-on-surface-variant">
                {t('pages.teacher.challenges.challengeTitle')}
              </span>
              <input
                type="text"
                value={challenge.title}
                onChange={(e) => patch({ title: e.target.value })}
                className="bg-surface-container-low border border-outline-variant rounded-lg px-md py-sm focus:ring-2 focus:ring-primary outline-none"
              />
            </label>

            <SelectFilter
              label={t('pages.teacher.challenges.category')}
              value={challenge.category}
              onChange={(e) => patch({ category: e.target.value as ChallengeCategory })}
              options={Object.values(ChallengeCategory).map((c) => ({
                value: c,
                label: t(`enums.challengeCategory.${c}`),
              }))}
            />

            <div className="flex flex-col gap-xs">
              <span className="text-label-sm text-on-surface-variant">
                {t('pages.teacher.challenges.difficulty')}
              </span>
              <DifficultySelector
                value={challenge.difficulty}
                onChange={(d) => patch({ difficulty: d })}
              />
            </div>

            <div className="flex flex-col gap-xs">
              <span className="text-label-sm text-on-surface-variant">
                {t('pages.teacher.challenges.tagsLabel')}
              </span>
              <TagInput tags={challenge.tags} onChange={(tags) => patch({ tags })} />
            </div>
          </div>

          <div className="bg-surface-container-lowest border border-outline-variant/50 rounded-xl p-md flex flex-col gap-sm">
            <header className="flex items-center justify-between">
              <h3 className="font-manrope text-headline-md text-on-surface">
                {t('pages.teacher.challenges.problemDescription')}
              </h3>
              <span className="text-[12px] text-on-surface-variant">
                {t('pages.teacher.challenges.markdownSupported')}
              </span>
            </header>
            <MarkdownEditor
              value={challenge.description}
              onChange={(description) => patch({ description })}
              rows={14}
            />
          </div>
        </section>

        <section className="flex flex-col gap-md">
          <div className="bg-surface-container-lowest border border-outline-variant/50 rounded-xl p-md flex flex-col gap-sm">
            <header className="flex items-center justify-between">
              <div>
                <h3 className="font-manrope text-headline-md text-on-surface">
                  {t('pages.teacher.challenges.testCases')}
                </h3>
                <p className="text-label-sm text-on-surface-variant">
                  {t('pages.teacher.challenges.testCasesSubtitle')}
                </p>
              </div>
              <Button variant="teacher" size="sm" leadingIcon={<Icon name="add" size={16} />} onClick={addCase}>
                {t('pages.teacher.challenges.addTestCase')}
              </Button>
            </header>
            <div className="flex flex-col gap-sm">
              {challenge.testCases.map((tc, idx) => (
                <TestCasePanel
                  key={tc.id}
                  index={idx + 1}
                  testCase={tc}
                  onChange={(next) => updateCase(idx, next)}
                  onDelete={() => removeCase(idx)}
                  defaultOpen={idx === 0}
                />
              ))}
            </div>
          </div>

          <div className="flex-1 flex flex-col">
            <h3 className="font-manrope text-headline-md text-on-surface mb-sm">
              {t('pages.teacher.challenges.starterCode')}
            </h3>
            <CodeEditorShell
              language={challenge.language}
              onLanguageChange={(language) => patch({ language: language as SupportedLanguage })}
              code={challenge.starterCode}
              className="flex-1 min-h-[280px]"
            />
          </div>
        </section>
      </div>
    </div>
  );
}
