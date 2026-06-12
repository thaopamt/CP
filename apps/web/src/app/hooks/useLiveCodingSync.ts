import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { fullName } from '@cp/shared';

import { resolveSocketNamespace } from '../lib/socket-url';
import { useAuthStore } from '../stores/auth.store';

type ProblemExample = {
  input: string;
  output: string;
  explanation?: string;
};

/**
 * Syncs the student's code with the live monitor server.
 * Returns admin remote cursor offset for rendering.
 */
export function useLiveCodingSync(
  problemId: string | undefined,
  code: string,
  language: string,
  cursorOffset: number,
  problem?: { title?: string; description?: string; examples?: ProblemExample[] },
  onRemoteCodeChange?: (code: string, language: string) => void,
) {
  const socketRef = useRef<Socket | null>(null);
  const { user } = useAuthStore();

  const codeRef = useRef(code);
  const languageRef = useRef(language);
  const problemRef = useRef(problem);
  const onRemoteCodeChangeRef = useRef(onRemoteCodeChange);
  // Flag to suppress re-emitting code_change when the change originated from remote
  const skipNextEmitRef = useRef(false);

  // Admin cursor state
  const [adminCursor, setAdminCursor] = useState<number | null>(null);
  const [adminName, setAdminName] = useState<string | null>(null);
  const [adminIsEditing, setAdminIsEditing] = useState(false);

  useEffect(() => {
    codeRef.current = code;
    languageRef.current = language;
    problemRef.current = problem;
    onRemoteCodeChangeRef.current = onRemoteCodeChange;
  }, [code, language, problem, onRemoteCodeChange]);

  useEffect(() => {
    if (!problemId || !user) return;

    setAdminCursor(null);
    setAdminName(null);
    setAdminIsEditing(false);

    const socketUrl = resolveSocketNamespace('/live-monitor');
    const socket = io(socketUrl, {
      transports: ['websocket'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join_workspace', {
        studentId: user.id,
        problemId: problemId,
        problemTitle: problemRef.current?.title,
        problemDescription: problemRef.current?.description,
        problemExamples: problemRef.current?.examples,
        studentName: fullName(user) || user.email,
        language: languageRef.current,
      });

      // Sync current code immediately
      socket.emit('code_change', {
        studentId: user.id,
        problemId: problemId,
        code: codeRef.current,
        language: languageRef.current,
        cursorOffset: 0,
      });
    });

    // Admin pushes code changes
    socket.on(
      'admin_code_push',
      (data: { code: string; language: string; cursorOffset?: number; adminName?: string }) => {
        skipNextEmitRef.current = true;
        onRemoteCodeChangeRef.current?.(data.code, data.language);
        setAdminIsEditing(true);
        if (typeof data.cursorOffset === 'number') {
          setAdminCursor(data.cursorOffset);
        }
        if (data.adminName) {
          setAdminName(data.adminName);
        }
      },
    );

    // Admin cursor-only moves (no code change)
    socket.on(
      'admin_cursor_push',
      (data: { cursorOffset: number; adminName?: string }) => {
        setAdminIsEditing(true);
        setAdminCursor(data.cursorOffset);
        if (data.adminName) {
          setAdminName(data.adminName);
        }
      },
    );

    socket.on(
      'admin_edit_state_push',
      (data: { isEditing: boolean; cursorOffset?: number; adminName?: string }) => {
        setAdminIsEditing(data.isEditing);
        if (!data.isEditing) {
          setAdminCursor(null);
          return;
        }
        if (typeof data.cursorOffset === 'number') {
          setAdminCursor(data.cursorOffset);
        }
        if (data.adminName) {
          setAdminName(data.adminName);
        }
      },
    );

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [problemId, user]);

  // Send workspace metadata
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

  // Sync code change — immediate, no debounce
  useEffect(() => {
    if (skipNextEmitRef.current) {
      skipNextEmitRef.current = false;
      return;
    }

    if (socketRef.current && problemId && user) {
      socketRef.current.emit('code_change', {
        studentId: user.id,
        problemId: problemId,
        code: code,
        language: language,
        cursorOffset: cursorOffset,
      });
    }
  }, [code, language, cursorOffset, problemId, user]);

  return { adminCursor, adminName, adminIsEditing };
}
