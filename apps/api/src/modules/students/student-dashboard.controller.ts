import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { UserRole } from '@cp/shared';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { StudentsService } from './students.service';

@Controller('student-dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StudentDashboardController {
  constructor(private readonly service: StudentsService) {}

  @Roles(UserRole.STUDENT)
  @Get()
  async getDashboard(@CurrentUser() user: { id: string }): Promise<any> {
    return this.service.getDashboardData(user.id);
  }

  @Roles(UserRole.STUDENT)
  @Patch('preferences')
  async updatePreferences(
    @CurrentUser() user: { id: string },
    @Body() body: { defaultLanguage?: string },
  ): Promise<{ defaultLanguage: string }> {
    return this.service.updateDefaultLanguage(user.id, body.defaultLanguage || 'cpp');
  }
}
