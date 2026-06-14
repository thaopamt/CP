import { FormEvent, useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { useTranslation } from 'react-i18next';
import { Button, Icon, StatusBadge } from '@cp/ui';
import { IBlogPost, ICreateBlogPostPayload, PublishStatus } from '@cp/shared';

import { blogStatusTone } from '../../shared/blog/BlogArticleView';

interface BlogFormProps {
  defaultValues?: IBlogPost;
  submitLabel: string;
  isSubmitting?: boolean;
  onSubmit: (payload: ICreateBlogPostPayload) => Promise<void> | void;
}

const inputCls =
  'h-[42px] px-sm bg-surface-container-lowest border border-outline-variant rounded-md text-body-md focus:ring-2 focus:ring-primary outline-none transition-shadow w-full';

export function BlogForm({ defaultValues, submitLabel, isSubmitting, onSubmit }: BlogFormProps) {
  const { t } = useTranslation();
  const [title, setTitle] = useState(defaultValues?.title ?? '');
  const [slug, setSlug] = useState(defaultValues?.slug ?? '');
  const [excerpt, setExcerpt] = useState(defaultValues?.excerpt ?? '');
  const [coverUrl, setCoverUrl] = useState(defaultValues?.coverUrl ?? '');
  const [tagsText, setTagsText] = useState((defaultValues?.tags ?? []).join(', '));
  const [status, setStatus] = useState<PublishStatus>(defaultValues?.status ?? PublishStatus.DRAFT);
  const [content, setContent] = useState(defaultValues?.content ?? '');
  const [mode, setMode] = useState<'write' | 'preview'>('write');
  const [error, setError] = useState<string | null>(null);

  const tags = useMemo(
    () =>
      tagsText
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
    [tagsText],
  );

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await onSubmit({
        title,
        slug: slug.trim() || undefined,
        excerpt,
        coverUrl: coverUrl.trim() || null,
        tags,
        status,
        content,
      });
    } catch (err) {
      const msg =
        (err as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
      setError(Array.isArray(msg) ? msg.join(', ') : (msg ?? (err as Error).message));
    }
  }

  return (
    <form onSubmit={submit} className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px] gap-lg">
      <div className="space-y-lg">
        {error && (
          <div className="rounded-lg border border-error/30 bg-error-container/30 p-md text-body-sm text-on-error-container">
            {error}
          </div>
        )}

        <section className="space-y-md">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
            <Field label={t('pages.blog.form.title')}>
              <input
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label={t('pages.blog.form.slug')}>
              <input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder={t('pages.blog.form.slugPlaceholder')}
                className={`${inputCls} font-mono`}
              />
            </Field>
            <Field label={t('pages.blog.form.coverUrl')}>
              <input
                value={coverUrl ?? ''}
                onChange={(e) => setCoverUrl(e.target.value)}
                placeholder="/api/uploads/blog/example.jpg"
                className={inputCls}
              />
            </Field>
            <Field label={t('pages.blog.form.tags')}>
              <input
                value={tagsText}
                onChange={(e) => setTagsText(e.target.value)}
                placeholder={t('pages.blog.form.tagsPlaceholder')}
                className={inputCls}
              />
            </Field>
          </div>

          <Field label={t('pages.blog.form.excerpt')}>
            <textarea
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              rows={3}
              className="w-full px-sm py-xs bg-surface-container-lowest border border-outline-variant rounded-md text-body-md focus:ring-2 focus:ring-primary outline-none resize-none transition-shadow"
            />
          </Field>
        </section>

        <section className="rounded-lg border border-outline-variant bg-surface-container-lowest overflow-hidden">
          <div className="flex items-center gap-xs px-sm py-xs border-b border-outline-variant bg-surface-container-low">
            <button
              type="button"
              onClick={() => setMode('write')}
              className={mode === 'write' ? tabActiveCls : tabCls}
            >
              <Icon name="edit" size={16} />
              {t('pages.blog.form.write')}
            </button>
            <button
              type="button"
              onClick={() => setMode('preview')}
              className={mode === 'preview' ? tabActiveCls : tabCls}
            >
              <Icon name="visibility" size={16} />
              {t('pages.blog.form.preview')}
            </button>
          </div>

          {mode === 'write' ? (
            <textarea
              required
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={18}
              className="w-full resize-y min-h-[420px] p-md font-mono text-[13px] leading-relaxed text-on-surface bg-surface-container-lowest outline-none"
            />
          ) : (
            <div className="min-h-[420px] p-md prose prose-sm dark:prose-invert max-w-none prose-headings:text-on-surface prose-p:text-on-surface-variant prose-li:text-on-surface-variant prose-strong:text-on-surface prose-a:text-primary prose-code:text-primary prose-code:bg-surface-container-high prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none prose-pre:bg-surface-container-low prose-pre:border prose-pre:border-outline-variant prose-pre:rounded-lg">
              <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                {content || t('pages.blog.form.emptyPreview')}
              </ReactMarkdown>
            </div>
          )}
        </section>
      </div>

      <aside className="xl:sticky xl:top-20 self-start rounded-lg border border-outline-variant/50 bg-surface-container-lowest p-md space-y-md">
        <Field label={t('common.status')}>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as PublishStatus)}
            className={inputCls}
          >
            <option value={PublishStatus.DRAFT}>{t('enums.publishStatus.DRAFT')}</option>
            <option value={PublishStatus.PUBLISHED}>{t('enums.publishStatus.PUBLISHED')}</option>
            <option value={PublishStatus.ARCHIVED}>{t('enums.publishStatus.ARCHIVED')}</option>
          </select>
        </Field>

        <div className="flex items-center justify-between gap-sm">
          <span className="text-label-sm text-on-surface-variant">{t('pages.blog.form.currentStatus')}</span>
          <StatusBadge tone={blogStatusTone(status)}>{t(`enums.publishStatus.${status}`)}</StatusBadge>
        </div>

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-xs">
            {tags.map((tag) => (
              <span key={tag} className="rounded-full border border-outline-variant px-sm py-1 text-[11px] text-on-surface-variant">
                {tag}
              </span>
            ))}
          </div>
        )}

        <Button
          type="submit"
          className="w-full"
          leadingIcon={<Icon name={isSubmitting ? 'progress_activity' : 'save'} size={18} className={isSubmitting ? 'animate-spin' : undefined} />}
          disabled={isSubmitting}
        >
          {submitLabel}
        </Button>
      </aside>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-label-sm font-semibold text-on-surface">{label}</span>
      {children}
    </label>
  );
}

const tabCls =
  'inline-flex items-center gap-xs px-md py-xs rounded-md text-label-sm text-on-surface-variant hover:bg-surface-container-high transition-colors';
const tabActiveCls = 'inline-flex items-center gap-xs px-md py-xs rounded-md text-label-sm bg-primary text-on-primary';
