import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import {
  Button,
  CodeEditorShell,
  ConsoleOutput,
  DifficultyBadge,
  Icon,
  InstructionBlock,
  TestResultRow,
} from '@cp/ui';
import {
  DifficultyLevel,
  IConsoleLine,
  IProblem,
  ITestResult,
  SupportedLanguage,
} from '@cp/shared';
import { useRunCode, useSubmitCode } from '../../api/submissions.queries';
import { useAssignment } from '../../api/curriculum.queries';

const STARTER_CODE = `# Robot Pathfinder — Quest 3
# Move the robot to collect every gem.

def solve(robot):
    for _ in range(4):
        robot.forward()
    robot.turn_right()
    # TODO: collect every remaining gem
    pass

solve(robot)
`;

export default function StudentWorkspacePage() {
  const { t } = useTranslation();
  const { problemId } = useParams<{ problemId: string }>();
  const navigate = useNavigate();

  // Queries & Mutations
  const assignmentQuery = useAssignment(problemId);
  const assignment = assignmentQuery.data;
  
  const runMutation = useRunCode();
  const submitMutation = useSubmitCode();

  const [language, setLanguage] = useState<SupportedLanguage>('python');
  const [code, setCode] = useState(STARTER_CODE);

  // Fallback to mock problem if no backend assignment yet (for design purposes)
  const problem: IProblem = useMemo(
    () => {
      if (assignment) {
        return {
          id: assignment.id,
          title: assignment.title,
          questIndex: 1,
          questTotal: 1,
          difficulty: assignment.difficulty as DifficultyLevel,
          description: assignment.description || '',
          instructions: [],
          hint: '',
          expectedResult: '',
        };
      }
      return {
        id: 'p-3',
        title: t('pages.student.workspace.seed.title'),
        questIndex: 3,
        questTotal: 10,
        difficulty: DifficultyLevel.EASY,
        description: t('pages.student.workspace.seed.description'),
        instructions: t('pages.student.workspace.seed.instructions', { returnObjects: true }) as string[],
        hint: t('pages.student.workspace.seed.hint'),
        expectedResult: t('pages.student.workspace.seed.expected'),
      };
    },
    [t, assignment],
  );

  const initialTests: ITestResult[] = useMemo(
    () => [
      { id: 't1', name: t('pages.student.workspace.tests.firstGem.name'), passed: false, details: t('pages.student.workspace.tests.unrun') },
      { id: 't2', name: t('pages.student.workspace.tests.walls.name'), passed: false, details: t('pages.student.workspace.tests.unrun') },
      { id: 't3', name: t('pages.student.workspace.tests.allGems.name'), passed: false, details: t('pages.student.workspace.tests.unrun') },
    ],
    [t],
  );

  const [logs, setLogs] = useState<IConsoleLine[]>([
    { id: 'l1', type: 'info', text: t('pages.student.workspace.starter') },
  ]);
  const [tests, setTests] = useState<ITestResult[]>(initialTests);
  const [running, setRunning] = useState(false);

  function appendLogs(next: IConsoleLine[]) {
    setLogs((prev) => [...prev, ...next]);
  }

  function clearConsole() {
    setLogs([]);
  }

  async function runCode() {
    setRunning(true);
    appendLogs([{ id: line(), type: 'info', text: `> Running ${language} code...` }]);
    
    try {
      const result = await runMutation.mutateAsync({
        language,
        code,
      });

      if (result.compile && result.compile.stderr) {
        appendLogs([{ id: line(), type: 'error', text: result.compile.stderr }]);
      }
      
      if (result.run.stdout) {
        appendLogs([{ id: line(), type: 'info', text: result.run.stdout }]);
      }
      if (result.run.stderr) {
        appendLogs([{ id: line(), type: 'error', text: result.run.stderr }]);
      }

      if (!result.run.stdout && !result.run.stderr) {
        appendLogs([{ id: line(), type: 'success', text: 'Program exited with code 0 (No output)' }]);
      }

    } catch (err: any) {
      appendLogs([{ id: line(), type: 'error', text: 'Execution failed: ' + err.message }]);
    } finally {
      setRunning(false);
    }
  }

  async function submitCode() {
    if (!assignment) {
      appendLogs([{ id: line(), type: 'error', text: 'Cannot submit mock assignment. Please open a real assignment.' }]);
      return;
    }
    
    setRunning(true);
    appendLogs([{ id: line(), type: 'info', text: '> Submitting code to auto-grader...' }]);

    try {
      const response = await submitMutation.mutateAsync({
        assignmentId: assignment.id,
        language,
        code,
      });

      const sub = response.submission;
      appendLogs([{ id: line(), type: sub.status === 'ACCEPTED' ? 'success' : 'error', text: `Verdict: ${sub.status}` }]);
      appendLogs([{ id: line(), type: 'info', text: `Passed: ${sub.passedCount} / ${sub.totalCount}` }]);

      if (sub.testResults) {
        const testCaseResults = sub.testResults.map((tr: any) => ({
          id: `t${tr.testCaseIndex}`,
          name: `Test Case ${tr.testCaseIndex + 1}`,
          passed: tr.status === 'ACCEPTED',
          details: tr.status === 'ACCEPTED' ? 'Passed' : `Failed: Expected ${tr.expectedOutput}, got ${tr.actualOutput}`,
        }));
        setTests(testCaseResults);
      }
    } catch (err: any) {
      appendLogs([{ id: line(), type: 'error', text: 'Submission failed: ' + err.message }]);
    } finally {
      setRunning(false);
    }
  }

  const passCount = tests.filter((tc) => tc.passed).length;
  const allPassing = passCount === tests.length;

  return (
    <div className="flex flex-col gap-md pt-lg">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-md">
        <div className="flex items-center gap-md min-w-0">
          <button
            type="button"
            className="p-1 rounded text-on-surface-variant hover:bg-surface-container-high"
            aria-label={t('common.more')}
            onClick={() => navigate(-1)}
          >
            <Icon name="arrow_back" />
          </button>
          <div className="min-w-0">
            <h2 className="font-manrope text-headline-lg text-on-surface truncate">{problem.title}</h2>
            <div className="flex items-center gap-sm mt-xs text-label-sm text-on-surface-variant">
              <span className="px-md py-xs rounded-full bg-primary-container text-on-primary-container font-bold">
                {t('pages.student.workspace.questOf', { index: problem.questIndex, total: problem.questTotal })}
              </span>
              <DifficultyBadge difficulty={problem.difficulty} />
            </div>
          </div>
        </div>
        <div className="flex gap-sm">
          <Button
            variant="ghost"
            leadingIcon={<Icon name="refresh" size={18} />}
            onClick={() => setCode(STARTER_CODE)}
          >
            {t('pages.student.workspace.resetCode')}
          </Button>
          <button
            onClick={runCode}
            disabled={running}
            className="flex-1 lg:flex-none flex items-center justify-center gap-xs px-xl py-2.5 rounded-xl bg-surface-container-high text-on-surface hover:bg-surface-container-highest transition-colors font-semibold"
          >
            <Icon name="play_arrow" size={20} />
            {running ? t('pages.student.workspace.running') : t('pages.student.workspace.runCode')}
          </button>
          <button
            onClick={submitCode}
            disabled={running}
            className="flex-1 lg:flex-none flex items-center justify-center gap-xs px-xl py-2.5 rounded-xl bg-primary text-on-primary hover:bg-primary/90 transition-colors shadow-sm font-semibold"
          >
            <Icon name="send" size={20} />
            {t('pages.student.workspace.submit')}
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-md min-h-[640px]">
        <aside className="md:col-span-1 bg-surface-container-lowest border border-outline-variant/40 rounded-2xl flex flex-col overflow-hidden">
          <header className="p-md bg-gradient-to-br from-primary-container via-primary to-on-primary-fixed text-on-primary">
            <h3 className="font-manrope text-headline-md">
              {t('pages.student.workspace.missionBriefing')}
            </h3>
            <p className="text-label-sm opacity-90 mt-xs">{problem.description}</p>
          </header>
          <div className="flex-1 overflow-y-auto p-md flex flex-col gap-md">
            <InstructionBlock variant="instructions">
              <ul className="list-disc pl-md space-y-xs">
                {problem.instructions.map((lineText, i) => (
                  <li key={i} dangerouslySetInnerHTML={{ __html: highlightInline(lineText) }} />
                ))}
              </ul>
            </InstructionBlock>

            {problem.hint && (
              <InstructionBlock variant="hint">
                <p>{problem.hint}</p>
              </InstructionBlock>
            )}

            {problem.expectedResult && (
              <InstructionBlock variant="expected">
                <p>{problem.expectedResult}</p>
              </InstructionBlock>
            )}
          </div>
        </aside>

        <section className="md:col-span-2 flex flex-col gap-md min-h-0">
          <CodeEditorShell
            language={language}
            onLanguageChange={(l) => setLanguage(l as SupportedLanguage)}
            code={code}
            className="min-h-[320px] flex-1"
            readOnly={false}
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-md min-h-[260px]">
            <ConsoleOutput lines={logs} onClear={clearConsole} />
            <div className="flex flex-col rounded-lg overflow-hidden border border-outline-variant bg-surface-container-lowest">
              <header className="flex items-center justify-between px-sm py-xs border-b border-outline-variant bg-surface-container-low">
                <div className="inline-flex items-center gap-xs text-label-sm font-semibold text-on-surface">
                  <Icon name="science" size={16} className="text-tertiary" />
                  {t('ui.workspace.testResults')} ·{' '}
                  <span className="text-tertiary">
                    {t('ui.workspace.passingFraction', { passing: passCount, total: tests.length })}
                  </span>
                </div>
                {allPassing && (
                  <span className="inline-flex items-center gap-xs text-tertiary text-[12px] font-semibold">
                    <Icon name="check_circle" filled size={14} /> {t('ui.workspace.missionComplete')}
                  </span>
                )}
              </header>
              <div className="flex-1 overflow-y-auto p-sm flex flex-col gap-xs">
                {tests.map((tc) => (
                  <TestResultRow key={tc.id} result={tc} />
                ))}
              </div>
              <footer className="p-sm border-t border-outline-variant bg-surface-container-low">
                <Button
                  variant="student"
                  className="w-full"
                  leadingIcon={<Icon name="rocket_launch" size={18} />}
                  disabled={!allPassing}
                >
                  {allPassing
                    ? t('ui.workspace.submitMission')
                    : t('ui.workspace.submitDisabled')}
                </Button>
              </footer>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

let __lineCounter = 0;
function line() {
  __lineCounter += 1;
  return `cl-${__lineCounter}`;
}

function highlightInline(input: string): string {
  return input.replace(
    /`([^`]+)`/g,
    '<code class="px-xs py-[2px] rounded bg-surface-container-high text-primary text-[12px] font-mono">$1</code>',
  );
}
