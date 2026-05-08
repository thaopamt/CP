import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtPayload, UserRole } from '@cp/shared';

import { ROLES_KEY } from '../decorators/roles.decorator';

/**
 * Compares the caller's role (set on req.user by JwtStrategy.validate)
 * to the @Roles() metadata on the handler/class. Allows through if no
 * @Roles() metadata is present.
 *
 * Pair with AuthGuard('jwt') — RolesGuard does NOT authenticate, it only
 * authorizes:
 *
 *     @UseGuards(AuthGuard('jwt'), RolesGuard)
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<UserRole[] | undefined>(
      ROLES_KEY,
      [ctx.getHandler(), ctx.getClass()],
    );
    if (!required || required.length === 0) return true;

    const { user } = ctx.switchToHttp().getRequest<{ user?: JwtPayload }>();
    return !!user && required.includes(user.role);
  }
}
