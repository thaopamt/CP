import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload, UserRole } from '@cp/shared';
import { Server, Socket } from 'socket.io';

type AuthedSocket = Socket & { data: { userId?: string; role?: UserRole } };

/**
 * Per-exam live updates. Clients join `exam:{id}` and refetch the leaderboard
 * (freeze logic stays server-side) when a `exam:leaderboard:changed` ping
 * arrives. Status transitions (finalized) are pushed the same way.
 */
@WebSocketGateway({ cors: { origin: '*' }, namespace: '/exams' })
export class ExamEventsGateway implements OnGatewayConnection {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(ExamEventsGateway.name);

  constructor(private readonly jwt: JwtService) {}

  async handleConnection(client: AuthedSocket) {
    try {
      const token = this.extractToken(client);
      if (!token) throw new Error('missing token');
      const payload = await this.jwt.verifyAsync<JwtPayload>(token);
      client.data.userId = payload.sub;
      client.data.role = payload.role;
    } catch {
      client.disconnect(true);
    }
  }

  @SubscribeMessage('exam:join')
  handleJoin(@ConnectedSocket() client: AuthedSocket, @MessageBody() body: { examId?: string }) {
    if (client.data.userId && body?.examId) {
      client.join(this.room(body.examId));
      client.emit('exam:joined', { examId: body.examId });
    }
  }

  @SubscribeMessage('exam:leave')
  handleLeave(@ConnectedSocket() client: AuthedSocket, @MessageBody() body: { examId?: string }) {
    if (body?.examId) client.leave(this.room(body.examId));
  }

  emitLeaderboardChanged(examId: string): void {
    if (!this.server) return;
    this.server.to(this.room(examId)).emit('exam:leaderboard:changed', { examId });
  }

  emitStatusChanged(examId: string, status: string): void {
    if (!this.server) return;
    this.server.to(this.room(examId)).emit('exam:status:changed', { examId, status });
  }

  private room(examId: string): string {
    return `exam:${examId}`;
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
}
