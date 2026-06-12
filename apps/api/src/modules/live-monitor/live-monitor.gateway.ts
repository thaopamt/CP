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
type ProblemExample = {
  input: string;
  output: string;
  explanation?: string;
};
type AdminEditSession = {
  studentId: string;
  problemId: string;
  adminName?: string;
};

export interface ActiveStudent {
  socketId: string;
  studentId: string;
  problemId?: string;
  problemTitle?: string;
  problemDescription?: string;
  problemExamples?: ProblemExample[];
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
  // Track workspaces where an admin is actively editing so stale cursors can be cleared.
  private adminEditSessions = new Map<string, Map<string, AdminEditSession>>();

  handleConnection(client: Socket) {
    console.log(`LiveMonitor: Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`LiveMonitor: Client disconnected: ${client.id}`);
    this.adminSockets.delete(client.id);
    this.clearAdminEditSessions(client.id);
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
    @MessageBody()
    data: {
      studentId: string;
      problemId: string;
      problemTitle?: string;
      problemDescription?: string;
      problemExamples?: ProblemExample[];
      studentName?: string;
      language?: string;
    },
    @ConnectedSocket() client: Socket,
  ) {
    console.log(`LiveMonitor: Student ${data.studentId} joined workspace ${data.problemId}`);
    
    // Join a room specific to this student's workspace
    const roomName = `workspace_${data.studentId}_${data.problemId}`;
    client.join(roomName);

    const existing = this.activeStudents.get(client.id);

    // Save state
    this.activeStudents.set(client.id, {
      ...existing,
      socketId: client.id,
      studentId: data.studentId,
      problemId: data.problemId,
      problemTitle: data.problemTitle ?? existing?.problemTitle,
      problemDescription: data.problemDescription ?? existing?.problemDescription,
      problemExamples: data.problemExamples ?? existing?.problemExamples,
      studentName: data.studentName,
      language: data.language ?? existing?.language,
      status: 'coding',
      isTabVisible: true,
      isWindowFocused: true,
      idleForMs: 0,
      lastActive: Date.now(),
    });

    this.broadcastActiveStudents();
  }

  @SubscribeMessage('workspace_metadata')
  handleWorkspaceMetadata(
    @MessageBody()
    data: {
      studentId: string;
      problemId: string;
      problemTitle?: string;
      problemDescription?: string;
      problemExamples?: ProblemExample[];
    },
    @ConnectedSocket() client: Socket,
  ) {
    const student = this.activeStudents.get(client.id);
    if (!student || student.studentId !== data.studentId || student.problemId !== data.problemId) return;

    student.problemTitle = data.problemTitle ?? student.problemTitle;
    student.problemDescription = data.problemDescription ?? student.problemDescription;
    student.problemExamples = data.problemExamples ?? student.problemExamples;
    student.lastActive = Date.now();
    this.broadcastActiveStudents();
  }

  @SubscribeMessage('code_change')
  handleCodeChange(
    @MessageBody() data: { studentId: string; problemId: string; code: string; language: string; cursorOffset?: number },
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
      cursorOffset: data.cursorOffset,
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
    this.clearAdminEditSession(client.id, data.studentId, data.problemId, client);
    client.leave(roomName);
    console.log(`LiveMonitor: Admin stopped watching ${roomName}`);
  }

  @SubscribeMessage('admin_code_edit')
  handleAdminCodeEdit(
    @MessageBody()
    data: {
      studentId: string;
      problemId: string;
      code: string;
      language: string;
      cursorOffset?: number;
      adminName?: string;
    },
    @ConnectedSocket() client: Socket,
  ) {
    if (!data?.studentId || !data?.problemId) return;

    const sessionKey = `${data.studentId}_${data.problemId}`;
    const sessions = this.adminEditSessions.get(client.id) ?? new Map<string, AdminEditSession>();
    sessions.set(sessionKey, {
      studentId: data.studentId,
      problemId: data.problemId,
      adminName: data.adminName,
    });
    this.adminEditSessions.set(client.id, sessions);

    // 1. Update server-side state so the snapshot stays current
    const student = Array.from(this.activeStudents.values()).find(
      (s) => s.studentId === data.studentId && s.problemId === data.problemId,
    );
    if (student) {
      student.code = data.code;
      student.language = data.language;
      student.lastActive = Date.now();
    }

    const roomName = `workspace_${data.studentId}_${data.problemId}`;
    const payload = {
      studentId: data.studentId,
      problemId: data.problemId,
      code: data.code,
      language: data.language,
      cursorOffset: data.cursorOffset,
      adminName: data.adminName,
    };

    // 2. Push code to the student (and any other clients in the room, except the sender admin)
    client.to(roomName).emit('admin_code_push', payload);

    // 3. Broadcast code_update to all admins (except the sender) for grid preview
    client.to('admin_global').emit('code_update', payload);
  }

  @SubscribeMessage('admin_edit_state')
  handleAdminEditState(
    @MessageBody()
    data: {
      studentId: string;
      problemId: string;
      isEditing: boolean;
      cursorOffset?: number;
      adminName?: string;
    },
    @ConnectedSocket() client: Socket,
  ) {
    if (!data?.studentId || !data?.problemId) return;

    const key = `${data.studentId}_${data.problemId}`;
    if (data.isEditing) {
      const sessions = this.adminEditSessions.get(client.id) ?? new Map<string, AdminEditSession>();
      sessions.set(key, {
        studentId: data.studentId,
        problemId: data.problemId,
        adminName: data.adminName,
      });
      this.adminEditSessions.set(client.id, sessions);
    } else {
      this.adminEditSessions.get(client.id)?.delete(key);
      if (this.adminEditSessions.get(client.id)?.size === 0) {
        this.adminEditSessions.delete(client.id);
      }
    }

    const roomName = `workspace_${data.studentId}_${data.problemId}`;
    client.to(roomName).emit('admin_edit_state_push', {
      isEditing: data.isEditing,
      cursorOffset: data.cursorOffset,
      adminName: data.adminName,
    });
  }

  @SubscribeMessage('admin_cursor_move')
  handleAdminCursorMove(
    @MessageBody()
    data: {
      studentId: string;
      problemId: string;
      cursorOffset: number;
      adminName?: string;
    },
    @ConnectedSocket() client: Socket,
  ) {
    if (!data?.studentId || !data?.problemId) return;
    const roomName = `workspace_${data.studentId}_${data.problemId}`;
    // Forward cursor position to the student (not code, just cursor)
    client.to(roomName).emit('admin_cursor_push', {
      cursorOffset: data.cursorOffset,
      adminName: data.adminName,
    });
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

  private clearAdminEditSessions(socketId: string) {
    const sessions = this.adminEditSessions.get(socketId);
    if (!sessions) return;
    for (const session of sessions.values()) {
      const roomName = `workspace_${session.studentId}_${session.problemId}`;
      this.server.to(roomName).emit('admin_edit_state_push', {
        isEditing: false,
        adminName: session.adminName,
      });
    }
    this.adminEditSessions.delete(socketId);
  }

  private clearAdminEditSession(
    socketId: string,
    studentId: string,
    problemId: string,
    client: Socket,
  ) {
    const key = `${studentId}_${problemId}`;
    const sessions = this.adminEditSessions.get(socketId);
    if (!sessions) return;
    const session = sessions.get(key);
    if (!session) return;

    const roomName = `workspace_${studentId}_${problemId}`;
    client.to(roomName).emit('admin_edit_state_push', {
      isEditing: false,
      adminName: session.adminName,
    });
    sessions.delete(key);
    if (sessions.size === 0) {
      this.adminEditSessions.delete(socketId);
    }
  }
}
