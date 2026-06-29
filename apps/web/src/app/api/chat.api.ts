import {
  IChatConversation,
  IChatMessage,
  IChatMessagesPage,
} from '@cp/shared';

import { apiClient } from '../lib/api-client';

export const chatApi = {
  async getConversations(): Promise<IChatConversation[]> {
    const { data } = await apiClient.get<IChatConversation[]>(
      '/chat/conversations',
    );
    return data;
  },

  /**
   * Get or create a conversation.
   * Students: call with no args → auto-creates their own thread.
   * Staff: pass studentUserId to open a thread for a specific student.
   */
  async getOrCreateConversation(
    studentUserId?: string,
  ): Promise<IChatConversation> {
    const { data } = await apiClient.post<IChatConversation>(
      '/chat/conversations',
      studentUserId ? { studentUserId } : {},
    );
    return data;
  },

  async getMessages(
    conversationId: string,
    page = 1,
  ): Promise<IChatMessagesPage> {
    const { data } = await apiClient.get<IChatMessagesPage>(
      `/chat/conversations/${conversationId}/messages`,
      { params: { page } },
    );
    return data;
  },

  async sendMessage(
    conversationId: string,
    content: string,
  ): Promise<IChatMessage> {
    const { data } = await apiClient.post<IChatMessage>(
      `/chat/conversations/${conversationId}/messages`,
      { content },
    );
    return data;
  },

  async markAsRead(
    conversationId: string,
  ): Promise<{ count: number }> {
    const { data } = await apiClient.post<{ count: number }>(
      `/chat/conversations/${conversationId}/read`,
    );
    return data;
  },

  async getUnreadCount(): Promise<number> {
    const { data } = await apiClient.get<number>('/chat/unread-count');
    return data;
  },
};
