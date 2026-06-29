import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload, UserRole } from '@cp/shared';

import { ChatService } from './chat.service';

/**
 * Real-time WebSocket gateway for chat.
 *
 * Performance notes:
 * - Uses findConversationById() (single indexed PK lookup) instead of
 *   getConversations() (which fetches ALL conversations + relations + unread).
 * - Unread count updates are fire-and-forget (not awaited).
 * - Emit happens immediately after message is saved, before side-effects.
 */
@WebSocketGateway({ cors: { origin: '*' }, namespace: '/chat' })
export class ChatGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  /** socketId → JwtPayload */
  private socketPayload = new Map<string, JwtPayload>();

  constructor(
    private readonly jwt: JwtService,
    private readonly chat: ChatService,
  ) {}

  /* ─── Connection lifecycle ────────────────────────────────────────── */

  async handleConnection(client: Socket) {
    try {
      const token =
        (client.handshake.auth as { token?: string })?.token ??
        (client.handshake.headers?.authorization as string)?.replace(
          'Bearer ',
          '',
        );
      if (!token) {
        client.disconnect();
        return;
      }
      const payload = await this.jwt.verifyAsync<JwtPayload>(token);
      this.socketPayload.set(client.id, payload);

      if (payload.role === UserRole.STUDENT) {
        client.join(`student_${payload.sub}`);
      } else {
        client.join('staff');
      }
      client.join(`user_${payload.sub}`);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.socketPayload.delete(client.id);
  }

  /* ─── Client → Server events ──────────────────────────────────────── */

  @SubscribeMessage('send_message')
  async handleSendMessage(
    @MessageBody() data: { conversationId: string; content: string; type?: string },
    @ConnectedSocket() client: Socket,
  ) {
    const payload = this.socketPayload.get(client.id);
    if (!payload || !data?.conversationId || !data?.content?.trim()) return;

    // 1. Save message (this already validates participation)
    const msgType = data.type === 'warning' ? 'warning' : 'normal';
    const message = await this.chat.sendMessage(
      data.conversationId,
      payload.sub,
      payload.role,
      data.content.trim(),
      msgType as any,
    );

    // 2. Fast lookup to find the student (single PK query)
    const conv = await this.chat.findConversationById(data.conversationId);
    if (!conv) return;

    // 3. Emit immediately — student + staff both get notified
    this.server.to('staff').emit('new_message', message);
    this.server
      .to(`student_${conv.studentId}`)
      .emit('new_message', message);

    // 4. Fire-and-forget unread updates (don't block the response)
    if (payload.role === UserRole.STUDENT) {
      this.server.to('staff').emit('unread_update', { refresh: true });
    } else {
      this.chat
        .getTotalUnread(conv.studentId, UserRole.STUDENT)
        .then((totalUnread) => {
          this.server
            .to(`student_${conv.studentId}`)
            .emit('unread_update', { totalUnread });
        })
        .catch(() => { /* ignore */ });
    }
  }

  @SubscribeMessage('mark_read')
  async handleMarkRead(
    @MessageBody() data: { conversationId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const payload = this.socketPayload.get(client.id);
    if (!payload || !data?.conversationId) return;

    const { count } = await this.chat.markAsRead(
      data.conversationId,
      payload.sub,
      payload.role,
    );
    if (count === 0) return;

    if (payload.role === UserRole.STUDENT) {
      this.server.to('staff').emit('messages_read', {
        conversationId: data.conversationId,
        readBy: payload.sub,
      });
    } else {
      // Fast lookup instead of getConversations()
      const conv = await this.chat.findConversationById(data.conversationId);
      if (conv) {
        this.server
          .to(`student_${conv.studentId}`)
          .emit('messages_read', {
            conversationId: data.conversationId,
            readBy: payload.sub,
          });
      }
    }
  }

  @SubscribeMessage('typing')
  async handleTyping(
    @MessageBody() data: { conversationId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const payload = this.socketPayload.get(client.id);
    if (!payload || !data?.conversationId) return;

    const typingEvent = {
      conversationId: data.conversationId,
      userId: payload.sub,
      role: payload.role,
    };

    if (payload.role === UserRole.STUDENT) {
      this.server.to('staff').emit('user_typing', typingEvent);
    } else {
      // Fast lookup instead of getConversations()
      const conv = await this.chat.findConversationById(data.conversationId);
      if (conv) {
        this.server
          .to(`student_${conv.studentId}`)
          .emit('user_typing', typingEvent);
      }
    }
  }
}
