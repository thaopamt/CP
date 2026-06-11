import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button, Card, Icon, StatusBadge, useConfirm, useToast } from '@cp/ui';
import { DifficultyBadge } from '@cp/ui';
import { DifficultyLevel, PublishStatus } from '@cp/shared';

import { useDeleteMazeLevel, useMazeLevels } from '../../../api/maze.queries';
import { usePortalBase } from '../../../hooks/usePortalBase';

export default function MazeLevelsListPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const base = usePortalBase();
  const toast = useToast();
  const confirm = useConfirm();
  const { data: levels = [], isLoading } = useMazeLevels();
  const deleteMutation = useDeleteMazeLevel();

  const handleDelete = async (id: string, title: string) => {
    const ok = await confirm({
      title: t('maze.admin.deleteTitle'),
      message: t('maze.admin.deleteConfirm', { title }),
      intent: 'danger',
    });
    if (!ok) return;
    deleteMutation.mutate(id, {
      onSuccess: () => toast.success(t('maze.admin.deleted')),
      onError: () => toast.error(t('maze.admin.saveError')),
    });
  };

  return (
    <div className="flex flex-col gap-lg pt-lg max-w-[1100px] mx-auto w-full">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface">{t('maze.admin.title')}</h1>
          <p className="text-body-md text-on-surface-variant">{t('maze.admin.subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" leadingIcon={<Icon name="leaderboard" />} onClick={() => navigate(`${base}/maze/progress`)}>
            {t('maze.admin.progress')}
          </Button>
          <Button variant="admin" leadingIcon={<Icon name="add" />} onClick={() => navigate(`${base}/maze/new`)}>
            {t('maze.admin.create')}
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid place-items-center py-16 text-on-surface-variant">
          <span className="material-symbols-outlined animate-spin text-3xl">progress_activity</span>
        </div>
      ) : levels.length === 0 ? (
        <Card className="p-8 text-center text-on-surface-variant">{t('maze.admin.empty')}</Card>
      ) : (
        <div className="flex flex-col gap-3">
          {levels.map((lvl) => (
            <Card key={lvl.id} className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-2xl">
                🧩
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-on-surface truncate">{lvl.title}</span>
                  <span className="text-label-sm text-on-surface-variant">
                    {lvl.gridConfig.width}×{lvl.gridConfig.height}
                  </span>
                </div>
                <p className="text-body-md text-on-surface-variant truncate">{lvl.description}</p>
              </div>
              <DifficultyBadge difficulty={lvl.difficulty as DifficultyLevel} />
              <StatusBadge tone={lvl.status === PublishStatus.PUBLISHED ? 'success' : 'neutral'}>
                {lvl.status === PublishStatus.PUBLISHED ? t('maze.builder.published') : t('maze.builder.draft')}
              </StatusBadge>
              <div className="flex gap-1">
                <button
                  className="p-2 rounded-lg hover:bg-surface-container-highest text-on-surface-variant"
                  onClick={() => navigate(`${base}/maze/${lvl.id}/edit`)}
                  aria-label={t('common.edit')}
                >
                  <Icon name="edit" />
                </button>
                <button
                  className="p-2 rounded-lg hover:bg-error/10 text-error"
                  onClick={() => handleDelete(lvl.id, lvl.title)}
                  aria-label={t('common.delete')}
                >
                  <Icon name="delete" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
