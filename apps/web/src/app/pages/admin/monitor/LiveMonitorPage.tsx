import { useEffect, useState, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { Icon, PageHeader } from '@cp/ui';
import Editor from 'react-simple-code-editor';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import Prism from 'prismjs';
import 'prismjs/themes/prism-tomorrow.css';
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-cpp';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-javascript';
import 'katex/dist/katex.min.css';

import { resolveSocketNamespace } from '../../../lib/socket-url';
import RemoteCursors, { type RemoteCursor } from '../../../components/RemoteCursors';
import { MazeWorkspaceViewer } from '../../../features/maze/MazeWorkspaceViewer';
import { useAuthStore } from '../../../stores/auth.store';
import { fullName } from '@cp/shared';

interface ActiveStudent {
  socketId: string;
  studentId: string;
  problemId?: string;
  problemTitle?: string;
  problemDescription?: string;
  problemExamples?: Array<{
    input: string;
    output: string;
    explanation?: string;
  }>;
  studentName?: string;
  language?: string;
  code?: string;
  lastActive: number;
  status?: 'online' | 'idle' | 'away' | 'coding';
  currentPath?: string;
  isTabVisible?: boolean;
  isWindowFocused?: boolean;
  idleForMs?: number;
}

/* ── Syntax highlight helper ─────────────────────────────────── */
function highlightCode(code: string, language: string) {
  const lang = language === 'cpp' ? 'cpp' : language;
  const grammar = Prism.languages[lang] || Prism.languages.javascript;
  return Prism.highlight(code, grammar, lang);
}

/* ── Tiny code preview (read-only, no interaction) ───────────── */
function CodePreview({ code, language }: { code: string; language: string }) {
  if (!code) {
    return (
      <div className="flex items-center justify-center h-full text-gray-600 text-xs italic select-none">
        Chưa có code…
      </div>
    );
  }
  return (
    <pre
      className="text-[10px] leading-[15px] font-mono text-gray-400 whitespace-pre overflow-hidden pointer-events-none select-none p-2"
      dangerouslySetInnerHTML={{ __html: highlightCode(code, language) }}
    />
  );
}

/* ── Detail Modal ────────────────────────────────────────────── */
function DetailModal({
  student,
  code,
  language,
  studentCursorOffset,
  onClose,
  socketRef,
  onAdminCodeChange,
}: {
  student: ActiveStudent;
  code: string;
  language: string;
  studentCursorOffset?: number;
  onClose: () => void;
  socketRef: React.RefObject<Socket | null>;
  onAdminCodeChange: (studentId: string, problemId: string, code: string, language: string) => void;
}) {
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isLocalChangeRef = useRef(false);
  const { user } = useAuthStore();
  const adminName = user ? (fullName(user) || user.email) : 'Admin';

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  // Handle admin typing — emit immediately, no debounce
  const handleCodeChange = (newCode: string) => {
    isLocalChangeRef.current = true;
    // Update parent codeMap immediately
    if (student.problemId) {
      onAdminCodeChange(student.studentId, student.problemId, newCode, language);
    }
    // Emit to server immediately
    if (socketRef.current && student.problemId) {
      // Get cursor position from textarea
      const textarea = editorContainerRef.current?.querySelector('textarea');
      const cursorOffset = textarea?.selectionStart ?? 0;
      socketRef.current.emit('admin_code_edit', {
        studentId: student.studentId,
        problemId: student.problemId,
        code: newCode,
        language,
        cursorOffset,
        adminName,
      });
    }
  };

  // Track admin cursor movement (clicks, arrow keys, etc.)
  useEffect(() => {
    const container = editorContainerRef.current;
    if (!container) return;

    const emitCursor = () => {
      const textarea = container.querySelector('textarea');
      if (!textarea || !socketRef.current || !student.problemId) return;
      socketRef.current.emit('admin_cursor_move', {
        studentId: student.studentId,
        problemId: student.problemId,
        cursorOffset: textarea.selectionStart ?? 0,
        adminName,
      });
    };

    // Track cursor changes via multiple events
    const onSelect = () => emitCursor();
    const onClick = () => emitCursor();
    const onKeyUp = (e: KeyboardEvent) => {
      // Only emit for navigation keys, not typing (typing already handled in handleCodeChange)
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'PageUp', 'PageDown'].includes(e.key)) {
        emitCursor();
      }
    };

    container.addEventListener('click', onClick);
    container.addEventListener('keyup', onKeyUp);
    document.addEventListener('selectionchange', onSelect);

    return () => {
      container.removeEventListener('click', onClick);
      container.removeEventListener('keyup', onKeyUp);
      document.removeEventListener('selectionchange', onSelect);
    };
  }, [student.studentId, student.problemId, socketRef]);

  // Save and restore cursor position when code is updated from student (remote)
  useEffect(() => {
    if (isLocalChangeRef.current) {
      isLocalChangeRef.current = false;
      return;
    }
    // Remote code update — preserve cursor position
    const textarea = editorContainerRef.current?.querySelector('textarea');
    if (textarea) {
      const pos = textarea.selectionStart;
      // React will update the textarea value, then we restore cursor
      requestAnimationFrame(() => {
        const clampedPos = Math.min(pos, code.length);
        textarea.setSelectionRange(clampedPos, clampedPos);
      });
    }
  }, [code]);

  // Student cursor for RemoteCursors overlay
  const remoteCursors: RemoteCursor[] = [];
  if (typeof studentCursorOffset === 'number') {
    remoteCursors.push({
      name: student.studentName || 'Học sinh',
      offset: studentCursorOffset,
      color: '#34d399', // emerald
    });
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative w-[94vw] max-w-7xl h-[84vh] flex flex-col bg-[#0d0d1a] rounded-2xl overflow-hidden shadow-2xl border border-white/10 animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 bg-[#1e1e3a] border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold">
              {(student.studentName || student.studentId).charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="text-sm font-semibold text-white">
                {student.studentName || student.studentId}
              </div>
              <div className="text-[11px] text-gray-400 flex flex-wrap items-center gap-2">
                <span className="max-w-[46vw] truncate">
                  {student.problemTitle || `Problem: ${student.problemId?.substring(0, 8) ?? 'N/A'}…`}
                </span>
                <span className="px-1.5 py-0.5 rounded bg-white/5 font-mono uppercase text-[10px]">
                  {language}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              LIVE
            </span>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <Icon name="close" size={20} />
            </button>
          </div>
        </div>

        <div className="flex-1 min-h-0 grid grid-cols-[minmax(320px,38%)_1fr]">
          {/* Problem statement */}
          <aside className="min-h-0 overflow-y-auto border-r border-white/10 bg-[#15152a]">
            <div className="sticky top-0 z-10 flex items-center gap-2 border-b border-white/10 bg-[#15152a]/95 px-4 py-3 backdrop-blur">
              <Icon name="description" size={18} className="text-emerald-400" />
              <div className="min-w-0">
                <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Đề bài</div>
                <div className="truncate text-sm font-semibold text-white">
                  {student.problemTitle || 'Chưa có tiêu đề đề bài'}
                </div>
              </div>
            </div>
            <div className="p-4">
              {student.problemDescription ? (
                <div
                  className="prose prose-invert prose-sm max-w-none
                    prose-headings:text-white prose-headings:font-semibold
                    prose-code:text-emerald-300 prose-code:bg-white/5 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-[13px] prose-code:before:content-none prose-code:after:content-none
                    prose-pre:bg-[#0d0d1a] prose-pre:border prose-pre:border-white/5 prose-pre:rounded-lg
                    prose-strong:text-white prose-a:text-emerald-400
                    prose-p:text-gray-300 prose-li:text-gray-300 prose-td:text-gray-300
                    prose-th:text-gray-200 prose-th:bg-white/5
                    prose-table:border-collapse [&_th]:border [&_th]:border-white/10 [&_th]:px-3 [&_th]:py-1.5
                    [&_td]:border [&_td]:border-white/10 [&_td]:px-3 [&_td]:py-1.5"
                >
                  <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                    {student.problemDescription}
                  </ReactMarkdown>
                </div>
              ) : !student.problemExamples?.length ? (
                <div className="flex h-44 flex-col items-center justify-center rounded-xl border border-dashed border-white/10 text-center text-gray-500">
                  <Icon name="article" size={32} />
                  <p className="mt-2 text-sm font-medium">Chưa nhận được nội dung đề bài</p>
                  <p className="mt-1 max-w-[240px] text-xs">
                    Khi học sinh mở bài tập, đề bài sẽ được đồng bộ lên màn hình monitor.
                  </p>
                </div>
              ) : null}

              {!!student.problemExamples?.length && (
                <div className="mt-5 space-y-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">Ví dụ</h3>
                  {student.problemExamples.map((example, index) => (
                    <div key={index} className="rounded-lg border border-white/10 bg-[#0d0d1a] p-3">
                      <div className="mb-2 text-xs font-semibold text-white">Example {index + 1}</div>
                      <div className="space-y-2">
                        <div>
                          <span className="text-[10px] font-semibold uppercase text-gray-500">Input</span>
                          <pre className="mt-1 whitespace-pre-wrap rounded bg-white/5 p-2 text-xs text-gray-300">{example.input || '(empty)'}</pre>
                        </div>
                        <div>
                          <span className="text-[10px] font-semibold uppercase text-gray-500">Output</span>
                          <pre className="mt-1 whitespace-pre-wrap rounded bg-white/5 p-2 text-xs text-gray-300">{example.output || '(empty)'}</pre>
                        </div>
                        {example.explanation && (
                          <div className="prose prose-invert prose-sm max-w-none prose-p:leading-5 prose-p:text-gray-400 prose-code:bg-white/5 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-[11px] prose-code:before:content-none prose-code:after:content-none prose-p:m-0">
                            <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                              {example.explanation}
                            </ReactMarkdown>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </aside>

          {/* Maze: read-only block view. Other languages: editable code editor. */}
          {language === 'maze' ? (
            <div className="min-h-0 overflow-hidden bg-white">
              <MazeWorkspaceViewer xml={code} />
            </div>
          ) : (
            <div ref={scrollContainerRef} className="min-h-0 overflow-auto relative">
              <div ref={editorContainerRef} style={{ position: 'relative' }}>
                <Editor
                  value={code || '// Waiting for code...'}
                  onValueChange={handleCodeChange}
                  highlight={(c) => highlightCode(c, language)}
                  padding={16}
                  className="w-full min-h-full font-mono text-[13px] bg-transparent text-gray-300 outline-none"
                  textareaClassName="focus:outline-none"
                  style={{
                    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                    lineHeight: '20px',
                  }}
                />
                <RemoteCursors
                  cursors={remoteCursors}
                  code={code || ''}
                  scrollContainerRef={scrollContainerRef}
                  lineHeight={20}
                  paddingTop={16}
                  paddingLeft={16}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer stats */}
        <div className="flex items-center justify-between px-5 py-2 bg-[#1e1e3a] border-t border-white/10 text-xs text-gray-500 shrink-0">
          <span>{code ? code.split('\n').length : 0} dòng</span>
          <span>Cập nhật: {new Date(student.lastActive).toLocaleTimeString('vi-VN')}</span>
        </div>
      </div>
    </div>
  );
}

/* ── Main Page ───────────────────────────────────────────────── */
export default function LiveMonitorPage() {
  const [students, setStudents] = useState<ActiveStudent[]>([]);
  // Per-student code snapshots: key = `${studentId}_${problemId}`
  const [codeMap, setCodeMap] = useState<Record<string, { code: string; language: string; cursorOffset?: number }>>({});
  const [selectedStudent, setSelectedStudent] = useState<ActiveStudent | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socketUrl = resolveSocketNamespace('/live-monitor');
    const socket = io(socketUrl, { transports: ['websocket'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('admin_join');
    });

    socket.on('active_students_list', (list: ActiveStudent[]) => {
      setStudents(list);
      // Seed codeMap from the initial student data
      setCodeMap((prev) => {
        const next = { ...prev };
        for (const s of list) {
          if (!s.problemId) continue;
          const key = `${s.studentId}_${s.problemId}`;
          if (s.code && !next[key]) {
            next[key] = { code: s.code, language: s.language || 'javascript' };
          }
        }
        return next;
      });
    });

    socket.on('code_update', (data: { studentId: string; problemId: string; code: string; language: string; cursorOffset?: number }) => {
      const key = `${data.studentId}_${data.problemId}`;
      setCodeMap((prev) => ({
        ...prev,
        [key]: { code: data.code, language: data.language, cursorOffset: data.cursorOffset },
      }));
    });

    return () => { socket.disconnect(); };
  }, []);

  const handleOpenDetail = useCallback((student: ActiveStudent) => {
    if (!student.problemId) return;
    setSelectedStudent(student);
    // Also watch the specific room for this student
    if (socketRef.current) {
      socketRef.current.emit('admin_watch_student', {
        studentId: student.studentId,
        problemId: student.problemId,
      });
    }
  }, []);

  const handleCloseDetail = useCallback(() => {
    if (selectedStudent?.problemId && socketRef.current) {
      socketRef.current.emit('admin_unwatch_student', {
        studentId: selectedStudent.studentId,
        problemId: selectedStudent.problemId,
      });
    }
    setSelectedStudent(null);
  }, [selectedStudent]);

  const handleAdminCodeChange = useCallback((studentId: string, problemId: string, code: string, language: string) => {
    const key = `${studentId}_${problemId}`;
    setCodeMap((prev) => ({
      ...prev,
      [key]: { code, language, cursorOffset: prev[key]?.cursorOffset },
    }));
  }, []);

  const selectedStudentLive = selectedStudent
    ? students.find(
        (student) =>
          student.studentId === selectedStudent.studentId &&
          student.problemId === selectedStudent.problemId,
      ) ?? selectedStudent
    : null;
  const selectedKey = selectedStudentLive
    ? `${selectedStudentLive.studentId}_${selectedStudentLive.problemId ?? ''}`
    : '';

  const codingCount = students.filter((student) => student.status === 'coding' && !!student.problemId).length;
  const onlineCount = students.filter((student) => student.status === 'online').length;
  const idleCount = students.filter((student) => student.status === 'idle').length;
  const awayCount = students.filter((student) => student.status === 'away').length;

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-[#0a0a0a]">
      <div className="px-6 py-4 shrink-0">
        <PageHeader
          title="Live Code Monitor"
          subtitle="Theo dõi quá trình làm bài của học sinh theo thời gian thực"
        />
      </div>

      {/* Toolbar */}
      <div className="px-6 pb-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            {students.length} học sinh online
          </span>
          <span className="rounded-full bg-violet-100 px-2.5 py-1 text-xs font-semibold text-violet-700 dark:bg-violet-500/10 dark:text-violet-300">
            {codingCount} đang làm bài
          </span>
          <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
            {onlineCount} đang hoạt động
          </span>
          <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
            {idleCount} tạm ngưng
          </span>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-500/10 dark:text-slate-300">
            {awayCount} tab khác
          </span>
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        {students.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-4">
            <div className="w-20 h-20 rounded-2xl bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
              <Icon name="person_off" size={40} className="text-gray-300 dark:text-gray-700" />
            </div>
            <div className="text-center">
              <p className="text-base font-medium text-gray-500 dark:text-gray-400">Không có học sinh nào online</p>
              <p className="text-sm text-gray-400 dark:text-gray-600 mt-1">
                Khi học sinh mở portal hoặc bắt đầu code, họ sẽ xuất hiện ở đây
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {students.map((student) => {
              const hasWorkspace = !!student.problemId;
              const isActivelyCoding = student.status === 'coding' && hasWorkspace;
              const key = hasWorkspace ? `${student.studentId}_${student.problemId}` : student.studentId;
              const snapshot = codeMap[key];
              const displayCode = snapshot?.code || student.code || '';
              const displayLang = snapshot?.language || student.language || 'javascript';
              const initial = (student.studentName || student.studentId).charAt(0).toUpperCase();
              const timeSinceActive = Date.now() - student.lastActive;
              const isRecent = timeSinceActive < 10_000; // active within 10s
              const presence = getPresenceMeta(student);
              const hasProblemDetails = !!student.problemDescription || !!student.problemExamples?.length;

              return (
                <button
                  key={student.socketId}
                  onClick={() => handleOpenDetail(student)}
                  className={`group relative flex flex-col bg-white dark:bg-[#141420] rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm
                    transition-all duration-200 overflow-hidden text-left focus:outline-none ${
                      hasWorkspace
                      ? 'cursor-pointer hover:shadow-lg hover:border-violet-300 dark:hover:border-violet-700 hover:scale-[1.02] focus:ring-2 focus:ring-violet-500/40'
                      : 'cursor-default'
                    }`}
                >
                  {/* Card header */}
                  <div className="flex items-center gap-2.5 px-3 py-2.5 border-b border-gray-100 dark:border-white/5">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                      {initial}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {student.studentName || student.studentId}
                      </div>
                      <div className="text-[10px] text-gray-400 dark:text-gray-500 truncate">
                        {hasWorkspace
                          ? student.problemTitle || student.problemId
                          : student.currentPath || 'Đang ở portal học sinh'}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span
                        className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                          isActivelyCoding
                            ? 'bg-violet-100 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300'
                            : presence.badgeClass
                        }`}
                      >
                        {isActivelyCoding ? 'Đang làm bài' : presence.label}
                      </span>
                      {hasWorkspace && (
                        <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400">
                          {displayLang}
                        </span>
                      )}
                      {isActivelyCoding && isRecent && (
                        <span className="relative flex h-2 w-2" title="Đang gõ code">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                      )}
                    </div>
                  </div>

                  {hasWorkspace ? (
                    <div className="h-44 overflow-hidden bg-[#0d0d1a] relative">
                      {hasProblemDetails && (
                        <div className="border-b border-white/5 bg-[#15152a] px-3 py-2">
                          <div className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-400">
                            <Icon name="description" size={12} />
                            Đề bài
                          </div>
                          <p className="line-clamp-2 text-[11px] leading-4 text-gray-300">
                            {student.problemDescription
                              ? toPlainText(student.problemDescription)
                              : `${student.problemExamples?.length ?? 0} ví dụ input/output`}
                          </p>
                        </div>
                      )}
                      <div className={hasProblemDetails ? 'h-28 overflow-hidden' : 'h-full overflow-hidden'}>
                        {displayLang === 'maze' ? (
                          <div className="h-full bg-white">
                            <MazeWorkspaceViewer xml={displayCode} />
                          </div>
                        ) : (
                          <CodePreview code={displayCode} language={displayLang} />
                        )}
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-[#0d0d1a] to-transparent pointer-events-none" />
                      <div className="absolute inset-0 bg-violet-600/0 group-hover:bg-violet-600/10 transition-colors flex items-center justify-center">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="px-3 py-1.5 rounded-lg bg-white/10 backdrop-blur-sm text-white text-xs font-medium flex items-center gap-1.5 shadow-lg">
                            <Icon name="visibility" size={14} />
                            Xem chi tiết
                          </div>
                        </div>
                      </div>
                      {!isActivelyCoding && (
                        <div className="absolute left-2 top-2 rounded-full bg-black/60 px-2 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
                          {presence.label}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className={`flex h-36 flex-col items-center justify-center gap-2 ${presence.panelClass}`}>
                      <Icon name={presence.icon} size={34} />
                      <div className="text-center">
                        <p className="text-sm font-semibold">{presence.title}</p>
                        <p className="mt-1 text-xs opacity-80">
                          {presence.description}
                        </p>
                        {student.status === 'idle' && typeof student.idleForMs === 'number' && (
                          <p className="mt-1 text-[11px] opacity-70">
                            Không thao tác {formatDuration(student.idleForMs)}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Detail modal */}
      {selectedStudentLive && (
        <DetailModal
          student={selectedStudentLive}
          code={codeMap[selectedKey]?.code || ''}
          language={codeMap[selectedKey]?.language || selectedStudentLive.language || 'javascript'}
          studentCursorOffset={codeMap[selectedKey]?.cursorOffset}
          onClose={handleCloseDetail}
          socketRef={socketRef}
          onAdminCodeChange={handleAdminCodeChange}
        />
      )}
    </div>
  );
}

function getPresenceMeta(student: ActiveStudent) {
  switch (student.status) {
    case 'away':
      return {
        label: 'Tab khác',
        title: 'Đang ở tab khác',
        description: 'Tab hệ thống đang ẩn hoặc mất focus',
        icon: 'visibility_off',
        badgeClass: 'bg-slate-100 text-slate-700 dark:bg-slate-500/10 dark:text-slate-300',
        panelClass: 'bg-slate-50 text-slate-700 dark:bg-slate-500/5 dark:text-slate-300',
      };
    case 'idle':
      return {
        label: 'Tạm ngưng',
        title: 'Không thao tác',
        description: 'Vẫn mở portal nhưng chưa hoạt động gần đây',
        icon: 'schedule',
        badgeClass: 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300',
        panelClass: 'bg-amber-50 text-amber-700 dark:bg-amber-500/5 dark:text-amber-300',
      };
    default:
      return {
        label: 'Online',
        title: 'Đang hoạt động',
        description: 'Đang ở portal học sinh, chưa mở tab làm bài',
        icon: 'computer',
        badgeClass: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300',
        panelClass: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/5 dark:text-emerald-300',
      };
  }
}

function formatDuration(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes > 0) return `${minutes} phút`;
  return `${seconds} giây`;
}

function toPlainText(markdown: string) {
  return markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/!\[[^\]]*]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)]\([^)]*\)/g, '$1')
    .replace(/[#>*_~|\[\]-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
