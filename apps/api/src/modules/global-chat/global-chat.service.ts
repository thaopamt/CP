import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  GlobalChatAuditAction,
  GlobalChatMessage,
  GlobalChatMessageStatus,
  GlobalChatMessagesResponse,
  GlobalChatNotificationType,
  GlobalChatReadResponse,
  GlobalChatUnreadCountResponse,
  JwtPayload,
  UserRole,
} from '@cp/shared';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';

import { UsersService } from '../users/users.service';
import { User } from '../users/user.entity';
import { GlobalChatMessageEntity } from './entities/global-chat-message.entity';
import { GlobalChatMessageReadEntity } from './entities/global-chat-message-read.entity';
import { NotificationEntity } from './entities/global-chat-notification.entity';
import { AuditLogEntity } from './entities/audit-log.entity';

const MAX_MESSAGE_LENGTH = 2000;
const SHORT_WINDOW_MS = 10_000;
const LONG_WINDOW_MS = 60_000;
const DUPLICATE_WINDOW_MS = 3_000;

interface SendContext {
  ipAddress?: string | null;
  userAgent?: string | null;
}

interface RateBucket {
  short: number[];
  long: number[];
  lastContent?: string;
  lastContentAt?: number;
}

@Injectable()
export class GlobalChatService {
  private readonly rateBuckets = new Map<string, RateBucket>();

  constructor(
    private readonly users: UsersService,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(GlobalChatMessageEntity)
    private readonly messageRepo: Repository<GlobalChatMessageEntity>,
    @InjectRepository(GlobalChatMessageReadEntity)
    private readonly readRepo: Repository<GlobalChatMessageReadEntity>,
    @InjectRepository(NotificationEntity)
    private readonly notificationRepo: Repository<NotificationEntity>,
    @InjectRepository(AuditLogEntity)
    private readonly auditRepo: Repository<AuditLogEntity>,
  ) { }

  async listMessages(
    user: JwtPayload,
    limit: number,
    before?: string,
  ): Promise<GlobalChatMessagesResponse> {
    await this.assertActiveUser(user.sub);

    const safeLimit = Math.min(Math.max(limit || 30, 1), 100);
    const qb = this.messageRepo
      .createQueryBuilder('message')
      .leftJoinAndSelect('message.sender', 'sender')
      .where('message.deletedAt IS NULL')
      .orderBy('message.createdAt', 'DESC')
      .addOrderBy('message.id', 'DESC')
      .take(safeLimit + 1);

    if (before) {
      const cursor = await this.messageRepo.findOne({ where: { id: before } });
      if (!cursor) {
        throw new BadRequestException('Invalid cursor');
      }
      qb.andWhere(
        new Brackets((subQb) => {
          subQb
            .where('message.createdAt < :cursorCreatedAt', {
              cursorCreatedAt: cursor.createdAt,
            })
            .orWhere('message.createdAt = :cursorCreatedAt AND message.id < :cursorId', {
              cursorCreatedAt: cursor.createdAt,
              cursorId: cursor.id,
            });
        }),
      );
    }

    const rows = await qb.getMany();
    const hasMore = rows.length > safeLimit;
    const page = hasMore ? rows.slice(0, safeLimit) : rows;

    return {
      items: page.map((message) => this.serializeMessage(message)),
      nextCursor: hasMore ? page[page.length - 1]?.id ?? null : null,
    };
  }

  async sendMessage(
    user: JwtPayload | User,
    content: string,
    context: SendContext = {},
  ): Promise<GlobalChatMessage> {
    const activeUser = await this.resolveActiveUser(user);
    const sanitized = this.sanitizeContent(content);
    if (!sanitized) {
      throw new BadRequestException('Message cannot be empty');
    }
    if (sanitized.length > MAX_MESSAGE_LENGTH) {
      throw new BadRequestException(`Message cannot exceed ${MAX_MESSAGE_LENGTH} characters`);
    }

    await this.assertRateLimit(activeUser, sanitized, context);

    const entity = this.messageRepo.create({
      senderId: activeUser.id,
      sender: activeUser,
      content: sanitized,
      contentPlain: sanitized,
      status: GlobalChatMessageStatus.VISIBLE,
      hiddenAt: null,
      hiddenById: null,
      hiddenReason: null,
    });
    const saved = await this.messageRepo.save(entity);
    saved.sender = activeUser;

    void this.createNotificationsForMessage(saved).catch(() => undefined);
    return this.serializeMessage(saved);
  }

  async hideMessage(
    admin: JwtPayload,
    messageId: string,
    reason?: string,
    context: SendContext = {},
  ): Promise<GlobalChatMessage> {
    const activeAdmin = await this.assertActiveUser(admin.sub);
    if (activeAdmin.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can hide messages');
    }

    const message = await this.messageRepo.findOne({
      where: { id: messageId },
      relations: { sender: true },
    });
    if (!message) {
      throw new NotFoundException('Message not found');
    }
    if (message.status === GlobalChatMessageStatus.HIDDEN) {
      throw new ConflictException('Message is already hidden');
    }

    message.status = GlobalChatMessageStatus.HIDDEN;
    message.hiddenAt = new Date();
    message.hiddenById = activeAdmin.id;
    message.hiddenReason = this.sanitizeContent(reason ?? 'Hidden by admin').slice(0, 255);
    const saved = await this.messageRepo.save(message);

    await this.auditRepo.save(
      this.auditRepo.create({
        actorId: activeAdmin.id,
        action: GlobalChatAuditAction.MESSAGE_HIDE,
        targetType: 'global_chat_message',
        targetId: saved.id,
        metadata: { reason: saved.hiddenReason },
        ipAddress: context.ipAddress ?? null,
        userAgent: context.userAgent ?? null,
      }),
    );

    return this.serializeMessage(saved);
  }

  async markRead(user: JwtPayload | User, lastReadMessageId: string): Promise<GlobalChatReadResponse> {
    const activeUser = await this.resolveActiveUser(user);
    const message = await this.messageRepo.findOne({ where: { id: lastReadMessageId } });
    if (!message) {
      throw new BadRequestException('Invalid message');
    }

    const existing = await this.readRepo.findOne({ where: { userId: activeUser.id } });
    const shouldKeepExisting =
      existing?.lastReadAt && existing.lastReadAt.getTime() > message.createdAt.getTime();

    const read = existing ?? this.readRepo.create({ userId: activeUser.id });
    if (!shouldKeepExisting) {
      read.lastReadMessageId = message.id;
      read.lastReadAt = message.createdAt;
    }

    if (!existing) {
      read.lastReadMessageId = message.id;
      read.lastReadAt = message.createdAt;
    }

    const saved = await this.readRepo.save(read);
    const { unreadCount } = await this.getUnreadCount(activeUser);
    return {
      lastReadAt: saved.lastReadAt.toISOString(),
      unreadCount,
    };
  }

  async getUnreadCount(user: JwtPayload | User): Promise<GlobalChatUnreadCountResponse> {
    const activeUser = await this.resolveActiveUser(user);
    return this.getUnreadCountForUser(activeUser);
  }

  async getUnreadCountForUserId(userId: string): Promise<GlobalChatUnreadCountResponse> {
    const activeUser = await this.assertActiveUser(userId);
    return this.getUnreadCountForUser(activeUser);
  }

  private async getUnreadCountForUser(activeUser: User): Promise<GlobalChatUnreadCountResponse> {
    const read = await this.readRepo.findOne({ where: { userId: activeUser.id } });

    const qb = this.messageRepo
      .createQueryBuilder('message')
      .where('message.status = :status', { status: GlobalChatMessageStatus.VISIBLE })
      .andWhere('message.senderId != :userId', { userId: activeUser.id })
      .andWhere('message.deletedAt IS NULL');

    if (read?.lastReadMessageId) {
      qb.andWhere(
        'message.createdAt > (SELECT m.created_at FROM global_chat_messages m WHERE m.id = :lastReadMessageId)',
        { lastReadMessageId: read.lastReadMessageId },
      );
    } else if (read?.lastReadAt) {
      qb.andWhere('message.createdAt > :lastReadAt', { lastReadAt: read.lastReadAt });
    }

    return { unreadCount: await qb.getCount() };
  }

  async getLatestVisibleMessage(): Promise<GlobalChatMessage | null> {
    const latest = await this.messageRepo.findOne({
      where: { status: GlobalChatMessageStatus.VISIBLE },
      relations: { sender: true },
      order: { createdAt: 'DESC' },
    });
    return latest ? this.serializeMessage(latest) : null;
  }

  async assertActiveUser(userId: string): Promise<User> {
    const user = await this.users.findActiveById(userId);
    if (!user) {
      throw new ForbiddenException('User is inactive');
    }
    return user;
  }

  sanitizeContent(content: string): string {
    return String(content ?? '')
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/gi, ' ')
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .split('\n')
      .map((line) => line.replace(/[ \t]+/g, ' ').trim())
      .join('\n')
      .trim();
  }

  serializeMessage(message: GlobalChatMessageEntity): GlobalChatMessage {
    const sender = message.sender;
    const hidden = message.status === GlobalChatMessageStatus.HIDDEN;

    return {
      id: message.id,
      content: hidden ? '' : message.contentPlain,
      status: message.status,
      createdAt: message.createdAt.toISOString(),
      updatedAt: message.updatedAt?.toISOString(),
      hiddenAt: message.hiddenAt?.toISOString() ?? null,
      hiddenReason: message.hiddenReason,
      sender: {
        id: message.senderId,
        name: sender ? `${sender.firstName} ${sender.lastName}`.trim() : 'Unknown user',
        avatarUrl: sender?.avatarUrl ?? null,
        role: sender?.role ?? UserRole.STUDENT,
      },
    };
  }

  private async resolveActiveUser(user: JwtPayload | User): Promise<User> {
    const userId = 'sub' in user ? user.sub : user.id;
    return this.assertActiveUser(userId);
  }

  private async assertRateLimit(
    user: User,
    content: string,
    context: SendContext,
  ): Promise<void> {
    const now = Date.now();
    const bucket = this.rateBuckets.get(user.id) ?? { short: [], long: [] };
    bucket.short = bucket.short.filter((time) => now - time < SHORT_WINDOW_MS);
    bucket.long = bucket.long.filter((time) => now - time < LONG_WINDOW_MS);

    const normalized = content.toLocaleLowerCase();
    const isDuplicate =
      bucket.lastContent === normalized &&
      bucket.lastContentAt !== undefined &&
      now - bucket.lastContentAt < DUPLICATE_WINDOW_MS;

    if (bucket.short.length >= 5 || bucket.long.length >= 30 || isDuplicate) {
      this.rateBuckets.set(user.id, bucket);
      await this.recordRateLimited(user, {
        ...context,
        shortCount: bucket.short.length,
        longCount: bucket.long.length,
        duplicate: isDuplicate,
      });
      throw new HttpException('Too many messages. Please slow down.', HttpStatus.TOO_MANY_REQUESTS);
    }

    bucket.short.push(now);
    bucket.long.push(now);
    bucket.lastContent = normalized;
    bucket.lastContentAt = now;
    this.rateBuckets.set(user.id, bucket);
  }

  private async recordRateLimited(
    user: User,
    metadata: SendContext & { shortCount: number; longCount: number; duplicate: boolean },
  ): Promise<void> {
    await this.auditRepo.save(
      this.auditRepo.create({
        actorId: user.id,
        action: GlobalChatAuditAction.RATE_LIMITED,
        targetType: 'global_chat_message',
        targetId: null,
        metadata: {
          shortCount: metadata.shortCount,
          longCount: metadata.longCount,
          duplicate: metadata.duplicate,
        },
        ipAddress: metadata.ipAddress ?? null,
        userAgent: metadata.userAgent ?? null,
      }),
    );
  }

  private async createNotificationsForMessage(message: GlobalChatMessageEntity): Promise<void> {
    // Don't notify anyone when a student sends a chat message.
    const senderRole =
      message.sender?.role ??
      (await this.userRepo.findOne({ where: { id: message.senderId }, select: ['role'] }))?.role;
    if (senderRole === UserRole.STUDENT) return;

    const recipients = await this.userRepo
      .createQueryBuilder('user')
      .select(['user.id'])
      .where('user.isActive = :isActive', { isActive: true })
      .andWhere('user.id != :senderId', { senderId: message.senderId })
      .getMany();

    if (recipients.length === 0) return;

    await this.notificationRepo.insert(
      recipients.map((user) => ({
        userId: user.id,
        type: GlobalChatNotificationType.GLOBAL_CHAT_MESSAGE,
        title: 'Tin nhắn mới trong Chat',
        body: message.contentPlain.slice(0, 500),
        data: { messageId: message.id, senderId: message.senderId },
        readAt: null,
      })),
    );
  }
}
