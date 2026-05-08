import { Controller, UseGuards } from '@nestjs/common';
import { Crud, CrudController } from '@dataui/crud';
import { UserRole } from '@cp/shared';

import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { User } from './user.entity';
import { UsersService } from './users.service';

/**
 * ────────────────────────────────────────────────────────────────────────
 *  Sample @dataui/crud controller
 * ────────────────────────────────────────────────────────────────────────
 * Inherits the full RESTful surface from @dataui/crud:
 *
 *   GET    /api/users         (getManyBase)   — any authenticated user
 *   GET    /api/users/:id     (getOneBase)    — any authenticated user
 *   POST   /api/users         (createOneBase) — ADMIN only (per-route @Roles)
 *   POST   /api/users/bulk    (createManyBase)— ADMIN only
 *   PATCH  /api/users/:id     (updateOneBase) — ADMIN only
 *   PUT    /api/users/:id     (replaceOneBase)— ADMIN only
 *   DELETE /api/users/:id     (deleteOneBase) — ADMIN only
 *
 * The class-level `@UseGuards(JwtAuthGuard, RolesGuard)` enforces auth on
 * every route. The per-route `decorators: [Roles(UserRole.ADMIN)]` adds
 * authorization on top — RolesGuard reads metadata reflectively.
 *
 * `query.exclude: ['passwordHash']` is belt-and-suspenders: the entity
 * also has `@Column({ select: false })` so the hash never even reaches
 * the JSON serializer. Both layers stay in place because either alone
 * is one config-mistake away from leaking credentials.
 */
@Crud({
  model: { type: User },
  query: {
    exclude: ['passwordHash'],
    sort: [{ field: 'createdAt', order: 'DESC' }],
    join: {},
  },
  routes: {
    createOneBase: { decorators: [Roles(UserRole.ADMIN)] },
    createManyBase: { decorators: [Roles(UserRole.ADMIN)] },
    updateOneBase: { decorators: [Roles(UserRole.ADMIN)] },
    replaceOneBase: { decorators: [Roles(UserRole.ADMIN)] },
    deleteOneBase: { decorators: [Roles(UserRole.ADMIN)] },
  },
  params: { id: { field: 'id', type: 'uuid', primary: true } },
})
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController implements CrudController<User> {
  constructor(public service: UsersService) {}
}
