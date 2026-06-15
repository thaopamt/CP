import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { IBlogPost } from '@cp/shared';
import { Icon, StatusBadge } from '@cp/ui';
import { useTranslation } from 'react-i18next';

export function BlogArticleView({ post, showStatus = false }: { post: IBlogPost; showStatus?: boolean }) {
  const { t } = useTranslation();
  const authorName = post.author
    ? `${post.author.firstName} ${post.author.lastName}`.trim()
    : t('pages.blog.article.unknownAuthor');

  return (
    <article className="max-w-4xl mx-auto">
      {post.coverUrl && (
        <img
          src={post.coverUrl}
          alt={post.title}
          className="w-full aspect-[16/6] object-cover rounded-lg border border-outline-variant/50 mb-lg bg-surface-container-low"
        />
      )}

      <header className="mb-lg">
        <div className="flex flex-wrap items-center gap-sm mb-sm">
          {showStatus && (
            <StatusBadge tone={post.status === 'PUBLISHED' ? 'success' : post.status === 'DRAFT' ? 'warning' : 'neutral'}>
              {t(`enums.publishStatus.${post.status}`)}
            </StatusBadge>
          )}
          {post.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center rounded-full border border-outline-variant px-sm py-1 text-[11px] font-semibold text-on-surface-variant"
            >
              {tag}
            </span>
          ))}
        </div>

        <h1 className="font-manrope text-display-sm md:text-display-md text-on-surface leading-tight">
          {post.title}
        </h1>
        {post.excerpt && (
          <p className="text-title-md text-on-surface-variant mt-sm max-w-3xl">
            {post.excerpt}
          </p>
        )}
        <div className="mt-md flex flex-wrap items-center gap-sm text-label-sm text-on-surface-variant">
          <span className="inline-flex items-center gap-xs">
            <Icon name="person" size={16} />
            {authorName}
          </span>
          <span aria-hidden>•</span>
          <span className="inline-flex items-center gap-xs">
            <Icon name="calendar_month" size={16} />
            {formatBlogDate(post.publishedAt ?? post.createdAt)}
          </span>
        </div>
      </header>

      <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none prose-headings:text-on-surface prose-p:text-on-surface-variant prose-li:text-on-surface-variant prose-strong:text-on-surface prose-a:text-primary prose-code:text-primary prose-code:bg-surface-container-high prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none prose-pre:bg-surface-container-low prose-pre:border prose-pre:border-outline-variant prose-pre:rounded-lg">
        <ReactMarkdown
          remarkPlugins={[remarkMath]}
          rehypePlugins={[rehypeKatex]}
          components={{
            img(props) {
              const src = typeof props.src === 'string' ? props.src : '';
              const alt = props.alt ?? '';
              // Character images render as compact labeled thumbnails so a post
              // can show the whole roster in level order without giant images.
              if (src.includes('/character/')) {
                return (
                  <span className="m-1 inline-flex w-24 flex-col items-center align-top">
                    <img
                      src={src}
                      alt={alt}
                      className="!my-0 h-24 w-24 rounded-lg bg-surface-container-high object-contain"
                    />
                    {alt && (
                      <span className="mt-1 text-center text-[11px] font-semibold text-on-surface-variant">
                        {alt}
                      </span>
                    )}
                  </span>
                );
              }
              return <img src={src} alt={alt} className="rounded-lg" />;
            },
          }}
        >
          {post.content}
        </ReactMarkdown>
      </div>
    </article>
  );
}

export function formatBlogDate(iso: string | null | undefined): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export function blogStatusTone(status: IBlogPost['status']): 'success' | 'warning' | 'neutral' {
  if (status === 'PUBLISHED') return 'success';
  if (status === 'DRAFT') return 'warning';
  return 'neutral';
}
