import { create } from 'zustand';

export interface OnlineUser {
  id: string;
  name: string;
  avatarUrl: string | null;
  role: string;
  inChat: boolean;
}

interface GlobalChatState {
  unreadCount: number;
  isConnected: boolean;
  isChatOpen: boolean;
  onlineUsers: OnlineUser[];
  setUnreadCount: (count: number) => void;
  setConnected: (isConnected: boolean) => void;
  setChatOpen: (isChatOpen: boolean) => void;
  setOnlineUsers: (users: OnlineUser[]) => void;
  reset: () => void;
}

export const useGlobalChatStore = create<GlobalChatState>((set) => ({
  unreadCount: 0,
  isConnected: false,
  isChatOpen: false,
  onlineUsers: [],
  setUnreadCount: (count) => set({ unreadCount: Math.max(0, count) }),
  setConnected: (isConnected) => set({ isConnected }),
  setChatOpen: (isChatOpen) => set({ isChatOpen }),
  setOnlineUsers: (onlineUsers) => set({ onlineUsers }),
  reset: () => set({ unreadCount: 0, isConnected: false, isChatOpen: false, onlineUsers: [] }),
}));
