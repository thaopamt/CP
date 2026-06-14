import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button, Column, DataTable, FilterToolbar, Icon, PageHeader, Pagination, SearchBox, SelectFilter, StatusBadge, useConfirm } from '@cp/ui';
import { IBlogPost, PublishStatus } from '@cp/shared';

import { BLOG_STATUS_OPTIONS } from '../../../api/blog.api';
import { useDeleteBlogPost, useManageBlogPosts } from '../../../api/blog.queries';
import { usePortalBase } from '../../../hooks/usePortalBase';
import { blogStatusTone, formatBlogDate } from '../../shared/blog/BlogArticleView';

const PAGE_SIZE = 10;

export default function BlogManageListPage() {
  const { t } = useTranslation();
  const base = usePortalBase();
  const navigate = useNavigate();
  const confirm = useConfirm();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [tag, setTag] = useState('');
  const [status, setStatus] = useState<PublishStatus | 'all'>('all');
  const { data, isError, isLoading, isPlaceholderData, error } = useManageBlogPosts({
    page,
    limit: PAGE_SIZE,
    search,
    tag,
    status,
  });
  const deletePost = useDeleteBlogPost();

  function resetPage<T>(setter: (value: T) => void) {
    return (value: T) => {
      setter(value);
      setPage(1);
    };
  }

  const columns: Column<IBlogPost>[] = useMemo(
    () => [
      {
        key: 'title',
        header: t('pages.blog.manage.columns.title'),
        cell: (post) => (
          <div className="min-w-0 max-w-[360px]">
            <div className="font-semibold text-on-surface truncate" title={post.title}>
              {post.title}
            </div>
            <div className="font-mono text-[12px] text-on-surface-variant truncate">
              /{post.slug}
            </div>
          </div>
        ),
      },
      {
        key: 'author',
        header: t('pages.blog.manage.columns.author'),
        cell: (post) => (
          <span className="text-body-sm text-on-surface-variant">
            {post.author ? `${post.author.firstName} ${post.author.lastName}`.trim() : '-'}
          </span>
        ),
      },
      {
        key: 'tags',
        header: t('pages.blog.manage.columns.tags'),
        cell: (post) => (
          <div className="flex flex-wrap gap-xs max-w-[220px]">
            {post.tags.length === 0 ? (
              <span className="text-on-surface-variant">-</span>
            ) : (
              post.tags.slice(0, 3).map((item) => (
                <span key={item} className="rounded-full bg-surface-container-high px-sm py-1 text-[11px] text-on-surface-variant">
                  {item}
                </span>
              ))
            )}
          </div>
        ),
      },
      {
        key: 'status',
        header: t('common.status'),
        cell: (post) => (
          <StatusBadge tone={blogStatusTone(post.status)}>
            {t(`enums.publishStatus.${post.status}`)}
          </StatusBadge>
        ),
      },
      {
        key: 'date',
        header: t('pages.blog.manage.columns.date'),
        cell: (post) => (
          <span className="text-body-sm text-on-surface-variant">
            {formatBlogDate(post.publishedAt ?? post.createdAt)}
          </span>
        ),
      },
      {
        key: 'actions',
        header: '',
        align: 'right',
        cell: (post) => (
          <div className="inline-flex justify-end gap-xs opacity-0 group-hover:opacity-100 transition-opacity">
            <Link
              to={`${base}/blog/preview/${post.id}`}
              className="p-1 rounded text-on-surface-variant hover:text-primary transition-colors inline-grid place-items-center"
              title={t('common.preview')}
            >
              <Icon name="visibility" size={18} />
            </Link>
            <Link
              to={`${base}/blog/${post.id}/edit`}
              className="p-1 rounded text-on-surface-variant hover:text-primary transition-colors inline-grid place-items-center"
              title={t('common.edit')}
            >
              <Icon name="edit" size={18} />
            </Link>
            <button
              type="button"
              className="p-1 rounded text-on-surface-variant hover:text-error transition-colors inline-grid place-items-center"
              title={t('common.delete')}
              disabled={deletePost.isPending}
              onClick={async () => {
                const ok = await confirm({
                  title: t('common.confirmDelete', 'Confirm Delete'),
                  message: t('pages.blog.manage.deleteConfirm'),
                  intent: 'danger',
                });
                if (ok) deletePost.mutate(post.id);
              }}
            >
              <Icon name="delete" size={18} />
            </button>
          </div>
        ),
      },
    ],
    [base, confirm, deletePost, t],
  );

  const rows = data?.items ?? [];
  const total = data?.total ?? 0;
  const pageCount = data?.pageCount ?? 1;

  return (
    <div className="flex flex-col gap-lg">
      <PageHeader
        title={t('pages.blog.manage.title')}
        subtitle={t('pages.blog.manage.subtitle')}
        actions={
          <Button leadingIcon={<Icon name="add" size={18} />} onClick={() => navigate(`${base}/blog/new`)}>
            {t('pages.blog.manage.create')}
          </Button>
        }
      />

      <FilterToolbar>
        <SearchBox
          value={search}
          onChange={resetPage(setSearch)}
          placeholder={t('pages.blog.manage.searchPlaceholder')}
        />
        <SearchBox
          value={tag}
          onChange={resetPage(setTag)}
          placeholder={t('pages.blog.manage.tagPlaceholder')}
          className="md:max-w-[220px]"
        />
        <SelectFilter
          label={t('common.status')}
          value={status}
          onChange={(e) => resetPage(setStatus)(e.target.value as PublishStatus | 'all')}
          options={BLOG_STATUS_OPTIONS.map((value) => ({
            value,
            label: value === 'all' ? t('common.all') : t(`enums.publishStatus.${value}`),
          }))}
        />
      </FilterToolbar>

      <div className="bg-surface-container-lowest border border-outline-variant/50 rounded-lg shadow-elev-1 overflow-hidden relative">
        {isPlaceholderData && <div className="absolute top-0 inset-x-0 h-0.5 bg-primary/50 animate-pulse z-10" />}
        {isError ? (
          <div className="p-xl text-center">
            <Icon name="error" size={36} className="mx-auto mb-sm text-error" />
            <p className="text-body-md text-on-surface">{(error as Error).message}</p>
          </div>
        ) : (
          <DataTable
            rows={rows}
            columns={columns}
            rowKey={(post) => post.id}
            emptyState={isLoading ? t('common.loading') : t('pages.blog.manage.empty')}
          />
        )}
        <footer className="flex flex-col sm:flex-row items-center justify-between gap-sm p-md border-t border-outline-variant/30">
          <div className="text-label-sm text-on-surface-variant">
            {t('pages.blog.showing', {
              from: rows.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1,
              to: (page - 1) * PAGE_SIZE + rows.length,
              total,
            })}
          </div>
          <Pagination page={page} pageCount={pageCount} onChange={setPage} />
        </footer>
      </div>
    </div>
  );
}
