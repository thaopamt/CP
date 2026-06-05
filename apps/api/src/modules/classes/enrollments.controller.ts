import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';
import { Crud, CrudController } from '@dataui/crud';
import { UserRole } from '@cp/shared';

import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Enrollment } from './enrollment.entity';
import { EnrollmentsService } from './enrollments.service';

interface EnrollDto {
  classId: string;
  studentId: string;
}

/**
 * Enrollments — many-to-many between classes and student users.
 * The `enroll`/`drop` paths bump the parent class's denormalized
 * counters via ClassesService.recountEnrollment.
 */
@Crud({
  model: { type: Enrollment },
  query: {
    sort: [{ field: 'createdAt', order: 'DESC' }],
    join: { class: { eager: false }, student: { eager: true } },
  },
  routes: {
    // Read access for any auth'd user; mutation gated below by custom routes
    createOneBase: { decorators: [Roles(UserRole.ADMIN)] },
    updateOneBase: { decorators: [Roles(UserRole.ADMIN)] },
    replaceOneBase: { decorators: [Roles(UserRole.ADMIN)] },
    deleteOneBase: { decorators: [Roles(UserRole.ADMIN)] },
    createManyBase: { decorators: [Roles(UserRole.ADMIN)] },
  },
  params: { id: { field: 'id', type: 'uuid', primary: true } },
})
@Controller('enrollments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EnrollmentsController implements CrudController<Enrollment> {
  constructor(public service: EnrollmentsService) {}

  /** GET /api/enrollments/student/:studentId/progress — enrolled classes with learning progress */
  @Get('student/:studentId/progress')
  listByStudentWithLearningProgress(
    @Param('studentId', new ParseUUIDPipe()) studentId: string,
  ): Promise<Enrollment[]> {
    return this.service.listByStudentWithLearningProgress(studentId);
  }

  /** Convenience action: POST /api/enrollments/enroll { classId, studentId } */
  @Post('enroll')
  @Roles(UserRole.ADMIN)
  async enroll(@Body() dto: EnrollDto): Promise<Enrollment> {
    return this.service.enroll(dto.classId, dto.studentId);
  }

  /** DELETE /api/enrollments/drop/:id — soft-deletes + recounts */
  @Delete('drop/:id')
  @Roles(UserRole.ADMIN)
  async drop(@Param('id', new ParseUUIDPipe()) id: string): Promise<{ ok: true }> {
    await this.service.drop(id);
    return { ok: true };
  }
}
