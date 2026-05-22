import { useEffect, useState, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { Icon, PageHeader } from '@cp/ui';
import Editor from 'react-simple-code-editor';
import Prism from 'prismjs';
import 'prismjs/themes/prism-tomorrow.css';
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-cpp';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-javascript';

import { resolveSocketNamespace } from '../../../lib/socket-url';

interface ActiveStudent {
  socketId: string;
  studentId: string;
  problemId?: string;
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
  onClose,
}: {
  student: ActiveStudent;
  code: string;
  language: string;
  onClose: () => void;
}) {
  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative w-[90vw] max-w-5xl h-[80vh] flex flex-col bg-[#0d0d1a] rounded-2xl overflow-hidden shadow-2xl border border-white/10 animate-in fade-in zoom-in-95">
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
              <div className="text-[11px] text-gray-400 flex items-center gap-2">
                <span>Problem: {student.problemId?.substring(0, 8) ?? 'N/A'}…</span>
                <span className="px-1.5 py-0.5 rounded bg-white/5 font-mono uppercase text-[10px]">
                  {language}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
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

        {/* Code editor (read-only) */}
        <div className="flex-1 overflow-auto">
          <Editor
            value={code || '// Waiting for code...'}
            onValueChange={() => {}}
            highlight={(c) => highlightCode(c, language)}
            padding={16}
            className="w-full min-h-full font-mono text-[13px] bg-transparent text-gray-300 outline-none"
            textareaClassName="pointer-events-none"
            style={{
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
              lineHeight: '20px',
            }}
          />
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
  const [codeMap, setCodeMap] = useState<Record<string, { code: string; language: string }>>({});
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

    socket.on('code_update', (data: { studentId: string; problemId: string; code: string; language: string }) => {
      const key = `${data.studentId}_${data.problemId}`;
      setCodeMap((prev) => ({
        ...prev,
        [key]: { code: data.code, language: data.language },
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

  const selectedKey = selectedStudent
    ? `${selectedStudent.studentId}_${selectedStudent.problemId ?? ''}`
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
          description="Theo dõi quá trình làm bài của học sinh theo thời gian thực"
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
                          ? student.problemId && student.problemId.length > 20
                            ? student.problemId.substring(0, 20) + '…'
                            : student.problemId
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
                    <div className="h-36 overflow-hidden bg-[#0d0d1a] relative">
                      <CodePreview code={displayCode} language={displayLang} />
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
      {selectedStudent && (
        <DetailModal
          student={selectedStudent}
          code={codeMap[selectedKey]?.code || ''}
          language={codeMap[selectedKey]?.language || selectedStudent.language || 'javascript'}
          onClose={handleCloseDetail}
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
