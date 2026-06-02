import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { Crud, CrudController, Override } from '@dataui/crud';
import { JwtPayload, UserRole } from '@cp/shared';

import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { StudentProfile } from './student-profile.entity';
import { StudentsService } from './students.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { UpdateMyStudentDto } from './dto/update-my-student.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

/**
 * RESTful surface for student profiles (StudentProfile entity, 1-1 User).
 *
 *   GET    /api/students            — list (any auth user)
 *   GET    /api/students/:id        — one (eager: user + guardians)
 *   POST   /api/students            — ADMIN — create User+Profile+Guardians atomically
 *   PATCH  /api/students/:id        — ADMIN — partial update + replace guardians
 *   DELETE /api/students/:id        — ADMIN — soft delete (cascades to User via FK)
 */

@Crud({
  model: { type: StudentProfile },
  dto: {
    create: CreateStudentDto,
    update: UpdateStudentDto,
    replace: CreateStudentDto,
  },
  query: {
    sort: [{ field: 'createdAt', order: 'DESC' }],
    join: {
      user: { eager: true },
      guardians: { eager: true },
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
@Controller('students')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StudentsController implements CrudController<StudentProfile> {
  constructor(public service: StudentsService) {}

  @Roles(UserRole.STUDENT)
  @Get('me')
  async getMe(@CurrentUser() user: JwtPayload): Promise<StudentProfile> {
    return this.service.getStudentByUserId(user.sub);
  }

  @Roles(UserRole.STUDENT)
  @Patch('me')
  async updateMe(
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateMyStudentDto,
  ): Promise<StudentProfile> {
    return this.service.updateCurrentStudent(user.sub, dto);
  }

  @Override('createOneBase')
  @Roles(UserRole.ADMIN)
  @Post()
  async createOne(@Body() dto: CreateStudentDto): Promise<StudentProfile> {
    return this.service.createStudent(dto);
  }

  @Roles(UserRole.ADMIN)
  @Patch(':id')
  async updateOne(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateStudentDto,
  ): Promise<StudentProfile> {
    return this.service.updateStudent(id, dto);
  }

  @Roles(UserRole.ADMIN)
  @Post(':id/reset-password')
  async resetPassword(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: ResetPasswordDto,
  ): Promise<{ success: boolean }> {
    await this.service.resetPassword(id, dto.newPassword);
    return { success: true };
  }
}
