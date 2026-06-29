import { UserRole } from './user-role.enum';

/* ────────────────────────────────────────────────────────────────────── */
/*  Chat types — shared by NestJS backend and React frontend             */
/*                                                                       */
/*  Model: Each student has ONE support thread. All teachers/admins      */
/*  can view and reply to any student thread.                            */
/* ────────────────────────────────────────────────────────────────────── */

export type ChatMessageType = 'normal' | 'warning';

/** Wire-format conversation (returned from REST & pushed via socket). */
export interface IChatConversation {
  id: string;
  studentId: string;
  studentName: string;
  studentAvatarUrl: string | null;
  lastMessage: string | null;
  lastMessageAt: string | null;
  /** Computed per-viewer: how many messages the caller hasn't read yet. */
  unreadCount: number;
  createdAt: string;
}

/** Wire-format message. */
export interface IChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  senderAvatarUrl: string | null;
  content: string;
  /** 'normal' (default) or 'warning' (shows full-screen alert to student) */
  type: ChatMessageType;
  readAt: string | null;
  createdAt: string;
}

/** Socket event payload for send_message. */
export interface SendMessagePayload {
  conversationId: string;
  content: string;
  /** Optional: 'warning' to trigger a full-screen alert for the student */
  type?: ChatMessageType;
}

/** Paginated messages response. */
export interface IChatMessagesPage {
  items: IChatMessage[];
  hasMore: boolean;
  page: number;
}
