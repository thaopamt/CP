import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { DifficultyBadge, Icon, useConfirm } from '@cp/ui';
import {
  DifficultyLevel,
  ICodeExecutionResponse,
  ISubmission,
  SubmissionStatus,
} from '@cp/shared';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

import Editor, { useMonaco } from '@monaco-editor/react';

import { useAssignment, useCourseAssignments } from '../../api/curriculum.queries';
import { useAllMySubmissions, useRunCode, useSubmitCode, useSubmissions } from '../../api/submissions.queries';
import { useMyTasks, useStudentDashboard, useUpdateDefaultLanguage } from '../../api/student.queries';
import { useLiveCodingSync } from '../../hooks/useLiveCodingSync';
import { useInteractiveExec } from '../../hooks/useInteractiveExec';
import { useSubmissionRealtimeFeed } from '../../hooks/useSubmissionRealtimeFeed';
import { CompletionRankingInfo } from '../../components/CompletionRankingInfo';
import { useChatWidgetStore } from '../../stores/chat-widget.store';
import {
  buildSubmissionRunResults,
  getActiveRunResultIndex,
  RunResultsState,
} from './submission-result.helpers';

/* ── Language config ──────────────────────────────────────────────── */
const LANG_OPTIONS: { value: string; label: string; template: string }[] = [
  { value: 'cpp', label: 'C++ 20', template: '#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    // Your code here\n    \n    return 0;\n}\n' },
  { value: 'java', label: 'Java 17', template: 'import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        // Your code here\n        \n    }\n}\n' },
  { value: 'python', label: 'Python 3', template: '' },
  { value: 'javascript', label: 'JavaScript', template: '// Your code here\nconst readline = require("readline");\nconst rl = readline.createInterface({ input: process.stdin });\n\nrl.on("line", (line) => {\n    \n});\n' },
];

/* ── Tabs for left panel ──────────────────────────────────────────── */
type LeftTab = 'description' | 'submissions';
type BottomTab = 'testcase' | 'terminal' | 'result';
type WorkspaceRouteState = { classId?: string; courseId?: string } | null;
type NextAssignmentTarget = { title: string; path: string; state?: WorkspaceRouteState };
type WorkspaceDraft = { language: string; code: string };
type CourseProgressStatus = 'accepted' | 'partial' | 'wrong' | 'idle';
type CourseProgressItem = {
  id: string;
  title: string;
  isCoding: boolean;
  status: CourseProgressStatus;
};

function getCourseProgressStatus(submissions: ISubmission[] | undefined): CourseProgressStatus {
  if (!submissions?.length) return 'idle';

  if (submissions.some((submission) => submission.status === SubmissionStatus.ACCEPTED || (
    submission.totalCount > 0 && submission.passedCount >= submission.totalCount
  ))) {
    return 'accepted';
  }

  if (submissions.some((submission) => submission.passedCount > 0)) {
    return 'partial';
  }

  return 'wrong';
}

function CourseProgressDots({
  items,
  currentAssignmentId,
  onSelect,
}: {
  items: CourseProgressItem[];
  currentAssignmentId?: string;
  onSelect: (item: CourseProgressItem) => void;
}) {
  const [hoverInfo, setHoverInfo] = useState<{ title: string; index: number; x: number; y: number } | null>(null);
  const [scrollButtons, setScrollButtons] = useState({ canScrollLeft: false, canScrollRight: false });
  const progressViewportRef = useRef<HTMLDivElement | null>(null);
  const currentDotRef = useRef<HTMLButtonElement | null>(null);
  const shouldScrollProgress = items.length > 8;

  const updateScrollButtons = useCallback(() => {
    const viewport = progressViewportRef.current;
    const maxScrollLeft = viewport ? viewport.scrollWidth - viewport.clientWidth : 0;
    const nextScrollButtons = {
      canScrollLeft: shouldScrollProgress && !!viewport && viewport.scrollLeft > 1,
      canScrollRight: shouldScrollProgress && !!viewport && viewport.scrollLeft < maxScrollLeft - 1,
    };

    setScrollButtons((current) => (
      current.canScrollLeft === nextScrollButtons.canScrollLeft &&
      current.canScrollRight === nextScrollButtons.canScrollRight
        ? current
        : nextScrollButtons
    ));
  }, [shouldScrollProgress]);

  useEffect(() => {
    if (!shouldScrollProgress) {
      updateScrollButtons();
      return;
    }

    currentDotRef.current?.scrollIntoView({ block: 'nearest', inline: 'center' });
    requestAnimationFrame(updateScrollButtons);
  }, [currentAssignmentId, items.length, shouldScrollProgress, updateScrollButtons]);

  useEffect(() => {
    const viewport = progressViewportRef.current;
    if (!viewport) return undefined;

    const handleScroll = () => updateScrollButtons();
    viewport.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll);
    updateScrollButtons();

    return () => {
      viewport.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [updateScrollButtons]);

  const handleProgressScroll = useCallback((direction: 'left' | 'right') => {
    const viewport = progressViewportRef.current;
    if (!viewport) return;

    viewport.scrollBy({
      left: direction === 'left' ? -viewport.clientWidth : viewport.clientWidth,
      behavior: 'smooth',
    });
  }, []);

  if (items.length === 0) return null;

  return (
    <>
      <nav
        aria-label="Course assignment progress"
        className="mx-3 flex shrink-0 items-center justify-center gap-1 overflow-hidden"
      >
        {shouldScrollProgress && (
          <button
            type="button"
            onClick={() => handleProgressScroll('left')}
            disabled={!scrollButtons.canScrollLeft}
            aria-label="Scroll assignments left"
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-gray-300 transition-colors hover:bg-white/10 hover:text-white disabled:pointer-events-none disabled:opacity-35"
          >
            <Icon name="chevron_left" size={15} />
          </button>
        )}

        <div
          ref={progressViewportRef}
          className={`flex ${shouldScrollProgress ? 'w-36 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden' : 'max-w-full'} items-center gap-1 overflow-x-auto rounded-full border border-white/10 bg-white/5 px-1.5 py-1 pb-[2px]`}
        >
          {items.map((item, index) => {
            const isCurrent = item.id === currentAssignmentId;
            const statusClass = {
              accepted: 'border-emerald-400 bg-emerald-400 text-[#1a1a2e]',
              partial: 'border-emerald-400 bg-emerald-400/20 text-emerald-400',
              wrong: 'border-amber-400 bg-amber-400 text-[#1a1a2e]',
              idle: 'border-white/20 bg-white/10 text-gray-300',
            }[item.status];

            return (
              <button
                key={item.id}
                ref={(node) => {
                  if (!isCurrent && currentDotRef.current === node) currentDotRef.current = null;
                  if (isCurrent) currentDotRef.current = node;
                }}
                type="button"
                onClick={() => onSelect(item)}
                onMouseEnter={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  setHoverInfo({
                    title: item.title,
                    index,
                    x: rect.left + rect.width / 2,
                    y: rect.bottom + 8,
                  });
                }}
                onMouseLeave={() => setHoverInfo(null)}
                aria-label={`Bài ${index + 1}: ${item.title}${isCurrent ? ' đang làm' : ''}`}
                className={`flex items-center justify-center shrink-0 rounded-full border transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-emerald-300/70 ${
                  isCurrent ? 'w-5 h-5 text-[10px] font-bold ring-2 ring-white/50 ring-offset-1 ring-offset-[#1a1a2e]' : 'w-3 h-3'
                } ${statusClass}`}
              >
                {isCurrent ? index + 1 : null}
              </button>
            );
          })}
        </div>

        {shouldScrollProgress && (
          <button
            type="button"
            onClick={() => handleProgressScroll('right')}
            disabled={!scrollButtons.canScrollRight}
            aria-label="Scroll assignments right"
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-gray-300 transition-colors hover:bg-white/10 hover:text-white disabled:pointer-events-none disabled:opacity-35"
          >
            <Icon name="chevron_right" size={15} />
          </button>
        )}
      </nav>

      {hoverInfo && (
        <div
          className="fixed z-[100] pointer-events-none -translate-x-1/2 px-3 py-1.5 bg-[#2a2a4a] text-white text-sm font-medium rounded-lg shadow-xl border border-white/10 animate-in fade-in zoom-in-95 duration-150 whitespace-nowrap"
          style={{ left: hoverInfo.x, top: hoverInfo.y }}
        >
          <span className="text-emerald-400 mr-1.5">{hoverInfo.title}</span>
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-[6px] border-transparent border-b-[#2a2a4a]" />
        </div>
      )}
    </>
  );
}

export default function StudentWorkspacePage() {
  const { isConnected: realtimeConnected } = useSubmissionRealtimeFeed();
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);
  const decorationsCollectionRef = useRef<any>(null);

  const routeParams = useParams<{ problemId?: string; id?: string }>();
  const problemId = routeParams.problemId ?? routeParams.id;
  const location = useLocation();
  const navigate = useNavigate();
  const confirm = useConfirm();
  const isStandaloneAssignmentRoute = location.pathname.startsWith('/student/assignments/');
  const routeState = location.state as WorkspaceRouteState;
  const classIdFromState = routeState?.classId;
  const courseIdFromState = routeState?.courseId;

  const { data: assignment, isLoading, isError } = useAssignment(problemId);
  const { data: courseAssignments = [] } = useCourseAssignments(courseIdFromState);
  const myTasksParams = useMemo(() => ({ page: 1, limit: 200 }), []);
  const allMySubmissionsParams = useMemo(() => ({ limit: 500 }), []);
  const { data: myTasksData } = useMyTasks(myTasksParams);
  const { data: allMySubmissionsData } = useAllMySubmissions(allMySubmissionsParams, !!courseIdFromState);
  const { data: submissions = [], refetch: refetchSubmissions } = useSubmissions(assignment?.id || '');
  const runMutation = useRunCode();
  const submitMutation = useSubmitCode();
  const { data: dashboardData } = useStudentDashboard();
  const updateLangMutation = useUpdateDefaultLanguage();

  const [leftTab, setLeftTab] = useState<LeftTab>('description');
  const [bottomTab, setBottomTab] = useState<BottomTab>('testcase');
  // ── LocalStorage draft key ──
  const draftKey = `code-draft-workspace-${problemId ?? 'new'}`;

  const savedLang = localStorage.getItem('cp_default_language');
  const defaultLangOption = LANG_OPTIONS.find(l => l.value === savedLang) || LANG_OPTIONS[0];

  const readCurrentWorkspaceDraft = (): WorkspaceDraft => {
    const fallback = LANG_OPTIONS.find(l => l.value === localStorage.getItem('cp_default_language')) || defaultLangOption;
    try {
      const draft = JSON.parse(localStorage.getItem(draftKey) || 'null');
      const draftLang = LANG_OPTIONS.find(l => l.value === draft?.language) || fallback;
      return {
        language: draftLang.value,
        code: typeof draft?.code === 'string' ? draft.code : draftLang.template,
      };
    } catch {
      return { language: fallback.value, code: fallback.template };
    }
  };
  
  const [language, setLanguage] = useState(() => {
    return readCurrentWorkspaceDraft().language;
  });
  
  const [code, setCode] = useState(() => {
    return readCurrentWorkspaceDraft().code;
  });

  // ── Auto-save code to localStorage (debounced 500ms) ──
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(draftKey, JSON.stringify({ code, language }));
      } catch { /* ignore quota errors */ }
    }, 500);
    return () => clearTimeout(timer);
  }, [code, language, draftKey]);

  const [hasInitFromDb, setHasInitFromDb] = useState(false);
  const [activeTestIdx, setActiveTestIdx] = useState(0);
  const [customInput, setCustomInput] = useState('');
  const [customOutput, setCustomOutput] = useState('');
  const [terminalInput, setTerminalInput] = useState('');
  const [terminalResult, setTerminalResult] = useState<ICodeExecutionResponse | null>(null);
  const [terminalError, setTerminalError] = useState('');
  const [terminalRunning, setTerminalRunning] = useState(false);
  const [terminalHistory, setTerminalHistory] = useState<{ stdin: string; result?: ICodeExecutionResponse; error?: string }[]>([]);
  const [terminalMultiline, setTerminalMultiline] = useState(false);
  const [running, setRunning] = useState(false);
  const [manualRunResults, setManualRunResults] = useState<RunResultsState | null>(null);
  const [activeResultIdx, setActiveResultIdx] = useState(0);
  const [submittedSubmissionId, setSubmittedSubmissionId] = useState<string | null>(null);
  const acceptedPromptedSubmissionIdRef = useRef<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopy = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 1500);
  };

  const classIdForBack = classIdFromState ?? assignment?.classIds?.[0];
  const handleBack = useCallback(() => {
    if (isStandaloneAssignmentRoute) {
      navigate('/student/assignments');
      return;
    }

    if (classIdForBack && courseIdFromState) {
      navigate(`/student/classes/${classIdForBack}/courses/${courseIdFromState}`);
      return;
    }

    navigate(classIdForBack ? `/student/classes/${classIdForBack}` : '/student/classes');
  }, [classIdForBack, courseIdFromState, isStandaloneAssignmentRoute, navigate]);
  const backLabel = isStandaloneAssignmentRoute ? 'Problems' : 'Back';
  const errorBackLabel = isStandaloneAssignmentRoute ? 'Back to Problems' : 'Back to Course';

  // Interactive execution (WebSocket)
  const interactiveExec = useInteractiveExec();

  // Terminal refs
  const terminalBodyRef = useRef<HTMLDivElement>(null);
  const terminalInputRef = useRef<HTMLInputElement>(null);
  const inputHistoryRef = useRef<string[]>([]);
  const inputHistoryIdxRef = useRef(-1);

  // Auto-scroll terminal body when new output arrives
  useEffect(() => {
    const el = terminalBodyRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [interactiveExec.lines]);

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
  const orderedCourseAssignments = useMemo(
    () => [...courseAssignments].sort((a, b) => a.order - b.order),
    [courseAssignments],
  );
  const submissionsByAssignmentId = useMemo(() => {
    const map = new Map<string, ISubmission[]>();
    const allSubmissions = (allMySubmissionsData?.data ?? []) as ISubmission[];

    for (const submission of allSubmissions) {
      const list = map.get(submission.assignmentId) ?? [];
      list.push(submission);
      map.set(submission.assignmentId, list);
    }

    if (assignment?.id && submissions.length > 0) {
      map.set(assignment.id, submissions as ISubmission[]);
    }

    return map;
  }, [allMySubmissionsData?.data, assignment?.id, submissions]);
  const courseProgressItems = useMemo<CourseProgressItem[]>(
    () =>
      orderedCourseAssignments.map((courseAssignment) => ({
        id: courseAssignment.assignment.id,
        title: courseAssignment.assignment.title,
        isCoding: !!courseAssignment.assignment.codingConfig,
        status: getCourseProgressStatus(submissionsByAssignmentId.get(courseAssignment.assignment.id)),
      })),
    [orderedCourseAssignments, submissionsByAssignmentId],
  );
  const handleCourseProgressSelect = useCallback((item: CourseProgressItem) => {
    if (item.id === problemId) return;

    if (item.isCoding) {
      navigate(`/student/workspace/${item.id}`, { state: routeState });
      return;
    }

    navigate(`/student/assignments/${item.id}`);
  }, [navigate, problemId, routeState]);

  const nextAssignmentTarget = useMemo<NextAssignmentTarget | null>(() => {
    if (!problemId) return null;

    const courseAssignmentIndex = orderedCourseAssignments.findIndex(
      (courseAssignment) => courseAssignment.assignment.id === problemId,
    );

    if (courseAssignmentIndex >= 0) {
      const next = orderedCourseAssignments[courseAssignmentIndex + 1]?.assignment;
      if (!next) return null;

      return {
        title: next.title,
        path: next.codingConfig ? `/student/workspace/${next.id}` : `/student/assignments/${next.id}`,
        state: next.codingConfig ? routeState : undefined,
      };
    }

    const tasks = myTasksData?.items ?? [];
    const taskIndex = tasks.findIndex((task) => task.id === problemId);
    const nextTask = taskIndex >= 0 ? tasks[taskIndex + 1] : null;
    if (!nextTask) return null;

    return {
      title: nextTask.title,
      path: `/student/assignments/${nextTask.id}`,
    };
  }, [myTasksData?.items, orderedCourseAssignments, problemId, routeState]);

  const submittedSubmission = useMemo(
    () => submittedSubmissionId
      ? submissions.find((submission: any) => submission.id === submittedSubmissionId) ?? null
      : null,
    [submittedSubmissionId, submissions],
  );
  const liveSubmissionRunResults = useMemo(
    () => submittedSubmission ? buildSubmissionRunResults(submittedSubmission, assignment) : null,
    [assignment, submittedSubmission],
  );
  const runResults = liveSubmissionRunResults ?? manualRunResults;

  useEffect(() => {
    if (!submittedSubmissionId) return;
    if (realtimeConnected) return;
    if (submittedSubmission?.status && submittedSubmission.status !== SubmissionStatus.PENDING) return;

    const initialTimer = window.setTimeout(() => {
      void refetchSubmissions();
    }, 4000);
    const interval = window.setInterval(() => {
      void refetchSubmissions();
    }, 6000);

    return () => {
      window.clearTimeout(initialTimer);
      window.clearInterval(interval);
    };
  }, [refetchSubmissions, realtimeConnected, submittedSubmission?.status, submittedSubmissionId]);

  useEffect(() => {
    if (!submittedSubmission || !liveSubmissionRunResults) return;

    setActiveResultIdx((current) => {
      const nextIndex = getActiveRunResultIndex(liveSubmissionRunResults);
      return current === nextIndex ? current : nextIndex;
    });
    setBottomTab((current) => current === 'result' ? current : 'result');

    if (submittedSubmission.status === SubmissionStatus.PENDING) return;

    setRunning(false);

    if (
      submittedSubmission.status !== SubmissionStatus.ACCEPTED ||
      acceptedPromptedSubmissionIdRef.current === submittedSubmission.id
    ) {
      return;
    }

    acceptedPromptedSubmissionIdRef.current = submittedSubmission.id;
    void (async () => {
      const shouldMoveNext = await confirm({
        title: 'Hoàn thành bài!',
        message: (
          <div>
            {nextAssignmentTarget ? (
              <span>
                Em đã làm đúng tất cả test. Bài tiếp theo là{' '}
                <span className="font-semibold text-on-surface">{nextAssignmentTarget.title}</span>.
              </span>
            ) : (
              <span>Em đã làm đúng tất cả test. Hiện chưa có bài tiếp theo trong danh sách đang giao.</span>
            )}
            <CompletionRankingInfo />
          </div>
        ),
        confirmLabel: nextAssignmentTarget ? 'Làm bài tiếp theo' : 'Về danh sách bài',
        cancelLabel: 'Ở lại',
        intent: 'primary',
      });

      if (!shouldMoveNext) return;

      if (nextAssignmentTarget) {
        if (nextAssignmentTarget.state) {
          navigate(nextAssignmentTarget.path, { state: nextAssignmentTarget.state });
        } else {
          navigate(nextAssignmentTarget.path);
        }
      } else {
        navigate('/student/assignments');
      }
    })();
  }, [confirm, liveSubmissionRunResults, navigate, nextAssignmentTarget, submittedSubmission]);

  // Cursor tracking
  const [cursorOffset, setCursorOffset] = useState(0);
  const editorWrapRef = useRef<HTMLDivElement>(null);
  const editorScrollRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const nextDraft = readCurrentWorkspaceDraft();
    setLanguage(nextDraft.language);
    setCode(nextDraft.code);
    setLeftTab('description');
    setBottomTab('testcase');
    setActiveTestIdx(0);
    setActiveResultIdx(0);
    setManualRunResults(null);
    setSubmittedSubmissionId(null);
    acceptedPromptedSubmissionIdRef.current = null;
    setCustomInput('');
    setCustomOutput('');
    setTerminalInput('');
    setTerminalResult(null);
    setTerminalError('');
    setTerminalRunning(false);
    setTerminalHistory([]);
    setTerminalMultiline(false);
    setRunning(false);
    setCopiedField(null);
    setCursorOffset(0);
    inputHistoryRef.current = [];
    inputHistoryIdxRef.current = -1;
    interactiveExec.kill();
    interactiveExec.clearLines();
    terminalBodyRef.current?.scrollTo({ top: 0 });
    editorScrollRef.current?.scrollTo({ top: 0, left: 0 });
  }, [problemId]);

  const handleRemoteCodeChange = useCallback((newCode: string, newLanguage: string) => {
    setCode(newCode);
    setLanguage(newLanguage);
  }, []);

  // Kích hoạt Live Coding Sync
  const { adminCursor, adminName, adminIsEditing } = useLiveCodingSync(problemId, code, language, cursorOffset, {
    title: assignment?.title,
    description: assignment?.description,
    examples: liveProblemExamples,
  }, handleRemoteCodeChange);

  // Monaco admin cursor decoration
  useEffect(() => {
    if (!editorRef.current || !monacoRef.current) return;
    const editor = editorRef.current;
    
    if (adminIsEditing && typeof adminCursor === 'number') {
      const model = editor.getModel();
      if (!model) return;
      const pos = model.getPositionAt(adminCursor);
      
      const newDecorations = [
        {
          range: new monacoRef.current.Range(pos.lineNumber, pos.column, pos.lineNumber, pos.column),
          options: {
            className: 'remote-cursor-admin',
            stickiness: monacoRef.current.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
            hoverMessage: { value: adminName || 'Giáo viên' }
          }
        }
      ];
      
      if (!decorationsCollectionRef.current) {
        decorationsCollectionRef.current = editor.createDecorationsCollection(newDecorations);
      } else {
        decorationsCollectionRef.current.set(newDecorations);
      }
    } else {
      if (decorationsCollectionRef.current) {
        decorationsCollectionRef.current.clear();
      }
    }
  }, [adminIsEditing, adminCursor, adminName]);

  // Sync default language from DB (once after dashboard loads)
  useEffect(() => {
    if (dashboardData?.defaultLanguage && !hasInitFromDb && !savedLang) {
      const dbLang = LANG_OPTIONS.find(l => l.value === dashboardData.defaultLanguage);
      if (dbLang) {
        setLanguage(dbLang.value);
        setCode(dbLang.template);
        localStorage.setItem('cp_default_language', dbLang.value);
      }
      setHasInitFromDb(true);
    }
  }, [dashboardData, hasInitFromDb, savedLang]);

  const handleLanguageChange = (val: string) => {
    setLanguage(val);
    const tpl = LANG_OPTIONS.find(l => l.value === val)?.template ?? '';
    setCode(tpl);
    // Persist to localStorage (instant) + DB (async)
    localStorage.setItem('cp_default_language', val);
    updateLangMutation.mutate(val);
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

  const visibleTestCases = useMemo(
    () => assignment?.codingConfig?.testCases?.filter(tc => !tc.isHidden) ?? [],
    [assignment?.codingConfig?.testCases],
  );

  useEffect(() => {
    const firstCase = visibleTestCases[0];
    setActiveTestIdx(0);
    setCustomInput(firstCase?.input ?? '');
    setCustomOutput(firstCase?.output ?? '');
    setTerminalInput(firstCase?.input ?? '');
  }, [assignment?.id, visibleTestCases]);

  useEffect(() => {
    const selectedCase = visibleTestCases[activeTestIdx];
    setCustomInput(selectedCase?.input ?? '');
    setCustomOutput(selectedCase?.output ?? '');
  }, [activeTestIdx, visibleTestCases]);

  const handleUseCaseInTerminal = () => {
    setTerminalInput(customInput);
    setBottomTab('terminal');
  };

  const handleRunTerminal = async () => {
    setBottomTab('terminal');

    if (!terminalMultiline) {
      // Interactive mode: use WebSocket
      interactiveExec.start(language, code);
      setTerminalInput('');
      setTimeout(() => terminalInputRef.current?.focus(), 100);
    } else {
      // Text mode: use HTTP API (Piston)
      const stdin = terminalInput;
      setTerminalRunning(true);
      setTerminalError('');
      setTerminalResult(null);

      try {
        const result = await runMutation.mutateAsync({ language, code, stdin });
        setTerminalResult(result);
        setTerminalHistory(prev => [...prev, { stdin, result }]);
      } catch (err: any) {
        const errorMsg = err?.response?.data?.message || err?.message || 'Execution failed';
        setTerminalError(errorMsg);
        setTerminalHistory(prev => [...prev, { stdin, error: errorMsg }]);
      } finally {
        setTerminalRunning(false);
        setTimeout(() => {
          terminalBodyRef.current?.scrollTo({ top: terminalBodyRef.current.scrollHeight, behavior: 'smooth' });
        }, 50);
      }
    }
  };

  const handleSendStdin = () => {
    if (!terminalInput.trim() || !interactiveExec.running) return;
    interactiveExec.sendStdin(terminalInput);
    inputHistoryRef.current.push(terminalInput);
    inputHistoryIdxRef.current = -1;
    setTerminalInput('');
    setTimeout(() => terminalInputRef.current?.focus(), 50);
  };

  const handleRun = async () => {
    setRunning(true);
    setBottomTab('result');
    setActiveResultIdx(0);
    setSubmittedSubmissionId(null);
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
      setManualRunResults({
        overall: allAccepted ? 'accepted' : hasError ? 'error' : 'wrong',
        cases,
      });
    } catch (err: any) {
      setManualRunResults({
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
      const assignmentId = assignment?.id ?? problemId;
      if (!assignmentId) {
        throw new Error('Assignment not found');
      }

      const result = await submitMutation.mutateAsync({
        assignmentId,
        language,
        code,
      });
      const sub = result.submission;
      const nextResults = buildSubmissionRunResults(sub, assignment);

      setSubmittedSubmissionId(sub.id);
      setManualRunResults(nextResults);
      setActiveResultIdx(getActiveRunResultIndex(nextResults));
    } catch (err: any) {
      setSubmittedSubmissionId(null);
      setManualRunResults({
        overall: 'error',
        cases: [{ status: 'error', input: '', stdout: err.message || 'Submission failed', expected: '' }],
      });
      setActiveResultIdx(0);
    } finally {
      setRunning(false);
    }
  };

  const handleViewSubmission = (sub: any) => {
    setSubmittedSubmissionId(null);
    setCode(sub.code);
    setLanguage(sub.language);

    const nextResults = buildSubmissionRunResults(sub, assignment);
    setManualRunResults(nextResults);
    setActiveResultIdx(getActiveRunResultIndex(nextResults));
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
          <button onClick={handleBack} className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm hover:bg-emerald-500 transition-colors">
            {errorBackLabel}
          </button>
        </div>
      </div>
    );
  }


  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#1a1a2e] text-gray-200" style={{ fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>
      {/* ── Top Bar ─────────────────────────────────────────────────── */}
      <header className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 min-h-[3rem] px-4 bg-[#1e1e3a] border-b border-white/5 shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={handleBack} className="flex items-center gap-1.5 text-gray-400 hover:text-white transition-colors text-sm whitespace-nowrap shrink-0">
            <Icon name="arrow_back" size={18} />
            <span className="hidden sm:inline">{backLabel}</span>
          </button>
          <div className="w-px h-5 bg-white/10 shrink-0 hidden sm:block" />
          <div className="flex items-center gap-2 min-w-0 hidden sm:flex">
            <span className={`material-symbols-outlined text-base shrink-0 ${assignment.difficulty === 'EASY' ? 'text-emerald-400' : assignment.difficulty === 'MEDIUM' ? 'text-amber-400' : 'text-red-400'}`}>
              assignment
            </span>
            <h1 className="text-sm font-semibold text-white leading-tight break-words">{assignment.title}</h1>
            <DifficultyBadge difficulty={assignment.difficulty as DifficultyLevel} />
          </div>
        </div>

        <div className="flex justify-center min-w-0">
          <CourseProgressDots
            items={courseProgressItems}
            currentAssignmentId={problemId}
            onSelect={handleCourseProgressSelect}
          />
        </div>

        <div className="flex items-center justify-end gap-2 shrink-0">
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
                  {assignment.codingConfig?.ioMode === 'file' && (
                    <span className="inline-flex items-center gap-1 text-xs text-cyan-400 font-medium bg-cyan-500/10 px-1.5 py-0.5 rounded">
                      <Icon name="draft" size={13} />File I/O
                    </span>
                  )}

                  {/* Ask about this assignment */}
                  <button
                    onClick={() => {
                      useChatWidgetStore.getState().openWithContext({
                        type: 'assignment',
                        id: assignment.id,
                        title: assignment.title,
                        meta: assignment.difficulty,
                      });
                    }}
                    className="inline-flex items-center gap-1 text-xs text-teal-400 font-medium bg-teal-500/10 hover:bg-teal-500/20 px-2 py-0.5 rounded transition-colors cursor-pointer"
                  >
                    <Icon name="support_agent" size={13} />Hỏi / Báo cáo
                  </button>
                </div>

                {/* Tags */}
                {assignment.tags && assignment.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-5">
                    {assignment.tags.map((tag, i) => (
                      <span key={i} className="px-2 py-0.5 rounded-full bg-white/5 text-[11px] text-gray-400 border border-white/5">{tag}</span>
                    ))}
                  </div>
                )}

                {/* File I/O info banner */}
                {assignment.codingConfig?.ioMode === 'file' && (
                  <div className="mb-5 px-3 py-2 bg-cyan-500/5 border border-cyan-500/20 rounded-lg text-xs flex items-center gap-4">
                    <span className="text-cyan-300 font-medium">File I/O</span>
                    <span className="text-gray-400">Input: <code className="text-cyan-300 bg-white/5 px-1.5 py-0.5 rounded">{assignment.codingConfig.inputFileName}</code></span>
                    <span className="text-gray-400">Output: <code className="text-cyan-300 bg-white/5 px-1.5 py-0.5 rounded">{assignment.codingConfig.outputFileName}</code></span>
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
                            <div className="relative mt-1">
                              <pre className="text-sm font-mono text-gray-300 whitespace-pre-wrap pr-12">{tc.input || '(empty)'}</pre>
                              <button
                                onClick={() => handleCopy(tc.input || '', `ex-input-${idx}`)}
                                className={`absolute top-0 right-0 text-[10px] px-1.5 py-0.5 rounded transition-colors ${copiedField === `ex-input-${idx}` ? 'text-emerald-400' : 'text-gray-500 hover:text-gray-300'}`}
                              >
                                {copiedField === `ex-input-${idx}` ? 'Copied!' : 'Copy'}
                              </button>
                            </div>
                          </div>
                          <div>
                            <span className="text-[11px] text-gray-500 font-semibold uppercase">Output:</span>
                            <div className="relative mt-1">
                              <pre className="text-sm font-mono text-gray-300 whitespace-pre-wrap pr-12">{tc.output || '(empty)'}</pre>
                              <button
                                onClick={() => handleCopy(tc.output || '', `ex-output-${idx}`)}
                                className={`absolute top-0 right-0 text-[10px] px-1.5 py-0.5 rounded transition-colors ${copiedField === `ex-output-${idx}` ? 'text-emerald-400' : 'text-gray-500 hover:text-gray-300'}`}
                              >
                                {copiedField === `ex-output-${idx}` ? 'Copied!' : 'Copy'}
                              </button>
                            </div>
                          </div>
                          {tc.explanation && (
                            <div>
                              <span className="text-[11px] text-gray-500 font-semibold uppercase">Explanation:</span>
                              <div className="prose prose-sm dark:prose-invert max-w-none text-gray-400 mt-1 prose-p:m-0 prose-code:bg-black/20 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none">
                                <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                                  {tc.explanation}
                                </ReactMarkdown>
                              </div>
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
                      {assignment.codingConfig.ioMode === 'file' && (
                        <li>
                          File I/O: input from <code className="text-cyan-300 bg-white/5 px-1.5 py-0.5 rounded text-[13px]">{assignment.codingConfig.inputFileName}</code>,
                          output to <code className="text-cyan-300 bg-white/5 px-1.5 py-0.5 rounded text-[13px]">{assignment.codingConfig.outputFileName}</code>
                        </li>
                      )}
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
                          <span className={`text-xs font-bold px-2 py-0.5 rounded ${sub.status === 'ACCEPTED' ? 'bg-emerald-500/10 text-emerald-400' :
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
            <div className="flex items-center justify-between px-3 h-[37px] bg-[#1e1e3a] border-b border-white/5 shrink-0">
              <div className="flex items-center gap-2">
                <Icon name="code" size={14} className="text-emerald-400" />
                <span className="text-xs text-gray-400">Code</span>
              </div>
              <button onClick={() => { const tpl = LANG_OPTIONS.find(l => l.value === language)?.template ?? ''; setCode(tpl); }} className="text-xs text-gray-500 hover:text-gray-300 flex items-center gap-1 transition-colors">
                <Icon name="refresh" size={12} />Reset
              </button>
            </div>
            {/* Editor Body */}
            <div className="flex-1 min-h-0 relative">
              <Editor
                height="100%"
                language={language === 'cpp' ? 'cpp' : language}
                theme="cp-dark"
                beforeMount={(monaco) => {
                  monaco.editor.defineTheme('cp-dark', {
                    base: 'vs-dark',
                    inherit: true,
                    rules: [
                      { token: 'comment', foreground: '6b7280', fontStyle: 'italic' },
                      { token: 'keyword', foreground: 'a78bfa' },
                      { token: 'identifier', foreground: 'e5e7eb' },
                      { token: 'string', foreground: '34d399' },
                      { token: 'number', foreground: 'fbbf24' },
                    ],
                    colors: {
                      'editor.background': '#0d0d1a',
                      'editor.foreground': '#e5e7eb',
                      'editor.lineHighlightBackground': '#ffffff0a',
                      'editorLineNumber.foreground': '#4b5563',
                      'editorLineNumber.activeForeground': '#a78bfa',
                      'editor.selectionBackground': '#34d39930',
                      'editorCursor.foreground': '#34d399',
                      'editorWhitespace.foreground': '#ffffff10',
                      'editorIndentGuide.background': '#ffffff10',
                      'editorIndentGuide.activeBackground': '#ffffff30',
                    }
                  });
                }}
                value={code}
                onChange={(val) => {
                  if (val !== undefined) setCode(val);
                }}
                onMount={(editor, monaco) => {
                  editorRef.current = editor;
                  monacoRef.current = monaco;
                  editor.onDidChangeCursorPosition((e) => {
                    const offset = editor.getModel()?.getOffsetAt(e.position) || 0;
                    setCursorOffset(offset);
                  });
                }}
                options={{
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                  fontSize: 13,
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  wordWrap: 'on',
                  padding: { top: 12 },
                  tabSize: 4,
                  automaticLayout: true,
                }}
              />
            </div>

            <style>{`
                .remote-cursor-admin {
                  border-left: 2px solid #a78bfa;
                  animation: remoteCursorBlink 1.2s ease-in-out infinite;
                  z-index: 100;
                  pointer-events: none;
                }
                @keyframes remoteCursorBlink {
                  0%, 100% { opacity: 1; }
                  50% { opacity: 0.3; }
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
                      <label className="text-[11px] text-gray-500 font-medium uppercase tracking-wider mb-1.5 block">Input</label>
                      <div className="relative">
                        <pre className="bg-[#1a1a2e] border border-white/5 rounded-lg p-2.5 pr-14 text-sm font-mono text-gray-300 whitespace-pre-wrap min-h-[40px]">{customInput.trim()}</pre>
                        <button
                          onClick={() => handleCopy(customInput.trim(), 'tc-input')}
                          className={`absolute top-2 right-2 text-[10px] px-1.5 py-0.5 rounded transition-colors ${copiedField === 'tc-input' ? 'text-emerald-400' : 'text-gray-500 hover:text-gray-300'}`}
                        >
                          {copiedField === 'tc-input' ? 'Copied!' : 'Copy'}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="text-[11px] text-gray-500 font-medium uppercase tracking-wider mb-1.5 block">Expected Output</label>
                      <div className="relative">
                        <pre className="bg-[#1a1a2e] border border-white/5 rounded-lg p-2.5 pr-14 text-sm font-mono text-gray-400 whitespace-pre-wrap min-h-[40px]">{customOutput.trim() || '(empty)'}</pre>
                        <button
                          onClick={() => handleCopy(customOutput.trim(), 'tc-output')}
                          className={`absolute top-2 right-2 text-[10px] px-1.5 py-0.5 rounded transition-colors ${copiedField === 'tc-output' ? 'text-emerald-400' : 'text-gray-500 hover:text-gray-300'}`}
                        >
                          {copiedField === 'tc-output' ? 'Copied!' : 'Copy'}
                        </button>
                      </div>
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
                <div className="flex h-full min-h-[220px] flex-col overflow-hidden" style={{ background: '#000' }}>
                  {/* ── Terminal toolbar ────────────────────────────── */}
                  <div className="flex items-center justify-between px-3 py-1 shrink-0" style={{ background: '#1e1e1e', borderBottom: '1px solid #333' }}>
                    <div className="flex items-center gap-3">
                      {/* Traffic lights */}
                      <div className="flex gap-1.5">
                        <span className="w-[10px] h-[10px] rounded-full" style={{ background: '#ff5f56' }} />
                        <span className="w-[10px] h-[10px] rounded-full" style={{ background: '#ffbd2e' }} />
                        <span className="w-[10px] h-[10px] rounded-full" style={{ background: '#27c93f' }} />
                      </div>
                      {/* Toolbar buttons */}
                      <div className="flex items-center gap-1 text-[11px]">
                        {interactiveExec.running ? (
                          <button
                            onClick={() => interactiveExec.kill()}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold transition-colors"
                            style={{ background: '#d32f2f', color: '#fff' }}
                          >
                            <Icon name="stop" size={12} />
                            Stop
                          </button>
                        ) : (
                          <button
                            onClick={handleRunTerminal}
                            disabled={terminalRunning}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold transition-colors disabled:opacity-40"
                            style={{ background: '#2ea043', color: '#fff' }}
                          >
                            <Icon name="play_arrow" size={12} />
                            Run
                          </button>
                        )}
                        <button
                          onClick={() => { interactiveExec.clearLines(); setTerminalHistory([]); setTerminalResult(null); setTerminalError(''); }}
                          className="px-2 py-0.5 rounded text-[11px] transition-colors"
                          style={{ color: '#888', background: 'transparent' }}
                          onMouseEnter={e => (e.currentTarget.style.color = '#ccc')}
                          onMouseLeave={e => (e.currentTarget.style.color = '#888')}
                        >
                          Clear
                        </button>
                      </div>
                    </div>
                    {/* Input mode toggle */}
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] uppercase tracking-wider" style={{ color: '#666' }}>stdin:</span>
                      <label className="flex items-center gap-1 cursor-pointer">
                        <input
                          type="radio"
                          name="termMode"
                          checked={!terminalMultiline}
                          onChange={() => setTerminalMultiline(false)}
                          className="accent-green-500"
                          style={{ width: 12, height: 12 }}
                        />
                        <span className="text-[11px]" style={{ color: !terminalMultiline ? '#ccc' : '#666' }}>Interactive</span>
                      </label>
                      <label className="flex items-center gap-1 cursor-pointer">
                        <input
                          type="radio"
                          name="termMode"
                          checked={terminalMultiline}
                          onChange={() => setTerminalMultiline(true)}
                          className="accent-green-500"
                          style={{ width: 12, height: 12 }}
                        />
                        <span className="text-[11px]" style={{ color: terminalMultiline ? '#ccc' : '#666' }}>Text</span>
                      </label>
                    </div>
                  </div>

                  {/* ── Text stdin mode (batch) ────────────────────── */}
                  {terminalMultiline && (
                    <div style={{ background: '#111', borderBottom: '1px solid #333' }}>
                      <div className="flex items-center justify-between px-3 py-1">
                        <span className="text-[10px] uppercase tracking-wider" style={{ color: '#555' }}>Standard Input</span>
                        <span className="text-[10px]" style={{ color: '#444' }}>
                          {terminalInput.split('\n').length} lines · {terminalInput.length} chars
                        </span>
                      </div>
                      <textarea
                        value={terminalInput}
                        onChange={(e) => setTerminalInput(e.target.value)}
                        spellCheck={false}
                        placeholder="Enter input to program here..."
                        className="w-full resize-none outline-none font-mono text-[13px] leading-5 px-3 pb-2"
                        style={{ background: '#111', color: '#e0e0e0', height: 70 }}
                      />
                    </div>
                  )}

                  {/* ── Terminal body ── */}
                  <div
                    ref={terminalBodyRef}
                    className="flex-1 min-h-0 overflow-auto px-3 py-2 font-mono text-[13px] leading-[1.6] cursor-text"
                    style={{ background: '#000', color: '#e0e0e0' }}
                    onClick={() => terminalInputRef.current?.focus()}
                  >
                    {/* Interactive mode output */}
                    {!terminalMultiline ? (
                      interactiveExec.lines.length === 0 && !interactiveExec.running ? (
                        <div style={{ color: '#555' }}>
                          <div className="mt-1" style={{ color: '#555', fontSize: 12 }}>
                            Bấm Run để chạy. Khi chương trình cần nhập (cin, scanf, input), gõ trực tiếp ở dưới rồi bấm Enter.
                          </div>
                        </div>
                      ) : (
                        interactiveExec.lines.map((line, idx) => {
                          const colorMap: Record<string, string> = {
                            stdout: '#e0e0e0',
                            stderr: '#ff6b9d',
                            stdin: '#27c93f',
                            system: '#27c93f',
                            error: '#ff4444',
                          };
                          return (
                            <pre key={idx} className="whitespace-pre-wrap" style={{ color: colorMap[line.type] || '#e0e0e0', margin: 0 }}>
                              {line.text}
                            </pre>
                          );
                        })
                      )
                    ) : (
                      /* Text/batch mode output */
                      <>
                        {terminalHistory.length === 0 && !terminalRunning && (
                          <div style={{ color: '#555' }}>
                            <div className="mt-1" style={{ color: '#555', fontSize: 12 }}>
                              Nhập stdin ở trên rồi bấm Run để chạy code.
                            </div>
                          </div>
                        )}
                        {terminalHistory.map((entry, idx) => (
                          <div key={idx}>
                            {entry.result?.compile && entry.result.compile.code !== 0 && (
                              <pre className="whitespace-pre-wrap" style={{ color: '#f44' }}>{entry.result.compile.output}</pre>
                            )}
                            {entry.result?.run?.stdout && (
                              <pre className="whitespace-pre-wrap" style={{ color: '#e0e0e0' }}>{entry.result.run.stdout}</pre>
                            )}
                            {entry.stdin && (
                              <pre className="whitespace-pre-wrap" style={{ color: '#27c93f' }}>{entry.stdin}</pre>
                            )}
                            {entry.result?.run?.stderr && (
                              <pre className="whitespace-pre-wrap" style={{ color: '#f4a' }}>{entry.result.run.stderr}</pre>
                            )}
                            {entry.error && (
                              <pre className="whitespace-pre-wrap" style={{ color: '#f44' }}>{entry.error}</pre>
                            )}
                            {entry.result && (
                              <div className="mt-1" style={{ color: '#27c93f', fontSize: 12 }}>
                                ...Program finished with exit code {entry.result.run?.code ?? '?'}
                                {entry.result.run?.wall_time != null && <span style={{ color: '#555' }}> ({entry.result.run.wall_time}ms)</span>}
                              </div>
                            )}
                          </div>
                        ))}
                        {terminalRunning && (
                          <div className="flex items-center gap-2" style={{ color: '#888', fontSize: 12 }}>
                            <Icon name="progress_activity" size={13} className="animate-spin" />
                            Compiling and executing...
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* ── Input line ── */}
                  {!terminalMultiline && (
                    <div className="flex items-center gap-0 shrink-0" style={{ background: '#000', borderTop: '1px solid #222' }}>
                      <input
                        ref={terminalInputRef}
                        type="text"
                        value={terminalInput}
                        onChange={(e) => setTerminalInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (interactiveExec.running) {
                              handleSendStdin();
                            } else {
                              handleRunTerminal();
                            }
                          }
                          if (e.key === 'ArrowUp') {
                            e.preventDefault();
                            if (inputHistoryRef.current.length > 0) {
                              const newIdx = Math.min(inputHistoryIdxRef.current + 1, inputHistoryRef.current.length - 1);
                              inputHistoryIdxRef.current = newIdx;
                              setTerminalInput(inputHistoryRef.current[inputHistoryRef.current.length - 1 - newIdx]);
                            }
                          }
                          if (e.key === 'ArrowDown') {
                            e.preventDefault();
                            if (inputHistoryIdxRef.current > 0) {
                              const newIdx = inputHistoryIdxRef.current - 1;
                              inputHistoryIdxRef.current = newIdx;
                              setTerminalInput(inputHistoryRef.current[inputHistoryRef.current.length - 1 - newIdx]);
                            } else {
                              inputHistoryIdxRef.current = -1;
                              setTerminalInput('');
                            }
                          }
                        }}
                        placeholder={interactiveExec.running ? 'Nhập input rồi bấm Enter...' : ''}
                        className="flex-1 outline-none font-mono text-[13px] px-3 py-1.5"
                        style={{ background: '#000', color: '#27c93f', caretColor: '#27c93f' }}
                      />
                    </div>
                  )}
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
                        <span className={`text-lg font-bold ${
                          runResults.overall === 'accepted'
                            ? 'text-emerald-400'
                            : runResults.overall === 'pending'
                              ? 'text-blue-400'
                              : 'text-red-400'
                        }`}>
                          {runResults.overall === 'accepted'
                            ? '✓ Accepted'
                            : runResults.overall === 'wrong'
                              ? '✗ Wrong Answer'
                              : runResults.overall === 'pending'
                                ? 'Judging...'
                                : '✗ Error'}
                        </span>
                        {runResults.cases.length > 1 && (
                          <span className="text-xs text-gray-400">
                            {runResults.cases.filter(c => c.status === 'accepted').length} / {runResults.cases.length} passed
                          </span>
                        )}
                      </div>

                      {/* {runResults.progress?.phase === 'running' && (
                        <div className="mb-3 flex flex-wrap items-center gap-2 rounded-lg border border-blue-500/20 bg-blue-500/5 px-3 py-2 text-xs text-blue-200">
                          <Icon name="progress_activity" size={14} className="animate-spin text-blue-300" />
                          <span className="font-semibold">
                            {typeof runResults.progress.currentTestCaseIndex === 'number'
                              ? `Judging testcase #${runResults.progress.currentTestCaseIndex + 1}`
                              : runResults.progress.message || 'Judging submission'}
                          </span>
                          <span className="text-blue-200/70">
                            {runResults.progress.completedCount} / {runResults.progress.totalCount} done
                          </span>
                        </div>
                      )} */}

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
                                name={c.status === 'accepted' ? 'check_circle' : c.status === 'pending' ? 'progress_activity' : 'cancel'}
                                size={12}
                                className={
                                  c.status === 'accepted'
                                    ? 'text-emerald-400'
                                    : c.status === 'pending'
                                      ? 'text-blue-400 animate-spin'
                                      : 'text-red-400'
                                }
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
                            <pre className={`mt-1 bg-[#1a1a2e] border rounded-lg p-2.5 text-sm font-mono whitespace-pre-wrap ${runResults.cases[activeResultIdx].status === 'accepted' ? 'border-emerald-500/20 text-emerald-300' :
                                runResults.cases[activeResultIdx].status === 'pending' ? 'border-blue-500/20 text-blue-300' :
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
          <pre className={`whitespace-pre-wrap rounded-lg border p-2 ${compileFailed ? 'border-red-500/20 bg-red-500/5 text-red-200' : 'border-emerald-500/20 bg-emerald-500/5 text-emerald-200'
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
