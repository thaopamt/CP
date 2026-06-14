import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button, Icon, PageHeader } from '@cp/ui';
import { ICreateBlogPostPayload } from '@cp/shared';

import { useManageBlogPost, useUpdateBlogPost } from '../../../api/blog.queries';
import { usePortalBase } from '../../../hooks/usePortalBase';
import { BlogForm } from './BlogForm';

export default function BlogEditPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const base = usePortalBase();
  const navigate = useNavigate();
  const { data: post, isLoading, isError, error } = useManageBlogPost(id);
  const updatePost = useUpdateBlogPost(id ?? '');

  async function submit(payload: ICreateBlogPostPayload) {
    if (!id) return;
    await updatePost.mutateAsync(payload);
    navigate(`${base}/blog`);
  }

  if (isLoading) return <CenteredState icon="progress_activity" label={t('common.loading')} spin />;
  if (isError || !post) return <CenteredState icon="error" label={(error as Error)?.message ?? t('common.notFound')} />;

  return (
    <div className="flex flex-col gap-lg">
      <PageHeader
        title={t('pages.blog.edit.title')}
        subtitle={post.title}
        actions={
          <div className="flex gap-sm">
            <Button variant="ghost" leadingIcon={<Icon name="visibility" size={18} />} onClick={() => navigate(`${base}/blog/preview/${post.id}`)}>
              {t('common.preview')}
            </Button>
            <Button variant="ghost" leadingIcon={<Icon name="arrow_back" size={18} />} onClick={() => navigate(`${base}/blog`)}>
              {t('pages.blog.backToBlog')}
            </Button>
          </div>
        }
      />
      <BlogForm
        key={post.id}
        defaultValues={post}
        submitLabel={t('pages.blog.edit.submit')}
        isSubmitting={updatePost.isPending}
        onSubmit={submit}
      />
    </div>
  );
}

function CenteredState({ icon, label, spin }: { icon: string; label: string; spin?: boolean }) {
  return (
    <div className="min-h-[320px] grid place-items-center text-center text-on-surface-variant">
      <div>
        <Icon name={icon} size={36} className={spin ? 'animate-spin mx-auto mb-sm' : 'mx-auto mb-sm'} />
        <p>{label}</p>
      </div>
    </div>
  );
}
