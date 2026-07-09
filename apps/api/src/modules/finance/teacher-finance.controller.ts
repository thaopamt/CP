import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  FinanceBillingStatus,
  FinanceCollectionStatus,
  JwtPayload,
  UserRole,
} from '@cp/shared';

import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TeacherAssignmentsService } from '../students/teacher-assignments.service';
import { FinanceService } from './finance.service';

/**
 * Teacher-scoped finance endpoint.
 *
 * Teachers see only students that are:
 *   - assigned to them, OR
 *   - not assigned to any teacher at all
 *
 * This reuses `FinanceService.getMonthlyReport()` with a visibility filter
 * computed via `TeacherAssignmentsService.visibleStudentUserIds()`.
 *
 * Read-only: teachers cannot modify amount-due overrides or collection status.
 */
@Controller('teacher/finance')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.TEACHER)
export class TeacherFinanceController {
  constructor(
    private readonly finance: FinanceService,
    private readonly assignments: TeacherAssignmentsService,
  ) {}

  @Get('monthly')
  async getMonthlyReport(
    @CurrentUser() user: JwtPayload,
    @Query('month') month?: string,
    @Query('search') search?: string,
    @Query('status') status?: FinanceCollectionStatus,
    @Query('billingStatus') billingStatus?: FinanceBillingStatus,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const visibleUserIds = await this.assignments.visibleStudentUserIds(user.sub);
    return this.finance.getMonthlyReport(
      {
        month,
        search,
        status,
        billingStatus,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
      },
      visibleUserIds ? { visibleStudentUserIds: visibleUserIds } : undefined,
    );
  }
}
