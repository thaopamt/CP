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

type StudentPresenceStatus = 'online' | 'idle' | 'away' | 'coding';

export interface ActiveStudent {
  socketId: string;
  studentId: string;
  problemId?: string;
  studentName?: string;
  language?: string;
  code?: string;
  lastActive: number;
  status?: StudentPresenceStatus;
  currentPath?: string;
  isTabVisible?: boolean;
  isWindowFocused?: boolean;
  idleForMs?: number;
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
  // Track student portal presence even when they are not in the coding workspace.
  private onlineStudents = new Map<string, ActiveStudent>();
  // Track admin socket IDs for global broadcast
  private adminSockets = new Set<string>();

  handleConnection(client: Socket) {
    console.log(`LiveMonitor: Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`LiveMonitor: Client disconnected: ${client.id}`);
    this.adminSockets.delete(client.id);
    this.onlineStudents.delete(client.id);
    if (this.activeStudents.has(client.id)) {
      this.activeStudents.delete(client.id);
    }
    this.broadcastActiveStudents();
  }

  // ---- Student Events ----

  @SubscribeMessage('student_online')
  handleStudentOnline(
    @MessageBody()
    data: {
      studentId: string;
      studentName?: string;
      currentPath?: string;
      status?: StudentPresenceStatus;
      isTabVisible?: boolean;
      isWindowFocused?: boolean;
      idleForMs?: number;
    },
    @ConnectedSocket() client: Socket,
  ) {
    if (!data?.studentId) return;
    const status = this.normalizePresenceStatus(data.status);

    this.onlineStudents.set(client.id, {
      socketId: client.id,
      studentId: data.studentId,
      studentName: data.studentName,
      currentPath: data.currentPath,
      status,
      isTabVisible: data.isTabVisible,
      isWindowFocused: data.isWindowFocused,
      idleForMs: data.idleForMs,
      lastActive: Date.now(),
    });

    this.broadcastActiveStudents();
  }

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
      status: 'coding',
      isTabVisible: true,
      isWindowFocused: true,
      idleForMs: 0,
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

    // Send coding students plus online-only students to the admin.
    client.emit('active_students_list', this.getMonitorStudents());
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
    const list = this.getMonitorStudents();
    this.server.emit('active_students_list', list);
  }

  private getMonitorStudents(): ActiveStudent[] {
    const presenceByStudentId = new Map<string, ActiveStudent>();
    for (const presence of this.onlineStudents.values()) {
      const existing = presenceByStudentId.get(presence.studentId);
      if (!existing || existing.lastActive < presence.lastActive) {
        presenceByStudentId.set(presence.studentId, presence);
      }
    }

    const codingStudents = Array.from(this.activeStudents.values()).map((student) => {
      const presence = presenceByStudentId.get(student.studentId);
      const presenceStatus = this.normalizePresenceStatus(presence?.status);
      return {
        ...student,
        currentPath: presence?.currentPath ?? student.currentPath,
        isTabVisible: presence?.isTabVisible ?? student.isTabVisible,
        isWindowFocused: presence?.isWindowFocused ?? student.isWindowFocused,
        idleForMs: presence?.idleForMs ?? student.idleForMs,
        status: presenceStatus === 'online' ? ('coding' as const) : presenceStatus,
      };
    });
    const codingStudentIds = new Set(codingStudents.map((student) => student.studentId));
    const onlineOnlyStudents = Array.from(this.onlineStudents.values())
      .filter((student) => !codingStudentIds.has(student.studentId))
      .map((student) => ({
        ...student,
        status: this.normalizePresenceStatus(student.status),
      }));

    return [...codingStudents, ...onlineOnlyStudents].sort((a, b) => b.lastActive - a.lastActive);
  }

  private normalizePresenceStatus(status?: StudentPresenceStatus): Exclude<StudentPresenceStatus, 'coding'> {
    return status === 'away' || status === 'idle' ? status : 'online';
  }
}
