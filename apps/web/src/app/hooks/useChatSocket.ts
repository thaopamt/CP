import { useEffect, useRef, useCallback, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import { IChatMessage, IChatMessagesPage } from '@cp/shared';

import { resolveSocketNamespace } from '../lib/socket-url';
import { useAuthStore } from '../stores/auth.store';
import { CHAT_KEYS } from '../api/chat.queries';

/**
 * Manages a persistent Socket.IO connection to the `/chat` namespace.
 *
 * Performance optimizations:
 * - Optimistically inserts new messages directly into the React Query cache
 *   instead of invalidating (which triggers a full re-fetch).
 * - Only invalidates conversation list (lightweight) for ordering updates.
 * - Typing indicators use local state only (no server round-trip).
 */
export function useChatSocket() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const socketRef = useRef<Socket | null>(null);
  const qc = useQueryClient();

  const [isConnected, setIsConnected] = useState(false);
  const [totalUnread, setTotalUnread] = useState(0);
  const [typingMap, setTypingMap] = useState<
    Record<string, { userId: string; timeout: ReturnType<typeof setTimeout> }>
  >({});

  const onNewMessageRef = useRef<((msg: IChatMessage) => void) | null>(null);

  useEffect(() => {
    if (!accessToken) return;

    const socket = io(resolveSocketNamespace('/chat'), {
      transports: ['websocket'],
      auth: { token: accessToken },
    });
    socketRef.current = socket;

    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));

    socket.on('new_message', (msg: IChatMessage) => {
      // Optimistically insert message into the cache (page 1)
      qc.setQueriesData<IChatMessagesPage>(
        { queryKey: CHAT_KEYS.messages(msg.conversationId) },
        (old) => {
          if (!old) return old;
          // Only update page 1 cache (most recent messages)
          if (old.page !== 1) return old;
          // Avoid duplicates
          if (old.items.some((m) => m.id === msg.id)) return old;
          return { ...old, items: [...old.items, msg] };
        },
      );
      // Invalidate conversation list for ordering/last-message update
      qc.invalidateQueries({ queryKey: CHAT_KEYS.conversations });
      // Notify external listener
      onNewMessageRef.current?.(msg);
    });

    socket.on(
      'messages_read',
      (data: { conversationId: string; readBy: string }) => {
        // Update read status in cached messages
        qc.setQueriesData<IChatMessagesPage>(
          { queryKey: CHAT_KEYS.messages(data.conversationId) },
          (old) => {
            if (!old) return old;
            return {
              ...old,
              items: old.items.map((m) =>
                !m.readAt && m.senderId !== data.readBy
                  ? { ...m, readAt: new Date().toISOString() }
                  : m,
              ),
            };
          },
        );
        qc.invalidateQueries({ queryKey: CHAT_KEYS.conversations });
      },
    );

    socket.on(
      'user_typing',
      (data: { conversationId: string; userId: string }) => {
        setTypingMap((prev) => {
          if (prev[data.conversationId]) {
            clearTimeout(prev[data.conversationId].timeout);
          }
          const timeout = setTimeout(() => {
            setTypingMap((p) => {
              const next = { ...p };
              delete next[data.conversationId];
              return next;
            });
          }, 3000);
          return {
            ...prev,
            [data.conversationId]: { userId: data.userId, timeout },
          };
        });
      },
    );

    socket.on('unread_update', (data: { totalUnread?: number; refresh?: boolean }) => {
      if (data.totalUnread !== undefined) {
        setTotalUnread(data.totalUnread);
      }
      if (data.refresh) {
        qc.invalidateQueries({ queryKey: CHAT_KEYS.unread });
      }
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    };
  }, [accessToken, qc]);

  const sendMessage = useCallback(
    (
      conversationId: string,
      content: string,
      type?: string,
      imageUrl?: string,
      contextType?: string,
      contextId?: string,
      contextTitle?: string,
      contextMeta?: string,
    ) => {
      socketRef.current?.emit('send_message', {
        conversationId,
        content,
        type,
        imageUrl,
        contextType,
        contextId,
        contextTitle,
        contextMeta,
      });
    },
    [],
  );

  const markRead = useCallback((conversationId: string) => {
    socketRef.current?.emit('mark_read', { conversationId });
    setTotalUnread(0);
  }, []);

  const lastTypingRef = useRef<number>(0);
  const emitTyping = useCallback((conversationId: string) => {
    const now = Date.now();
    // Throttle: max once per 2 seconds
    if (now - lastTypingRef.current < 2000) return;
    lastTypingRef.current = now;
    socketRef.current?.emit('typing', { conversationId });
  }, []);

  const setOnNewMessage = useCallback(
    (cb: ((msg: IChatMessage) => void) | null) => {
      onNewMessageRef.current = cb;
    },
    [],
  );

  return {
    isConnected,
    totalUnread,
    typingMap,
    sendMessage,
    markRead,
    emitTyping,
    setOnNewMessage,
  };
}
