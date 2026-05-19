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

export interface ActiveStudent {
  socketId: string;
  studentId: string;
  problemId: string;
  studentName?: string;
  language?: string;
  code?: string;
  lastActive: number;
}

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/live-monitor',
})
export class LiveMonitorGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  // Track active student sessions: socketId -> ActiveStudent
  private activeStudents = new Map<string, ActiveStudent>();
  // Track admin socket IDs for global broadcast
  private adminSockets = new Set<string>();

  handleConnection(client: Socket) {
    console.log(`LiveMonitor: Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`LiveMonitor: Client disconnected: ${client.id}`);
    this.adminSockets.delete(client.id);
    if (this.activeStudents.has(client.id)) {
      this.activeStudents.delete(client.id);
      this.broadcastActiveStudents();
    }
  }

  // ---- Student Events ----

  @SubscribeMessage('join_workspace')
  handleJoinWorkspace(
    @MessageBody() data: { studentId: string; problemId: string; studentName?: string; language?: string },
    @ConnectedSocket() client: Socket,
  ) {
    console.log(`LiveMonitor: Student ${data.studentId} joined workspace ${data.problemId}`);
    
    // Join a room specific to this student's workspace
    const roomName = `workspace_${data.studentId}_${data.problemId}`;
    client.join(roomName);

    // Save state
    this.activeStudents.set(client.id, {
      socketId: client.id,
      studentId: data.studentId,
      problemId: data.problemId,
      studentName: data.studentName,
      language: data.language,
      lastActive: Date.now(),
    });

    this.broadcastActiveStudents();
  }

  @SubscribeMessage('code_change')
  handleCodeChange(
    @MessageBody() data: { studentId: string; problemId: string; code: string; language: string },
    @ConnectedSocket() client: Socket,
  ) {
    const student = this.activeStudents.get(client.id);
    if (student) {
      student.language = data.language;
      student.code = data.code;
      student.lastActive = Date.now();
    }

    const payload = {
      studentId: data.studentId,
      problemId: data.problemId,
      code: data.code,
      language: data.language,
    };

    // Broadcast to admins watching this specific student room
    const roomName = `workspace_${data.studentId}_${data.problemId}`;
    client.to(roomName).emit('code_update', payload);

    // Also broadcast to all admins for the grid preview
    this.server.to('admin_global').emit('code_update', payload);
  }

  // ---- Admin Events ----

  @SubscribeMessage('admin_join')
  handleAdminJoin(@ConnectedSocket() client: Socket) {
    this.adminSockets.add(client.id);
    // Join a global admin room for grid-view updates
    client.join('admin_global');

    // Send the current list of active students (including their latest code snapshots) to the admin
    const studentsWithCode = Array.from(this.activeStudents.values()).map((s) => ({
      ...s,
    }));
    client.emit('active_students_list', studentsWithCode);
  }

  @SubscribeMessage('admin_watch_student')
  handleAdminWatchStudent(
    @MessageBody() data: { studentId: string; problemId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const roomName = `workspace_${data.studentId}_${data.problemId}`;
    client.join(roomName);
    console.log(`LiveMonitor: Admin started watching ${roomName}`);

    // Send latest known code immediately to the admin
    const student = Array.from(this.activeStudents.values()).find(
      (s) => s.studentId === data.studentId && s.problemId === data.problemId,
    );
    if (student && student.code) {
      client.emit('code_update', {
        studentId: student.studentId,
        problemId: student.problemId,
        code: student.code,
        language: student.language || 'javascript',
      });
    }
  }

  @SubscribeMessage('admin_unwatch_student')
  handleAdminUnwatchStudent(
    @MessageBody() data: { studentId: string; problemId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const roomName = `workspace_${data.studentId}_${data.problemId}`;
    client.leave(roomName);
    console.log(`LiveMonitor: Admin stopped watching ${roomName}`);
  }

  // ---- Helper ----
  private broadcastActiveStudents() {
    const list = Array.from(this.activeStudents.values());
    this.server.emit('active_students_list', list);
  }
}
