import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import {
  GlobalChatDeletedPayload,
  GlobalChatFailedPayload,
  GlobalChatMessage,
  GlobalChatSendPayload,
  GlobalChatSentPayload,
  JwtPayload,
} from '@cp/shared';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';

import { User } from '../users/user.entity';
import { GlobalChatService } from './global-chat.service';

const GLOBAL_CHAT_ROOM = 'global_chat';

type AuthenticatedSocket = Socket & {
  data: {
    user?: User;
    authRegistered?: boolean;
  };
};

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/global-chat',
})
export class GlobalChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly userSocketCounts = new Map<string, number>();
  private readonly socketAuth = new WeakMap<Socket, Promise<User>>();

  constructor(
    private readonly jwt: JwtService,
    private readonly chat: GlobalChatService,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      await this.authenticateSocket(client);
    } catch {
      client.disconnect(true);
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    const userId = client.data.user?.id;
    if (userId) {
      this.decrementUserSocket(userId);
    }
  }

  @SubscribeMessage('global_chat:join')
  async handleJoin(@ConnectedSocket() client: AuthenticatedSocket) {
    const user = await this.requireSocketUser(client);
    client.join(GLOBAL_CHAT_ROOM);
    await this.emitUnreadCount(user.id);
  }

  @SubscribeMessage('global_chat:message:new')
  async handleNewMessage(
    @MessageBody() data: GlobalChatSendPayload,
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    const user = await this.requireSocketUser(client);
    try {
      const message = await this.chat.sendMessage(user, data?.content ?? '', {
        ipAddress: client.handshake.address,
        userAgent: String(client.handshake.headers['user-agent'] ?? ''),
      });
      this.broadcastNewMessage(message, data?.clientMessageId, user.id);
    } catch (error) {
      const payload: GlobalChatFailedPayload = {
        clientMessageId: data?.clientMessageId,
        message: error instanceof Error ? error.message : 'Failed to send message',
        code: this.errorCode(error),
      };
      client.emit('global_chat:message:failed', payload);
    }
  }

  @SubscribeMessage('global_chat:typing')
  async handleTyping(@MessageBody() data: { isTyping?: boolean }, @ConnectedSocket() client: AuthenticatedSocket) {
    const user = await this.requireSocketUser(client);
    client.to(GLOBAL_CHAT_ROOM).emit('global_chat:typing', {
      userId: user.id,
      name: `${user.firstName} ${user.lastName}`.trim(),
      isTyping: !!data?.isTyping,
    });
  }

  @SubscribeMessage('global_chat:read')
  async handleRead(
    @MessageBody() data: { lastReadMessageId?: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    const user = await this.requireSocketUser(client);
    if (!data?.lastReadMessageId) return;

    try {
      await this.chat.markRead(user, data.lastReadMessageId);
      await this.emitUnreadCount(user.id);
    } catch {
      // Read receipts are best-effort; REST history remains the source of truth.
    }
  }

  broadcastNewMessage(message: GlobalChatMessage, clientMessageId?: string, senderId?: string) {
    if (!this.server) return;

    this.server.to(GLOBAL_CHAT_ROOM).emit('global_chat:message:new', message);
    if (senderId) {
      const sentPayload: GlobalChatSentPayload = { clientMessageId, message };
      this.server.to(this.userRoom(senderId)).emit('global_chat:message:sent', sentPayload);
    }
    void this.emitUnreadCountsForConnectedUsers();
  }

  broadcastDeleted(payload: GlobalChatDeletedPayload) {
    if (!this.server) return;

    this.server.to(GLOBAL_CHAT_ROOM).emit('global_chat:message:deleted', payload);
    void this.emitUnreadCountsForConnectedUsers();
  }

  async emitUnreadCount(userId: string) {
    if (!this.server) return;

    const payload = await this.chat.getUnreadCountForUserId(userId);
    this.server.to(this.userRoom(userId)).emit('global_chat:unread_count_updated', payload);
  }

  private async emitUnreadCountsForConnectedUsers() {
    const userIds = Array.from(this.userSocketCounts.keys());
    await Promise.all(userIds.map((userId) => this.emitUnreadCount(userId)));
  }

  private extractToken(client: Socket): string | null {
    const authToken = client.handshake.auth?.token;
    if (typeof authToken === 'string' && authToken.trim()) {
      return authToken.trim();
    }

    const authorization = client.handshake.headers.authorization;
    if (typeof authorization === 'string' && authorization.startsWith('Bearer ')) {
      return authorization.slice('Bearer '.length).trim();
    }

    return null;
  }

  private async requireSocketUser(client: AuthenticatedSocket): Promise<User> {
    try {
      return await this.authenticateSocket(client);
    } catch {
      client.disconnect(true);
      throw new Error('Unauthenticated socket');
    }
  }

  private authenticateSocket(client: AuthenticatedSocket): Promise<User> {
    if (client.data.user) {
      return Promise.resolve(client.data.user);
    }

    const existing = this.socketAuth.get(client);
    if (existing) {
      return existing;
    }

    const authPromise = (async () => {
      const token = this.extractToken(client);
      if (!token) {
        throw new Error('Missing socket token');
      }

      const payload = await this.jwt.verifyAsync<JwtPayload>(token);
      const user = await this.chat.assertActiveUser(payload.sub);
      client.data.user = user;

      if (!client.data.authRegistered) {
        client.join(this.userRoom(user.id));
        this.incrementUserSocket(user.id);
        client.data.authRegistered = true;
      }

      return user;
    })();

    this.socketAuth.set(client, authPromise);
    return authPromise;
  }

  private incrementUserSocket(userId: string) {
    this.userSocketCounts.set(userId, (this.userSocketCounts.get(userId) ?? 0) + 1);
  }

  private decrementUserSocket(userId: string) {
    const next = (this.userSocketCounts.get(userId) ?? 1) - 1;
    if (next <= 0) {
      this.userSocketCounts.delete(userId);
    } else {
      this.userSocketCounts.set(userId, next);
    }
  }

  private userRoom(userId: string): string {
    return `user:${userId}`;
  }

  private errorCode(error: unknown): string {
    const maybeStatus = error as { getStatus?: () => number };
    const status = typeof maybeStatus.getStatus === 'function' ? maybeStatus.getStatus() : 500;
    if (status === 429) return 'RATE_LIMITED';
    if (status === 400) return 'VALIDATION_FAILED';
    if (status === 403) return 'FORBIDDEN';
    return 'SEND_FAILED';
  }
}
