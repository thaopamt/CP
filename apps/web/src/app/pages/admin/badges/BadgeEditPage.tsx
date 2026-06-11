import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PageHeader, Icon, Button } from '@cp/ui';
import { useBadge, useUpdateBadge } from '../../../api/badges.queries';
import { usePortalBase } from '../../../hooks/usePortalBase';
import { BadgeForm } from './BadgeForm';

export default function BadgeEditPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const base = usePortalBase();
  const { data: badge, isLoading } = useBadge(id!);
  const updateMutation = useUpdateBadge(id!);

  if (isLoading) {
    return (
      <div className="p-8 flex justify-center">
        <Icon name="sync" className="animate-spin text-primary" size={48} />
      </div>
    );
  }

  return (
    <div className="p-8">
      <PageHeader
        title={t('gamif.admin.badges.form.editTitle')}
        subtitle={badge?.title}
        breadcrumb={
          <Button variant="ghost" leadingIcon={<Icon name="arrow_back" />} onClick={() => navigate(`${base}/badges`)}>
            {t('gamif.admin.badges.title')}
          </Button>
        }
      />
      <div className="mt-8 bg-surface-container-lowest rounded-3xl p-8 shadow-sm">
        {badge && (
          <BadgeForm
            defaultValues={badge}
            onSubmit={(data) => {
              updateMutation.mutate(data, {
                onSuccess: () => navigate(`${base}/badges`),
              });
            }}
            isLoading={updateMutation.isPending}
          />
        )}
      </div>
    </div>
  );
}
