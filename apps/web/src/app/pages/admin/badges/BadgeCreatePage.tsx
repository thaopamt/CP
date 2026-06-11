import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PageHeader, Button, Icon } from '@cp/ui';
import { useCreateBadge } from '../../../api/badges.queries';
import { usePortalBase } from '../../../hooks/usePortalBase';
import { BadgeForm } from './BadgeForm';

export default function BadgeCreatePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const base = usePortalBase();
  const createMutation = useCreateBadge();

  return (
    <div className="p-8">
      <PageHeader
        title={t('gamif.admin.badges.form.createTitle')}
        subtitle={t('gamif.admin.badges.subtitle')}
        breadcrumb={
          <Button variant="ghost" leadingIcon={<Icon name="arrow_back" />} onClick={() => navigate(`${base}/badges`)}>
            {t('gamif.admin.badges.title')}
          </Button>
        }
      />
      <div className="mt-8 bg-surface-container-lowest rounded-3xl p-8 shadow-sm">
        <BadgeForm
          onSubmit={(data) => {
            createMutation.mutate(data, {
              onSuccess: () => navigate(`${base}/badges`),
            });
          }}
          isLoading={createMutation.isPending}
        />
      </div>
    </div>
  );
}
