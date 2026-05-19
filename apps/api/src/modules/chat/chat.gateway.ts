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

export interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  content: string;
  timestamp: number;
}

const MAX_HISTORY = 100;
let messageCounter = 0;

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  /** In-memory ring buffer of recent messages. */
  private messageHistory: ChatMessage[] = [];

  /** Track connected users: socketId -> user info */
  private connectedUsers = new Map<string, { userId: string; userName: string; userRole: string }>();

  handleConnection(client: Socket) {
    console.log(`Chat: Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    const user = this.connectedUsers.get(client.id);
    if (user) {
      console.log(`Chat: ${user.userName} disconnected`);
      this.connectedUsers.delete(client.id);
      this.broadcastOnlineUsers();
    }
  }

  @SubscribeMessage('user_join')
  handleUserJoin(
    @MessageBody() data: { userId: string; userName: string; userRole: string },
    @ConnectedSocket() client: Socket,
  ) {
    console.log(`Chat: ${data.userName} (${data.userRole}) joined`);
    this.connectedUsers.set(client.id, {
      userId: data.userId,
      userName: data.userName,
      userRole: data.userRole,
    });

    // Send message history to the newly joined user
    client.emit('message_history', this.messageHistory);

    // Broadcast updated online users list
    this.broadcastOnlineUsers();
  }

  @SubscribeMessage('send_message')
  handleSendMessage(
    @MessageBody() data: { userId: string; userName: string; userRole: string; content: string },
    @ConnectedSocket() client: Socket,
  ) {
    if (!data.content || !data.content.trim()) return;

    const message: ChatMessage = {
      id: `msg_${Date.now()}_${++messageCounter}`,
      userId: data.userId,
      userName: data.userName,
      userRole: data.userRole,
      content: data.content.trim(),
      timestamp: Date.now(),
    };

    // Add to history buffer
    this.messageHistory.push(message);
    if (this.messageHistory.length > MAX_HISTORY) {
      this.messageHistory.shift();
    }

    // Broadcast to ALL connected clients (including sender)
    this.server.emit('new_message', message);
  }

  @SubscribeMessage('user_typing')
  handleTyping(
    @MessageBody() data: { userId: string; userName: string },
    @ConnectedSocket() client: Socket,
  ) {
    // Broadcast to everyone except the sender
    client.broadcast.emit('user_typing', {
      userId: data.userId,
      userName: data.userName,
    });
  }

  private broadcastOnlineUsers() {
    const users = Array.from(this.connectedUsers.values());
    // Deduplicate by userId (same user may have multiple tabs)
    const unique = Array.from(
      new Map(users.map((u) => [u.userId, u])).values(),
    );
    this.server.emit('online_users', unique);
  }
}
