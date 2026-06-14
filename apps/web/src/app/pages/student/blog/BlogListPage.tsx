import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FilterToolbar, Icon, PageHeader, Pagination, SearchBox } from '@cp/ui';

import { usePublishedBlogPosts } from '../../../api/blog.queries';
import { formatBlogDate } from '../../shared/blog/BlogArticleView';

const PAGE_SIZE = 9;

export default function BlogListPage() {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [tag, setTag] = useState('');
  const { data, isLoading, isError, error, isPlaceholderData } = usePublishedBlogPosts({
    page,
    limit: PAGE_SIZE,
    search,
    tag,
  });

  function resetPage<T>(setter: (value: T) => void) {
    return (value: T) => {
      setter(value);
      setPage(1);
    };
  }

  const posts = data?.items ?? [];

  return (
    <div className="flex flex-col gap-lg py-lg">
      <PageHeader
        title={t('pages.blog.reader.title')}
        subtitle={t('pages.blog.reader.subtitle')}
      />

      <FilterToolbar className="bg-surface-container-lowest">
        <SearchBox
          value={search}
          onChange={resetPage(setSearch)}
          placeholder={t('pages.blog.reader.searchPlaceholder')}
        />
        <SearchBox
          value={tag}
          onChange={resetPage(setTag)}
          placeholder={t('pages.blog.reader.tagPlaceholder')}
          className="md:max-w-[220px]"
        />
      </FilterToolbar>

      <section className="relative">
        {isPlaceholderData && <div className="absolute top-0 inset-x-0 h-0.5 bg-primary/50 animate-pulse z-10" />}
        {isError ? (
          <CenteredState icon="error" label={(error as Error).message} />
        ) : isLoading ? (
          <CenteredState icon="progress_activity" label={t('common.loading')} spin />
        ) : posts.length === 0 ? (
          <CenteredState icon="article" label={t('pages.blog.reader.empty')} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-md">
            {posts.map((post) => (
              <Link
                key={post.id}
                to={`/student/blog/${post.slug}`}
                className="group rounded-lg border border-outline-variant/50 bg-surface-container-lowest overflow-hidden hover:border-primary/50 hover:shadow-elev-2 transition-all"
              >
                {post.coverUrl ? (
                  <img src={post.coverUrl} alt={post.title} className="w-full aspect-[16/9] object-cover bg-surface-container-low" />
                ) : (
                  <div className="w-full aspect-[16/9] bg-surface-container-low grid place-items-center text-primary">
                    <Icon name="article" size={40} />
                  </div>
                )}
                <div className="p-md">
                  <div className="flex flex-wrap items-center gap-xs mb-sm">
                    {post.tags.slice(0, 3).map((item) => (
                      <span key={item} className="rounded-full bg-tertiary-container/20 px-sm py-1 text-[11px] font-semibold text-tertiary">
                        {item}
                      </span>
                    ))}
                  </div>
                  <h3 className="font-manrope text-title-lg text-on-surface group-hover:text-primary transition-colors line-clamp-2">
                    {post.title}
                  </h3>
                  {post.excerpt && (
                    <p className="text-body-sm text-on-surface-variant mt-xs line-clamp-3">
                      {post.excerpt}
                    </p>
                  )}
                  <div className="mt-md flex items-center gap-xs text-label-sm text-on-surface-variant">
                    <Icon name="calendar_month" size={15} />
                    {formatBlogDate(post.publishedAt ?? post.createdAt)}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <div className="flex justify-center">
        <Pagination page={page} pageCount={data?.pageCount ?? 1} onChange={setPage} />
      </div>
    </div>
  );
}

function CenteredState({ icon, label, spin }: { icon: string; label: string; spin?: boolean }) {
  return (
    <div className="min-h-[260px] grid place-items-center text-center text-on-surface-variant">
      <div>
        <Icon name={icon} size={40} className={spin ? 'animate-spin mx-auto mb-sm' : 'mx-auto mb-sm'} />
        <p>{label}</p>
      </div>
    </div>
  );
}
