import {
  Body,
  Controller,
  Delete,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Crud, CrudController } from '@dataui/crud';
import { UserRole } from '@cp/shared';

import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { User } from './user.entity';
import { UsersService } from './users.service';
import { CreateTeacherDto } from './dto/create-teacher.dto';
import { UpdateTeacherDto } from './dto/update-teacher.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

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

  /**
   * Teacher (and other admin-managed account) operations. These live on
   * `/users/teachers*` so they sit alongside — and never collide with — the
   * auto-generated @dataui/crud routes (`GET /users`, `GET /users/:id`).
   * Listing reuses the CRUD `getManyBase` with an `?s={"role":"TEACHER"}`
   * filter from the client. Creating/resetting hash the password server-side,
   * which the raw CRUD create cannot do.
   */
  @Roles(UserRole.ADMIN)
  @Post('teachers')
  createTeacher(@Body() dto: CreateTeacherDto): Promise<User> {
    return this.service.createUser({ ...dto, role: UserRole.TEACHER });
  }

  @Roles(UserRole.ADMIN)
  @Patch('teachers/:id')
  updateTeacher(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateTeacherDto,
  ): Promise<User> {
    return this.service.adminUpdate(id, dto);
  }

  @Roles(UserRole.ADMIN)
  @Post('teachers/:id/reset-password')
  async resetPassword(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: ResetPasswordDto,
  ): Promise<{ success: boolean }> {
    await this.service.resetPassword(id, dto.newPassword);
    return { success: true };
  }

  @Roles(UserRole.ADMIN)
  @Delete('teachers/:id')
  async deleteTeacher(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<{ success: boolean }> {
    await this.service.deleteUser(id);
    return { success: true };
  }
}
