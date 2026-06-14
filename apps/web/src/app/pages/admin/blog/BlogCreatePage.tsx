import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button, Icon, PageHeader } from '@cp/ui';
import { ICreateBlogPostPayload } from '@cp/shared';

import { useCreateBlogPost } from '../../../api/blog.queries';
import { usePortalBase } from '../../../hooks/usePortalBase';
import { BlogForm } from './BlogForm';

export default function BlogCreatePage() {
  const { t } = useTranslation();
  const base = usePortalBase();
  const navigate = useNavigate();
  const createPost = useCreateBlogPost();

  async function submit(payload: ICreateBlogPostPayload) {
    await createPost.mutateAsync(payload);
    navigate(`${base}/blog`);
  }

  return (
    <div className="flex flex-col gap-lg">
      <PageHeader
        title={t('pages.blog.create.title')}
        subtitle={t('pages.blog.create.subtitle')}
        actions={
          <Button variant="ghost" leadingIcon={<Icon name="arrow_back" size={18} />} onClick={() => navigate(`${base}/blog`)}>
            {t('pages.blog.backToBlog')}
          </Button>
        }
      />
      <BlogForm
        submitLabel={t('pages.blog.create.submit')}
        isSubmitting={createPost.isPending}
        onSubmit={submit}
      />
    </div>
  );
}
