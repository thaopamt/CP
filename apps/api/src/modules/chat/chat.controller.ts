import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { randomUUID } from 'crypto';
import { JwtPayload, UserRole } from '@cp/shared';
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

import { ChatService } from './chat.service';
import { SendMessageDto, StartConversationDto } from './dto/chat.dto';

const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): JwtPayload => {
    return ctx.switchToHttp().getRequest<{ user: JwtPayload }>().user;
  },
);

@Controller('chat')
@UseGuards(AuthGuard('jwt'))
export class ChatController {
  constructor(private readonly chat: ChatService) {}

  /** List conversations visible to the caller. */
  @Get('conversations')
  getConversations(@CurrentUser() user: JwtPayload) {
    return this.chat.getConversations(user.sub, user.role);
  }

  /**
   * Get or create a conversation for a student.
   * - Students call this with no body → auto-creates their own thread.
   * - Teachers/admins call this with { studentUserId } → create thread for a student.
   */
  @Post('conversations')
  createConversation(
    @CurrentUser() user: JwtPayload,
    @Body() dto: StartConversationDto,
  ) {
    // Students always get their own thread
    const studentId =
      user.role === 'STUDENT' ? user.sub : dto.studentUserId;
    if (!studentId) {
      throw new Error('studentUserId is required for staff');
    }
    return this.chat.getOrCreateConversation(studentId);
  }

  /** Paginated message history. */
  @Get('conversations/:id/messages')
  getMessages(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Query('page') page?: string,
  ) {
    return this.chat.getMessages(id, user.sub, user.role, Number(page) || 1);
  }

  /** Send a message. */
  @Post('conversations/:id/messages')
  sendMessage(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SendMessageDto,
  ) {
    return this.chat.sendMessage(id, user.sub, user.role, dto.content, dto.type, dto.imageUrl);
  }

  /** Mark messages as read. */
  @Post('conversations/:id/read')
  markAsRead(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.chat.markAsRead(id, user.sub, user.role);
  }

  /** Total unread count (for badge). */
  @Get('unread-count')
  getUnreadCount(@CurrentUser() user: JwtPayload) {
    return this.chat.getTotalUnread(user.sub, user.role);
  }

  /** Upload image for chat message (staff only). */
  @Post('upload')
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          const dir = join(process.cwd(), 'uploads', 'chat');
          if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
          cb(null, dir);
        },
        filename: (_req, file, cb) => {
          const ext = extname(file.originalname).toLowerCase() || '.png';
          cb(null, `${randomUUID()}${ext}`);
        },
      }),
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowed.includes(file.mimetype)) {
          return cb(new BadRequestException(`Unsupported file type: ${file.mimetype}`), false);
        }
        cb(null, true);
      },
    }),
  )
  uploadImage(
    @CurrentUser() user: JwtPayload,
    @UploadedFile() file: Express.Multer.File,
  ): { url: string } {
    if (user.role === UserRole.STUDENT) {
      throw new BadRequestException('Students cannot upload chat images');
    }
    if (!file) throw new BadRequestException('No file uploaded.');
    return { url: `/api/uploads/chat/${file.filename}` };
  }
}
