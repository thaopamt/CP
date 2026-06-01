import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  fullName,
  GlobalChatDeletedPayload,
  GlobalChatFailedPayload,
  GlobalChatMessage,
  GlobalChatMessageStatus,
  GlobalChatSentPayload,
  UserRole,
} from '@cp/shared';
import { Avatar, Button, Icon, useToast } from '@cp/ui';

import { globalChatApi } from '../../api/globalChat.api';
import {
  createGlobalChatClientMessageId,
  useGlobalChatSocket,
} from '../../hooks/useGlobalChatSocket';
import { useAuthStore } from '../../stores/auth.store';
import { useGlobalChatStore, OnlineUser } from '../../stores/globalChat.store';

const MAX_MESSAGE_LENGTH = 2000;
const EMOJI_OPTIONS = ['👍', '👏', '❤️', '😊', '🔥', '✅', '💡', '🚀'];

type SendState = 'pending' | 'sent' | 'failed';

interface UiMessage extends GlobalChatMessage {
  clientMessageId?: string;
  sendState?: SendState;
  error?: string;
}

export default function GlobalChatPage() {
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const user = useAuthStore((s) => s.user);
  const setChatOpen = useGlobalChatStore((s) => s.setChatOpen);
  const setUnreadCount = useGlobalChatStore((s) => s.setUnreadCount);
  const isConnected = useGlobalChatStore((s) => s.isConnected);
  const onlineUsers = useGlobalChatStore((s) => s.onlineUsers);
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [showOnlinePanel, setShowOnlinePanel] = useState(true);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [typingUsers, setTypingUsers] = useState<Record<string, string>>({});
  const listRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const lastMarkedReadRef = useRef<string | null>(null);
  const typingTimeoutRef = useRef<number | null>(null);
  const typingUserTimeouts = useRef<Record<string, number>>({});

  const upsertMessage = useCallback((message: GlobalChatMessage, sendState: SendState = 'sent') => {
    setMessages((prev) => {
      if (prev.some((item) => item.id === message.id)) {
        return prev.map((item) =>
          item.id === message.id ? { ...message, sendState: item.sendState ?? sendState } : item,
        );
      }
      return [...prev, { ...message, sendState }];
    });
  }, []);

  const handleSocketMessage = useCallback(
    (message: GlobalChatMessage) => {
      upsertMessage(message);
    },
    [upsertMessage],
  );

  const handleSocketSent = useCallback((payload: GlobalChatSentPayload) => {
    setMessages((prev) => {
      const withoutPending = prev.filter(
        (item) =>
          item.clientMessageId !== payload.clientMessageId && item.id !== payload.message.id,
      );
      return [...withoutPending, { ...payload.message, sendState: 'sent' as SendState }];
    });
  }, []);

  const handleSocketFailed = useCallback((payload: GlobalChatFailedPayload) => {
    setMessages((prev) =>
      prev.map((item) =>
        item.clientMessageId === payload.clientMessageId
          ? { ...item, sendState: 'failed', error: payload.message }
          : item,
      ),
    );
    toast.error(payload.message);
  }, [toast]);

  const handleSocketDeleted = useCallback((payload: GlobalChatDeletedPayload) => {
    setMessages((prev) =>
      prev.map((item) =>
        item.id === payload.id
          ? {
              ...item,
              content: '',
              status: GlobalChatMessageStatus.HIDDEN,
              hiddenAt: payload.hiddenAt,
              sendState: 'sent',
            }
          : item,
      ),
    );
  }, []);

  const handleTyping = useCallback((payload: { userId: string; name: string; isTyping: boolean }) => {
    if (!payload.userId || payload.userId === user?.id) return;

    if (!payload.isTyping) {
      setTypingUsers((prev) => {
        const next = { ...prev };
        delete next[payload.userId];
        return next;
      });
      return;
    }

    setTypingUsers((prev) => ({ ...prev, [payload.userId]: payload.name }));
    window.clearTimeout(typingUserTimeouts.current[payload.userId]);
    typingUserTimeouts.current[payload.userId] = window.setTimeout(() => {
      setTypingUsers((prev) => {
        const next = { ...prev };
        delete next[payload.userId];
        return next;
      });
    }, 2500);
  }, [user?.id]);

  const socket = useGlobalChatSocket({
    onMessage: handleSocketMessage,
    onSent: handleSocketSent,
    onFailed: handleSocketFailed,
    onDeleted: handleSocketDeleted,
    onTyping: handleTyping,
  });

  const loadInitialMessages = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await globalChatApi.listMessages({ limit: 30 });
      setMessages(data.items.slice().reverse().map((message) => ({ ...message, sendState: 'sent' })));
      setNextCursor(data.nextCursor);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('globalChat.errors.loadFailed'));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    setChatOpen(true);
    socket.sendChatFocus(true);
    void loadInitialMessages();
    return () => {
      setChatOpen(false);
      socket.sendChatFocus(false);
    };
  }, [loadInitialMessages, setChatOpen, socket]);

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    list.scrollTop = list.scrollHeight;
  }, [messages.length]);

  const latestPersistedMessageId = useMemo(() => {
    const persisted = messages.filter((message) => !message.clientMessageId);
    return persisted[persisted.length - 1]?.id ?? null;
  }, [messages]);

  useEffect(() => {
    if (!latestPersistedMessageId || latestPersistedMessageId === lastMarkedReadRef.current) return;
    lastMarkedReadRef.current = latestPersistedMessageId;

    globalChatApi
      .markRead(latestPersistedMessageId)
      .then((result) => setUnreadCount(result.unreadCount))
      .catch(() => undefined);
    socket.markRead(latestPersistedMessageId);
  }, [latestPersistedMessageId, setUnreadCount, socket]);

  const loadOlderMessages = async () => {
    if (!nextCursor || isLoadingOlder) return;
    setIsLoadingOlder(true);
    try {
      const data = await globalChatApi.listMessages({ limit: 30, before: nextCursor });
      setMessages((prev) => [
        ...data.items.slice().reverse().map((message) => ({ ...message, sendState: 'sent' as SendState })),
        ...prev,
      ]);
      setNextCursor(data.nextCursor);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('globalChat.errors.loadFailed'));
    } finally {
      setIsLoadingOlder(false);
    }
  };

  const sendOptimisticMessage = useCallback(
    async (content: string, clientMessageId = createGlobalChatClientMessageId()) => {
      if (!user) return;
      const optimistic: UiMessage = {
        id: clientMessageId,
        clientMessageId,
        content,
        status: GlobalChatMessageStatus.VISIBLE,
        createdAt: new Date().toISOString(),
        sender: {
          id: user.id,
          name: fullName(user),
          avatarUrl: user.avatarUrl,
          role: user.role,
        },
        sendState: 'pending',
      };

      setMessages((prev) => [
        ...prev.filter((message) => message.clientMessageId !== clientMessageId),
        optimistic,
      ]);

      const sentBySocket = socket.sendMessage({ clientMessageId, content });
      if (sentBySocket) return;

      try {
        const message = await globalChatApi.sendMessage(content, clientMessageId);
        handleSocketSent({ clientMessageId, message });
      } catch (err) {
        handleSocketFailed({
          clientMessageId,
          message: err instanceof Error ? err.message : t('globalChat.errors.sendFailed'),
          code: 'SEND_FAILED',
        });
      }
    },
    [handleSocketFailed, handleSocketSent, socket, t, user],
  );

  const submitCurrentMessage = async () => {
    const content = input.trim();
    if (!content || content.length > MAX_MESSAGE_LENGTH) return;

    setInput('');
    socket.sendTyping(false);
    await sendOptimisticMessage(content);
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    void submitCurrentMessage();
  };

  const handleRetry = (message: UiMessage) => {
    if (!message.clientMessageId) return;
    void sendOptimisticMessage(message.content, message.clientMessageId);
  };

  const handleHideMessage = async (messageId: string) => {
    try {
      await globalChatApi.hideMessage(messageId, t('globalChat.moderation.defaultReason'));
      toast.success(t('globalChat.moderation.hiddenToast'));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('globalChat.errors.hideFailed'));
    }
  };

  const handleInputChange = (value: string) => {
    setInput(value);
    socket.sendTyping(true);
    if (typingTimeoutRef.current) window.clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = window.setTimeout(() => socket.sendTyping(false), 1200);
  };

  const insertIntoInput = (value: string, cursorOffset = value.length) => {
    const inputEl = inputRef.current;
    const start = inputEl?.selectionStart ?? input.length;
    const end = inputEl?.selectionEnd ?? input.length;
    const next = `${input.slice(0, start)}${value}${input.slice(end)}`;
    handleInputChange(next);

    window.requestAnimationFrame(() => {
      inputEl?.focus();
      const cursor = start + cursorOffset;
      inputEl?.setSelectionRange(cursor, cursor);
    });
  };

  const wrapSelection = (before: string, after: string, placeholder: string) => {
    const inputEl = inputRef.current;
    const start = inputEl?.selectionStart ?? input.length;
    const end = inputEl?.selectionEnd ?? input.length;
    const selected = input.slice(start, end);
    const inner = selected || placeholder;
    const wrapped = `${before}${inner}${after}`;
    const next = `${input.slice(0, start)}${wrapped}${input.slice(end)}`;
    handleInputChange(next);

    window.requestAnimationFrame(() => {
      inputEl?.focus();
      if (selected) {
        const cursor = start + wrapped.length;
        inputEl?.setSelectionRange(cursor, cursor);
        return;
      }
      const selectionStart = start + before.length;
      inputEl?.setSelectionRange(selectionStart, selectionStart + placeholder.length);
    });
  };

  const typingText = useMemo(() => {
    const names = Object.values(typingUsers);
    if (names.length === 0) return '';
    if (names.length === 1) return t('globalChat.typing.one', { name: names[0] });
    return t('globalChat.typing.many', { count: names.length });
  }, [t, typingUsers]);

  const isTooLong = input.length > MAX_MESSAGE_LENGTH;
  const canSend = input.trim().length > 0 && !isTooLong;

  return (
    <div className="mx-auto flex h-[calc(100vh-8rem)] min-h-[620px] max-w-6xl gap-0 overflow-hidden">
    <section className="flex flex-1 min-w-0 flex-col overflow-hidden rounded-l-lg border border-outline-variant bg-surface shadow-elev-1">
      <header className="flex items-center justify-between gap-md border-b border-outline-variant px-md py-sm md:px-lg">
        <div className="min-w-0">
          <h1 className="font-manrope text-headline-md font-extrabold text-on-surface">
            {t('globalChat.title')}
          </h1>
          <p className="text-label-sm text-on-surface-variant">
            {isConnected ? t('globalChat.status.connected') : t('globalChat.status.connecting')}
          </p>
        </div>
        <div className="flex items-center gap-sm">
          <button
            type="button"
            onClick={() => setShowOnlinePanel((prev) => !prev)}
            className={[
              'relative flex items-center gap-xs rounded-full px-sm py-xs text-label-sm font-semibold transition-colors',
              showOnlinePanel
                ? 'bg-primary-container text-on-primary-container'
                : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest',
            ].join(' ')}
            title="Danh sách online"
          >
            <Icon name="group" size={18} />
            <span>{onlineUsers.length}</span>
          </button>
          <div className="grid h-10 w-10 place-items-center rounded-full bg-primary-container text-on-primary-container">
            <Icon name="forum" size={22} />
          </div>
        </div>
      </header>

      <div ref={listRef} className="flex-1 overflow-y-auto bg-background px-sm py-md md:px-lg">
        {isLoading ? (
          <div className="grid h-full place-items-center text-on-surface-variant">
            <Icon name="progress_activity" className="animate-spin" size={32} />
          </div>
        ) : error ? (
          <div className="grid h-full place-items-center text-center">
            <div>
              <Icon name="error" className="mx-auto text-error" size={32} />
              <p className="mt-sm text-body-md text-on-surface">{error}</p>
              <Button className="mt-md" variant="outline" onClick={loadInitialMessages}>
                {t('globalChat.actions.retry')}
              </Button>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="grid h-full place-items-center text-center text-on-surface-variant">
            <div>
              <Icon name="forum" className="mx-auto" size={36} />
              <p className="mt-sm text-body-md">{t('globalChat.empty')}</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-sm">
            {nextCursor && (
              <div className="flex justify-center pb-sm">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={loadOlderMessages}
                  disabled={isLoadingOlder}
                  leadingIcon={
                    <Icon
                      name={isLoadingOlder ? 'progress_activity' : 'expand_less'}
                      className={isLoadingOlder ? 'animate-spin' : undefined}
                      size={18}
                    />
                  }
                >
                  {t('globalChat.actions.loadOlder')}
                </Button>
              </div>
            )}

            {messages.map((message) => (
              <MessageRow
                key={message.clientMessageId ?? message.id}
                message={message}
                isOwn={message.sender.id === user?.id}
                isAdmin={user?.role === UserRole.ADMIN}
                locale={i18n.language}
                onRetry={() => handleRetry(message)}
                onHide={() => handleHideMessage(message.id)}
                t={t}
              />
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-outline-variant bg-surface px-md py-sm md:px-lg">
        <div className="h-5 text-[12px] text-on-surface-variant">{typingText}</div>
        <div className="mb-sm flex flex-wrap items-center gap-xs">
          <button
            type="button"
            onClick={() => wrapSelection('`', '`', 'code')}
            className="inline-flex h-8 items-center gap-1 rounded-md px-sm text-[12px] font-semibold text-on-surface-variant hover:bg-surface-container-high"
            aria-label={t('globalChat.toolbar.inlineCode')}
            title={t('globalChat.toolbar.inlineCode')}
          >
            <Icon name="code" size={18} />
            <span>{t('globalChat.toolbar.inlineCodeShort')}</span>
          </button>
          <button
            type="button"
            onClick={() => wrapSelection('```\n', '\n```', 'const answer = 42;')}
            className="inline-flex h-8 items-center gap-1 rounded-md px-sm text-[12px] font-semibold text-on-surface-variant hover:bg-surface-container-high"
            aria-label={t('globalChat.toolbar.codeBlock')}
            title={t('globalChat.toolbar.codeBlock')}
          >
            <Icon name="data_object" size={18} />
            <span>{t('globalChat.toolbar.codeBlockShort')}</span>
          </button>
          <div className="mx-xs h-5 w-px bg-outline-variant" />
          {EMOJI_OPTIONS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => insertIntoInput(`${emoji} `)}
              className="grid h-8 w-8 place-items-center rounded-md text-[16px] hover:bg-surface-container-high"
              aria-label={t('globalChat.toolbar.insertEmoji', { emoji })}
              title={t('globalChat.toolbar.insertEmoji', { emoji })}
            >
              {emoji}
            </button>
          ))}
        </div>
        <form
          onSubmit={handleSubmit}
          className="flex items-center gap-sm rounded-xl bg-surface-container-low px-sm py-xs shadow-inner transition-colors focus-within:bg-surface-container-high"
        >
          <label className="sr-only" htmlFor="global-chat-input">
            {t('globalChat.input.label')}
          </label>
          <textarea
            id="global-chat-input"
            ref={inputRef}
            value={input}
            onChange={(event) => handleInputChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                void submitCurrentMessage();
              }
            }}
            rows={1}
            maxLength={MAX_MESSAGE_LENGTH + 100}
            placeholder={t('globalChat.input.placeholder')}
            className="max-h-32 min-h-[40px] flex-1 resize-none border-0 bg-transparent px-sm py-sm text-body-md leading-6 outline-none ring-0 focus:border-0 focus:outline-none focus:ring-0"
          />
          <Button
            type="submit"
            disabled={!canSend}
            className="h-10 min-h-10 w-10 min-w-10 shrink-0 rounded-full p-0"
            aria-label={t('globalChat.actions.send')}
          >
            <Icon name="send" size={20} />
          </Button>
        </form>
        <div className={`mt-xs text-right text-[12px] ${isTooLong ? 'text-error' : 'text-on-surface-variant'}`}>
          {input.length}/{MAX_MESSAGE_LENGTH}
        </div>
      </div>
    </section>

    {/* Online Users Panel */}
    {showOnlinePanel && (
      <OnlineUsersPanel users={onlineUsers} currentUserId={user?.id} />
    )}
    </div>
  );
}

function MessageRow({
  message,
  isOwn,
  isAdmin,
  locale,
  onRetry,
  onHide,
  t,
}: {
  message: UiMessage;
  isOwn: boolean;
  isAdmin: boolean;
  locale: string;
  onRetry: () => void;
  onHide: () => void;
  t: (key: string, values?: Record<string, unknown>) => string;
}) {
  const hidden = message.status === GlobalChatMessageStatus.HIDDEN;
  const initials = message.sender.name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <article className={`flex gap-sm ${isOwn ? 'justify-end' : 'justify-start'}`}>
      {!isOwn && <Avatar initials={initials} src={message.sender.avatarUrl} size="sm" />}
      <div className={`max-w-[82%] md:max-w-[68%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
        <div className={`mb-xs flex flex-wrap items-center gap-xs text-[12px] text-on-surface-variant ${isOwn ? 'justify-end' : ''}`}>
          <span className="font-semibold text-on-surface">{isOwn ? t('globalChat.me') : message.sender.name}</span>
          {message.sender.role === UserRole.ADMIN && (
            <span className="rounded-full bg-secondary-container px-2 py-0.5 text-[11px] font-semibold text-on-secondary-container">
              Admin
            </span>
          )}
          <span>{formatTime(message.createdAt, locale)}</span>
        </div>

        <div
          className={[
            'whitespace-pre-wrap break-words rounded-lg px-md py-sm text-body-md shadow-sm',
            isOwn
              ? 'bg-primary text-on-primary'
              : 'bg-surface-container-low text-on-surface border border-outline-variant',
            hidden && 'border-dashed bg-surface-container-high text-on-surface-variant italic',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          {hidden ? t('globalChat.message.hidden') : <MessageContent content={message.content} t={t} />}
        </div>

        <div className="mt-xs flex items-center gap-xs text-[12px] text-on-surface-variant">
          {isOwn && message.sendState === 'pending' && (
            <>
              <Icon name="schedule" size={14} />
              {t('globalChat.message.pending')}
            </>
          )}
          {isOwn && message.sendState === 'sent' && (
            <>
              <Icon name="done" size={14} />
              {t('globalChat.message.sent')}
            </>
          )}
          {isOwn && message.sendState === 'failed' && (
            <>
              <Icon name="error" className="text-error" size={14} />
              <span className="text-error">{t('globalChat.message.failed')}</span>
              <button type="button" className="font-semibold text-primary hover:underline" onClick={onRetry}>
                {t('globalChat.actions.retry')}
              </button>
            </>
          )}
          {isAdmin && !hidden && !message.clientMessageId && (
            <button
              type="button"
              className="ml-sm inline-flex items-center gap-1 font-semibold text-error hover:underline"
              onClick={onHide}
            >
              <Icon name="visibility_off" size={14} />
              {t('globalChat.actions.hide')}
            </button>
          )}
        </div>
      </div>
      {isOwn && <Avatar initials={initials} src={message.sender.avatarUrl} size="sm" />}
    </article>
  );
}

function MessageContent({
  content,
  t,
}: {
  content: string;
  t: (key: string, values?: Record<string, unknown>) => string;
}) {
  const parts = parseCodeBlocks(content);

  return (
    <div className="space-y-sm">
      {parts.map((part, index) =>
        part.type === 'code' ? (
          <CodeBlock key={`${part.type}-${index}`} code={part.value} language={part.language} t={t} />
        ) : (
          <p key={`${part.type}-${index}`} className="whitespace-pre-wrap break-words">
            <InlineCodeText text={part.value} />
          </p>
        ),
      )}
    </div>
  );
}

function CodeBlock({
  code,
  language,
  t,
}: {
  code: string;
  language?: string;
  t: (key: string, values?: Record<string, unknown>) => string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="my-xs overflow-hidden rounded-lg border border-outline-variant bg-[#111827] text-[#e5e7eb]">
      <div className="flex items-center justify-between gap-sm border-b border-white/10 px-sm py-xs text-[11px] text-gray-300">
        <span className="font-semibold uppercase tracking-wide">{language || 'code'}</span>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1 rounded px-2 py-1 text-[11px] hover:bg-white/10"
          aria-label={t('globalChat.toolbar.copyCode')}
          title={t('globalChat.toolbar.copyCode')}
        >
          <Icon name={copied ? 'check' : 'content_copy'} size={14} />
          {copied ? t('globalChat.toolbar.copied') : t('globalChat.toolbar.copy')}
        </button>
      </div>
      <pre className="max-h-72 overflow-auto p-sm text-[13px] leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function InlineCodeText({ text }: { text: string }) {
  const segments = parseInlineCode(text);
  return (
    <>
      {segments.map((segment, index) =>
        segment.type === 'code' ? (
          <code
            key={`${segment.type}-${index}`}
            className="rounded bg-black/10 px-1.5 py-0.5 font-mono text-[0.92em]"
          >
            {segment.value}
          </code>
        ) : (
          <span key={`${segment.type}-${index}`}>{segment.value}</span>
        ),
      )}
    </>
  );
}

function parseCodeBlocks(content: string) {
  const blocks: Array<{ type: 'text' | 'code'; value: string; language?: string }> = [];
  const regex = /```([a-zA-Z0-9_+#.-]+)?\n?([\s\S]*?)```/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      blocks.push({ type: 'text', value: content.slice(lastIndex, match.index) });
    }
    blocks.push({
      type: 'code',
      language: match[1],
      value: match[2].replace(/^\n|\n$/g, ''),
    });
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < content.length) {
    blocks.push({ type: 'text', value: content.slice(lastIndex) });
  }

  return blocks.filter((block) => block.value.length > 0);
}

function parseInlineCode(text: string) {
  const segments: Array<{ type: 'text' | 'code'; value: string }> = [];
  const regex = /`([^`\n]+)`/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: 'text', value: text.slice(lastIndex, match.index) });
    }
    segments.push({ type: 'code', value: match[1] });
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    segments.push({ type: 'text', value: text.slice(lastIndex) });
  }

  return segments.length > 0 ? segments : [{ type: 'text' as const, value: text }];
}

function formatTime(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale || 'vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function OnlineUsersPanel({
  users,
  currentUserId,
}: {
  users: OnlineUser[];
  currentUserId?: string;
}) {
  const { t } = useTranslation();

  // Sort: inChat users first, then by name
  const sorted = useMemo(
    () => [...users].sort((a, b) => {
      if (a.inChat !== b.inChat) return a.inChat ? -1 : 1;
      return a.name.localeCompare(b.name);
    }),
    [users],
  );

  return (
    <aside className="flex w-64 flex-col border-y border-r border-outline-variant bg-surface-container-lowest rounded-r-lg shadow-elev-1 overflow-hidden">
      <header className="flex items-center gap-sm border-b border-outline-variant px-md py-sm">
        <div className="relative">
          <Icon name="group" size={20} className="text-primary" />
          <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-green-500 ring-2 ring-surface-container-lowest" />
        </div>
        <h2 className="font-manrope text-label-md font-bold text-on-surface">
          {t('globalChat.onlineUsers', 'Đang online')}
        </h2>
        <span className="ml-auto rounded-full bg-primary-container px-2 py-0.5 text-[11px] font-bold text-on-primary-container">
          {users.length}
        </span>
      </header>

      <div className="flex-1 overflow-y-auto px-sm py-sm">
        {users.length === 0 ? (
          <p className="py-lg text-center text-label-sm text-on-surface-variant italic">
            Chưa có ai online
          </p>
        ) : (
          <ul className="flex flex-col gap-xs">
            {sorted.map((u) => {
              const initials = u.name
                .split(' ')
                .filter(Boolean)
                .slice(0, 2)
                .map((p) => p[0])
                .join('')
                .toUpperCase();
              const isMe = u.id === currentUserId;
              const dotColor = u.inChat ? 'bg-green-500' : 'bg-yellow-400';

              return (
                <li
                  key={u.id}
                  className={[
                    'flex items-center gap-sm rounded-lg px-sm py-xs transition-colors',
                    isMe
                      ? 'bg-primary-container/30'
                      : 'hover:bg-surface-container-high',
                  ].join(' ')}
                >
                  <span className="relative shrink-0">
                    <Avatar initials={initials} src={u.avatarUrl} size="sm" />
                    <span className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full ${dotColor} ring-2 ring-surface-container-lowest`} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-xs">
                      <span className="truncate text-label-sm font-medium text-on-surface">
                        {u.name}
                        {isMe && (
                          <span className="ml-xs text-[11px] text-on-surface-variant">
                            (bạn)
                          </span>
                        )}
                      </span>
                    </div>
                    {u.role === 'admin' && (
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-secondary">
                        Admin
                      </span>
                    )}
                    {u.role === 'teacher' && (
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-tertiary">
                        Giáo viên
                      </span>
                    )}
                    {u.role === 'student' && (
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                        Học sinh
                      </span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Legend */}
      <div className="border-t border-outline-variant/50 px-md py-xs flex items-center gap-md text-[10px] text-on-surface-variant">
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
          Đang chat
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-yellow-400" />
          Online
        </span>
      </div>
    </aside>
  );
}
