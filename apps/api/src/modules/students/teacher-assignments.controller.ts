import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Put,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@cp/shared';

import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { User } from '../users/user.entity';
import { StudentProfile } from './student-profile.entity';
import { TeacherAssignmentsService } from './teacher-assignments.service';
import {
  SetStudentTeachersDto,
  SetTeacherStudentsDto,
} from './dto/teacher-assignment.dto';

/**
 * Teacher ⇄ student assignment endpoints. Empty controller base so the
 * paths read naturally and sit beside the `students`/`users` CRUD routes
 * without colliding (these are 3-segment paths, the CRUD routes are 2).
 */
@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class TeacherAssignmentsController {
  constructor(private readonly service: TeacherAssignmentsService) {}

  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Get('students/:id/teachers')
  getStudentTeachers(@Param('id', new ParseUUIDPipe()) id: string): Promise<User[]> {
    return this.service.getTeachersForStudent(id);
  }

  @Roles(UserRole.ADMIN)
  @Put('students/:id/teachers')
  setStudentTeachers(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: SetStudentTeachersDto,
  ): Promise<User[]> {
    return this.service.setTeachersForStudent(id, dto.teacherIds);
  }

  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Get('teachers/:id/students')
  getTeacherStudents(@Param('id', new ParseUUIDPipe()) id: string): Promise<StudentProfile[]> {
    return this.service.getStudentsForTeacher(id);
  }

  @Roles(UserRole.ADMIN)
  @Put('teachers/:id/students')
  setTeacherStudents(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: SetTeacherStudentsDto,
  ): Promise<StudentProfile[]> {
    return this.service.setStudentsForTeacher(id, dto.studentIds);
  }
}
