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

const SOCKET_URL = import.meta.env.VITE_API_URL?.startsWith('http')
  ? import.meta.env.VITE_API_URL
  : import.meta.env.PROD
    ? ''
    : 'http://localhost:3000';

interface ActiveStudent {
  socketId: string;
  studentId: string;
  problemId: string;
  studentName?: string;
  language?: string;
  code?: string;
  lastActive: number;
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
                <span>Problem: {student.problemId.substring(0, 8)}…</span>
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
    const socketUrl = SOCKET_URL ? `${SOCKET_URL}/live-monitor` : '/live-monitor';
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
    if (selectedStudent && socketRef.current) {
      socketRef.current.emit('admin_unwatch_student', {
        studentId: selectedStudent.studentId,
        problemId: selectedStudent.problemId,
      });
    }
    setSelectedStudent(null);
  }, [selectedStudent]);

  const selectedKey = selectedStudent
    ? `${selectedStudent.studentId}_${selectedStudent.problemId}`
    : '';

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
            {students.length} học sinh đang online
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
                Khi học sinh mở bài tập và bắt đầu code, họ sẽ xuất hiện ở đây
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {students.map((student) => {
              const key = `${student.studentId}_${student.problemId}`;
              const snapshot = codeMap[key];
              const displayCode = snapshot?.code || student.code || '';
              const displayLang = snapshot?.language || student.language || 'javascript';
              const initial = (student.studentName || student.studentId).charAt(0).toUpperCase();
              const timeSinceActive = Date.now() - student.lastActive;
              const isRecent = timeSinceActive < 10_000; // active within 10s

              return (
                <button
                  key={student.socketId}
                  onClick={() => handleOpenDetail(student)}
                  className="group relative flex flex-col bg-white dark:bg-[#141420] rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm
                    hover:shadow-lg hover:border-violet-300 dark:hover:border-violet-700 hover:scale-[1.02]
                    transition-all duration-200 overflow-hidden text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-violet-500/40"
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
                        {student.problemId.length > 20
                          ? student.problemId.substring(0, 20) + '…'
                          : student.problemId}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400">
                        {displayLang}
                      </span>
                      {isRecent && (
                        <span className="relative flex h-2 w-2" title="Đang gõ code">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Code preview */}
                  <div className="h-36 overflow-hidden bg-[#0d0d1a] relative">
                    <CodePreview code={displayCode} language={displayLang} />
                    {/* Fade overlay at bottom */}
                    <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-[#0d0d1a] to-transparent pointer-events-none" />
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-violet-600/0 group-hover:bg-violet-600/10 transition-colors flex items-center justify-center">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="px-3 py-1.5 rounded-lg bg-white/10 backdrop-blur-sm text-white text-xs font-medium flex items-center gap-1.5 shadow-lg">
                          <Icon name="visibility" size={14} />
                          Xem chi tiết
                        </div>
                      </div>
                    </div>
                  </div>
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
