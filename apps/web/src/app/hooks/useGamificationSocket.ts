import { useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@cp/ui';
import { IGamificationEvent } from '@cp/shared';

import { useAuthStore } from '../stores/auth.store';
import { resolveSocketNamespace } from '../lib/socket-url';

let socket: Socket | null = null;
let socketToken: string | null = null;

function ensureSocket(token: string): Socket {
  if (socket && socketToken === token) return socket;
  if (socket) {
    socket.disconnect();
    socket = null;
  }
  socketToken = token;
  socket = io(resolveSocketNamespace('/gamification'), {
    transports: ['websocket'],
    auth: { token },
  });
  socket.on('connect', () => socket?.emit('gamification:join'));
  return socket;
}

function disconnect() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
  socketToken = null;
}

/**
 * Subscribes the signed-in student to live gamification events (quest completed,
 * badge earned, level up) and surfaces them as toasts while keeping the relevant
 * React Query caches fresh. Mount once near the student shell.
 */
export function useGamificationSocket(onEvent?: (event: IGamificationEvent) => void) {
  const token = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  const toast = useToast();
  const qc = useQueryClient();

  useEffect(() => {
    if (!token || !user) {
      disconnect();
      return;
    }
    const s = ensureSocket(token);

    const handler = (event: IGamificationEvent) => {
      const emoji =
        event.type === 'level:up' ? '⬆️' : event.type === 'badge:earned' ? '🏅' : '⚔️';
      toast.success(`${emoji} ${event.title} — ${event.message}`);
      void qc.invalidateQueries({ queryKey: ['student-quests'] });
      void qc.invalidateQueries({ queryKey: ['student-badges'] });
      void qc.invalidateQueries({ queryKey: ['students', 'dashboard'] });
      void qc.invalidateQueries({ queryKey: ['leaderboard'] });
      onEvent?.(event);
    };

    s.on('gamification:event', handler);
    return () => {
      s.off('gamification:event', handler);
    };
  }, [token, user, toast, qc, onEvent]);
}
