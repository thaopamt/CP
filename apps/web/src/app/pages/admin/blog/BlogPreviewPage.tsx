import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button, Icon, PageHeader } from '@cp/ui';

import { useManageBlogPost } from '../../../api/blog.queries';
import { usePortalBase } from '../../../hooks/usePortalBase';
import { BlogArticleView } from '../../shared/blog/BlogArticleView';

export default function BlogPreviewPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const base = usePortalBase();
  const navigate = useNavigate();
  const { data: post, isLoading, isError, error } = useManageBlogPost(id);

  if (isLoading) return <CenteredState icon="progress_activity" label={t('common.loading')} spin />;
  if (isError || !post) return <CenteredState icon="error" label={(error as Error)?.message ?? t('common.notFound')} />;

  return (
    <div className="flex flex-col gap-lg">
      <PageHeader
        title={t('pages.blog.preview.title')}
        subtitle={post.slug}
        actions={
          <div className="flex gap-sm">
            <Button variant="ghost" leadingIcon={<Icon name="edit" size={18} />} onClick={() => navigate(`${base}/blog/${post.id}/edit`)}>
              {t('common.edit')}
            </Button>
            <Button variant="ghost" leadingIcon={<Icon name="arrow_back" size={18} />} onClick={() => navigate(`${base}/blog`)}>
              {t('pages.blog.backToBlog')}
            </Button>
          </div>
        }
      />
      <BlogArticleView post={post} showStatus />
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
