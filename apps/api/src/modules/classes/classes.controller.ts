import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { Crud, CrudController, Override } from '@dataui/crud';
import { UserRole } from '@cp/shared';

import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { ClassEntity } from './class.entity';
import { ClassesService } from './classes.service';
import { CreateClassDto } from './dto/create-class.dto';

/**
 * RESTful surface for `classes` (course offerings, NOT curriculum).
 *
 *   GET    /api/classes           — list (any auth user)
 *   GET    /api/classes/:id       — one (any auth user)
 *   POST   /api/classes           — create with sessions (ADMIN, custom override)
 *   PATCH  /api/classes/:id       — partial (ADMIN)
 *   PUT    /api/classes/:id       — full replace (ADMIN)
 *   DELETE /api/classes/:id       — soft delete via @DeleteDateColumn (ADMIN)
 */
@Crud({
  model: { type: ClassEntity },
  query: {
    sort: [{ field: 'createdAt', order: 'DESC' }],
    join: {
      instructor: { eager: true },
      sessions: { eager: true },
    },
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
@Controller('classes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ClassesController implements CrudController<ClassEntity> {
  constructor(public service: ClassesService) {}

  /**
   * Override the default `createOneBase` so we can validate against the
   * `CreateClassDto` schema (which requires sessions[]) and run the
   * write inside a transaction.
   */
  @Override('createOneBase')
  @Roles(UserRole.ADMIN)
  @Post()
  async createOne(@Body() dto: CreateClassDto): Promise<ClassEntity> {
    return this.service.createWithSessions(dto);
  }
}
