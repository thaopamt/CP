import { useEffect, useState, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { fullName, IUser } from '@cp/shared';
import { useAuthStore } from '../stores/auth.store';

const SOCKET_URL = import.meta.env.VITE_API_URL?.startsWith('http')
  ? import.meta.env.VITE_API_URL
  : import.meta.env.PROD
    ? ''
    : 'http://localhost:3000';

interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  content: string;
  timestamp: number;
}

/* ── Role badge colors ─────────────────────────────────────── */
const ROLE_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  ADMIN:   { bg: 'bg-rose-500/15',    text: 'text-rose-400',    label: 'Admin' },
  TEACHER: { bg: 'bg-amber-500/15',   text: 'text-amber-400',   label: 'Teacher' },
  STUDENT: { bg: 'bg-sky-500/15',     text: 'text-sky-400',     label: 'Student' },
};

/* ── Avatar initials ─────────────────────────────────────────── */
const ROLE_GRADIENT: Record<string, string> = {
  ADMIN:   'from-rose-500 to-pink-600',
  TEACHER: 'from-amber-500 to-orange-600',
  STUDENT: 'from-sky-500 to-indigo-600',
};

function ChatAvatar({ name, role }: { name: string; role: string }) {
  const initial = name.charAt(0).toUpperCase();
  const gradient = ROLE_GRADIENT[role] || 'from-gray-500 to-gray-600';
  return (
    <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
      {initial}
    </div>
  );
}

/* ── Typing indicator dots ──────────────────────────────────── */
function TypingDots() {
  return (
    <span className="inline-flex items-center gap-0.5 ml-1">
      <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }} />
      <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }} />
      <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }} />
    </span>
  );
}

/* ── Time formatter ─────────────────────────────────────────── */
function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

/* ── Main Widget ────────────────────────────────────────────── */
export default function GlobalChatWidget() {
  const { user } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [onlineCount, setOnlineCount] = useState(0);
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isOpenRef = useRef(isOpen);

  // Keep ref in sync
  useEffect(() => { isOpenRef.current = isOpen; }, [isOpen]);

  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setUnreadCount(0);
    }
  }, [isOpen]);

  // Socket connection
  useEffect(() => {
    if (!user) return;

    const socketUrl = SOCKET_URL ? `${SOCKET_URL}/chat` : '/chat';
    const socket = io(socketUrl, { transports: ['websocket'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('user_join', {
        userId: user.id,
        userName: fullName(user),
        userRole: user.role,
      });
    });

    socket.on('message_history', (history: ChatMessage[]) => {
      setMessages(history);
    });

    socket.on('new_message', (msg: ChatMessage) => {
      setMessages((prev) => [...prev, msg]);
      if (!isOpenRef.current && msg.userId !== user.id) {
        setUnreadCount((c) => c + 1);
      }
    });

    socket.on('user_typing', (data: { userId: string; userName: string }) => {
      if (data.userId === user.id) return;
      setTypingUsers((prev) => {
        if (prev.includes(data.userName)) return prev;
        return [...prev, data.userName];
      });
      // Auto-clear typing after 2s
      setTimeout(() => {
        setTypingUsers((prev) => prev.filter((n) => n !== data.userName));
      }, 2000);
    });

    socket.on('online_users', (users: { userId: string }[]) => {
      setOnlineCount(users.length);
    });

    return () => { socket.disconnect(); };
  }, [user]);

  const handleSend = () => {
    if (!input.trim() || !user || !socketRef.current) return;
    socketRef.current.emit('send_message', {
      userId: user.id,
      userName: fullName(user),
      userRole: user.role,
      content: input.trim(),
    });
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    // Emit typing
    if (socketRef.current && user) {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      socketRef.current.emit('user_typing', {
        userId: user.id,
        userName: fullName(user),
      });
      typingTimeoutRef.current = setTimeout(() => {
        typingTimeoutRef.current = null;
      }, 1500);
    }
  };

  if (!user) return null;

  const myId = user.id;

  return (
    <>
      {/* ── Chat panel ─────────────────────────────────────────── */}
      {isOpen && (
        <div className="fixed bottom-20 right-5 z-[100] w-[380px] max-w-[calc(100vw-2rem)] h-[520px] max-h-[calc(100vh-8rem)]
          flex flex-col bg-white dark:bg-[#1a1a2a] rounded-2xl shadow-2xl border border-gray-200 dark:border-white/10
          animate-in slide-in-from-bottom-4 fade-in duration-200">
          
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-white/10 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
                <span className="material-symbols-outlined text-white text-[18px]">forum</span>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Chat chung</h3>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 flex items-center gap-1">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                  </span>
                  {onlineCount} đang online
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-600 gap-2">
                <span className="material-symbols-outlined text-[40px] opacity-30">chat_bubble</span>
                <p className="text-sm">Chưa có tin nhắn nào</p>
                <p className="text-xs text-gray-400 dark:text-gray-600">Bắt đầu cuộc trò chuyện!</p>
              </div>
            )}
            {messages.map((msg) => {
              const isMe = msg.userId === myId;
              const roleMeta = ROLE_COLORS[msg.userRole] || ROLE_COLORS.STUDENT;

              if (isMe) {
                return (
                  <div key={msg.id} className="flex justify-end gap-2">
                    <div className="max-w-[75%] flex flex-col items-end">
                      <div className="px-3 py-2 rounded-2xl rounded-br-md bg-violet-600 text-white text-sm leading-relaxed break-words">
                        {msg.content}
                      </div>
                      <span className="text-[10px] text-gray-400 dark:text-gray-600 mt-0.5 mr-1">
                        {formatTime(msg.timestamp)}
                      </span>
                    </div>
                  </div>
                );
              }

              return (
                <div key={msg.id} className="flex gap-2">
                  <ChatAvatar name={msg.userName} role={msg.userRole} />
                  <div className="max-w-[75%] flex flex-col">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        {msg.userName}
                      </span>
                      <span className={`text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded-full ${roleMeta.bg} ${roleMeta.text}`}>
                        {roleMeta.label}
                      </span>
                    </div>
                    <div className="px-3 py-2 rounded-2xl rounded-bl-md bg-gray-100 dark:bg-white/5 text-gray-800 dark:text-gray-200 text-sm leading-relaxed break-words">
                      {msg.content}
                    </div>
                    <span className="text-[10px] text-gray-400 dark:text-gray-600 mt-0.5 ml-1">
                      {formatTime(msg.timestamp)}
                    </span>
                  </div>
                </div>
              );
            })}

            {/* Typing indicator */}
            {typingUsers.length > 0 && (
              <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500 pl-10">
                <span>{typingUsers.join(', ')} đang gõ</span>
                <TypingDots />
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="px-3 py-2.5 border-t border-gray-100 dark:border-white/10 shrink-0">
            <div className="flex items-center gap-2 bg-gray-100 dark:bg-white/5 rounded-xl px-3 py-1.5">
              <input
                ref={inputRef}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Nhập tin nhắn…"
                className="flex-1 bg-transparent text-sm text-gray-800 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-600 outline-none"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim()}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white bg-violet-600 hover:bg-violet-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors shrink-0"
              >
                <span className="material-symbols-outlined text-[18px]">send</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Floating bubble ─────────────────────────────────────── */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-5 right-5 z-[100] w-14 h-14 rounded-full
          bg-gradient-to-br from-violet-600 to-indigo-600 text-white
          shadow-lg hover:shadow-xl hover:scale-105 active:scale-95
          transition-all duration-200 flex items-center justify-center
          ${isOpen ? 'ring-2 ring-violet-400 ring-offset-2 dark:ring-offset-gray-900' : ''}`}
        aria-label="Toggle chat"
      >
        <span className="material-symbols-outlined text-[24px]">
          {isOpen ? 'close' : 'chat'}
        </span>
        {/* Unread badge */}
        {!isOpen && unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 rounded-full bg-rose-500 text-white text-[11px] font-bold flex items-center justify-center shadow-md animate-bounce">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>
    </>
  );
}
