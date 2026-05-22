import {
  GlobalChatMessage,
  GlobalChatMessagesResponse,
  GlobalChatReadResponse,
  GlobalChatUnreadCountResponse,
} from '@cp/shared';

import { apiClient } from '../lib/api-client';

export const globalChatApi = {
  async listMessages(params: { limit?: number; before?: string | null } = {}) {
    const { data } = await apiClient.get<GlobalChatMessagesResponse>('/global-chat/messages', {
      params: {
        limit: params.limit ?? 30,
        before: params.before || undefined,
      },
    });
    return data;
  },

  async sendMessage(content: string, clientMessageId?: string) {
    const { data } = await apiClient.post<GlobalChatMessage>('/global-chat/messages', {
      content,
      clientMessageId,
    });
    return data;
  },

  async hideMessage(id: string, reason?: string) {
    const { data } = await apiClient.patch<GlobalChatMessage>(`/global-chat/messages/${id}/hide`, {
      reason,
    });
    return data;
  },

  async markRead(lastReadMessageId: string) {
    const { data } = await apiClient.post<GlobalChatReadResponse>('/global-chat/read', {
      lastReadMessageId,
    });
    return data;
  },

  async getUnreadCount() {
    const { data } = await apiClient.get<GlobalChatUnreadCountResponse>('/global-chat/unread-count');
    return data;
  },
};
