import { SetMetadata } from '@nestjs/common';
import { UserRole } from '@cp/shared';

export const ROLES_KEY = 'roles';

/**
 * Attach required roles to a route handler or controller class.
 * Read by RolesGuard via Reflector.getAllAndOverride.
 *
 *   @Roles(UserRole.ADMIN)
 *   @Post()
 *   create() { ... }
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
