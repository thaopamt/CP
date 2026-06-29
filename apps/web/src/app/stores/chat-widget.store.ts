import { create } from 'zustand';

/**
 * Context that can be attached to a chat message.
 * e.g., when a student asks a question about a specific assignment.
 */
export interface ChatContext {
  /** Type of the context — 'assignment' for now, extensible later */
  type: 'assignment';
  /** ID of the referenced entity */
  id: string;
  /** Human-readable title shown in the chat bubble */
  title: string;
  /** Optional extra info (difficulty, etc.) */
  meta?: string;
}

interface ChatWidgetStore {
  /** Pending context to attach to the next message */
  pendingContext: ChatContext | null;
  /** Whether to force-open the widget */
  shouldOpen: boolean;
  /** Open the widget with a context pre-filled */
  openWithContext: (ctx: ChatContext) => void;
  /** Clear the pending context (after it's been sent) */
  clearContext: () => void;
  /** Acknowledge the open request */
  ackOpen: () => void;
}

export const useChatWidgetStore = create<ChatWidgetStore>((set) => ({
  pendingContext: null,
  shouldOpen: false,
  openWithContext: (ctx) => set({ pendingContext: ctx, shouldOpen: true }),
  clearContext: () => set({ pendingContext: null }),
  ackOpen: () => set({ shouldOpen: false }),
}));
