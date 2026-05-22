export const globalChatKeys = {
  all: ['global-chat'] as const,
  messages: () => [...globalChatKeys.all, 'messages'] as const,
  unread: () => [...globalChatKeys.all, 'unread'] as const,
};
