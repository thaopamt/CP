import { useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button, Icon, PageHeader } from '@cp/ui';

import { useMarkBlogRead, usePublishedBlogPost } from '../../../api/blog.queries';
import { BlogArticleView } from '../../shared/blog/BlogArticleView';

export default function BlogDetailPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { slug } = useParams();
  const { data: post, isLoading, isError, error } = usePublishedBlogPost(slug);
  const markRead = useMarkBlogRead();

  // Mark the post read once after it loads (decrements the unread nav badge).
  const markedId = useRef<string | null>(null);
  useEffect(() => {
    if (post?.id && markedId.current !== post.id) {
      markedId.current = post.id;
      markRead.mutate(post.id);
    }
  }, [post?.id, markRead]);

  if (isLoading) return <CenteredState icon="progress_activity" label={t('common.loading')} spin />;
  if (isError || !post) return <CenteredState icon="error" label={(error as Error)?.message ?? t('common.notFound')} />;

  return (
    <div className="flex flex-col gap-lg py-lg">
      <PageHeader
        title={t('pages.blog.reader.article')}
        actions={
          <Button variant="ghost" leadingIcon={<Icon name="arrow_back" size={18} />} onClick={() => navigate('/student/blog')}>
            {t('pages.blog.backToBlog')}
          </Button>
        }
      />
      <BlogArticleView post={post} />
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
