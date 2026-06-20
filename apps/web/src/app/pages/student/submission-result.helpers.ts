import {
  IAssignmentDef,
  ISubmission,
  ISubmissionJudgeProgress,
  SubmissionStatus,
} from '@cp/shared';

export type ResultStatus = 'accepted' | 'wrong' | 'error' | 'pending';

export type ResultCase = {
  testCaseIndex?: number;
  rawStatus?: SubmissionStatus;
  status: ResultStatus;
  input: string;
  stdout: string;
  expected: string;
  executionTimeMs?: number | null;
  errorMessage?: string | null;
};

export type RunResultsState = {
  overall: ResultStatus;
  cases: ResultCase[];
  progress?: ISubmissionJudgeProgress;
};

export type SubmissionWithProgress = ISubmission & {
  judgeProgress?: ISubmissionJudgeProgress;
};

export const QUEUED_SUBMISSION_MESSAGE = 'Submission queued. Judging will continue in the background.';

export function toResultStatus(status: SubmissionStatus): ResultStatus {
  if (status === SubmissionStatus.ACCEPTED) return 'accepted';
  if (status === SubmissionStatus.WRONG_ANSWER) return 'wrong';
  if (status === SubmissionStatus.PENDING) return 'pending';
  return 'error';
}

export function getFirstNonAcceptedCaseIndex(cases: ResultCase[]): number {
  const index = cases.findIndex((testCase) => testCase.status !== 'accepted');
  return index >= 0 ? index : 0;
}

export function getActiveRunResultIndex(results: RunResultsState): number {
  const currentIndex = results.progress?.currentTestCaseIndex;
  if (typeof currentIndex === 'number' && currentIndex >= 0 && currentIndex < results.cases.length) {
    return currentIndex;
  }

  return getFirstNonAcceptedCaseIndex(results.cases);
}

export function buildSubmissionRunResults(
  sub: SubmissionWithProgress,
  assignment?: Pick<IAssignmentDef, 'codingConfig'> | null,
): RunResultsState {
  const overall = toResultStatus(sub.status);
  const inlineCases = assignment?.codingConfig?.testCases ?? [];
  const allowViewHidden = !!assignment?.codingConfig?.allowViewHiddenTestCases;
  const progress = sub.judgeProgress;
  const currentTestCaseIndex = progress?.currentTestCaseIndex;
  const totalCount = Math.max(
    sub.totalCount ?? 0,
    progress?.totalCount ?? 0,
    sub.testResults?.length ?? 0,
    inlineCases.length + (assignment?.codingConfig?.hiddenTestCount ?? 0),
  );

  const toPendingCase = (testCaseIndex: number): ResultCase => {
    const tc = inlineCases[testCaseIndex];
    const isHidden = testCaseIndex >= inlineCases.length || !!tc?.isHidden;
    const hideDetails = isHidden && !allowViewHidden;
    const isCurrent = currentTestCaseIndex === testCaseIndex;

    return {
      testCaseIndex,
      rawStatus: SubmissionStatus.PENDING,
      status: 'pending',
      input: hideDetails ? 'Hidden Test Case' : tc?.input || (isHidden ? 'Hidden Test Case' : ''),
      stdout: isCurrent
        ? `Judging testcase #${testCaseIndex + 1}...`
        : 'Waiting for judge result...',
      expected: hideDetails ? '(Hidden Expected)' : tc?.output || '',
    };
  };

  if (sub.status === SubmissionStatus.PENDING && totalCount > 0) {
    const resultByIndex = new Map((sub.testResults ?? []).map((tr) => [tr.testCaseIndex, tr]));
    const cases: ResultCase[] = Array.from({ length: totalCount }, (_, testCaseIndex) => {
      const tr = resultByIndex.get(testCaseIndex);
      if (!tr) return toPendingCase(testCaseIndex);

      return toResultCase(tr, inlineCases, allowViewHidden);
    });

    return { overall, cases, progress };
  }

  const cases = sub.testResults && sub.testResults.length > 0
    ? sub.testResults.map((tr) => toResultCase(tr, inlineCases, allowViewHidden))
    : [{
      status: overall,
      input: '',
      stdout: sub.status === SubmissionStatus.PENDING
        ? sub.judgeProgress?.message || QUEUED_SUBMISSION_MESSAGE
        : `Passed: ${sub.passedCount} / ${sub.totalCount}`,
      expected: '',
    }];

  return { overall, cases, progress };
}

function toResultCase(
  tr: NonNullable<ISubmission['testResults']>[number],
  inlineCases: NonNullable<NonNullable<IAssignmentDef['codingConfig']>['testCases']>,
  allowViewHidden: boolean,
): ResultCase {
  const tc = inlineCases[tr.testCaseIndex];
  const isHidden = tr.testCaseIndex >= inlineCases.length || !!tc?.isHidden;
  const hideDetails = isHidden && !allowViewHidden;

  return {
    testCaseIndex: tr.testCaseIndex,
    rawStatus: tr.status,
    status: toResultStatus(tr.status),
    input: hideDetails ? 'Hidden Test Case' : tr.input || tc?.input || 'Hidden Test Case',
    stdout: hideDetails ? '(Output hidden)' : tr.errorMessage || tr.actualOutput || 'No output',
    expected: hideDetails ? '(Hidden Expected)' : tr.expectedOutput || '',
    executionTimeMs: tr.executionTimeMs,
    errorMessage: tr.errorMessage ?? null,
  };
}
