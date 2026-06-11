import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Crud, CrudController, Override } from '@dataui/crud';
import { UserRole } from '@cp/shared';

import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Course } from './course.entity';
import { CourseAssignment } from './course-assignment.entity';
import { CoursesService } from './courses.service';
import {
  AttachAssignmentsDto,
  CreateCourseDto,
  ReorderDto,
  UpdateCourseDto,
} from './dto/course.dto';

@Crud({
  model: { type: Course },
  dto: { create: CreateCourseDto, update: UpdateCourseDto, replace: CreateCourseDto },
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
@Controller('courses')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CoursesController implements CrudController<Course> {
  constructor(public service: CoursesService) {}

  @Override('createOneBase')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Post()
  async createOne(@Body() dto: CreateCourseDto): Promise<Course> {
    return this.service.createCourse(dto);
  }

  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Patch(':id')
  async updateOne(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateCourseDto,
  ): Promise<Course> {
    return this.service.updateCourse(id, dto);
  }

  // ── Course ↔ Assignment management ─────────────────────────────────────

  @Get(':id/assignments')
  async listAssignments(@Param('id', new ParseUUIDPipe()) id: string): Promise<CourseAssignment[]> {
    return this.service.listAssignments(id);
  }

  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Post(':id/assignments')
  async attachAssignments(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: AttachAssignmentsDto,
  ): Promise<CourseAssignment[]> {
    return this.service.attachAssignments(id, dto.assignmentIds);
  }

  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Delete(':id/assignments/:junctionId')
  async detachAssignment(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('junctionId', new ParseUUIDPipe()) junctionId: string,
  ): Promise<{ ok: true }> {
    await this.service.detachAssignment(id, junctionId);
    return { ok: true };
  }

  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Patch(':id/assignments/reorder')
  async reorderAssignments(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: ReorderDto,
  ): Promise<CourseAssignment[]> {
    return this.service.reorderAssignments(id, dto.ids);
  }
}
