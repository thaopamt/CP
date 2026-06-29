import { useEffect, useRef } from 'react';
import { useToast } from '@cp/ui';
import { IChatMessage, UserRole } from '@cp/shared';
import { useTranslation } from 'react-i18next';

import { useChatSocket } from './useChatSocket';
import { useChatUnreadCount } from '../api/chat.queries';
import { useAuthStore } from '../stores/auth.store';

/**
 * Hook for staff (Admin/Teacher) to receive chat notifications.
 * - Shows toast when a new student message arrives
 * - Exposes unread count for sidebar badge
 */
export function useChatNotifications() {
  const { t } = useTranslation();
  const toast = useToast();
  const user = useAuthStore((s) => s.user);

  const { totalUnread: socketUnread, setOnNewMessage } = useChatSocket();
  const { data: restUnread = 0 } = useChatUnreadCount();

  const unreadCount = socketUnread || restUnread;
  const userIdRef = useRef(user?.id);
  userIdRef.current = user?.id;

  useEffect(() => {
    if (!user) return;
    const isStaff =
      user.role === UserRole.ADMIN || user.role === UserRole.TEACHER;
    if (!isStaff) return;

    setOnNewMessage((msg: IChatMessage) => {
      // Only toast for messages from students (not from other staff)
      if (msg.senderRole === UserRole.STUDENT && msg.senderId !== userIdRef.current) {
        toast.info(`💬 ${msg.senderName}: ${msg.content.slice(0, 80)}`);
      }
    });

    return () => setOnNewMessage(null);
  }, [user?.id, user?.role]);

  return { unreadCount };
}
