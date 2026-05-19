import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PageHeader, Icon, Button } from '@cp/ui';
import { useQuest, useUpdateQuest } from '../../../api/quests.queries';
import { QuestForm } from './QuestForm';

export default function QuestEditPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: quest, isLoading } = useQuest(id!);
  const updateMutation = useUpdateQuest(id!);

  if (isLoading) {
    return <div className="p-8 flex justify-center"><Icon name="sync" className="animate-spin text-emerald-400" size={48} /></div>;
  }

  return (
    <div className="p-8">
      <PageHeader
        title={t('pages.admin.questEdit.title')}
        subtitle={t('pages.admin.questEdit.subtitle', { name: quest?.title })}
        breadcrumb={<Button variant="ghost" leadingIcon={<Icon name="arrow_back" />} onClick={() => navigate('/admin/quests')}>{t('pages.admin.questEdit.back')}</Button>}
      />
      <div className="mt-8 bg-surface-container-lowest rounded-3xl p-8 shadow-sm">
        {quest && (
          <QuestForm 
            defaultValues={quest}
            onSubmit={(data) => {
              updateMutation.mutate(data, {
                onSuccess: () => navigate('/admin/quests')
              });
            }}
            isLoading={updateMutation.isPending}
          />
        )}
      </div>
    </div>
  );
}
