import { Body, Controller, Delete, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import {
  FinanceCollectionStatus,
  IFinanceMonthlyAmountDuePayload,
  IFinanceMonthlyStatusPayload,
  UserRole,
} from '@cp/shared';

import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { FinanceService } from './finance.service';

@Controller('finance')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class FinanceController {
  constructor(private readonly service: FinanceService) {}

  @Get('monthly')
  getMonthlyReport(
    @Query('month') month?: string,
    @Query('search') search?: string,
    @Query('status') status?: FinanceCollectionStatus,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.getMonthlyReport({
      month,
      search,
      status,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Patch('monthly/:studentId/amount-due')
  setMonthlyAmountDue(
    @Param('studentId') studentId: string,
    @Body() payload: IFinanceMonthlyAmountDuePayload,
  ) {
    return this.service.setMonthlyAmountDue(studentId, payload);
  }

  @Delete('monthly/:studentId/amount-due')
  resetMonthlyAmountDue(@Param('studentId') studentId: string, @Query('month') month: string) {
    return this.service.resetMonthlyAmountDue(studentId, month);
  }

  @Patch('monthly/:studentId/status')
  setMonthlyStatus(@Param('studentId') studentId: string, @Body() payload: IFinanceMonthlyStatusPayload) {
    return this.service.setMonthlyStatus(studentId, payload);
  }
}
