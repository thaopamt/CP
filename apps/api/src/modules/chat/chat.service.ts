import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  fullName,
  ChatMessageType,
  IChatConversation,
  IChatMessage,
  IChatMessagesPage,
  UserRole,
} from '@cp/shared';

import { User } from '../users/user.entity';
import { ChatConversation } from './chat-conversation.entity';
import { ChatMessage } from './chat-message.entity';

const MESSAGES_PER_PAGE = 30;

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatConversation)
    private readonly convRepo: Repository<ChatConversation>,
    @InjectRepository(ChatMessage)
    private readonly msgRepo: Repository<ChatMessage>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  /* ------------------------------------------------------------------ */
  /*  Fast lookups (used by gateway — no heavy joins)                     */
  /* ------------------------------------------------------------------ */

  /** Lightweight lookup by ID — returns just the entity (no serialization). */
  async findConversationById(id: string): Promise<ChatConversation | null> {
    return this.convRepo.findOneBy({ id });
  }

  /* ------------------------------------------------------------------ */
  /*  Conversations                                                      */
  /* ------------------------------------------------------------------ */

  /**
   * List conversations visible to the caller.
   * - STUDENT: their own single thread
   * - TEACHER/ADMIN: all student threads
   */
  async getConversations(
    userId: string,
    role: UserRole,
  ): Promise<IChatConversation[]> {
    const where =
      role === UserRole.STUDENT ? { studentId: userId } : {};

    const convs = await this.convRepo.find({
      where,
      relations: ['student'],
      order: { lastMessageAt: { direction: 'DESC', nulls: 'LAST' } },
    });

    // Compute unread counts
    const convIds = convs.map((c) => c.id);
    const unreadMap = await this.getUnreadCounts(convIds, userId, role);

    return convs.map((c) =>
      this.serializeConversation(c, unreadMap.get(c.id) ?? 0),
    );
  }

  /**
   * Get or create a conversation for a student.
   * Called by students (auto) or by teachers (to start a chat with a student).
   */
  async getOrCreateConversation(
    studentUserId: string,
  ): Promise<IChatConversation> {
    // Verify the student exists
    const student = await this.userRepo.findOneBy({ id: studentUserId });
    if (!student) throw new NotFoundException('Student not found');
    if (student.role !== UserRole.STUDENT) {
      throw new ForbiddenException('Target user is not a student');
    }

    // Check for existing conversation
    let conv = await this.convRepo.findOne({
      where: { studentId: studentUserId },
      relations: ['student'],
    });

    if (!conv) {
      conv = this.convRepo.create({
        studentId: studentUserId,
        lastMessage: null,
        lastMessageAt: null,
      });
      conv = await this.convRepo.save(conv);
      conv = await this.convRepo.findOneOrFail({
        where: { id: conv.id },
        relations: ['student'],
      });
    }

    return this.serializeConversation(conv, 0);
  }

  /* ------------------------------------------------------------------ */
  /*  Messages                                                           */
  /* ------------------------------------------------------------------ */

  /** Paginated message history, newest first. */
  async getMessages(
    conversationId: string,
    userId: string,
    role: UserRole,
    page: number,
  ): Promise<IChatMessagesPage> {
    const conv = await this.convRepo.findOneBy({ id: conversationId });
    if (!conv) throw new NotFoundException('Conversation not found');

    // Students can only view their own thread
    if (role === UserRole.STUDENT && conv.studentId !== userId) {
      throw new ForbiddenException('Not your conversation');
    }

    const [messages, total] = await this.msgRepo.findAndCount({
      where: { conversationId },
      relations: ['sender'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * MESSAGES_PER_PAGE,
      take: MESSAGES_PER_PAGE,
    });

    return {
      items: messages.reverse().map((m) => this.serializeMessage(m)),
      hasMore: page * MESSAGES_PER_PAGE < total,
      page,
    };
  }

  /** Persist a new message and update conversation summary. */
  async sendMessage(
    conversationId: string,
    senderId: string,
    senderRole: UserRole,
    content: string,
    type: ChatMessageType = 'normal',
    imageUrl?: string,
    contextType?: string,
    contextId?: string,
    contextTitle?: string,
    contextMeta?: string,
  ): Promise<IChatMessage> {
    // Fetch conversation + sender in parallel (2 queries concurrently)
    const [conv, sender] = await Promise.all([
      this.convRepo.findOneBy({ id: conversationId }),
      this.userRepo.findOneBy({ id: senderId }),
    ]);
    if (!conv) throw new NotFoundException('Conversation not found');
    if (!sender) throw new NotFoundException('Sender not found');

    // Students can only send in their own thread
    if (senderRole === UserRole.STUDENT && conv.studentId !== senderId) {
      throw new ForbiddenException('Not your conversation');
    }

    // Save message
    const msg = await this.msgRepo.save(
      this.msgRepo.create({
        conversationId,
        senderId,
        content,
        type,
        imageUrl: imageUrl ?? null,
        contextType: contextType ?? null,
        contextId: contextId ?? null,
        contextTitle: contextTitle ?? null,
        contextMeta: contextMeta ?? null,
        readAt: null,
      }),
    );

    // Update conversation denormalized fields (fire-and-forget — don't block response)
    conv.lastMessage = content.length > 100 ? content.slice(0, 100) : content;
    conv.lastMessageAt = msg.createdAt;
    this.convRepo.save(conv).catch(() => { /* ignore */ });

    // Construct response directly — no reload query needed
    msg.sender = sender;
    return this.serializeMessage(msg);
  }

  /**
   * Mark all unread messages in a conversation as read.
   * - Student reads: marks staff messages as read
   * - Staff reads: marks student messages as read
   */
  async markAsRead(
    conversationId: string,
    userId: string,
    role: UserRole,
  ): Promise<{ count: number }> {
    const conv = await this.convRepo.findOneBy({ id: conversationId });
    if (!conv) throw new NotFoundException('Conversation not found');

    if (role === UserRole.STUDENT && conv.studentId !== userId) {
      throw new ForbiddenException('Not your conversation');
    }

    // Student reading → mark staff messages as read
    // Staff reading → mark student messages as read
    const studentId = conv.studentId;
    const senderCondition =
      role === UserRole.STUDENT
        ? 'sender_id != :studentId'
        : 'sender_id = :studentId';

    const result = await this.msgRepo
      .createQueryBuilder()
      .update(ChatMessage)
      .set({ readAt: () => 'CURRENT_TIMESTAMP' })
      .where('conversation_id = :conversationId', { conversationId })
      .andWhere(senderCondition, { studentId })
      .andWhere('read_at IS NULL')
      .execute();

    return { count: result.affected ?? 0 };
  }

  /** Get total unread count across all conversations for a user. */
  async getTotalUnread(userId: string, role: UserRole): Promise<number> {
    if (role === UserRole.STUDENT) {
      // Student: unread = messages in their thread sent by staff, not yet read
      const result = await this.msgRepo
        .createQueryBuilder('m')
        .innerJoin('chat_conversations', 'c', 'm.conversation_id = c.id')
        .where('c.student_id = :userId', { userId })
        .andWhere('m.sender_id != :userId', { userId })
        .andWhere('m.read_at IS NULL')
        .getCount();
      return result;
    }

    // Staff: unread = student messages across ALL conversations not yet read
    const result = await this.msgRepo
      .createQueryBuilder('m')
      .innerJoin('chat_conversations', 'c', 'm.conversation_id = c.id')
      .innerJoin('users', 'sender', 'm.sender_id = sender.id')
      .where("sender.role = 'STUDENT'")
      .andWhere('m.read_at IS NULL')
      .getCount();
    return result;
  }

  /* ------------------------------------------------------------------ */
  /*  Private helpers                                                     */
  /* ------------------------------------------------------------------ */

  private async getUnreadCounts(
    conversationIds: string[],
    userId: string,
    role: UserRole,
  ): Promise<Map<string, number>> {
    if (conversationIds.length === 0) return new Map();

    let qb = this.msgRepo
      .createQueryBuilder('m')
      .select('m.conversation_id', 'conversation_id')
      .addSelect('COUNT(*)', 'cnt')
      .where('m.conversation_id IN (:...ids)', { ids: conversationIds })
      .andWhere('m.read_at IS NULL');

    if (role === UserRole.STUDENT) {
      // Student sees unread from staff
      qb = qb.andWhere('m.sender_id != :userId', { userId });
    } else {
      // Staff sees unread from students
      qb = qb
        .innerJoin('users', 'sender', 'm.sender_id = sender.id')
        .andWhere("sender.role = 'STUDENT'");
    }

    const rows: Array<{ conversation_id: string; cnt: string }> =
      await qb.groupBy('m.conversation_id').getRawMany();

    const map = new Map<string, number>();
    for (const row of rows) {
      map.set(row.conversation_id, Number(row.cnt));
    }
    return map;
  }

  private serializeConversation(
    c: ChatConversation,
    unreadCount: number,
  ): IChatConversation {
    return {
      id: c.id,
      studentId: c.studentId,
      studentName: c.student ? fullName(c.student) : 'Unknown Student',
      studentAvatarUrl: c.student?.avatarUrl ?? null,
      lastMessage: c.lastMessage,
      lastMessageAt: c.lastMessageAt?.toISOString() ?? null,
      unreadCount,
      createdAt: c.createdAt.toISOString(),
    };
  }

  private serializeMessage(m: ChatMessage): IChatMessage {
    return {
      id: m.id,
      conversationId: m.conversationId,
      senderId: m.senderId,
      senderName: m.sender ? fullName(m.sender) : 'Unknown',
      senderRole: m.sender?.role ?? UserRole.STUDENT,
      senderAvatarUrl: m.sender?.avatarUrl ?? null,
      content: m.content,
      type: (m.type as ChatMessageType) || 'normal',
      imageUrl: m.imageUrl ?? null,
      contextType: m.contextType ?? null,
      contextId: m.contextId ?? null,
      contextTitle: m.contextTitle ?? null,
      contextMeta: m.contextMeta ?? null,
      readAt: m.readAt?.toISOString() ?? null,
      createdAt: m.createdAt.toISOString(),
    };
  }
}
