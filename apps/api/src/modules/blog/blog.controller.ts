import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  BlogListParams,
  IBlogListResponse,
  IBlogPost,
  IBlogUnreadCount,
  JwtPayload,
  PublishStatus,
  UserRole,
} from '@cp/shared';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { BlogService } from './blog.service';
import { CreateBlogPostDto, UpdateBlogPostDto } from './dto/blog-post.dto';

@Controller('blog-posts')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BlogController {
  constructor(private readonly blog: BlogService) {}

  @Get()
  listPublished(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('tag') tag?: string,
  ): Promise<IBlogListResponse> {
    return this.blog.listPublished(parseListParams({ page, limit, search, tag }));
  }

  @Get('slug/:slug')
  getPublishedBySlug(@Param('slug') slug: string): Promise<IBlogPost> {
    return this.blog.getPublishedBySlug(slug);
  }

  /** Published posts the current user hasn't opened — for the nav badge. */
  @Get('unread-count')
  async unreadCount(@CurrentUser() user: JwtPayload): Promise<IBlogUnreadCount> {
    return { count: await this.blog.getUnreadCount(user.sub) };
  }

  /** Mark a post as read by the current user. */
  @Post(':id/read')
  @HttpCode(HttpStatus.OK)
  async markRead(
    @CurrentUser() user: JwtPayload,
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<{ success: true }> {
    await this.blog.markRead(user.sub, id);
    return { success: true };
  }

  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Get('manage')
  listManage(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('tag') tag?: string,
    @Query('status') status?: PublishStatus | 'all',
  ): Promise<IBlogListResponse> {
    return this.blog.listManage(parseListParams({ page, limit, search, tag, status }));
  }

  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Get('manage/:id')
  getManageById(@Param('id', new ParseUUIDPipe()) id: string): Promise<IBlogPost> {
    return this.blog.getManageById(id);
  }

  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Post()
  createPost(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateBlogPostDto,
  ): Promise<IBlogPost> {
    return this.blog.createPost(user.sub, dto);
  }

  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Patch(':id')
  updatePost(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateBlogPostDto,
  ): Promise<IBlogPost> {
    return this.blog.updatePost(id, dto);
  }

  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Delete(':id')
  async deletePost(@Param('id', new ParseUUIDPipe()) id: string): Promise<{ success: true }> {
    await this.blog.deletePost(id);
    return { success: true };
  }
}

function parseListParams(params: {
  page?: string;
  limit?: string;
  search?: string;
  tag?: string;
  status?: PublishStatus | 'all';
}): BlogListParams {
  return {
    page: params.page ? Number.parseInt(params.page, 10) : undefined,
    limit: params.limit ? Number.parseInt(params.limit, 10) : undefined,
    search: params.search,
    tag: params.tag,
    status: params.status,
  };
}
