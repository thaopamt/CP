import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { chatApi } from './chat.api';

const CHAT_KEYS = {
  conversations: ['chat', 'conversations'] as const,
  messages: (id: string) => ['chat', 'messages', id] as const,
  unread: ['chat', 'unread'] as const,
};

export function useChatConversations() {
  return useQuery({
    queryKey: CHAT_KEYS.conversations,
    queryFn: () => chatApi.getConversations(),
    refetchInterval: 30_000,
  });
}

export function useChatMessages(conversationId: string | null, page = 1) {
  return useQuery({
    queryKey: [...CHAT_KEYS.messages(conversationId ?? ''), page],
    queryFn: () => chatApi.getMessages(conversationId!, page),
    enabled: !!conversationId,
  });
}

export function useChatUnreadCount() {
  return useQuery({
    queryKey: CHAT_KEYS.unread,
    queryFn: () => chatApi.getUnreadCount(),
    refetchInterval: 30_000,
  });
}

export function useCreateConversation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (studentUserId?: string) =>
      chatApi.getOrCreateConversation(studentUserId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CHAT_KEYS.conversations });
    },
  });
}

export function useMarkAsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (conversationId: string) =>
      chatApi.markAsRead(conversationId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CHAT_KEYS.conversations });
      qc.invalidateQueries({ queryKey: CHAT_KEYS.unread });
    },
  });
}

export { CHAT_KEYS };
