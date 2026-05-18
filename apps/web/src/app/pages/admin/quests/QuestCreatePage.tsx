import { useNavigate } from 'react-router-dom';
import { PageHeader, Button, Icon } from '@cp/ui';
import { useCreateQuest } from '../../../api/quests.queries';
import { QuestForm } from './QuestForm';

export default function QuestCreatePage() {
  const navigate = useNavigate();
  const createMutation = useCreateQuest();

  return (
    <div className="p-8">
      <PageHeader
        title="Create New Quest"
        subtitle="Design a new challenge for students to complete"
        breadcrumb={<Button variant="ghost" leadingIcon={<Icon name="arrow_back" />} onClick={() => navigate('/admin/quests')}>Back</Button>}
      />
      <div className="mt-8 bg-surface-container-lowest rounded-3xl p-8 shadow-sm">
        <QuestForm 
          onSubmit={(data) => {
            createMutation.mutate(data, {
              onSuccess: () => navigate('/admin/quests')
            });
          }}
          isLoading={createMutation.isPending}
        />
      </div>
    </div>
  );
}
