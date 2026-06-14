import { PublishStatus, UserRole } from '@cp/shared';

import { BlogPost } from './blog-post.entity';
import { BlogService } from './blog.service';

const now = new Date('2026-06-14T08:00:00.000Z');

function post(overrides: Partial<BlogPost> = {}): BlogPost {
  return {
    id: 'post-1',
    title: 'Hello World',
    slug: 'hello-world',
    excerpt: '',
    content: 'Body',
    coverUrl: null,
    tags: [],
    status: PublishStatus.DRAFT,
    publishedAt: null,
    authorId: 'author-1',
    author: {
      id: 'author-1',
      firstName: 'Ada',
      lastName: 'Lovelace',
      avatarUrl: null,
      role: UserRole.TEACHER,
    } as BlogPost['author'],
    createdAt: now,
    updatedAt: now,
    version: 1,
    deletedAt: null,
    ...overrides,
  };
}

function queryBuilder(rows: BlogPost[] = []) {
  const qb = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn().mockResolvedValue([rows, rows.length]),
  };
  return qb;
}

function serviceWith(repo: Record<string, unknown>) {
  return new BlogService(repo as never);
}

describe('BlogService', () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(now);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('normalizes and deduplicates generated slugs', async () => {
    let saved: BlogPost | null = null;
    const repo = {
      create: jest.fn((payload) => payload),
      save: jest.fn(async (payload) => {
        saved = post({ ...payload, id: 'new-post' });
        return saved;
      }),
      findOne: jest.fn(async ({ where }: { where: Partial<BlogPost> }) => {
        if (where.slug === 'lap-trinh-python') return post({ id: 'existing', slug: 'lap-trinh-python' });
        if (where.slug === 'lap-trinh-python-2') return null;
        if (where.id === 'new-post') return saved;
        return null;
      }),
    };

    const service = serviceWith(repo);
    const created = await service.createPost('author-1', {
      title: 'Lập trình Python',
      content: 'Markdown body',
    });

    expect(created.slug).toBe('lap-trinh-python-2');
    expect(repo.findOne).toHaveBeenCalledWith({ where: { slug: 'lap-trinh-python' } });
    expect(repo.findOne).toHaveBeenCalledWith({ where: { slug: 'lap-trinh-python-2' } });
  });

  it('sets publishedAt when a post is created as published', async () => {
    let saved: BlogPost | null = null;
    const repo = {
      create: jest.fn((payload) => payload),
      save: jest.fn(async (payload) => {
        saved = post({ ...payload, id: 'published-post' });
        return saved;
      }),
      findOne: jest.fn(async ({ where }: { where: Partial<BlogPost> }) => {
        if (where.slug === 'release-notes') return null;
        if (where.id === 'published-post') return saved;
        return null;
      }),
    };

    const service = serviceWith(repo);
    const created = await service.createPost('author-1', {
      title: 'Release notes',
      content: 'Published now',
      status: PublishStatus.PUBLISHED,
    });

    expect(created.status).toBe(PublishStatus.PUBLISHED);
    expect(created.publishedAt).toBe(now.toISOString());
  });

  it('adds the published-only status filter for reader lists', async () => {
    const qb = queryBuilder();
    const service = serviceWith({
      createQueryBuilder: jest.fn(() => qb),
    });

    await service.listPublished({ page: 1, limit: 10 });

    expect(qb.andWhere).toHaveBeenCalledWith('post.status = :publishedStatus', {
      publishedStatus: PublishStatus.PUBLISHED,
    });
  });

  it('adds the requested status filter for manage lists', async () => {
    const qb = queryBuilder();
    const service = serviceWith({
      createQueryBuilder: jest.fn(() => qb),
    });

    await service.listManage({ page: 1, limit: 10, status: PublishStatus.DRAFT });

    expect(qb.andWhere).toHaveBeenCalledWith('post.status = :manageStatus', {
      manageStatus: PublishStatus.DRAFT,
    });
  });
});
