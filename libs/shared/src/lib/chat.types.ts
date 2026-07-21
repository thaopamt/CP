import { UserRole } from './user-role.enum';

/* ────────────────────────────────────────────────────────────────────── */
/*  Chat types — shared by NestJS backend and React frontend             */
/*                                                                       */
/*  Model: Each student has ONE support thread. All teachers/admins      */
/*  can view and reply to any student thread.                            */
/* ────────────────────────────────────────────────────────────────────── */

export type ChatMessageType = 'normal' | 'warning' | 'report';

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
  /** 'normal' (default), 'warning' (shows full-screen alert to student), or 'report' (assignment report/Q&A) */
  type: ChatMessageType;
  /** Optional image URL (for warnings with images) */
  imageUrl: string | null;
  /** Optional structured context (e.g. for assignment reports/Q&A) */
  contextType?: string | null;
  contextId?: string | null;
  contextTitle?: string | null;
  contextMeta?: string | null;
  readAt: string | null;
  createdAt: string;
}

/** Socket event payload for send_message. */
export interface SendMessagePayload {
  conversationId: string;
  content: string;
  /** Optional: 'warning' or 'report' */
  type?: ChatMessageType;
  /** Optional: image URL attached to the message */
  imageUrl?: string;
  /** Optional structured context */
  contextType?: string;
  contextId?: string;
  contextTitle?: string;
  contextMeta?: string;
}

/** Paginated messages response. */
export interface IChatMessagesPage {
  items: IChatMessage[];
  hasMore: boolean;
  page: number;
}
