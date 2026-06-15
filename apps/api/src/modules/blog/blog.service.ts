import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  BlogListParams,
  IBlogAuthor,
  IBlogListResponse,
  IBlogPost,
  PublishStatus,
} from '@cp/shared';
import { Brackets, Repository, SelectQueryBuilder } from 'typeorm';

import { BlogPost } from './blog-post.entity';
import { BlogPostRead } from './blog-post-read.entity';
import { CreateBlogPostDto, UpdateBlogPostDto } from './dto/blog-post.dto';
import { User } from '../users/user.entity';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

@Injectable()
export class BlogService {
  constructor(
    @InjectRepository(BlogPost)
    private readonly posts: Repository<BlogPost>,
    @InjectRepository(BlogPostRead)
    private readonly reads: Repository<BlogPostRead>,
  ) {}

  /** Count of published posts the user hasn't opened yet. */
  async getUnreadCount(userId: string): Promise<number> {
    return this.posts
      .createQueryBuilder('post')
      .where('post.status = :status', { status: PublishStatus.PUBLISHED })
      .andWhere((qb) => {
        const sub = qb
          .subQuery()
          .select('1')
          .from(BlogPostRead, 'r')
          .where('r.post_id = post.id')
          .andWhere('r.user_id = :userId')
          .getQuery();
        return `NOT EXISTS ${sub}`;
      })
      .setParameter('userId', userId)
      .getCount();
  }

  /** Mark a post as read by a user (idempotent — duplicates are ignored). */
  async markRead(userId: string, postId: string): Promise<void> {
    const post = await this.posts.findOne({ where: { id: postId } });
    if (!post) throw new NotFoundException(`Blog post ${postId} not found`);
    const existing = await this.reads.findOne({ where: { userId, postId } });
    if (existing) return;
    try {
      await this.reads.save(this.reads.create({ userId, postId }));
    } catch {
      // Unique-constraint race — another request already inserted it.
    }
  }

  async listPublished(params: BlogListParams): Promise<IBlogListResponse> {
    return this.listPosts(params, true);
  }

  async listManage(params: BlogListParams): Promise<IBlogListResponse> {
    return this.listPosts(params, false);
  }

  async getPublishedBySlug(slug: string): Promise<IBlogPost> {
    const post = await this.posts.findOne({
      where: { slug, status: PublishStatus.PUBLISHED },
      relations: { author: true },
    });
    if (!post) throw new NotFoundException(`Blog post ${slug} not found`);
    return this.toDto(post);
  }

  async getManageById(id: string): Promise<IBlogPost> {
    const post = await this.posts.findOne({ where: { id }, relations: { author: true } });
    if (!post) throw new NotFoundException(`Blog post ${id} not found`);
    return this.toDto(post);
  }

  async createPost(authorId: string, dto: CreateBlogPostDto): Promise<IBlogPost> {
    const status = dto.status ?? PublishStatus.DRAFT;
    const post = this.posts.create({
      title: dto.title.trim(),
      slug: await this.ensureUniqueSlug(dto.slug?.trim() || dto.title),
      excerpt: dto.excerpt?.trim() ?? '',
      content: dto.content,
      coverUrl: normalizeOptionalString(dto.coverUrl),
      tags: normalizeTags(dto.tags),
      status,
      publishedAt: status === PublishStatus.PUBLISHED ? new Date() : null,
      authorId,
    });

    const saved = await this.posts.save(post);
    return this.getManageById(saved.id);
  }

  async updatePost(id: string, dto: UpdateBlogPostDto): Promise<IBlogPost> {
    const post = await this.posts.findOne({ where: { id } });
    if (!post) throw new NotFoundException(`Blog post ${id} not found`);

    if (dto.title !== undefined) post.title = dto.title.trim();
    if (dto.excerpt !== undefined) post.excerpt = dto.excerpt.trim();
    if (dto.content !== undefined) post.content = dto.content;
    if (dto.coverUrl !== undefined) post.coverUrl = normalizeOptionalString(dto.coverUrl);
    if (dto.tags !== undefined) post.tags = normalizeTags(dto.tags);
    if (dto.slug?.trim()) post.slug = await this.ensureUniqueSlug(dto.slug, id);
    if (dto.status !== undefined) post.status = dto.status;
    if (post.status === PublishStatus.PUBLISHED && !post.publishedAt) {
      post.publishedAt = new Date();
    }

    await this.posts.save(post);
    return this.getManageById(id);
  }

  async deletePost(id: string): Promise<void> {
    const post = await this.posts.findOne({ where: { id } });
    if (!post) throw new NotFoundException(`Blog post ${id} not found`);
    await this.posts.softDelete({ id });
  }

  private async listPosts(params: BlogListParams, publishedOnly: boolean): Promise<IBlogListResponse> {
    const page = normalizePositiveInt(params.page, DEFAULT_PAGE);
    const limit = Math.min(normalizePositiveInt(params.limit, DEFAULT_LIMIT), MAX_LIMIT);
    const query = this.posts
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.author', 'author');

    if (publishedOnly) {
      query.andWhere('post.status = :publishedStatus', { publishedStatus: PublishStatus.PUBLISHED });
    } else if (params.status && params.status !== 'all') {
      query.andWhere('post.status = :manageStatus', { manageStatus: params.status });
    }

    this.applySearchFilters(query, params);

    query
      .orderBy('post.publishedAt', 'DESC', 'NULLS LAST')
      .addOrderBy('post.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [posts, total] = await query.getManyAndCount();
    return {
      items: posts.map((post) => this.toDto(post)),
      total,
      page,
      pageCount: Math.max(1, Math.ceil(total / limit)),
    };
  }

  private applySearchFilters(query: SelectQueryBuilder<BlogPost>, params: BlogListParams): void {
    const search = params.search?.trim();
    if (search) {
      query.andWhere(
        new Brackets((qb) => {
          qb.where('post.title ILIKE :search', { search: `%${search}%` })
            .orWhere('post.excerpt ILIKE :search', { search: `%${search}%` })
            .orWhere('post.content ILIKE :search', { search: `%${search}%` });
        }),
      );
    }

    const tag = params.tag?.trim();
    if (tag) {
      query.andWhere('post.tags @> :tagFilter', { tagFilter: JSON.stringify([tag]) });
    }
  }

  private async ensureUniqueSlug(seed: string, currentId?: string): Promise<string> {
    const base = normalizeSlug(seed) || 'post';
    let candidate = base;
    let suffix = 2;

    while (await this.slugBelongsToAnotherPost(candidate, currentId)) {
      const suffixText = `-${suffix}`;
      candidate = `${base.slice(0, 255 - suffixText.length)}${suffixText}`;
      suffix += 1;
    }

    return candidate;
  }

  private async slugBelongsToAnotherPost(slug: string, currentId?: string): Promise<boolean> {
    const existing = await this.posts.findOne({ where: { slug } });
    return !!existing && existing.id !== currentId;
  }

  private toDto(post: BlogPost): IBlogPost {
    return {
      id: post.id,
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      content: post.content,
      coverUrl: post.coverUrl,
      tags: post.tags ?? [],
      status: post.status,
      publishedAt: post.publishedAt?.toISOString() ?? null,
      authorId: post.authorId,
      author: post.author ? toAuthorDto(post.author) : null,
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString(),
    };
  }
}

export function normalizeSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 255);
}

function normalizeTags(tags: string[] | undefined): string[] {
  return Array.from(
    new Set(
      (tags ?? [])
        .map((tag) => tag.trim())
        .filter(Boolean),
    ),
  );
}

function normalizeOptionalString(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed || null;
}

function normalizePositiveInt(value: number | undefined, fallback: number): number {
  if (typeof value !== 'number' || Number.isNaN(value) || value < 1) return fallback;
  return Math.floor(value);
}

function toAuthorDto(user: User): IBlogAuthor {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    avatarUrl: user.avatarUrl,
    role: user.role,
  };
}
