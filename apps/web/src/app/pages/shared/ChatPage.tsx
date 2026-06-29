import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { IChatMessage, UserRole } from '@cp/shared';

import { useAuthStore } from '../../stores/auth.store';
import {
  useChatConversations,
  useChatMessages,
  useMarkAsRead,
} from '../../api/chat.queries';
import { useChatSocket } from '../../hooks/useChatSocket';

/* ────────────────────────────────────────────────────────────────────── */
/*  Teacher / Admin — Full-page Chat                                     */
/*                                                                       */
/*  Left panel: all student threads (all staff see all conversations)    */
/*  Right panel: messages in the selected thread                         */
/* ────────────────────────────────────────────────────────────────────── */

export default function ChatPage() {
  const { t } = useTranslation();
  const { conversationId: paramConvId } = useParams<{
    conversationId?: string;
  }>();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const portalBase = user?.role === UserRole.ADMIN ? '/admin' : '/teacher';

  const [activeConvId, setActiveConvId] = useState<string | null>(
    paramConvId ?? null,
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [msgInput, setMsgInput] = useState('');
  const [page, setPage] = useState(1);
  const [allMessages, setAllMessages] = useState<IChatMessage[]>([]);
  const [isWarningMode, setIsWarningMode] = useState(false);

  const msgEndRef = useRef<HTMLDivElement>(null);

  // Data
  const { data: conversations = [], refetch: refetchConvs } =
    useChatConversations();
  const { data: msgPage } = useChatMessages(activeConvId, page);
  const markRead = useMarkAsRead();
  const {
    sendMessage: wsSend,
    markRead: wsMarkRead,
    emitTyping,
    typingMap,
    setOnNewMessage,
  } = useChatSocket();

  const activeConv = conversations.find((c) => c.id === activeConvId) ?? null;

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

  // Auto-scroll
  useEffect(() => {
    if (page === 1) {
      msgEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [allMessages, page]);

  // Mark as read when opening a conversation
  useEffect(() => {
    if (activeConvId && activeConv && activeConv.unreadCount > 0) {
      wsMarkRead(activeConvId);
      markRead.mutate(activeConvId);
    }
  }, [activeConvId]);

  // Listen for real-time messages
  useEffect(() => {
    setOnNewMessage((msg: IChatMessage) => {
      if (msg.conversationId === activeConvId) {
        setAllMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          // Replace optimistic messages from same sender
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
  }, [activeConvId, user?.id]);

  // Select conversation
  const selectConversation = useCallback(
    (convId: string) => {
      setActiveConvId(convId);
      setPage(1);
      setAllMessages([]);
      navigate(`${portalBase}/chat/${convId}`, { replace: true });
    },
    [navigate, portalBase],
  );

  // Send message — optimistic UI
  const handleSend = () => {
    if (!msgInput.trim() || !activeConvId || !user) return;
    const content = msgInput.trim();

    // Optimistic: show message immediately
    const optimisticMsg: IChatMessage = {
      id: `temp_${Date.now()}`,
      conversationId: activeConvId,
      senderId: user.id,
      senderName: user.firstName + ' ' + user.lastName,
      senderRole: user.role as UserRole,
      senderAvatarUrl: null,
      content,
      type: isWarningMode ? 'warning' : 'normal',
      readAt: null,
      createdAt: new Date().toISOString(),
    };
    setAllMessages((prev) => [...prev, optimisticMsg]);

    wsSend(activeConvId, content, isWarningMode ? 'warning' : undefined);
    setMsgInput('');
    setIsWarningMode(false);
  };

  // Load older messages
  const handleLoadMore = () => {
    if (msgPage?.hasMore) {
      setPage((p) => p + 1);
    }
  };

  // Filter conversations by student name
  const filteredConvs = conversations.filter((c) => {
    if (!searchTerm.trim()) return true;
    return c.studentName.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Format time
  const formatTime = (iso: string | null) => {
    if (!iso) return '';
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffDays === 0)
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (diffDays === 1) return t('chat.yesterday');
    if (diffDays < 7) return d.toLocaleDateString([], { weekday: 'short' });
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const isTyping =
    activeConvId && typingMap[activeConvId]
      ? typingMap[activeConvId].userId !== user?.id
      : false;

  return (
    <div className="flex h-[calc(100vh-64px)] -mx-md md:-mx-lg lg:-mx-xl -my-lg overflow-hidden">
      {/* ── Left panel: Student threads ────────────────────────────── */}
      <div
        className={`${
          activeConvId ? 'hidden md:flex' : 'flex'
        } flex-col w-full md:w-[320px] lg:w-[360px] border-r border-outline-variant bg-surface-container-lowest shrink-0`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-md py-sm border-b border-outline-variant">
          <h2 className="text-title-lg font-bold">{t('chat.title')}</h2>
        </div>

        {/* Search */}
        <div className="px-sm py-xs">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">
              search
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t('common.search')}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-surface-container-high text-body-sm outline-none focus:ring-2 focus:ring-primary border-none"
            />
          </div>
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto">
          {filteredConvs.length === 0 ? (
            <div className="text-center text-on-surface-variant text-body-sm py-xl">
              {t('chat.noConversations')}
            </div>
          ) : (
            filteredConvs.map((c) => {
              const isActive = c.id === activeConvId;
              return (
                <button
                  key={c.id}
                  onClick={() => selectConversation(c.id)}
                  className={`w-full flex items-center gap-sm px-md py-sm text-left transition-colors hover:bg-surface-container-high ${
                    isActive ? 'bg-primary-container/30' : ''
                  }`}
                >
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-primary/20 text-primary grid place-items-center shrink-0 text-label-lg font-bold overflow-hidden">
                    {c.studentAvatarUrl ? (
                      <img
                        src={c.studentAvatarUrl}
                        alt={c.studentName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      c.studentName
                        .split(' ')
                        .map((w) => w[0])
                        .join('')
                        .slice(0, 2)
                        .toUpperCase()
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-body-md font-semibold truncate">
                        {c.studentName}
                      </span>
                      <span className="text-label-sm text-on-surface-variant shrink-0 ml-xs">
                        {formatTime(c.lastMessageAt)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      <span className="text-body-sm text-on-surface-variant truncate">
                        {c.lastMessage || t('chat.noMessages')}
                      </span>
                      {c.unreadCount > 0 && (
                        <span className="ml-xs shrink-0 min-w-[20px] h-5 px-1.5 grid place-items-center rounded-full bg-primary text-on-primary text-[11px] font-bold">
                          {c.unreadCount > 99 ? '99+' : c.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ── Right panel: Messages ──────────────────────────────────── */}
      <div
        className={`${
          activeConvId ? 'flex' : 'hidden md:flex'
        } flex-col flex-1 bg-surface`}
      >
        {activeConv ? (
          <>
            {/* Header */}
            <div className="flex items-center gap-sm px-md py-sm border-b border-outline-variant">
              {/* Back button (mobile) */}
              <button
                onClick={() => {
                  setActiveConvId(null);
                  navigate(`${portalBase}/chat`, { replace: true });
                }}
                className="md:hidden w-9 h-9 grid place-items-center rounded-full hover:bg-surface-container-high"
              >
                <span className="material-symbols-outlined">arrow_back</span>
              </button>
              {/* Avatar */}
              <div className="w-9 h-9 rounded-full bg-primary/20 text-primary grid place-items-center text-label-md font-bold overflow-hidden">
                {activeConv.studentAvatarUrl ? (
                  <img
                    src={activeConv.studentAvatarUrl}
                    alt={activeConv.studentName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  activeConv.studentName
                    .split(' ')
                    .map((w) => w[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase()
                )}
              </div>
              <div>
                <h3 className="text-body-lg font-semibold">
                  {activeConv.studentName}
                </h3>
              </div>
            </div>

            {/* Messages area */}
            <div className="flex-1 overflow-y-auto px-md py-sm space-y-xs">
              {/* Load more */}
              {msgPage?.hasMore && (
                <div className="text-center py-xs">
                  <button
                    onClick={handleLoadMore}
                    className="text-primary text-body-sm hover:underline"
                  >
                    {t('chat.loadMore')}
                  </button>
                </div>
              )}

              {allMessages.map((msg, i) => {
                const isMine = msg.senderId === user?.id;
                const isStudent = msg.senderRole === UserRole.STUDENT;
                const showDate =
                  i === 0 ||
                  new Date(msg.createdAt).toDateString() !==
                    new Date(allMessages[i - 1].createdAt).toDateString();

                return (
                  <div key={msg.id}>
                    {showDate && (
                      <div className="text-center py-sm">
                        <span className="text-label-sm text-on-surface-variant bg-surface-container-high px-sm py-1 rounded-full">
                          {formatDateLabel(msg.createdAt, t)}
                        </span>
                      </div>
                    )}
                    <div
                      className={`flex items-end gap-xs ${
                        isStudent ? 'justify-start' : 'justify-end'
                      }`}
                    >
                      {/* Student avatar (left side) */}
                      {isStudent && (
                        <div className="w-7 h-7 rounded-full bg-surface-container-highest text-on-surface-variant grid place-items-center text-[11px] font-bold shrink-0 overflow-hidden">
                          {msg.senderAvatarUrl ? (
                            <img
                              src={msg.senderAvatarUrl}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            msg.senderName
                              .split(' ')
                              .map((w) => w[0])
                              .join('')
                              .slice(0, 2)
                              .toUpperCase()
                          )}
                        </div>
                      )}
                      <div
                        className={`max-w-[70%] px-sm py-xs rounded-2xl text-body-sm break-words ${
                          msg.type === 'warning'
                            ? 'bg-error text-on-error rounded-br-md ring-2 ring-error/30'
                            : isStudent
                              ? 'bg-surface-container-highest text-on-surface rounded-bl-md'
                              : 'bg-primary text-on-primary rounded-br-md'
                        }`}
                      >
                        {/* Warning badge */}
                        {msg.type === 'warning' && (
                          <div className="flex items-center gap-1 text-[10px] font-bold mb-1 opacity-90">
                            <span className="material-symbols-outlined text-[12px]">warning</span>
                            {t('chat.warningBadge')}
                          </div>
                        )}
                        {/* Show staff sender name if not the current user */}
                        {!isStudent && !isMine && (
                          <p className="text-[10px] font-semibold opacity-80 mb-0.5">
                            {msg.senderName}
                          </p>
                        )}
                        {msg.content}
                        <div
                          className={`flex items-center gap-1 mt-0.5 ${
                            isStudent ? 'justify-start' : 'justify-end'
                          }`}
                        >
                          <span
                            className={`text-[10px] ${
                              isStudent
                                ? 'text-on-surface-variant'
                                : 'text-on-primary/70'
                            }`}
                          >
                            {!isStudent && !isMine && (
                              <span className="mr-1">{msg.senderName} ·</span>
                            )}
                            {new Date(msg.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          {!isStudent && (
                            <span
                              className={`text-[10px] ${
                                msg.readAt
                                  ? 'text-on-primary'
                                  : 'text-on-primary/50'
                              }`}
                            >
                              ✓
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Typing indicator */}
              {isTyping && (
                <div className="flex items-center gap-xs text-on-surface-variant text-body-sm">
                  <span className="animate-pulse">●●●</span>
                  <span>{t('chat.typing')}</span>
                </div>
              )}
              <div ref={msgEndRef} />
            </div>

            {/* Input */}
            <div className="px-md py-sm border-t border-outline-variant">
              {/* Warning mode indicator */}
              {isWarningMode && (
                <div className="flex items-center gap-2 mb-xs px-sm py-1.5 bg-error/10 text-error rounded-lg text-label-sm">
                  <span className="material-symbols-outlined text-[16px]">warning</span>
                  <span className="font-medium">{t('chat.warningModeOn')}</span>
                  <button
                    onClick={() => setIsWarningMode(false)}
                    className="ml-auto text-[12px] underline hover:no-underline"
                  >
                    {t('common.cancel')}
                  </button>
                </div>
              )}
              <div className="flex items-center gap-xs">
                {/* Warning toggle */}
                <button
                  onClick={() => setIsWarningMode((prev) => !prev)}
                  title={t('chat.sendWarning')}
                  className={`w-10 h-10 grid place-items-center rounded-full transition-colors shrink-0 ${
                    isWarningMode
                      ? 'bg-error text-on-error'
                      : 'text-on-surface-variant hover:bg-surface-container-high'
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px]">warning</span>
                </button>
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
                  placeholder={isWarningMode ? t('chat.typeWarning') : t('chat.typeMessage')}
                  className={`flex-1 px-md py-2.5 rounded-full text-body-sm outline-none border-none ${
                    isWarningMode
                      ? 'bg-error/5 ring-2 ring-error/30 focus:ring-error'
                      : 'bg-surface-container-high focus:ring-2 focus:ring-primary'
                  }`}
                />
                <button
                  onClick={handleSend}
                  disabled={!msgInput.trim()}
                  className={`w-10 h-10 grid place-items-center rounded-full disabled:opacity-40 transition-colors shrink-0 ${
                    isWarningMode
                      ? 'bg-error text-on-error hover:bg-error/90'
                      : 'bg-primary text-on-primary hover:bg-primary/90'
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px]">
                    send
                  </span>
                </button>
              </div>
            </div>
          </>
        ) : (
          /* Empty state */
          <div className="flex-1 grid place-items-center text-on-surface-variant">
            <div className="text-center">
              <span className="material-symbols-outlined text-5xl mb-sm block opacity-40">
                chat
              </span>
              <p className="text-body-lg">{t('chat.selectConversation')}</p>
            </div>
          </div>
        )}
      </div>
    </div>
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
