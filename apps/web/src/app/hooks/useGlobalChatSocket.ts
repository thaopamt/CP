import { useEffect, useMemo } from 'react';
import { io, Socket } from 'socket.io-client';
import {
  GlobalChatDeletedPayload,
  GlobalChatFailedPayload,
  GlobalChatMessage,
  GlobalChatSendPayload,
  GlobalChatSentPayload,
} from '@cp/shared';
import { useToast } from '@cp/ui';

import { useAuthStore } from '../stores/auth.store';
import { useGlobalChatStore, OnlineUser } from '../stores/globalChat.store';
import { resolveSocketNamespace } from '../lib/socket-url';

type MessageListener = (message: GlobalChatMessage) => void;
type SentListener = (payload: GlobalChatSentPayload) => void;
type FailedListener = (payload: GlobalChatFailedPayload) => void;
type DeletedListener = (payload: GlobalChatDeletedPayload) => void;
type TypingListener = (payload: { userId: string; name: string; isTyping: boolean }) => void;

const listeners = {
  message: new Set<MessageListener>(),
  sent: new Set<SentListener>(),
  failed: new Set<FailedListener>(),
  deleted: new Set<DeletedListener>(),
  typing: new Set<TypingListener>(),
};

let socket: Socket | null = null;
let socketToken: string | null = null;
let currentUserId: string | null = null;
let notifyInfo: ((message: string) => void) | null = null;

interface UseGlobalChatSocketOptions {
  onMessage?: MessageListener;
  onSent?: SentListener;
  onFailed?: FailedListener;
  onDeleted?: DeletedListener;
  onTyping?: TypingListener;
}

export function useGlobalChatSocket(options: UseGlobalChatSocketOptions = {}) {
  const token = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  const isConnected = useGlobalChatStore((s) => s.isConnected);
  const toast = useToast();

  useEffect(() => {
    notifyInfo = toast.info;
  }, [toast]);

  useEffect(() => {
    currentUserId = user?.id ?? null;
    if (!token || !user) {
      disconnectGlobalChatSocket();
      return;
    }

    ensureGlobalChatSocket(token, user.id);

    return undefined;
  }, [token, user]);

  useEffect(() => registerListener(listeners.message, options.onMessage), [options.onMessage]);
  useEffect(() => registerListener(listeners.sent, options.onSent), [options.onSent]);
  useEffect(() => registerListener(listeners.failed, options.onFailed), [options.onFailed]);
  useEffect(() => registerListener(listeners.deleted, options.onDeleted), [options.onDeleted]);
  useEffect(() => registerListener(listeners.typing, options.onTyping), [options.onTyping]);

  return useMemo(
    () => ({
      isConnected,
      sendMessage: (payload: GlobalChatSendPayload) => {
        if (!socket?.connected) return false;
        socket.emit('global_chat:message:new', payload);
        return true;
      },
      markRead: (lastReadMessageId: string) => {
        socket?.emit('global_chat:read', { lastReadMessageId });
      },
      sendTyping: (isTyping: boolean) => {
        socket?.emit('global_chat:typing', { isTyping });
      },
      sendChatFocus: (focused: boolean) => {
        socket?.emit('global_chat:chat_focus', { focused });
      },
    }),
    [isConnected],
  );
}

export function createGlobalChatClientMessageId() {
  if ('crypto' in window && typeof window.crypto.randomUUID === 'function') {
    return window.crypto.randomUUID();
  }
  return `client-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function ensureGlobalChatSocket(token: string, userId: string) {
  if (socket && socketToken === token) {
    if (!socket.connected) socket.connect();
    return socket;
  }

  disconnectGlobalChatSocket();
  socketToken = token;
  currentUserId = userId;
  const socketUrl = resolveSocketNamespace('/global-chat');
  socket = io(socketUrl, {
    transports: ['websocket'],
    auth: { token },
  });

  socket.on('connect', () => {
    useGlobalChatStore.getState().setConnected(true);
    socket?.emit('global_chat:join');
  });

  socket.on('disconnect', () => {
    useGlobalChatStore.getState().setConnected(false);
  });

  socket.on('connect_error', () => {
    useGlobalChatStore.getState().setConnected(false);
  });

  socket.on('global_chat:unread_count_updated', (payload: { unreadCount: number }) => {
    useGlobalChatStore.getState().setUnreadCount(payload.unreadCount ?? 0);
  });

  socket.on('global_chat:message:new', (message: GlobalChatMessage) => {
    for (const listener of listeners.message) listener(message);
    const state = useGlobalChatStore.getState();
    if (!state.isChatOpen && message.sender.id !== currentUserId) {
      notifyInfo?.(`${message.sender.name}: ${message.content || 'Tin nhắn mới trong Chat chung'}`);
    }
  });

  socket.on('global_chat:message:sent', (payload: GlobalChatSentPayload) => {
    for (const listener of listeners.sent) listener(payload);
  });

  socket.on('global_chat:message:failed', (payload: GlobalChatFailedPayload) => {
    for (const listener of listeners.failed) listener(payload);
  });

  socket.on('global_chat:message:deleted', (payload: GlobalChatDeletedPayload) => {
    for (const listener of listeners.deleted) listener(payload);
  });

  socket.on('global_chat:typing', (payload: { userId: string; name: string; isTyping: boolean }) => {
    for (const listener of listeners.typing) listener(payload);
  });

  socket.on('global_chat:online_users', (users: OnlineUser[]) => {
    useGlobalChatStore.getState().setOnlineUsers(users);
  });

  return socket;
}

function disconnectGlobalChatSocket() {
  if (socket) {
    socket.disconnect();
  }
  socket = null;
  socketToken = null;
  useGlobalChatStore.getState().reset();
}

function registerListener<T>(set: Set<T>, listener?: T) {
  if (!listener) return undefined;
  set.add(listener);
  return () => {
    set.delete(listener);
  };
}
