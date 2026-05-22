import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { fullName, UserRole } from '@cp/shared';

import { resolveSocketNamespace } from '../lib/socket-url';
import { useAuthStore } from '../stores/auth.store';

const IDLE_AFTER_MS = 60_000;

type PresenceStatus = 'online' | 'idle' | 'away';

export function useStudentLivePresence(currentPath: string) {
  const user = useAuthStore((s) => s.user);
  const socketRef = useRef<Socket | null>(null);
  const currentPathRef = useRef(currentPath);
  const lastActivityAtRef = useRef(Date.now());
  const statusRef = useRef<PresenceStatus>('online');
  const heartbeatRef = useRef<number | null>(null);

  useEffect(() => {
    currentPathRef.current = currentPath;
  }, [currentPath]);

  const emitPresence = () => {
    const socket = socketRef.current;
    if (!socket?.connected || !user || user.role !== UserRole.STUDENT) return;

    const idleForMs = Date.now() - lastActivityAtRef.current;
    const isTabVisible = document.visibilityState === 'visible';
    const isWindowFocused = document.hasFocus();
    const status: PresenceStatus =
      !isTabVisible || !isWindowFocused ? 'away' : idleForMs >= IDLE_AFTER_MS ? 'idle' : 'online';

    statusRef.current = status;
    socket.emit('student_online', {
      studentId: user.id,
      studentName: fullName(user) || user.email,
      currentPath: currentPathRef.current,
      status,
      isTabVisible,
      isWindowFocused,
      idleForMs,
    });
  };

  useEffect(() => {
    if (!user || user.role !== UserRole.STUDENT) return;

    const socket = io(resolveSocketNamespace('/live-monitor'), {
      transports: ['websocket'],
    });
    socketRef.current = socket;

    socket.on('connect', emitPresence);

    return () => {
      if (heartbeatRef.current) window.clearInterval(heartbeatRef.current);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user]);

  useEffect(() => {
    emitPresence();
  }, [currentPath, user]);

  useEffect(() => {
    if (!user || user.role !== UserRole.STUDENT) return;

    const markActive = () => {
      lastActivityAtRef.current = Date.now();
      if (statusRef.current !== 'online') emitPresence();
    };
    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible' && document.hasFocus()) {
        lastActivityAtRef.current = Date.now();
      }
      emitPresence();
    };

    const activityEvents: Array<keyof WindowEventMap> = ['mousemove', 'keydown', 'pointerdown', 'scroll'];
    for (const event of activityEvents) {
      window.addEventListener(event, markActive, { passive: true });
    }
    document.addEventListener('visibilitychange', handleVisibilityOrFocus);
    window.addEventListener('focus', handleVisibilityOrFocus);
    window.addEventListener('blur', handleVisibilityOrFocus);

    heartbeatRef.current = window.setInterval(emitPresence, 15_000);

    return () => {
      for (const event of activityEvents) {
        window.removeEventListener(event, markActive);
      }
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      window.removeEventListener('focus', handleVisibilityOrFocus);
      window.removeEventListener('blur', handleVisibilityOrFocus);
      if (heartbeatRef.current) {
        window.clearInterval(heartbeatRef.current);
        heartbeatRef.current = null;
      }
    };
  }, [user]);
}
