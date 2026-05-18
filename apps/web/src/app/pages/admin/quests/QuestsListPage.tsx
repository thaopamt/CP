import { useNavigate } from 'react-router-dom';
import { Button, Icon, PageHeader, DataTable } from '@cp/ui';
import { useQuests, useDeleteQuest } from '../../../api/quests.queries';

export default function QuestsListPage() {
  const navigate = useNavigate();
  const { data: quests, isLoading } = useQuests();
  const deleteMutation = useDeleteQuest();

  const columns = [
    { key: 'title', header: 'Title', cell: (q: any) => q.title },
    { key: 'type', header: 'Type', cell: (q: any) => q.type },
    { key: 'targetCount', header: 'Target', cell: (q: any) => q.targetCount },
    { key: 'rewardXp', header: 'XP Reward', cell: (q: any) => q.rewardXp },
    { key: 'rewardGems', header: 'Gems Reward', cell: (q: any) => q.rewardGems },
    {
      key: 'actions',
      header: '',
      cell: (q: any) => (
        <div className="flex gap-2 justify-end">
          <Button variant="ghost" leadingIcon={<Icon name="edit" />} onClick={() => navigate(`/admin/quests/${q.id}/edit`)} />
          <Button variant="ghost" leadingIcon={<Icon name="delete" />} className="text-red-500" onClick={() => deleteMutation.mutate(q.id)} />
        </div>
      ),
    },
  ];

  return (
    <div className="p-8">
      <PageHeader
        title="Quests Management"
        subtitle="Manage gamification quests and bounties for students"
        actions={<Button leadingIcon={<Icon name="add" />} onClick={() => navigate('/admin/quests/new')}>New Quest</Button>}
      />
      <div className="mt-8 bg-surface-container-lowest rounded-3xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 flex justify-center"><Icon name="sync" className="animate-spin text-emerald-400" size={32} /></div>
        ) : (
          <DataTable 
            columns={columns} 
            rows={quests?.data || []} 
            rowKey={(q: any) => q.id} 
          />
        )}
      </div>
    </div>
  );
}
