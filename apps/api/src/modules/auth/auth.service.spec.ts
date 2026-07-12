import { ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '@cp/shared';

import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';

describe('AuthService.refreshTokens', () => {
  it('rejects inactive users with USER_BLOCKED before refresh-token comparison', async () => {
    const users = {
      findByIdWithRefreshToken: jest.fn().mockResolvedValue({
        id: 'user-1',
        email: 'student@example.com',
        username: null,
        firstName: 'A',
        lastName: 'Student',
        role: UserRole.STUDENT,
        avatarUrl: null,
        isActive: false,
        refreshTokenHash: 'hash',
        createdAt: new Date('2026-07-12T00:00:00.000Z'),
        updatedAt: new Date('2026-07-12T00:00:00.000Z'),
      }),
    } as unknown as UsersService;
    const jwt = {
      verifyAsync: jest.fn(),
      signAsync: jest.fn(),
    } as unknown as JwtService;
    const config = {
      getOrThrow: jest.fn().mockReturnValue('refresh-secret'),
      get: jest.fn(),
    } as unknown as ConfigService;
    const service = new AuthService(users, jwt, config);

    await expect(service.refreshTokens('user-1', 'refresh')).rejects.toBeInstanceOf(ForbiddenException);
    await expect(service.refreshTokens('user-1', 'refresh')).rejects.toMatchObject({
      response: {
        code: 'USER_BLOCKED',
        message: 'User is blocked',
      },
    });
    expect(jwt.verifyAsync).not.toHaveBeenCalled();
  });
});
