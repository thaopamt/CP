import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { JwtPayload } from '@cp/shared';

import { UsersService } from '../../modules/users/users.service';

@Injectable()
export class ActiveUserGuard implements CanActivate {
  constructor(private readonly users: UsersService) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest<{ user?: JwtPayload }>();
    const userId = req.user?.sub;
    if (!userId) {
      throw new ForbiddenException('Authenticated user is required');
    }

    const user = await this.users.findActiveById(userId);
    if (!user) {
      throw new ForbiddenException('User is inactive');
    }

    return true;
  }
}
