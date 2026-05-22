import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { fullName } from '@cp/shared';

import { resolveSocketNamespace } from '../lib/socket-url';
import { useAuthStore } from '../stores/auth.store';

type ProblemExample = {
  input: string;
  output: string;
  explanation?: string;
};

export function useLiveCodingSync(
  problemId: string | undefined,
  code: string,
  language: string,
  problem?: { title?: string; description?: string; examples?: ProblemExample[] },
) {
  const socketRef = useRef<Socket | null>(null);
  const { user } = useAuthStore();
  
  const codeRef = useRef(code);
  const languageRef = useRef(language);
  const problemRef = useRef(problem);

  useEffect(() => {
    codeRef.current = code;
    languageRef.current = language;
    problemRef.current = problem;
  }, [code, language, problem]);

  useEffect(() => {
    if (!problemId || !user) return;

    // Khởi tạo connection
    // Ensure we don't prepend '/api' to the namespace
    const socketUrl = resolveSocketNamespace('/live-monitor');
    const socket = io(socketUrl, {
      transports: ['websocket'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      // Khi connect thành công, gửi event join_workspace
      socket.emit('join_workspace', {
        studentId: user.id,
        problemId: problemId,
        problemTitle: problemRef.current?.title,
        problemDescription: problemRef.current?.description,
        problemExamples: problemRef.current?.examples,
        studentName: fullName(user) || user.email,
        language: languageRef.current,
      });
      
      // Đồng bộ code hiện tại ngay khi kết nối
      socket.emit('code_change', {
        studentId: user.id,
        problemId: problemId,
        code: codeRef.current,
        language: languageRef.current,
      });
    });

    // Cleanup khi unmount (rời trang bài tập)
    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [problemId, user]);

  useEffect(() => {
    if (!socketRef.current?.connected || !problemId || !user) return;

    socketRef.current.emit('workspace_metadata', {
      studentId: user.id,
      problemId,
      problemTitle: problem?.title,
      problemDescription: problem?.description,
      problemExamples: problem?.examples,
    });
  }, [problemId, problem?.title, problem?.description, problem?.examples, user]);

  // Sync code change (nên debounce nếu có thể, nhưng hiện tại gọi trực tiếp)
  useEffect(() => {
    if (socketRef.current && problemId && user) {
      socketRef.current.emit('code_change', {
        studentId: user.id,
        problemId: problemId,
        code: code,
        language: language,
      });
    }
  }, [code, language, problemId, user]);
}
