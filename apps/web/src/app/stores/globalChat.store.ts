import { create } from 'zustand';

interface GlobalChatState {
  unreadCount: number;
  isConnected: boolean;
  isChatOpen: boolean;
  setUnreadCount: (count: number) => void;
  setConnected: (isConnected: boolean) => void;
  setChatOpen: (isChatOpen: boolean) => void;
  reset: () => void;
}

export const useGlobalChatStore = create<GlobalChatState>((set) => ({
  unreadCount: 0,
  isConnected: false,
  isChatOpen: false,
  setUnreadCount: (count) => set({ unreadCount: Math.max(0, count) }),
  setConnected: (isConnected) => set({ isConnected }),
  setChatOpen: (isChatOpen) => set({ isChatOpen }),
  reset: () => set({ unreadCount: 0, isConnected: false, isChatOpen: false }),
}));
