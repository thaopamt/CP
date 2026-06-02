import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { IUser, JwtPayload, LoginResponse } from '@cp/shared';

import { UsersService } from '../users/users.service';
import { User } from '../users/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
  ) {}

  async login(email: string, password: string): Promise<LoginResponse> {
    const user = await this.users.findByEmailWithPassword(email);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
    const accessToken = await this.jwt.signAsync(payload);

    return {
      accessToken,
      user: this.serializeUser(user),
    };
  }

  async getCurrentUser(userId: string): Promise<IUser> {
    const user = await this.users.findActiveById(userId);
    if (!user) throw new NotFoundException(`User ${userId} not found`);
    return this.serializeUser(user);
  }

  async updateCurrentUser(
    userId: string,
    patch: {
      firstName?: string;
      lastName?: string;
      username?: string | null;
      avatarUrl?: string | null;
    },
  ): Promise<IUser> {
    const user = await this.users.updateOwnProfile(userId, patch);
    return this.serializeUser(user);
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<{ success: boolean }> {
    const user = await this.users.findByIdWithPassword(userId);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const ok = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.users.updatePasswordHash(user.id, await bcrypt.hash(newPassword, 10));
    return { success: true };
  }

  private serializeUser(user: User): IUser {
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      avatarUrl: user.avatarUrl,
      isActive: user.isActive,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }
}
