import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { IUser, JwtPayload, LoginResponse, RefreshRequest } from '@cp/shared';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AuthService } from './auth.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { LoginDto } from './dto/login.dto';
import { UpdateMeDto } from './dto/update-me.dto';

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
