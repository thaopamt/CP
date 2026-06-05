import { Body, Controller, Param, ParseUUIDPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { Crud, CrudController, Override } from '@dataui/crud';
import { UserRole } from '@cp/shared';

import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { ClassEntity } from './class.entity';
import { ClassesService } from './classes.service';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';

/**
 * RESTful surface for `classes` (course offerings, NOT curriculum).
 *
 *   GET    /api/classes           — list (any auth user)
 *   GET    /api/classes/:id       — one (any auth user)
 *   POST   /api/classes           — create class (ADMIN, custom override)
 *   PATCH  /api/classes/:id       — partial (ADMIN)
 *   PUT    /api/classes/:id       — full replace (ADMIN)
 *   DELETE /api/classes/:id       — soft delete via @DeleteDateColumn (ADMIN)
 */
@Crud({
  model: { type: ClassEntity },
  dto: {
    create: CreateClassDto,
    update: UpdateClassDto,
    replace: CreateClassDto,
  },
  query: {
    sort: [{ field: 'createdAt', order: 'DESC' }],
    join: {
      instructor: { eager: true },
    },
  },
  routes: {
    exclude: ['updateOneBase'],
    createOneBase: { decorators: [Roles(UserRole.ADMIN)] },
    createManyBase: { decorators: [Roles(UserRole.ADMIN)] },
    replaceOneBase: { decorators: [Roles(UserRole.ADMIN)] },
    deleteOneBase: { decorators: [Roles(UserRole.ADMIN)] },
  },
  params: { id: { field: 'id', type: 'uuid', primary: true } },
})
@Controller('classes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ClassesController implements CrudController<ClassEntity> {
  constructor(public service: ClassesService) { }

  @Override('createOneBase')
  @Roles(UserRole.ADMIN)
  @Post()
  async createOne(@Body() dto: CreateClassDto): Promise<ClassEntity> {
    return this.service.createClass(dto);
  }

  @Roles(UserRole.ADMIN)
  @Patch(':id')
  async updateClass(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateClassDto,
  ): Promise<ClassEntity> {
    return this.service.updateClass(id, dto);
  }
}
