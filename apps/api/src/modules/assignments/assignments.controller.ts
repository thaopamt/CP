import { Body, Controller, Param, ParseUUIDPipe, Patch, Post, Get, UseGuards, Query } from '@nestjs/common';
import { Crud, CrudController, Override } from '@dataui/crud';
import { UserRole } from '@cp/shared';

import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '@cp/shared';
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

  @Get('me/tasks')
  async getMyTasks(
    @CurrentUser() user: JwtPayload,
    @Query('page') pageStr?: string,
    @Query('limit') limitStr?: string,
    @Query('search') search?: string,
    @Query('category') category?: string,
    @Query('difficulty') difficulty?: string,
  ) {
    const page = pageStr ? parseInt(pageStr, 10) : 1;
    const limit = limitStr ? parseInt(limitStr, 10) : 10;
    return this.service.getAssignmentsForStudent(user.sub, {
      page, limit, search, category, difficulty
    });
  }

  @Get('me/feedback')
  async getMyFeedback(@CurrentUser() user: JwtPayload) {
    return [
      {
        id: 'fb1',
        assignmentId: 'as5',
        assignmentTitle: 'Seed Lab',
        teacherName: 'Vega',
        postedAt: new Date(Date.now() - 2 * 60 * 60_000).toISOString(),
        text: 'Great work on the lab, but make sure to double check your bounds.',
      },
      {
        id: 'fb2',
        assignmentId: 'as4',
        assignmentTitle: 'Linear Algebra',
        teacherName: 'Davis',
        postedAt: new Date(Date.now() - 26 * 60 * 60_000).toISOString(),
        text: 'Good understanding of the concepts.',
      },
    ];
  }

  @Get(':id/implicit-classes')
  async getImplicitClasses(@Param('id', new ParseUUIDPipe()) id: string): Promise<string[]> {
    return this.service.getImplicitClasses(id);
  }

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
