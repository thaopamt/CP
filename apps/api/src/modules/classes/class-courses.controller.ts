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
import { UserRole } from '@cp/shared';

import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { ClassCourse } from './class-course.entity';
import { ClassCoursesService } from './class-courses.service';
import { AttachCoursesDto, ReorderClassCoursesDto } from './dto/class-course.dto';

/**
 * Manages the courses attached to a class.
 *
 *   GET    /api/classes/:classId/courses              — list ordered (auth)
 *   POST   /api/classes/:classId/courses              — attach courses[] (ADMIN)
 *   DELETE /api/classes/:classId/courses/:junctionId  — detach (ADMIN)
 *   PATCH  /api/classes/:classId/courses/reorder      — reorder (ADMIN)
 */
@Controller('classes/:classId/courses')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ClassCoursesController {
  constructor(private readonly service: ClassCoursesService) {}

  @Get()
  list(@Param('classId', new ParseUUIDPipe()) classId: string): Promise<ClassCourse[]> {
    return this.service.listForClass(classId);
  }

  @Roles(UserRole.ADMIN)
  @Post()
  attach(
    @Param('classId', new ParseUUIDPipe()) classId: string,
    @Body() dto: AttachCoursesDto,
  ): Promise<ClassCourse[]> {
    return this.service.attach(classId, dto.courseIds, dto.isRequired);
  }

  @Roles(UserRole.ADMIN)
  @Delete(':junctionId')
  async detach(
    @Param('classId', new ParseUUIDPipe()) classId: string,
    @Param('junctionId', new ParseUUIDPipe()) junctionId: string,
  ): Promise<{ ok: true }> {
    await this.service.detach(classId, junctionId);
    return { ok: true };
  }

  @Roles(UserRole.ADMIN)
  @Patch('reorder')
  reorder(
    @Param('classId', new ParseUUIDPipe()) classId: string,
    @Body() dto: ReorderClassCoursesDto,
  ): Promise<ClassCourse[]> {
    return this.service.reorder(classId, dto.ids);
  }
}
