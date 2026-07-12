import { ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserRole } from '@cp/shared';

import { UsersService } from '../../users/users.service';
import { JwtStrategy } from './jwt.strategy';

function makeStrategy(activeUser: unknown) {
  const cfg = {
    getOrThrow: jest.fn().mockReturnValue('test-secret'),
  } as unknown as ConfigService;
  const users = {
    findActiveById: jest.fn().mockResolvedValue(activeUser),
  } as unknown as UsersService;

  return {
    strategy: new JwtStrategy(cfg, users),
    users,
  };
}

describe('JwtStrategy', () => {
  const payload = {
    sub: 'user-1',
    email: 'student@example.com',
    role: UserRole.STUDENT,
  };

  it('returns the JWT payload when the account is active', async () => {
    const { strategy, users } = makeStrategy({ id: 'user-1' });

    await expect(strategy.validate(payload)).resolves.toEqual(payload);
    expect(users.findActiveById).toHaveBeenCalledWith('user-1');
  });

  it('rejects inactive or missing accounts with USER_BLOCKED', async () => {
    const { strategy } = makeStrategy(null);

    await expect(strategy.validate(payload)).rejects.toBeInstanceOf(ForbiddenException);
    await expect(strategy.validate(payload)).rejects.toMatchObject({
      response: {
        code: 'USER_BLOCKED',
        message: 'User is blocked',
      },
    });
  });
});
