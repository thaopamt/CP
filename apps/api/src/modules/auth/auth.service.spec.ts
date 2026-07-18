import { ForbiddenException, NotFoundException } from '@nestjs/common';
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
        message: 'Tài khoản của bạn đã bị khóa',
      },
    });
    expect(jwt.verifyAsync).not.toHaveBeenCalled();
  });
});

describe('AuthService.generateImpersonationToken', () => {
  const buildUser = (over: Record<string, unknown> = {}) => ({
    id: 'stu-1',
    email: 'student@example.com',
    username: null,
    firstName: 'A',
    lastName: 'Student',
    role: UserRole.STUDENT,
    avatarUrl: null,
    isActive: true,
    createdAt: new Date('2026-07-12T00:00:00.000Z'),
    updatedAt: new Date('2026-07-12T00:00:00.000Z'),
    ...over,
  });

  it('signs an access token with the impersonatedBy claim and no refresh token', async () => {
    const users = {
      findActiveById: jest.fn().mockResolvedValue(buildUser()),
      updateRefreshTokenHash: jest.fn(),
    } as unknown as UsersService;
    const jwt = { signAsync: jest.fn().mockResolvedValue('access-jwt') } as unknown as JwtService;
    const config = {
      get: jest.fn().mockReturnValue('1d'),
      getOrThrow: jest.fn(),
    } as unknown as ConfigService;
    const service = new AuthService(users, jwt, config);

    const result = await service.generateImpersonationToken('stu-1', 'admin-9');

    expect(result.accessToken).toBe('access-jwt');
    expect(result.user.id).toBe('stu-1');
    expect((jwt.signAsync as jest.Mock)).toHaveBeenCalledTimes(1);
    const [payload, opts] = (jwt.signAsync as jest.Mock).mock.calls[0];
    expect(payload).toMatchObject({ sub: 'stu-1', role: UserRole.STUDENT, impersonatedBy: 'admin-9' });
    expect(opts).toMatchObject({ expiresIn: '1d' });
    expect((users.updateRefreshTokenHash as jest.Mock)).not.toHaveBeenCalled();
  });

  it('rejects when the target user is missing or inactive', async () => {
    const users = { findActiveById: jest.fn().mockResolvedValue(null) } as unknown as UsersService;
    const jwt = { signAsync: jest.fn() } as unknown as JwtService;
    const config = { get: jest.fn(), getOrThrow: jest.fn() } as unknown as ConfigService;
    const service = new AuthService(users, jwt, config);

    await expect(service.generateImpersonationToken('stu-x', 'admin-9')).rejects.toBeInstanceOf(NotFoundException);
    expect(jwt.signAsync).not.toHaveBeenCalled();
  });

  it('rejects impersonating a non-student account', async () => {
    const users = {
      findActiveById: jest.fn().mockResolvedValue(buildUser({ role: UserRole.TEACHER })),
    } as unknown as UsersService;
    const jwt = { signAsync: jest.fn() } as unknown as JwtService;
    const config = { get: jest.fn(), getOrThrow: jest.fn() } as unknown as ConfigService;
    const service = new AuthService(users, jwt, config);

    await expect(service.generateImpersonationToken('tea-1', 'admin-9')).rejects.toBeInstanceOf(ForbiddenException);
    expect(jwt.signAsync).not.toHaveBeenCalled();
  });
});
