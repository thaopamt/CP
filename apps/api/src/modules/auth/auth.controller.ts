import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  UnauthorizedException,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync, unlinkSync } from 'fs';
import { randomUUID } from 'crypto';
import { IUser, JwtPayload, LoginResponse, RefreshRequest } from '@cp/shared';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AuthService } from './auth.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { LoginDto } from './dto/login.dto';
import { UpdateMeDto } from './dto/update-me.dto';

const UPLOADS_DIR = join(process.cwd(), 'uploads', 'avatars');
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto): Promise<LoginResponse> {
    return this.auth.login(dto.email, dto.password);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() dto: RefreshRequest): Promise<LoginResponse> {
    // Note: The userId should typically come from the refresh token payload itself,
    // but the JWT library can decode it without verification if needed.
    // Alternatively, we verify it first.
    // Wait, the `refreshTokens` method requires `userId`. I need to decode the token.
    // Let me revise how I decode the token. I'll just decode it.
    const decoded = this.auth['jwt'].decode(dto.refreshToken) as JwtPayload;
    if (!decoded || !decoded.sub) {
      throw new UnauthorizedException('Invalid refresh token payload');
    }
    return this.auth.refreshTokens(decoded.sub, dto.refreshToken);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logout(@CurrentUser() user: JwtPayload): Promise<{ success: boolean }> {
    await this.auth.logout(user.sub);
    return { success: true };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: JwtPayload): Promise<IUser> {
    return this.auth.getCurrentUser(user.sub);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  updateMe(@CurrentUser() user: JwtPayload, @Body() dto: UpdateMeDto): Promise<IUser> {
    return this.auth.updateCurrentUser(user.sub, dto);
  }

  @Post('me/avatar')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('avatar', {
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          if (!existsSync(UPLOADS_DIR)) {
            mkdirSync(UPLOADS_DIR, { recursive: true });
          }
          cb(null, UPLOADS_DIR);
        },
        filename: (_req, file, cb) => {
          const ext = extname(file.originalname).toLowerCase() || '.jpg';
          cb(null, `${randomUUID()}${ext}`);
        },
      }),
      limits: { fileSize: MAX_FILE_SIZE },
      fileFilter: (_req, file, cb) => {
        if (!ALLOWED_MIME.includes(file.mimetype)) {
          return cb(
            new BadRequestException(
              `Unsupported file type: ${file.mimetype}. Allowed: ${ALLOWED_MIME.join(', ')}`,
            ),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  async uploadAvatar(
    @CurrentUser() user: JwtPayload,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<IUser> {
    if (!file) {
      throw new BadRequestException('No file uploaded.');
    }
    // Build the public URL path
    const avatarUrl = `/api/uploads/avatars/${file.filename}`;

    // Delete old avatar file if it was a local upload
    const currentUser = await this.auth.getCurrentUser(user.sub);
    if (currentUser.avatarUrl?.startsWith('/api/uploads/avatars/')) {
      const oldFilename = currentUser.avatarUrl.split('/').pop();
      if (oldFilename) {
        const oldPath = join(UPLOADS_DIR, oldFilename);
        try {
          if (existsSync(oldPath)) unlinkSync(oldPath);
        } catch {
          /* ignore cleanup errors */
        }
      }
    }

    return this.auth.updateCurrentUser(user.sub, { avatarUrl });
  }

  @Delete('me/avatar')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async deleteAvatar(@CurrentUser() user: JwtPayload): Promise<IUser> {
    const currentUser = await this.auth.getCurrentUser(user.sub);
    if (currentUser.avatarUrl?.startsWith('/api/uploads/avatars/')) {
      const filename = currentUser.avatarUrl.split('/').pop();
      if (filename) {
        const filePath = join(UPLOADS_DIR, filename);
        try {
          if (existsSync(filePath)) unlinkSync(filePath);
        } catch {
          /* ignore */
        }
      }
    }
    return this.auth.updateCurrentUser(user.sub, { avatarUrl: null });
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  changePassword(
    @CurrentUser() user: JwtPayload,
    @Body() dto: ChangePasswordDto,
  ): Promise<{ success: boolean }> {
    return this.auth.changePassword(user.sub, dto.currentPassword, dto.newPassword);
  }
}
