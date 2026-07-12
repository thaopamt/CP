import { ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayload } from '@cp/shared';

import { UsersService } from '../../users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    cfg: ConfigService,
    private readonly users: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: cfg.getOrThrow<string>('JWT_SECRET'),
    });
  }

  /**
   * Whatever this returns becomes `req.user` for downstream guards/handlers.
   * The shape matches `JwtPayload` from `@cp/shared` so RolesGuard can
   * read `user.role` directly.
   */
  async validate(payload: JwtPayload): Promise<JwtPayload> {
    const user = await this.users.findActiveById(payload.sub);
    if (!user) {
      throw new ForbiddenException({
        code: 'USER_BLOCKED',
        message: 'User is blocked',
      });
    }

    return payload;
  }
}
