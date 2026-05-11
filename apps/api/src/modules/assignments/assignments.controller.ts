import { Body, Controller, Param, ParseUUIDPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { Crud, CrudController, Override } from '@dataui/crud';
import { UserRole } from '@cp/shared';

import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Assignment } from './assignment.entity';
import { AssignmentsService } from './assignments.service';
import { CreateAssignmentDto, UpdateAssignmentDto } from './dto/create-assignment.dto';

@Crud({
  model: { type: Assignment },
  dto: { create: CreateAssignmentDto, update: UpdateAssignmentDto, replace: CreateAssignmentDto },
  query: { sort: [{ field: 'createdAt', order: 'DESC' }] },
  routes: {
    exclude: ['updateOneBase'],
    createOneBase: { decorators: [Roles(UserRole.ADMIN)] },
    createManyBase: { decorators: [Roles(UserRole.ADMIN)] },
    replaceOneBase: { decorators: [Roles(UserRole.ADMIN)] },
    deleteOneBase: { decorators: [Roles(UserRole.ADMIN)] },
  },
  params: { id: { field: 'id', type: 'uuid', primary: true } },
})
@Controller('assignments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AssignmentsController implements CrudController<Assignment> {
  constructor(public service: AssignmentsService) {}

  @Override('createOneBase')
  @Roles(UserRole.ADMIN)
  @Post()
  async createOne(@Body() dto: CreateAssignmentDto): Promise<Assignment> {
    return this.service.createAssignment(dto);
  }

  @Roles(UserRole.ADMIN)
  @Patch(':id')
  async updateOne(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateAssignmentDto,
  ): Promise<Assignment> {
    return this.service.updateAssignment(id, dto);
  }
}
