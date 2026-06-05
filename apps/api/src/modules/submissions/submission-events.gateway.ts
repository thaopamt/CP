import {
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ISubmissionRealtimeEvent, JwtPayload } from '@cp/shared';
import { Server, Socket } from 'socket.io';

import { User } from '../users/user.entity';
import { UsersService } from '../users/users.service';

const SUBMISSIONS_FEED_ROOM = 'submissions:feed';
const SUBMISSIONS_REDACTED_FEED_ROOM = 'submissions:feed:redacted';

type AuthenticatedSocket = Socket & {
  data: {
    user?: User;
  };
};

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/submissions',
})
export class SubmissionEventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(SubmissionEventsGateway.name);
  private readonly socketAuth = new WeakMap<Socket, Promise<User>>();

  constructor(
    private readonly jwt: JwtService,
    private readonly users: UsersService,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      await this.authenticateSocket(client);
    } catch {
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.debug(`Submissions socket disconnected: ${client.id}`);
  }

  @SubscribeMessage('submissions:join')
  async handleJoin(@ConnectedSocket() client: AuthenticatedSocket) {
    const user = await this.requireSocketUser(client);
    if (user.role === 'ADMIN' || user.role === 'TEACHER') {
      client.join(SUBMISSIONS_FEED_ROOM);
    } else {
      client.join(SUBMISSIONS_REDACTED_FEED_ROOM);
    }
    client.join(this.userRoom(user.id));
    client.emit('submissions:joined', { scope: 'all' });
  }

  publishSubmissionEvent(payload: ISubmissionRealtimeEvent) {
    if (!this.server) return;
    this.server.to(SUBMISSIONS_FEED_ROOM).emit('submissions:changed', payload);
  }

  publishUserSubmissionEvent(userId: string, payload: ISubmissionRealtimeEvent) {
    if (!this.server) return;
    this.server.to(this.userRoom(userId)).emit('submissions:changed', payload);
  }

  publishRedactedSubmissionEvent(payload: ISubmissionRealtimeEvent) {
    if (!this.server) return;
    this.server.to(SUBMISSIONS_REDACTED_FEED_ROOM).emit('submissions:changed', payload);
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
      const user = await this.users.findActiveById(payload.sub);
      if (!user) {
        throw new Error('Inactive socket user');
      }

      client.data.user = user;
      return user;
    })();

    this.socketAuth.set(client, authPromise);
    return authPromise;
  }

  private userRoom(userId: string): string {
    return `submissions:user:${userId}`;
  }
}
