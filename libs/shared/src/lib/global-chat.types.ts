import { UserRole } from './user-role.enum';

export enum GlobalChatMessageStatus {
  VISIBLE = 'VISIBLE',
  HIDDEN = 'HIDDEN',
}

export enum GlobalChatNotificationType {
  GLOBAL_CHAT_MESSAGE = 'GLOBAL_CHAT_MESSAGE',
}

export enum GlobalChatAuditAction {
  MESSAGE_HIDE = 'GLOBAL_CHAT_MESSAGE_HIDE',
  RATE_LIMITED = 'GLOBAL_CHAT_RATE_LIMITED',
}

export interface GlobalChatSender {
  id: string;
  name: string;
  avatarUrl?: string | null;
  role: UserRole;
}

export interface GlobalChatMessage {
  id: string;
  content: string;
  status: GlobalChatMessageStatus;
  createdAt: string;
  updatedAt?: string;
  hiddenAt?: string | null;
  hiddenReason?: string | null;
  sender: GlobalChatSender;
}

export interface GlobalChatMessagesResponse {
  items: GlobalChatMessage[];
  nextCursor: string | null;
}

export interface GlobalChatUnreadCountResponse {
  unreadCount: number;
}

export interface GlobalChatReadResponse {
  lastReadAt: string;
  unreadCount: number;
}

export interface GlobalChatSendPayload {
  clientMessageId: string;
  content: string;
}

export interface GlobalChatSentPayload {
  clientMessageId?: string;
  message: GlobalChatMessage;
}

export interface GlobalChatFailedPayload {
  clientMessageId?: string;
  message: string;
  code: string;
}

export interface GlobalChatDeletedPayload {
  id: string;
  hiddenAt: string;
  hiddenById: string;
}
