import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PageHeader, Button, Icon } from '@cp/ui';
import { useCreateQuest } from '../../../api/quests.queries';
import { usePortalBase } from '../../../hooks/usePortalBase';
import { QuestForm } from './QuestForm';

export default function QuestCreatePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const base = usePortalBase();
  const createMutation = useCreateQuest();

  return (
    <div className="p-8">
      <PageHeader
        title={t('pages.admin.questCreate.title')}
        subtitle={t('pages.admin.questCreate.subtitle')}
        breadcrumb={<Button variant="ghost" leadingIcon={<Icon name="arrow_back" />} onClick={() => navigate(`${base}/quests`)}>{t('pages.admin.questCreate.back')}</Button>}
      />
      <div className="mt-8 bg-surface-container-lowest rounded-3xl p-8 shadow-sm">
        <QuestForm 
          onSubmit={(data) => {
            createMutation.mutate(data, {
              onSuccess: () => navigate(`${base}/quests`)
            });
          }}
          isLoading={createMutation.isPending}
        />
      </div>
    </div>
  );
}
