import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { DifficultyBadge, Icon } from '@cp/ui';
import {
  ASSIGNMENT_TYPE_LABEL,
  ASSIGNMENT_TYPE_ICON,
  DifficultyLevel,
  ICodeExecutionResponse,
} from '@cp/shared';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

// Syntax highlighting
import Editor from 'react-simple-code-editor';
import Prism from 'prismjs';
import 'prismjs/themes/prism-tomorrow.css'; // dark theme
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-cpp';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-javascript';

import { useAssignment } from '../../api/curriculum.queries';
import { useRunCode, useSubmitCode, useSubmissions } from '../../api/submissions.queries';
import { useLiveCodingSync } from '../../hooks/useLiveCodingSync';

/* ── Language config ──────────────────────────────────────────────── */
const LANG_OPTIONS: { value: string; label: string; template: string }[] = [
  { value: 'cpp', label: 'C++ 20', template: '#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    // Your code here\n    \n    return 0;\n}\n' },
  { value: 'java', label: 'Java 17', template: 'import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        // Your code here\n        \n    }\n}\n' },
  { value: 'python', label: 'Python 3', template: '# Your code here\nimport sys\ninput = sys.stdin.readline\n\n' },
  { value: 'javascript', label: 'JavaScript', template: '// Your code here\nconst readline = require("readline");\nconst rl = readline.createInterface({ input: process.stdin });\n\nrl.on("line", (line) => {\n    \n});\n' },
];

/* ── Tabs for left panel ──────────────────────────────────────────── */
type LeftTab = 'description' | 'submissions';
type BottomTab = 'testcase' | 'terminal' | 'result';

export default function StudentWorkspacePage() {
  const { problemId } = useParams<{ problemId: string }>();
  const navigate = useNavigate();
  const { data: assignment, isLoading, isError } = useAssignment(problemId);
  const { data: submissions = [] } = useSubmissions(assignment?.id || '');
  const runMutation = useRunCode();
  const submitMutation = useSubmitCode();

  const [leftTab, setLeftTab] = useState<LeftTab>('description');
  const [bottomTab, setBottomTab] = useState<BottomTab>('testcase');
  const [language, setLanguage] = useState(LANG_OPTIONS[0].value);
  const [code, setCode] = useState(LANG_OPTIONS[0].template);
  const [activeTestIdx, setActiveTestIdx] = useState(0);
  const [customInput, setCustomInput] = useState('');
  const [customOutput, setCustomOutput] = useState('');
  const [terminalInput, setTerminalInput] = useState('');
  const [terminalResult, setTerminalResult] = useState<ICodeExecutionResponse | null>(null);
  const [terminalError, setTerminalError] = useState('');
  const [terminalRunning, setTerminalRunning] = useState(false);
  const [running, setRunning] = useState(false);
  const [runResults, setRunResults] = useState<null | {
    overall: 'accepted' | 'wrong' | 'error';
    cases: { status: 'accepted' | 'wrong' | 'error'; input: string; stdout: string; expected: string }[];
  }>(null);
  const [activeResultIdx, setActiveResultIdx] = useState(0);

  // Splitter state
  const [splitX, setSplitX] = useState(45); // % for left panel
  const [splitY, setSplitY] = useState(60); // % for code editor vs bottom
  const containerRef = useRef<HTMLDivElement>(null);
  const liveProblemExamples = useMemo(
    () =>
      assignment?.codingConfig?.testCases
        ?.filter((tc) => !tc.isHidden)
        .map((tc) => ({
          input: tc.input,
          output: tc.output,
          explanation: tc.explanation,
        })),
    [assignment?.codingConfig?.testCases],
  );

  // Kích hoạt Live Coding Sync
  useLiveCodingSync(problemId, code, language, {
    title: assignment?.title,
    description: assignment?.description,
    examples: liveProblemExamples,
  });

  const handleLanguageChange = (val: string) => {
    setLanguage(val);
    const tpl = LANG_OPTIONS.find(l => l.value === val)?.template ?? '';
    setCode(tpl);
  };

  // Horizontal drag
  const startDragX = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startSplit = splitX;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const onMove = (ev: MouseEvent) => {
      const delta = ev.clientX - startX;
      const pct = startSplit + (delta / rect.width) * 100;
      setSplitX(Math.max(25, Math.min(75, pct)));
    };
    const onUp = () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [splitX]);

  // Vertical drag
  const startDragY = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const startY = e.clientY;
    const startSplit = splitY;
    const rightPanel = containerRef.current?.querySelector('[data-right-panel]') as HTMLElement | null;
    if (!rightPanel) return;
    const rect = rightPanel.getBoundingClientRect();
    const onMove = (ev: MouseEvent) => {
      const delta = ev.clientY - startY;
      const pct = startSplit + (delta / rect.height) * 100;
      setSplitY(Math.max(20, Math.min(85, pct)));
    };
    const onUp = () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [splitY]);

  const visibleTestCases = assignment?.codingConfig?.testCases?.filter(tc => !tc.isHidden) ?? [];

  // Set initial custom input from first test case
  useEffect(() => {
    if (visibleTestCases.length > 0 && !customInput) {
      setCustomInput(visibleTestCases[0].input);
      setCustomOutput(visibleTestCases[0].output);
      setTerminalInput(visibleTestCases[0].input);
    }
  }, [visibleTestCases.length]);

  useEffect(() => {
    if (visibleTestCases[activeTestIdx]) {
      setCustomInput(visibleTestCases[activeTestIdx].input);
      setCustomOutput(visibleTestCases[activeTestIdx].output);
    }
  }, [activeTestIdx]);

  const handleUseCaseInTerminal = () => {
    setTerminalInput(customInput);
    setBottomTab('terminal');
  };

  const handleRunTerminal = async () => {
    setTerminalRunning(true);
    setTerminalError('');
    setTerminalResult(null);
    setBottomTab('terminal');

    try {
      const result = await runMutation.mutateAsync({
        language,
        code,
        stdin: terminalInput,
      });
      setTerminalResult(result);
    } catch (err: any) {
      setTerminalError(err?.response?.data?.message || err?.message || 'Execution failed');
    } finally {
      setTerminalRunning(false);
    }
  };

  const handleRun = async () => {
    setRunning(true);
    setBottomTab('result');
    setActiveResultIdx(0);
    try {
      const cases: { status: 'accepted' | 'wrong' | 'error'; input: string; stdout: string; expected: string }[] = [];
      const testInputs = visibleTestCases.length > 0
        ? visibleTestCases.map(tc => ({ input: tc.input, expected: tc.output }))
        : [{ input: customInput, expected: customOutput }];

      for (const tc of testInputs) {
        const result = await runMutation.mutateAsync({
          language,
          code,
          stdin: tc.input,
        });

        if (result.compile && result.compile.code !== 0) {
          cases.push({
            status: 'error',
            input: tc.input,
            stdout: result.compile.stderr || 'Compilation Error',
            expected: tc.expected || '',
          });
          // If compilation error, all subsequent cases will also fail
          for (let j = cases.length; j < testInputs.length; j++) {
            cases.push({
              status: 'error',
              input: testInputs[j].input,
              stdout: result.compile.stderr || 'Compilation Error',
              expected: testInputs[j].expected || '',
            });
          }
          break;
        }

        const actualOutput = result.run.stdout.trim();
        const actualError = result.run.stderr.trim();
        let status: 'accepted' | 'wrong' | 'error' = 'accepted';
        let stdout = actualOutput;

        if (result.run.code !== 0) {
          status = 'error';
          stdout = actualError || actualOutput || 'Runtime Error';
        } else if (tc.expected && actualOutput !== tc.expected.trim()) {
          status = 'wrong';
        }

        cases.push({
          status,
          input: tc.input,
          stdout: stdout || 'No output',
          expected: tc.expected || '',
        });
      }

      const allAccepted = cases.every(c => c.status === 'accepted');
      const hasError = cases.some(c => c.status === 'error');
      setRunResults({
        overall: allAccepted ? 'accepted' : hasError ? 'error' : 'wrong',
        cases,
      });
    } catch (err: any) {
      setRunResults({
        overall: 'error',
        cases: [{ status: 'error', input: customInput, stdout: err.message || 'Execution failed', expected: '' }],
      });
    } finally {
      setRunning(false);
    }
  };

  const handleSubmit = async () => {
    setRunning(true);
    setLeftTab('submissions');
    setBottomTab('result');
    try {
      const result = await submitMutation.mutateAsync({
        assignmentId: assignment?.id || problemId!,
        language,
        code,
      });
      const sub = result.submission;
      const overallStatus = sub.status === 'ACCEPTED' ? 'accepted' as const : sub.status === 'WRONG_ANSWER' ? 'wrong' as const : 'error' as const;
      
      const cases = sub.testResults && sub.testResults.length > 0 
        ? sub.testResults.map((tr) => {
            const tc = assignment?.codingConfig?.testCases?.[tr.testCaseIndex];
            const isHidden = tc?.isHidden;
            const allowView = assignment?.codingConfig?.allowViewHiddenTestCases;
            const hideDetails = isHidden && !allowView;
            
            return {
              status: tr.status === 'ACCEPTED' ? 'accepted' as const : tr.status === 'WRONG_ANSWER' ? 'wrong' as const : 'error' as const,
              input: hideDetails ? 'Hidden Test Case' : tc?.input || 'Hidden Test Case',
              stdout: hideDetails ? '(Output hidden)' : tr.errorMessage || tr.actualOutput || 'No output',
              expected: hideDetails ? '(Hidden Expected)' : tr.expectedOutput || '',
            };
          })
        : [{
            status: overallStatus,
            input: '',
            stdout: `Passed: ${sub.passedCount} / ${sub.totalCount}`,
            expected: '',
          }];

      setRunResults({
        overall: overallStatus,
        cases,
      });
      setActiveResultIdx(0);
    } catch (err: any) {
       setRunResults({
        overall: 'error',
        cases: [{ status: 'error', input: '', stdout: err.message || 'Submission failed', expected: '' }],
      });
      setActiveResultIdx(0);
    } finally {
      setRunning(false);
    }
  };

  const handleViewSubmission = (sub: any) => {
    setCode(sub.code);
    setLanguage(sub.language);
    
    const overallStatus = sub.status === 'ACCEPTED' ? 'accepted' as const : sub.status === 'WRONG_ANSWER' ? 'wrong' as const : 'error' as const;
    
    const cases = sub.testResults && sub.testResults.length > 0 
      ? sub.testResults.map((tr: any) => {
          const tc = assignment?.codingConfig?.testCases?.[tr.testCaseIndex];
          const isHidden = tc?.isHidden;
          const allowView = assignment?.codingConfig?.allowViewHiddenTestCases;
          const hideDetails = isHidden && !allowView;
          
          return {
            status: tr.status === 'ACCEPTED' ? 'accepted' as const : tr.status === 'WRONG_ANSWER' ? 'wrong' as const : 'error' as const,
            input: hideDetails ? 'Hidden Test Case' : tc?.input || 'Hidden Test Case',
            stdout: hideDetails ? '(Output hidden)' : tr.errorMessage || tr.actualOutput || 'No output',
            expected: hideDetails ? '(Hidden Expected)' : tr.expectedOutput || '',
          };
        })
      : [{
          status: overallStatus,
          input: '',
          stdout: `Passed: ${sub.passedCount} / ${sub.totalCount}`,
          expected: '',
        }];

    setRunResults({
      overall: overallStatus,
      cases,
    });
    setActiveResultIdx(0);
    setBottomTab('result');
  };

  /* ── Loading / Error ────────────────────────────────────────────── */
  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 grid place-items-center bg-[#1a1a2e]">
        <div className="flex flex-col items-center gap-3">
          <Icon name="progress_activity" size={36} className="animate-spin text-emerald-400" />
          <span className="text-sm text-gray-400">Loading problem…</span>
        </div>
      </div>
    );
  }
  if (isError || !assignment) {
    return (
      <div className="fixed inset-0 z-50 grid place-items-center bg-[#1a1a2e]">
        <div className="flex flex-col items-center gap-4 text-center">
          <Icon name="error" size={40} className="text-red-400" />
          <h2 className="text-lg font-semibold text-white">Problem not found</h2>
          <button onClick={() => navigate(-1)} className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm hover:bg-emerald-500 transition-colors">
            Back to Problems
          </button>
        </div>
      </div>
    );
  }

  const typeIcon = ASSIGNMENT_TYPE_ICON[assignment.type] ?? 'assignment';

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#1a1a2e] text-gray-200" style={{ fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>
      {/* ── Top Bar ─────────────────────────────────────────────────── */}
      <header className="h-12 flex items-center justify-between px-4 bg-[#1e1e3a] border-b border-white/5 shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-gray-400 hover:text-white transition-colors text-sm">
            <Icon name="arrow_back" size={18} />
            <span className="hidden sm:inline">Back</span>
          </button>
          <div className="w-px h-5 bg-white/10" />
          <div className="flex items-center gap-2 min-w-0">
            <span className={`material-symbols-outlined text-base ${assignment.difficulty === 'EASY' ? 'text-emerald-400' : assignment.difficulty === 'MEDIUM' ? 'text-amber-400' : 'text-red-400'}`}>
              {typeIcon}
            </span>
            <h1 className="text-sm font-semibold text-white truncate max-w-[300px]">{assignment.title}</h1>
            <DifficultyBadge difficulty={assignment.difficulty as DifficultyLevel} />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={language}
            onChange={e => handleLanguageChange(e.target.value)}
            className="bg-[#2a2a4a] border border-white/10 rounded-md px-2.5 py-1 text-xs text-gray-300 outline-none focus:border-emerald-500 cursor-pointer"
          >
            {LANG_OPTIONS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
          </select>
          <button
            onClick={handleRun}
            disabled={running}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#2a2a4a] hover:bg-[#353560] border border-white/10 rounded-md text-xs text-gray-300 transition-colors disabled:opacity-50"
          >
            <Icon name="play_arrow" size={14} className="text-emerald-400" />
            Run
          </button>
          <button
            onClick={handleRunTerminal}
            disabled={terminalRunning}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#2a2a4a] hover:bg-[#353560] border border-white/10 rounded-md text-xs text-gray-300 transition-colors disabled:opacity-50"
          >
            <Icon name="terminal" size={14} className="text-cyan-400" />
            Terminal
          </button>
          <button
            onClick={handleSubmit}
            disabled={running || terminalRunning}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 transition-colors text-xs font-semibold"
          >
            <Icon name="cloud_upload" size={14} />
            Submit
          </button>
        </div>
      </header>

      {/* ── Main Content: Resizable Split ───────────────────────────── */}
      <div ref={containerRef} className="flex-1 flex min-h-0">
        {/* ── LEFT PANEL: Problem Description ──────────────────────── */}
        <div style={{ width: `${splitX}%` }} className="flex flex-col min-h-0 border-r border-white/5">
          {/* Tabs */}
          <div className="flex items-center gap-0 border-b border-white/5 bg-[#1e1e3a] shrink-0">
            {(['description', 'submissions'] as LeftTab[]).map(tab => (
              <button
                key={tab}
                onClick={() => setLeftTab(tab)}
                className={`px-4 py-2.5 text-xs font-medium capitalize transition-colors relative
                  ${leftTab === tab ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
              >
                {tab === 'description' ? (
                  <span className="flex items-center gap-1.5"><Icon name="description" size={14} />Description</span>
                ) : (
                  <span className="flex items-center gap-1.5"><Icon name="history" size={14} />Submissions</span>
                )}
                {leftTab === tab && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500 rounded-t" />}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto">
            {leftTab === 'description' ? (
              <div className="p-5">
                {/* Title + Meta */}
                <h2 className="text-xl font-bold text-white mb-3">{assignment.title}</h2>
                <div className="flex flex-wrap items-center gap-2 mb-5">
                  <DifficultyBadge difficulty={assignment.difficulty as DifficultyLevel} />
                  <span className="text-xs text-gray-400 bg-white/5 px-2 py-0.5 rounded">{ASSIGNMENT_TYPE_LABEL[assignment.type]}</span>
                  <span className="text-xs text-gray-400 bg-white/5 px-2 py-0.5 rounded">{assignment.subject}</span>
                  <span className="inline-flex items-center gap-1 text-xs text-amber-400 font-semibold">
                    <Icon name="bolt" size={13} />{assignment.points} pts
                  </span>
                  {assignment.codingConfig?.timeLimit && (
                    <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                      <Icon name="timer" size={13} />{assignment.codingConfig.timeLimit}s
                    </span>
                  )}
                  {assignment.codingConfig?.memoryLimit && (
                    <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                      <Icon name="memory" size={13} />{assignment.codingConfig.memoryLimit} MB
                    </span>
                  )}
                </div>

                {/* Tags */}
                {assignment.tags && assignment.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-5">
                    {assignment.tags.map((tag, i) => (
                      <span key={i} className="px-2 py-0.5 rounded-full bg-white/5 text-[11px] text-gray-400 border border-white/5">{tag}</span>
                    ))}
                  </div>
                )}

                {/* Description Markdown */}
                <div className="prose prose-invert prose-sm max-w-none
                  prose-headings:text-white prose-headings:font-semibold
                  prose-code:text-emerald-300 prose-code:bg-white/5 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-[13px] prose-code:before:content-none prose-code:after:content-none
                  prose-pre:bg-[#0d0d1a] prose-pre:border prose-pre:border-white/5 prose-pre:rounded-lg
                  prose-strong:text-white prose-a:text-emerald-400
                  prose-p:text-gray-300 prose-li:text-gray-300 prose-td:text-gray-300
                  prose-th:text-gray-200 prose-th:bg-white/5
                  prose-table:border-collapse [&_th]:border [&_th]:border-white/10 [&_th]:px-3 [&_th]:py-1.5
                  [&_td]:border [&_td]:border-white/10 [&_td]:px-3 [&_td]:py-1.5"
                >
                  {assignment.description ? (
                    <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                      {assignment.description}
                    </ReactMarkdown>
                  ) : (
                    <p className="italic text-gray-500">No description provided.</p>
                  )}
                </div>

                {/* Sample Test Cases inline */}
                {visibleTestCases.length > 0 && (
                  <div className="mt-6 space-y-4">
                    {visibleTestCases.map((tc, idx) => (
                      <div key={idx}>
                        <h4 className="text-sm font-semibold text-white mb-2">Example {idx + 1}:</h4>
                        <div className="bg-[#0d0d1a] rounded-lg border border-white/5 p-3 space-y-2">
                          <div>
                            <span className="text-[11px] text-gray-500 font-semibold uppercase">Input:</span>
                            <pre className="text-sm font-mono text-gray-300 mt-1 whitespace-pre-wrap">{tc.input || '(empty)'}</pre>
                          </div>
                          <div>
                            <span className="text-[11px] text-gray-500 font-semibold uppercase">Output:</span>
                            <pre className="text-sm font-mono text-gray-300 mt-1 whitespace-pre-wrap">{tc.output || '(empty)'}</pre>
                          </div>
                          {tc.explanation && (
                            <div>
                              <span className="text-[11px] text-gray-500 font-semibold uppercase">Explanation:</span>
                              <p className="text-sm text-gray-400 mt-1">{tc.explanation}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Constraints / limits */}
                {assignment.codingConfig && (
                  <div className="mt-6">
                    <h4 className="text-sm font-semibold text-white mb-2">Constraints:</h4>
                    <ul className="list-disc list-inside text-sm text-gray-400 space-y-1">
                      <li>Time limit: {assignment.codingConfig.timeLimit ?? 1}s per test</li>
                      <li>Memory limit: {assignment.codingConfig.memoryLimit ?? 256} MB</li>
                      {assignment.codingConfig.allowedLanguages && (
                        <li>Languages: {assignment.codingConfig.allowedLanguages.join(', ')}</li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 space-y-3">
                {submissions.length > 0 ? (
                  submissions.map((sub: any) => (
                    <div 
                      key={sub.id} 
                      className="bg-[#1a1a2e] border border-white/5 rounded-lg p-3 hover:border-white/10 transition-colors cursor-pointer"
                      onClick={() => handleViewSubmission(sub)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                            sub.status === 'ACCEPTED' ? 'bg-emerald-500/10 text-emerald-400' :
                            sub.status === 'WRONG_ANSWER' ? 'bg-red-500/10 text-red-400' :
                            sub.status === 'PENDING' ? 'bg-blue-500/10 text-blue-400' :
                            'bg-yellow-500/10 text-yellow-400'
                          }`}>
                            {sub.status === 'ACCEPTED' ? 'Accepted' :
                             sub.status === 'WRONG_ANSWER' ? 'Wrong Answer' :
                             sub.status === 'PENDING' ? 'Pending' :
                             sub.status === 'TIME_LIMIT_EXCEEDED' ? 'Time Limit' :
                             sub.status === 'MEMORY_LIMIT_EXCEEDED' ? 'Memory Limit' :
                             sub.status === 'COMPILATION_ERROR' ? 'Compilation Error' :
                             'Error'}
                          </span>
                          <span className="text-[11px] text-gray-500 font-mono">{sub.language}</span>
                        </div>
                        <span className="text-[10px] text-gray-500">
                          {new Date(sub.createdAt.endsWith('Z') || sub.createdAt.includes('+') ? sub.createdAt : `${sub.createdAt}Z`).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-400">
                        <div className="flex items-center gap-1">
                          <Icon name="check_circle" size={12} className="text-emerald-500" />
                          {sub.passedCount} / {sub.totalCount} passed
                        </div>
                        {sub.totalExecutionTimeMs != null && (
                          <div className="flex items-center gap-1">
                            <Icon name="timer" size={12} />
                            {sub.totalExecutionTimeMs} ms
                          </div>
                        )}
                        {sub.maxMemoryBytes != null && (
                          <div className="flex items-center gap-1">
                            <Icon name="memory" size={12} />
                            {(sub.maxMemoryBytes / 1024 / 1024).toFixed(1)} MB
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-5 text-center text-gray-500">
                    <Icon name="history" size={48} className="mx-auto mb-3 text-gray-600" />
                    <p className="text-sm">No submissions yet.</p>
                    <p className="text-xs text-gray-600 mt-1">Your submission history will appear here.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Horizontal Splitter ──────────────────────────────────── */}
        <div
          onMouseDown={startDragX}
          className="w-1.5 cursor-col-resize bg-transparent hover:bg-emerald-500/30 active:bg-emerald-500/50 transition-colors shrink-0 relative group"
        >
          <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-center">
            <div className="w-0.5 h-8 bg-white/10 group-hover:bg-emerald-500/60 rounded-full transition-colors" />
          </div>
        </div>

        {/* ── RIGHT PANEL: Code Editor + Test Cases ────────────────── */}
        <div data-right-panel className="flex-1 flex flex-col min-h-0 min-w-0">
          {/* Code Editor Area */}
          <div style={{ height: `${splitY}%` }} className="flex flex-col min-h-0 bg-[#0d0d1a]">
            {/* Editor Header */}
            <div className="flex items-center justify-between px-3 py-1.5 bg-[#1e1e3a] border-b border-white/5 shrink-0">
              <div className="flex items-center gap-2">
                <Icon name="code" size={14} className="text-emerald-400" />
                <span className="text-xs text-gray-400">Code</span>
              </div>
              <button onClick={() => { const tpl = LANG_OPTIONS.find(l => l.value === language)?.template ?? ''; setCode(tpl); }} className="text-xs text-gray-500 hover:text-gray-300 flex items-center gap-1 transition-colors">
                <Icon name="refresh" size={12} />Reset
              </button>
            </div>
            {/* Editor Body */}
            <div className="flex-1 min-h-0 overflow-auto relative">
              <div className="flex min-h-full">
                {/* Line numbers */}
                <div className="shrink-0 w-10 bg-[#0a0a18] select-none border-r border-white/5 pt-3 pr-2">
                  {code.split('\n').map((_, i) => (
                    <div key={i} className="text-right text-[11px] leading-[20px] text-gray-600 font-mono">{i + 1}</div>
                  ))}
                </div>
                  {/* Syntax highlighted editor */}
                  <div className="flex-1 min-w-0 bg-[#0d0d1a]">
                    <Editor
                      value={code}
                      onValueChange={code => setCode(code)}
                      highlight={code => {
                        const grammar = Prism.languages[language === 'cpp' ? 'cpp' : language] || Prism.languages.javascript;
                        return Prism.highlight(code, grammar, language);
                      }}
                      padding={12}
                      className="editor-container"
                      textareaClassName="focus:outline-none"
                      style={{
                        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                        fontSize: 13,
                        lineHeight: '20px',
                        backgroundColor: 'transparent',
                        minHeight: '100%',
                        color: '#d4d4d4', // fallback color
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Add some global CSS overrides for the editor to ensure it fills the space properly */}
              <style>{`
                .editor-container {
                  min-height: 100%;
                }
                .editor-container textarea {
                  outline: none !important;
                }
                /* Optional: small tweaks to Prism tomorrow theme for better integration */
                code[class*="language-"], pre[class*="language-"] {
                  text-shadow: none !important;
                  background: transparent !important;
                }
              `}</style>
            </div>

          {/* ── Vertical Splitter ──────────────────────────────────── */}
          <div
            onMouseDown={startDragY}
            className="h-1.5 cursor-row-resize bg-transparent hover:bg-emerald-500/30 active:bg-emerald-500/50 transition-colors shrink-0 relative group"
          >
            <div className="absolute inset-x-0 top-0 bottom-0 flex items-center justify-center">
              <div className="h-0.5 w-8 bg-white/10 group-hover:bg-emerald-500/60 rounded-full transition-colors" />
            </div>
          </div>

          {/* ── Bottom Panel: Test Cases / Results ─────────────────── */}
          <div style={{ height: `${100 - splitY}%` }} className="flex flex-col min-h-0 bg-[#0d0d1a] border-t border-white/5">
            {/* Tabs */}
            <div className="flex items-center gap-0 border-b border-white/5 bg-[#1e1e3a] shrink-0">
              {(['testcase', 'terminal', 'result'] as BottomTab[]).map(tab => (
                <button
                  key={tab}
                  onClick={() => setBottomTab(tab)}
                  className={`px-3 py-2 text-xs font-medium transition-colors relative
                    ${bottomTab === tab ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
                >
                  {tab === 'testcase' ? (
                    <span className="flex items-center gap-1.5"><Icon name="science" size={13} />Testcase</span>
                  ) : tab === 'terminal' ? (
                    <span className="flex items-center gap-1.5">
                      <Icon name="terminal" size={13} className={terminalResult ? getTerminalStatus(terminalResult).iconClass : 'text-cyan-400'} />
                      Terminal
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5">
                      <Icon name={runResults ? (runResults.overall === 'accepted' ? 'check_circle' : 'cancel') : 'terminal'} size={13} className={runResults?.overall === 'accepted' ? 'text-emerald-400' : runResults?.overall === 'wrong' ? 'text-red-400' : ''} />
                      Result
                    </span>
                  )}
                  {bottomTab === tab && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500 rounded-t" />}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto p-3">
              {bottomTab === 'testcase' ? (
                <div>
                  {/* Test case pills */}
                  <div className="flex flex-wrap items-center gap-1.5 mb-3">
                    {visibleTestCases.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setActiveTestIdx(i)}
                        className={`px-2.5 py-1 rounded text-xs font-medium transition-colors
                          ${activeTestIdx === i ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'}`}
                      >
                        Case {i + 1}
                      </button>
                    ))}
                  </div>
                  {/* Input / Expected / Explanation */}
                  <div className="space-y-3">
                    <div>
                      <div className="mb-1.5 flex items-center justify-between gap-2">
                        <label className="text-[11px] text-gray-500 font-medium uppercase tracking-wider block">Input</label>
                        <button
                          onClick={handleUseCaseInTerminal}
                          className="inline-flex items-center gap-1 rounded bg-cyan-500/10 px-2 py-1 text-[11px] font-semibold text-cyan-300 hover:bg-cyan-500/20"
                        >
                          <Icon name="terminal" size={12} />
                          Dùng trong Terminal
                        </button>
                      </div>
                      <pre className="bg-[#1a1a2e] border border-white/5 rounded-lg p-2.5 text-sm font-mono text-gray-300 whitespace-pre-wrap min-h-[40px]">{customInput.trim()}</pre>
                    </div>
                    <div>
                      <label className="text-[11px] text-gray-500 font-medium uppercase tracking-wider mb-1.5 block">Expected Output</label>
                      <pre className="bg-[#1a1a2e] border border-white/5 rounded-lg p-2.5 text-sm font-mono text-gray-400 whitespace-pre-wrap min-h-[40px]">{customOutput.trim() || '(empty)'}</pre>
                    </div>
                    {visibleTestCases[activeTestIdx]?.explanation && (
                      <div>
                        <label className="text-[11px] text-gray-500 font-medium uppercase tracking-wider mb-1.5 block">Explanation</label>
                        <div className="bg-[#1a1a2e] border border-white/5 rounded-lg p-2.5 text-sm text-gray-400 leading-relaxed
                          prose prose-sm prose-invert max-w-none
                          prose-p:text-gray-400 prose-p:my-1
                          prose-code:text-emerald-300 prose-code:bg-white/5 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-xs
                          prose-pre:bg-[#0a0a18] prose-pre:border prose-pre:border-white/5 prose-pre:rounded-lg
                          prose-strong:text-gray-200 prose-em:text-gray-300
                          prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5">
                          <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                            {visibleTestCases[activeTestIdx].explanation}
                          </ReactMarkdown>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : bottomTab === 'terminal' ? (
                <div className="grid h-full min-h-[220px] grid-cols-1 gap-3 lg:grid-cols-[42%_1fr]">
                  <section className="flex min-h-0 flex-col rounded-xl border border-white/10 bg-[#111123] overflow-hidden">
                    <div className="flex items-center justify-between border-b border-white/10 bg-[#1a1a2e] px-3 py-2">
                      <div className="flex items-center gap-2">
                        <Icon name="keyboard" size={14} className="text-cyan-400" />
                        <span className="text-xs font-semibold text-gray-300">Standard Input</span>
                      </div>
                      <button
                        onClick={() => setTerminalInput('')}
                        className="text-[11px] text-gray-500 hover:text-gray-300"
                      >
                        Clear
                      </button>
                    </div>
                    <textarea
                      value={terminalInput}
                      onChange={(event) => setTerminalInput(event.target.value)}
                      spellCheck={false}
                      placeholder={'Nhập testcase/stdin ở đây...\nVí dụ:\n5\n1 2 3 4 5'}
                      className="min-h-0 flex-1 resize-none bg-transparent p-3 font-mono text-sm leading-5 text-gray-200 outline-none placeholder:text-gray-600"
                    />
                    <div className="flex items-center justify-between border-t border-white/10 px-3 py-2">
                      <span className="text-[11px] text-gray-600">
                        {terminalInput.split('\n').length} dòng · {terminalInput.length} ký tự
                      </span>
                      <button
                        onClick={handleRunTerminal}
                        disabled={terminalRunning}
                        className="inline-flex items-center gap-1.5 rounded-md bg-cyan-500/15 px-3 py-1.5 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/25 disabled:opacity-50"
                      >
                        <Icon name={terminalRunning ? 'progress_activity' : 'play_arrow'} size={14} className={terminalRunning ? 'animate-spin' : ''} />
                        Chạy Terminal
                      </button>
                    </div>
                  </section>

                  <section className="flex min-h-0 flex-col rounded-xl border border-white/10 bg-[#05050d] overflow-hidden">
                    <div className="flex items-center justify-between border-b border-white/10 bg-[#111123] px-3 py-2">
                      <div className="flex items-center gap-2">
                        <Icon name="terminal" size={14} className="text-cyan-400" />
                        <span className="text-xs font-semibold text-gray-300">Terminal Output</span>
                      </div>
                      {terminalResult && (
                        <span className={`rounded px-2 py-0.5 text-[11px] font-semibold ${getTerminalStatus(terminalResult).badgeClass}`}>
                          {getTerminalStatus(terminalResult).label}
                        </span>
                      )}
                    </div>
                    <div className="min-h-0 flex-1 overflow-auto p-3 font-mono text-xs leading-5">
                      {terminalRunning ? (
                        <div className="flex items-center gap-2 text-gray-400">
                          <Icon name="progress_activity" size={15} className="animate-spin" />
                          Compiling and running...
                        </div>
                      ) : terminalError ? (
                        <pre className="whitespace-pre-wrap text-red-300">{terminalError}</pre>
                      ) : terminalResult ? (
                        <TerminalOutput result={terminalResult} />
                      ) : (
                        <div className="text-gray-600">
                          <div className="text-gray-500">$ run {language}</div>
                          <div className="mt-2">Nhập stdin bên trái rồi bấm Chạy Terminal để xem stdout, stderr và lỗi biên dịch.</div>
                        </div>
                      )}
                    </div>
                  </section>
                </div>
              ) : (
                <div>
                  {running ? (
                    <div className="flex items-center gap-2 text-gray-400 text-sm py-4">
                      <Icon name="progress_activity" size={16} className="animate-spin" />
                      Running…
                    </div>
                  ) : runResults ? (
                    <div>
                      {/* Overall verdict */}
                      <div className="flex items-center gap-3 mb-3">
                        <span className={`text-lg font-bold ${runResults.overall === 'accepted' ? 'text-emerald-400' : 'text-red-400'}`}>
                          {runResults.overall === 'accepted' ? '✓ Accepted' : runResults.overall === 'wrong' ? '✗ Wrong Answer' : '✗ Error'}
                        </span>
                        {runResults.cases.length > 1 && (
                          <span className="text-xs text-gray-400">
                            {runResults.cases.filter(c => c.status === 'accepted').length} / {runResults.cases.length} passed
                          </span>
                        )}
                      </div>

                      {/* Per-case pills */}
                      {runResults.cases.length > 1 && (
                        <div className="flex flex-wrap items-center gap-1.5 mb-3">
                          {runResults.cases.map((c, i) => (
                            <button
                              key={i}
                              onClick={() => setActiveResultIdx(i)}
                              className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-colors
                                ${activeResultIdx === i ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'}`}
                            >
                              <Icon
                                name={c.status === 'accepted' ? 'check_circle' : 'cancel'}
                                size={12}
                                className={c.status === 'accepted' ? 'text-emerald-400' : 'text-red-400'}
                              />
                              Case {i + 1}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Selected case detail */}
                      {runResults.cases[activeResultIdx] && (
                        <div className="space-y-3">
                          {runResults.cases[activeResultIdx].input && (
                            <div>
                              <span className="text-[11px] text-gray-500 font-medium uppercase tracking-wider">Input</span>
                              <pre className="mt-1 bg-[#1a1a2e] border border-white/5 rounded-lg p-2.5 text-sm font-mono text-gray-300 whitespace-pre-wrap">{runResults.cases[activeResultIdx].input}</pre>
                            </div>
                          )}
                          <div>
                            <span className="text-[11px] text-gray-500 font-medium uppercase tracking-wider">Output</span>
                            <pre className={`mt-1 bg-[#1a1a2e] border rounded-lg p-2.5 text-sm font-mono whitespace-pre-wrap ${
                              runResults.cases[activeResultIdx].status === 'accepted' ? 'border-emerald-500/20 text-emerald-300' :
                              runResults.cases[activeResultIdx].status === 'wrong' ? 'border-red-500/20 text-red-300' :
                              'border-white/5 text-gray-300'
                            }`}>{runResults.cases[activeResultIdx].stdout}</pre>
                          </div>
                          {runResults.cases[activeResultIdx].expected && (
                            <div>
                              <span className="text-[11px] text-gray-500 font-medium uppercase tracking-wider">Expected</span>
                              <pre className="mt-1 bg-[#1a1a2e] border border-white/5 rounded-lg p-2.5 text-sm font-mono text-gray-300 whitespace-pre-wrap">{runResults.cases[activeResultIdx].expected}</pre>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500 py-4 text-center">
                      Click <strong className="text-gray-300">Run</strong> to execute your code against the test cases.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TerminalOutput({ result }: { result: ICodeExecutionResponse }) {
  const status = getTerminalStatus(result);
  const compile = result.compile;
  const run = result.run;
  const compileFailed = !!compile && compile.code !== 0;
  const runMeta = [
    `exit code: ${run.code}`,
    run.signal ? `signal: ${run.signal}` : '',
    run.status ? `status: ${run.status}` : '',
    run.wall_time != null ? `wall: ${run.wall_time}ms` : '',
    run.cpu_time != null ? `cpu: ${run.cpu_time}ms` : '',
    run.memory != null ? `memory: ${formatBytes(run.memory)}` : '',
  ].filter(Boolean);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${status.dotClass}`} />
        <span className={status.textClass}>{status.label}</span>
      </div>

      {compile && (
        <div>
          <div className="mb-1 text-gray-500">$ compile {result.language}</div>
          <pre className={`whitespace-pre-wrap rounded-lg border p-2 ${
            compileFailed ? 'border-red-500/20 bg-red-500/5 text-red-200' : 'border-emerald-500/20 bg-emerald-500/5 text-emerald-200'
          }`}>
            {compileFailed ? `Compilation failed with exit code ${compile.code}` : 'Compilation succeeded'}
          </pre>
          {compile.stdout && <TerminalBlock title="compiler stdout" tone="muted" value={compile.stdout} />}
          {compile.stderr && <TerminalBlock title="compiler stderr" tone="error" value={compile.stderr} />}
          {compile.output && compile.output !== compile.stdout && compile.output !== compile.stderr && (
            <TerminalBlock title="compiler output" tone={compileFailed ? 'error' : 'muted'} value={compile.output} />
          )}
        </div>
      )}

      {!compileFailed && (
        <div>
          <div className="mb-1 text-gray-500">$ run</div>
          <pre className="whitespace-pre-wrap rounded-lg border border-white/10 bg-white/[0.03] p-2 text-gray-400">
            {runMeta.join(' · ') || 'process finished'}
          </pre>
          {run.stdout && <TerminalBlock title="stdout" tone="success" value={run.stdout} />}
          {run.stderr && <TerminalBlock title="stderr" tone="error" value={run.stderr} />}
          {run.message && <TerminalBlock title="message" tone={status.kind === 'success' ? 'muted' : 'error'} value={run.message} />}
          {run.output && !run.stdout && !run.stderr && <TerminalBlock title="output" tone={status.kind === 'success' ? 'success' : 'error'} value={run.output} />}
          {!run.stdout && !run.stderr && !run.output && !run.message && (
            <pre className="mt-2 whitespace-pre-wrap rounded-lg border border-white/10 bg-white/[0.03] p-2 text-gray-500">
              No output
            </pre>
          )}
        </div>
      )}
    </div>
  );
}

function TerminalBlock({
  title,
  tone,
  value,
}: {
  title: string;
  tone: 'success' | 'error' | 'muted';
  value: string;
}) {
  const toneClass =
    tone === 'success'
      ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-200'
      : tone === 'error'
        ? 'border-red-500/20 bg-red-500/5 text-red-200'
        : 'border-white/10 bg-white/[0.03] text-gray-300';

  return (
    <div className="mt-2">
      <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-gray-600">{title}</div>
      <pre className={`whitespace-pre-wrap rounded-lg border p-2 ${toneClass}`}>{value}</pre>
    </div>
  );
}

function getTerminalStatus(result: ICodeExecutionResponse) {
  if (result.compile && result.compile.code !== 0) {
    return {
      kind: 'error',
      label: 'Compilation Error',
      iconClass: 'text-red-400',
      badgeClass: 'bg-red-500/10 text-red-300',
      textClass: 'font-semibold text-red-300',
      dotClass: 'bg-red-400',
    };
  }

  if (result.run.status === 'TO' || result.run.signal) {
    return {
      kind: 'error',
      label: 'Runtime Error',
      iconClass: 'text-amber-400',
      badgeClass: 'bg-amber-500/10 text-amber-300',
      textClass: 'font-semibold text-amber-300',
      dotClass: 'bg-amber-400',
    };
  }

  if (result.run.code !== 0) {
    return {
      kind: 'error',
      label: 'Runtime Error',
      iconClass: 'text-red-400',
      badgeClass: 'bg-red-500/10 text-red-300',
      textClass: 'font-semibold text-red-300',
      dotClass: 'bg-red-400',
    };
  }

  return {
    kind: 'success',
    label: 'Finished',
    iconClass: 'text-emerald-400',
    badgeClass: 'bg-emerald-500/10 text-emerald-300',
    textClass: 'font-semibold text-emerald-300',
    dotClass: 'bg-emerald-400',
  };
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
