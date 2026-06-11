import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Get,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
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

/** Max size (bytes) accepted for an uploaded test case archive. */
const MAX_TESTCASE_ZIP_BYTES = 100 * 1024 * 1024; // 100 MB

@Crud({
  model: { type: Assignment },
  dto: { create: CreateAssignmentDto, update: UpdateAssignmentDto, replace: CreateAssignmentDto },
  query: { sort: [{ field: 'createdAt', order: 'DESC' }] },
  routes: {
    exclude: ['updateOneBase', 'deleteOneBase'],
    createOneBase: { decorators: [Roles(UserRole.ADMIN)] },
    createManyBase: { decorators: [Roles(UserRole.ADMIN)] },
    replaceOneBase: { decorators: [Roles(UserRole.ADMIN)] },
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
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Post()
  async createOne(@Body() dto: CreateAssignmentDto): Promise<Assignment> {
    return this.service.createAssignment(dto);
  }

  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Patch(':id')
  async updateOne(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateAssignmentDto,
  ): Promise<Assignment> {
    return this.service.updateAssignment(id, dto);
  }

  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Delete(':id')
  async deleteOne(@Param('id', new ParseUUIDPipe()) id: string): Promise<Assignment> {
    return this.service.deleteAssignment(id);
  }

  /**
   * Upload a ZIP of `.inp`/`.out` files as the assignment's hidden grading test
   * cases. Content is parsed server-side and written to disk; only the count is
   * persisted in the DB. Replaces any previously uploaded set.
   */
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Post(':id/testcases')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_TESTCASE_ZIP_BYTES } }))
  async uploadTestcases(
    @Param('id', new ParseUUIDPipe()) id: string,
    @UploadedFile() file: { buffer: Buffer; originalname?: string } | undefined,
  ): Promise<{ hiddenTestCount: number; testcases: { inputFile: string; outputFile: string }[] }> {
    if (!file?.buffer?.length) {
      throw new BadRequestException('No ZIP file uploaded');
    }
    const { assignment, testcases } = await this.service.uploadHiddenTestcases(id, file.buffer);
    return { hiddenTestCount: assignment.codingConfig?.hiddenTestCount ?? 0, testcases };
  }

  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Delete(':id/testcases')
  async clearTestcases(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<{ hiddenTestCount: number }> {
    await this.service.clearHiddenTestcases(id);
    return { hiddenTestCount: 0 };
  }

  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Get(':id/testcases/manifest')
  async getTestcaseManifest(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<{ inputFile: string; outputFile: string }[]> {
    return this.service.getHiddenTestcaseManifest(id);
  }

  /**
   * Read hidden grading test case contents. Admins always; other roles only
   * when the assignment explicitly allows viewing hidden test cases.
   */
  @Get(':id/testcases')
  async getTestcases(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    if (user.role !== UserRole.ADMIN) {
      const assignment = await this.service.getById(id);
      if (!assignment.codingConfig?.allowViewHiddenTestCases) {
        throw new ForbiddenException('Hidden test cases are not viewable for this assignment');
      }
    }
    return this.service.getHiddenTestcases(id);
  }
}
