import { ExecutionContext, createParamDecorator } from '@nestjs/common';
import { JwtPayload } from '@cp/shared';

/**
 * Inject the JWT payload populated by JwtStrategy.validate().
 *
 *   @Get('me')
 *   me(@CurrentUser() user: JwtPayload) { ... }
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): JwtPayload => {
    const req = ctx.switchToHttp().getRequest();
    return req.user;
  },
);
