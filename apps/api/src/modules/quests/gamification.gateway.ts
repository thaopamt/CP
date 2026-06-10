import {
  ConnectedSocket,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { IGamificationEvent, JwtPayload } from '@cp/shared';
import { Server, Socket } from 'socket.io';

type AuthedSocket = Socket & { data: { userId?: string } };

/**
 * Pushes quest/badge/level-up events to the owning student's room so the UI can
 * surface a toast the moment a background submission grade completes a quest.
 */
@WebSocketGateway({ cors: { origin: '*' }, namespace: '/gamification' })
export class GamificationGateway implements OnGatewayConnection {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(GamificationGateway.name);

  constructor(private readonly jwt: JwtService) {}

  async handleConnection(client: AuthedSocket) {
    try {
      const token = this.extractToken(client);
      if (!token) throw new Error('missing token');
      const payload = await this.jwt.verifyAsync<JwtPayload>(token);
      client.data.userId = payload.sub;
      client.join(this.userRoom(payload.sub));
    } catch {
      client.disconnect(true);
    }
  }

  @SubscribeMessage('gamification:join')
  handleJoin(@ConnectedSocket() client: AuthedSocket) {
    if (client.data.userId) {
      client.join(this.userRoom(client.data.userId));
      client.emit('gamification:joined', { ok: true });
    }
  }

  /** Fire-and-forget; safe before the server is wired up. */
  publish(userId: string, event: IGamificationEvent) {
    if (!this.server) return;
    this.server.to(this.userRoom(userId)).emit('gamification:event', event);
  }

  private extractToken(client: Socket): string | null {
    const authToken = client.handshake.auth?.token;
    if (typeof authToken === 'string' && authToken.trim()) return authToken.trim();
    const authorization = client.handshake.headers.authorization;
    if (typeof authorization === 'string' && authorization.startsWith('Bearer ')) {
      return authorization.slice('Bearer '.length).trim();
    }
    return null;
  }

  private userRoom(userId: string): string {
    return `gamification:user:${userId}`;
  }
}
