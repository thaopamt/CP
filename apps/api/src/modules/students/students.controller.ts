import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, UseGuards, NotFoundException } from '@nestjs/common';
import { Crud, CrudController, CrudRequest, Override, ParsedRequest } from '@dataui/crud';
import { JwtPayload, UserRole } from '@cp/shared';

import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { StudentProfile } from './student-profile.entity';
import { StudentsService } from './students.service';
import { TeacherAssignmentsService } from './teacher-assignments.service';
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
  constructor(
    public service: StudentsService,
    private readonly assignments: TeacherAssignmentsService,
  ) {}

  get base(): CrudController<StudentProfile> {
    return this;
  }

  /**
   * List students. Teachers only see students assigned to them or to no
   * teacher at all; admins see everyone. We compute the hidden profile ids
   * and push an `id NOT IN (...)` filter onto the parsed CRUD request so the
   * existing pagination / eager joins still apply.
   */
  @Override('getManyBase')
  async getMany(@ParsedRequest() req: CrudRequest, @CurrentUser() user: JwtPayload) {
    if (user.role === UserRole.TEACHER) {
      const hidden = await this.assignments.hiddenStudentProfileIds(user.sub);
      if (hidden.length) {
        const extra = { id: { $notin: hidden } };
        const existing = req.parsed.search;
        req.parsed.search =
          existing && Object.keys(existing).length ? { $and: [existing, extra] } : extra;
      }
    }
    return this.base.getManyBase!(req);
  }

  @Roles(UserRole.STUDENT)
  @Get('me')
  async getMe(@CurrentUser() user: JwtPayload): Promise<StudentProfile> {
    return this.service.getStudentByUserId(user.sub);
  }

  @Get('user/:userId')
  async getByUserId(@Param('userId', new ParseUUIDPipe()) userId: string): Promise<StudentProfile> {
    return this.service.getStudentByUserId(userId);
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
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Post()
  async createOne(@Body() dto: CreateStudentDto): Promise<StudentProfile> {
    return this.service.createStudent(dto);
  }

  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Patch(':id')
  async updateOne(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateStudentDto,
  ): Promise<StudentProfile> {
    return this.service.updateStudent(id, dto);
  }

  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Post(':id/reset-password')
  async resetPassword(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: ResetPasswordDto,
  ): Promise<{ success: boolean }> {
    await this.service.resetPassword(id, dto.newPassword);
    return { success: true };
  }

  @Roles(UserRole.ADMIN)
  @Post(':id/reset-learning-data')
  async resetLearningData(
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.service.resetLearningData(id);
  }

  @Roles(UserRole.ADMIN)
  @Post(':id/block')
  async blockStudent(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body('reason') reason?: string,
  ) {
    return this.service.blockStudent(id, reason);
  }

  @Roles(UserRole.ADMIN)
  @Post(':id/unblock')
  async unblockStudent(
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.service.unblockStudent(id);
  }

  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Get(':id/heatmap')
  async getStudentHeatmap(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<any[]> {
    const profile = await this.service.getProfileById(id);
    return this.service.getHeatmapData(profile.userId);
  }
}
