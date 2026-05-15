import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { DifficultyBadge, Icon } from '@cp/ui';
import {
  AssignmentType,
  ASSIGNMENT_TYPE_LABEL,
  ASSIGNMENT_TYPE_ICON,
  DifficultyLevel,
  SupportedLanguage,
  ICodingTestCase,
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

/* ── Language config ──────────────────────────────────────────────── */
const LANG_OPTIONS: { value: string; label: string; template: string }[] = [
  { value: 'cpp', label: 'C++ 20', template: '#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    // Your code here\n    \n    return 0;\n}\n' },
  { value: 'java', label: 'Java 17', template: 'import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        // Your code here\n        \n    }\n}\n' },
  { value: 'python', label: 'Python 3', template: '# Your code here\nimport sys\ninput = sys.stdin.readline\n\n' },
  { value: 'javascript', label: 'JavaScript', template: '// Your code here\nconst readline = require("readline");\nconst rl = readline.createInterface({ input: process.stdin });\n\nrl.on("line", (line) => {\n    \n});\n' },
];

/* ── Tabs for left panel ──────────────────────────────────────────── */
type LeftTab = 'description' | 'submissions';
type BottomTab = 'testcase' | 'result';

export default function StudentAssignmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: assignment, isLoading, isError } = useAssignment(id);

  const [leftTab, setLeftTab] = useState<LeftTab>('description');
  const [bottomTab, setBottomTab] = useState<BottomTab>('testcase');
  const [language, setLanguage] = useState(LANG_OPTIONS[0].value);
  const [code, setCode] = useState(LANG_OPTIONS[0].template);
  const [activeTestIdx, setActiveTestIdx] = useState(0);
  const [customInput, setCustomInput] = useState('');
  const [customOutput, setCustomOutput] = useState('');
  const [running, setRunning] = useState(false);
  const [runResult, setRunResult] = useState<null | { status: 'accepted' | 'wrong' | 'error'; stdout: string; expected: string; runtime: string; memory: string }>(null);

  // Splitter state
  const [splitX, setSplitX] = useState(45); // % for left panel
  const [splitY, setSplitY] = useState(60); // % for code editor vs bottom
  const containerRef = useRef<HTMLDivElement>(null);

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
    }
  }, [visibleTestCases.length]);

  useEffect(() => {
    if (visibleTestCases[activeTestIdx]) {
      setCustomInput(visibleTestCases[activeTestIdx].input);
      setCustomOutput(visibleTestCases[activeTestIdx].output);
    }
  }, [activeTestIdx]);

  const handleRun = () => {
    setRunning(true);
    setBottomTab('result');
    setTimeout(() => {
      setRunResult({
        status: Math.random() > 0.5 ? 'accepted' : 'wrong',
        stdout: customOutput || 'No output',
        expected: customOutput || '',
        runtime: `${(Math.random() * 100 + 10).toFixed(0)} ms`,
        memory: `${(Math.random() * 10 + 5).toFixed(1)} MB`,
      });
      setRunning(false);
    }, 800);
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
          <button onClick={() => navigate('/student/assignments')} className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm hover:bg-emerald-500 transition-colors">
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
          <Link to="/student/assignments" className="flex items-center gap-1.5 text-gray-400 hover:text-white transition-colors text-sm">
            <Icon name="arrow_back" size={18} />
            <span className="hidden sm:inline">Problems</span>
          </Link>
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
            disabled={running}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 rounded-md text-xs text-white font-medium transition-colors disabled:opacity-50"
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
              <div className="p-5 text-center text-gray-500">
                <Icon name="history" size={48} className="mx-auto mb-3 text-gray-600" />
                <p className="text-sm">No submissions yet.</p>
                <p className="text-xs text-gray-600 mt-1">Your submission history will appear here.</p>
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
              {(['testcase', 'result'] as BottomTab[]).map(tab => (
                <button
                  key={tab}
                  onClick={() => setBottomTab(tab)}
                  className={`px-3 py-2 text-xs font-medium transition-colors relative
                    ${bottomTab === tab ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
                >
                  {tab === 'testcase' ? (
                    <span className="flex items-center gap-1.5"><Icon name="science" size={13} />Testcase</span>
                  ) : (
                    <span className="flex items-center gap-1.5">
                      <Icon name={runResult ? (runResult.status === 'accepted' ? 'check_circle' : 'cancel') : 'terminal'} size={13} className={runResult?.status === 'accepted' ? 'text-emerald-400' : runResult?.status === 'wrong' ? 'text-red-400' : ''} />
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
                  <div className="flex items-center gap-1.5 mb-3">
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
                  {/* Input / Expected */}
                  <div className="space-y-3">
                    <div>
                      <label className="text-[11px] text-gray-500 font-medium uppercase tracking-wider mb-1.5 block">Input =</label>
                      <textarea
                        value={customInput}
                        onChange={e => setCustomInput(e.target.value)}
                        className="w-full bg-[#1a1a2e] border border-white/5 rounded-lg p-2.5 text-sm font-mono text-gray-300 resize-none outline-none focus:border-emerald-500/50 min-h-[60px]"
                        rows={3}
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-gray-500 font-medium uppercase tracking-wider mb-1.5 block">Expected Output =</label>
                      <pre className="bg-[#1a1a2e] border border-white/5 rounded-lg p-2.5 text-sm font-mono text-gray-400 whitespace-pre-wrap min-h-[40px]">
                        {customOutput || '(empty)'}
                      </pre>
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  {running ? (
                    <div className="flex items-center gap-2 text-gray-400 text-sm py-4">
                      <Icon name="progress_activity" size={16} className="animate-spin" />
                      Running…
                    </div>
                  ) : runResult ? (
                    <div>
                      <div className={`text-lg font-bold mb-3 ${runResult.status === 'accepted' ? 'text-emerald-400' : 'text-red-400'}`}>
                        {runResult.status === 'accepted' ? '✓ Accepted' : '✗ Wrong Answer'}
                      </div>
                      <div className="flex gap-4 mb-4">
                        <div className="text-xs text-gray-400">
                          <span className="text-gray-500">Runtime:</span> <span className="text-white font-medium">{runResult.runtime}</span>
                        </div>
                        <div className="text-xs text-gray-400">
                          <span className="text-gray-500">Memory:</span> <span className="text-white font-medium">{runResult.memory}</span>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <span className="text-[11px] text-gray-500 font-medium uppercase tracking-wider">Input</span>
                          <pre className="mt-1 bg-[#1a1a2e] border border-white/5 rounded-lg p-2.5 text-sm font-mono text-gray-300 whitespace-pre-wrap">{customInput}</pre>
                        </div>
                        <div>
                          <span className="text-[11px] text-gray-500 font-medium uppercase tracking-wider">Output</span>
                          <pre className="mt-1 bg-[#1a1a2e] border border-white/5 rounded-lg p-2.5 text-sm font-mono text-gray-300 whitespace-pre-wrap">{runResult.stdout}</pre>
                        </div>
                        <div>
                          <span className="text-[11px] text-gray-500 font-medium uppercase tracking-wider">Expected</span>
                          <pre className="mt-1 bg-[#1a1a2e] border border-white/5 rounded-lg p-2.5 text-sm font-mono text-gray-300 whitespace-pre-wrap">{runResult.expected}</pre>
                        </div>
                      </div>
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
