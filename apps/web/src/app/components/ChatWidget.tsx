import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { IChatMessage, UserRole } from '@cp/shared';

import { useAuthStore } from '../stores/auth.store';
import { useChatWidgetStore } from '../stores/chat-widget.store';
import {
  useChatConversations,
  useChatMessages,
  useMarkAsRead,
  useChatUnreadCount,
} from '../api/chat.queries';
import { useChatSocket } from '../hooks/useChatSocket';
import { chatApi } from '../api/chat.api';

/* ────────────────────────────────────────────────────────────────────── */
/*  Student Floating Chat Widget                                         */
/*                                                                       */
/*  Single-conversation chatbot-style widget:                            */
/*  - FAB click → opens chat view directly (no conversation list)        */
/*  - Auto-creates conversation if none exists (finds assigned teacher)  */
/*  - Student doesn't see teacher identity (shows generic "Hỗ trợ")     */
/* ────────────────────────────────────────────────────────────────────── */

export function ChatWidget() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);

  const [isOpen, setIsOpen] = useState(false);
  const [msgInput, setMsgInput] = useState('');
  const [page, setPage] = useState(1);
  const [allMessages, setAllMessages] = useState<IChatMessage[]>([]);
  const [isCreatingConv, setIsCreatingConv] = useState(false);
  const [warningPopup, setWarningPopup] = useState<IChatMessage | null>(null);

  const msgEndRef = useRef<HTMLDivElement>(null);

  // External triggers (e.g. from WorkspacePage "Ask about assignment")
  const pendingContext = useChatWidgetStore((s) => s.pendingContext);
  const shouldOpenFromStore = useChatWidgetStore((s) => s.shouldOpen);
  const clearContext = useChatWidgetStore((s) => s.clearContext);
  const ackOpen = useChatWidgetStore((s) => s.ackOpen);

  // Data
  const { data: conversations = [], refetch: refetchConvs } =
    useChatConversations();
  const { data: unreadCount = 0 } = useChatUnreadCount();
  const markRead = useMarkAsRead();
  const {
    sendMessage: wsSend,
    markRead: wsMarkRead,
    emitTyping,
    typingMap,
    totalUnread,
    setOnNewMessage,
  } = useChatSocket();

  // Auto-select the most recent conversation
  const activeConvId = conversations.length > 0 ? conversations[0].id : null;
  const activeConv = conversations.length > 0 ? conversations[0] : null;

  // React to external open requests (from WorkspacePage store)
  useEffect(() => {
    if (shouldOpenFromStore) {
      setIsOpen(true);
      setPage(1);
      ackOpen();
    }
  }, [shouldOpenFromStore, ackOpen]);

  const { data: msgPage } = useChatMessages(activeConvId, page);
  const displayUnread = totalUnread || unreadCount;

  // Auto-create conversation when widget opens and no conversation exists
  useEffect(() => {
    if (!isOpen || activeConv || isCreatingConv) return;

    let cancelled = false;
    setIsCreatingConv(true);

    chatApi
      .getOrCreateConversation()
      .then(() => {
        if (!cancelled) refetchConvs();
      })
      .catch(() => {
        // silently fail — will show empty state
      })
      .finally(() => {
        if (!cancelled) setIsCreatingConv(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, activeConv, isCreatingConv]);

  // Merge paginated messages
  useEffect(() => {
    if (msgPage?.items) {
      if (page === 1) {
        setAllMessages(msgPage.items);
      } else {
        setAllMessages((prev) => {
          const ids = new Set(prev.map((m) => m.id));
          const newMsgs = msgPage.items.filter((m) => !ids.has(m.id));
          return [...newMsgs, ...prev];
        });
      }
    }
  }, [msgPage, page]);

  // Auto-scroll when new messages arrive
  useEffect(() => {
    if (page === 1 && isOpen) {
      msgEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [allMessages, page, isOpen]);

  // Mark as read when widget opens
  useEffect(() => {
    if (isOpen && activeConvId && activeConv && activeConv.unreadCount > 0) {
      wsMarkRead(activeConvId);
      markRead.mutate(activeConvId);
    }
  }, [isOpen, activeConvId]);

  // Listen for real-time messages
  useEffect(() => {
    setOnNewMessage((msg: IChatMessage) => {
      // Auto-open widget if staff sends a message while closed
      if (msg.senderId !== user?.id && !isOpen) {
        setIsOpen(true);
        setPage(1);
      }

      // Show warning popup (only once per message)
      if (msg.type === 'warning' && msg.senderId !== user?.id) {
        const dismissedKey = 'chat_dismissed_warnings';
        const dismissed: string[] = JSON.parse(
          localStorage.getItem(dismissedKey) || '[]',
        );
        if (!dismissed.includes(msg.id)) {
          setWarningPopup(msg);
        }
      }

      if (msg.conversationId === activeConvId) {
        setAllMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          const cleaned = prev.filter(
            (m) => !(m.id.startsWith('temp_') && m.senderId === msg.senderId),
          );
          return [...cleaned, msg];
        });
        if (msg.senderId !== user?.id) {
          wsMarkRead(msg.conversationId);
          markRead.mutate(msg.conversationId);
        }
      }
      refetchConvs();
    });
    return () => setOnNewMessage(null);
  }, [activeConvId, user?.id, isOpen]);

  // Send message — optimistic UI, with optional context
  const handleSend = () => {
    if (!msgInput.trim() || !activeConvId) return;
    let content = msgInput.trim();

    // Prepend context tag if present
    if (pendingContext) {
      const tag = `[📎 ${pendingContext.type === 'assignment' ? t('chat.contextAssignment') : pendingContext.type}: ${pendingContext.title}]`;
      content = `${tag}\n${content}`;
      clearContext();
    }

    // Optimistic: show message immediately
    const optimisticMsg: IChatMessage = {
      id: `temp_${Date.now()}`,
      conversationId: activeConvId,
      senderId: user!.id,
      senderName: '',
      senderRole: UserRole.STUDENT,
      senderAvatarUrl: null,
      content,
      type: 'normal',
      imageUrl: null,
      readAt: null,
      createdAt: new Date().toISOString(),
    };
    setAllMessages((prev) => [...prev, optimisticMsg]);

    // Send via socket
    wsSend(activeConvId, content);
    setMsgInput('');
  };

  // Toggle widget
  const handleToggle = () => {
    setIsOpen((prev) => !prev);
    if (!isOpen) {
      setPage(1);
    }
  };

  const isTyping =
    activeConvId && typingMap[activeConvId]
      ? typingMap[activeConvId].userId !== user?.id
      : false;

  if (!user || user.role !== UserRole.STUDENT) return null;

  // Whether the chat panel is ready (has a conversation loaded)
  const isChatReady = !!activeConv;
  const isLoading = isCreatingConv || (!activeConv && conversations.length === 0);

  return (
    <>
      {/* ── FAB Button ──────────────────────────────────────────── */}
      <button
        onClick={handleToggle}
        className="fixed bottom-6 right-6 z-[60] w-14 h-14 rounded-full bg-gradient-to-br from-teal-500 to-cyan-600 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all grid place-items-center"
        aria-label={isOpen ? t('common.cancel') : t('chat.title')}
      >
        <span className="material-symbols-outlined text-[24px]">
          {isOpen ? 'close' : 'chat'}
        </span>
        {!isOpen && displayUnread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 grid place-items-center rounded-full bg-error text-white text-[11px] font-bold">
            {displayUnread > 99 ? '99+' : displayUnread}
          </span>
        )}
      </button>

      {/* ── Chat Popup ──────────────────────────────────────────── */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-[60] w-[360px] max-w-[calc(100vw-48px)] h-[520px] max-h-[calc(100vh-120px)] rounded-2xl bg-surface-container border border-outline-variant shadow-elev-3 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
          {/* ── Header ─────────────────────────────────────────── */}
          <div className="flex items-center gap-xs px-md py-sm border-b border-outline-variant">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-500 to-cyan-600 text-white grid place-items-center shrink-0">
              <span className="material-symbols-outlined text-[20px]">
                support_agent
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-body-md font-semibold">
                {t('chat.supportTitle')}
              </h3>
              <p className="text-[11px] text-on-surface-variant">
                {t('chat.supportSubtitle')}
              </p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="w-8 h-8 grid place-items-center rounded-full hover:bg-surface-container-high shrink-0"
            >
              <span className="material-symbols-outlined text-[20px]">
                close
              </span>
            </button>
          </div>

          {isLoading ? (
            /* ── Loading state ────────────────────────────────── */
            <div className="flex-1 flex flex-col items-center justify-center">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-body-sm text-on-surface-variant mt-sm">
                {t('common.loading')}
              </p>
            </div>
          ) : isChatReady ? (
            <>
              {/* ── Messages ──────────────────────────────────── */}
              <div className="flex-1 overflow-y-auto px-sm py-xs space-y-xs">
                {msgPage?.hasMore && (
                  <div className="text-center py-1">
                    <button
                      onClick={() => setPage((p) => p + 1)}
                      className="text-primary text-[12px] hover:underline"
                    >
                      {t('chat.loadMore')}
                    </button>
                  </div>
                )}

                {/* Welcome message when no messages exist yet */}
                {allMessages.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-xl text-center">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-500/10 to-cyan-600/10 grid place-items-center mb-sm">
                      <span className="material-symbols-outlined text-[24px] text-teal-500">
                        waving_hand
                      </span>
                    </div>
                    <p className="text-body-sm text-on-surface-variant">
                      {t('chat.welcomeMessage')}
                    </p>
                  </div>
                )}

                {allMessages.map((msg, i) => {
                  const isMine = msg.senderId === user?.id;
                  const showDate =
                    i === 0 ||
                    new Date(msg.createdAt).toDateString() !==
                      new Date(allMessages[i - 1].createdAt).toDateString();

                  return (
                    <div key={msg.id}>
                      {showDate && (
                        <div className="text-center py-1">
                          <span className="text-[10px] text-on-surface-variant bg-surface-container-high px-2 py-0.5 rounded-full">
                            {formatDateLabel(msg.createdAt, t)}
                          </span>
                        </div>
                      )}
                      <div
                        className={`flex items-end gap-1 ${
                          isMine ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        {/* Teacher/Admin avatar — generic icon */}
                        {!isMine && (
                          <div className={`w-6 h-6 rounded-full grid place-items-center shrink-0 ${
                            msg.type === 'warning'
                              ? 'bg-error/20 text-error'
                              : 'bg-gradient-to-br from-teal-500/20 to-cyan-600/20 text-teal-500'
                          }`}>
                            <span className="material-symbols-outlined text-[14px]">
                              {msg.type === 'warning' ? 'warning' : 'support_agent'}
                            </span>
                          </div>
                        )}
                        <div
                          className={`max-w-[75%] px-sm py-1.5 rounded-2xl text-[13px] leading-snug break-words ${
                            msg.type === 'warning'
                              ? 'bg-error text-on-error rounded-bl-md ring-1 ring-error/30'
                              : isMine
                                ? 'bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-br-md'
                                : 'bg-surface-container-highest text-on-surface rounded-bl-md'
                          }`}
                        >
                          {/* Warning badge */}
                          {msg.type === 'warning' && (
                            <div className="flex items-center gap-1 text-[10px] font-bold mb-0.5 opacity-90">
                              <span className="material-symbols-outlined text-[11px]">warning</span>
                              {t('chat.warningBadge')}
                            </div>
                          )}
                          {/* Attached image */}
                          {msg.imageUrl && (
                            <img
                              src={msg.imageUrl}
                              alt="Attachment"
                              className="max-w-full max-h-32 rounded-lg mb-1 cursor-pointer hover:opacity-90 transition-opacity"
                              onClick={() => window.open(msg.imageUrl!, '_blank')}
                            />
                          )}
                          {msg.content}
                          <div
                            className={`flex items-center gap-0.5 mt-0.5 ${
                              isMine ? 'justify-end' : 'justify-start'
                            }`}
                          >
                            <span
                              className={`text-[9px] ${
                                msg.type === 'warning'
                                  ? 'text-on-error/70'
                                  : isMine
                                    ? 'text-white/70'
                                    : 'text-on-surface-variant'
                              }`}
                            >
                              {new Date(msg.createdAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                            {isMine && (
                              <span
                                className={`text-[9px] ${
                                  msg.readAt ? 'text-white' : 'text-white/50'
                                }`}
                              >
                                
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {isTyping && (
                  <div className="flex items-center gap-1 text-on-surface-variant text-[12px]">
                    <span className="animate-pulse">●●●</span>
                    <span>{t('chat.typing')}</span>
                  </div>
                )}
                <div ref={msgEndRef} />
              </div>

              {/* ── Input — always visible ─────────────────────── */}
              <div className="px-sm py-xs border-t border-outline-variant">
                {/* Context chip (shown when asking about an assignment) */}
                {pendingContext && (
                  <div className="flex items-center gap-1.5 mb-1 px-1">
                    <div className="flex-1 flex items-center gap-1.5 text-[11px] bg-primary-container/30 text-primary rounded-lg px-2.5 py-1.5">
                      <span className="material-symbols-outlined text-[14px]">attach_file</span>
                      <span className="font-medium truncate">
                        {pendingContext.type === 'assignment' ? t('chat.contextAssignment') : pendingContext.type}: {pendingContext.title}
                      </span>
                      {pendingContext.meta && (
                        <span className="text-on-surface-variant">· {pendingContext.meta}</span>
                      )}
                    </div>
                    <button
                      onClick={() => clearContext()}
                      className="w-5 h-5 grid place-items-center rounded-full hover:bg-surface-container-high shrink-0"
                    >
                      <span className="material-symbols-outlined text-[14px] text-on-surface-variant">close</span>
                    </button>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={msgInput}
                    onChange={(e) => {
                      setMsgInput(e.target.value);
                      if (activeConvId) emitTyping(activeConvId);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    placeholder={pendingContext ? t('chat.typeQuestionAbout') : t('chat.typeMessage')}
                    className="flex-1 px-sm py-2 rounded-full bg-surface-container-high text-body-sm outline-none focus:ring-2 focus:ring-primary border-none"
                  />
                  <button
                    onClick={handleSend}
                    disabled={!msgInput.trim()}
                    className="w-9 h-9 grid place-items-center rounded-full bg-gradient-to-r from-teal-500 to-cyan-600 text-white disabled:opacity-40 hover:opacity-90 transition-opacity shrink-0"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      send
                    </span>
                  </button>
                </div>
              </div>
            </>
          ) : (
            /* ── Error state (no teacher/admin available) ─────── */
            <div className="flex-1 flex flex-col items-center justify-center px-lg text-center">
              <div className="w-16 h-16 rounded-full bg-surface-container-highest grid place-items-center mb-md">
                <span className="material-symbols-outlined text-[32px] text-on-surface-variant">
                  chat_error
                </span>
              </div>
              <p className="text-body-sm text-on-surface-variant">
                {t('chat.unavailable')}
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── Warning Popup Modal ─────────────────────────────────── */}
      {warningPopup && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-md">
          <div className="bg-surface rounded-2xl shadow-elev-5 max-w-md w-full p-lg animate-in zoom-in-95 duration-200">
            {/* Warning icon */}
            <div className="flex justify-center mb-md">
              <div className="w-16 h-16 rounded-full bg-error/10 grid place-items-center">
                <span className="material-symbols-outlined text-[40px] text-error">
                  warning
                </span>
              </div>
            </div>

            {/* Title */}
            <h2 className="text-title-lg font-bold text-center text-error mb-sm">
              {t('chat.warningTitle')}
            </h2>

            {/* Message content */}
            <div className="text-body-md text-on-surface text-center mb-md whitespace-pre-wrap leading-relaxed">
              {warningPopup.content}
            </div>

            {/* Attached image */}
            {warningPopup.imageUrl && (
              <div className="flex justify-center mb-lg">
                <img
                  src={warningPopup.imageUrl}
                  alt="Warning attachment"
                  className="max-w-full max-h-56 rounded-xl border border-error/20 object-contain cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => window.open(warningPopup.imageUrl!, '_blank')}
                />
              </div>
            )}

            {/* Dismiss */}
            <button
              onClick={() => {
                // Save to localStorage so it doesn't show again
                const dismissedKey = 'chat_dismissed_warnings';
                const dismissed: string[] = JSON.parse(
                  localStorage.getItem(dismissedKey) || '[]',
                );
                if (!dismissed.includes(warningPopup.id)) {
                  dismissed.push(warningPopup.id);
                  localStorage.setItem(dismissedKey, JSON.stringify(dismissed));
                }
                setWarningPopup(null);
              }}
              className="w-full py-3 rounded-xl bg-error text-on-error font-semibold text-body-md hover:bg-error/90 transition-colors"
            >
              {t('chat.warningDismiss')}
            </button>
          </div>
        </div>
      )}
    </>
  );
}

/* ── Helpers ──────────────────────────────────────────────────────────── */

function formatDateLabel(
  iso: string,
  t: (key: string) => string,
): string {
  const d = new Date(iso);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const msgDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.round(
    (today.getTime() - msgDay.getTime()) / 86400000,
  );
  if (diffDays === 0) return t('chat.today');
  if (diffDays === 1) return t('chat.yesterday');
  return d.toLocaleDateString([], {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}
