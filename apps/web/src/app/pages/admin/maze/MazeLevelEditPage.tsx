import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PageHeader, useToast } from '@cp/ui';
import { BlockType, PublishStatus } from '@cp/shared';

import { useMazeLevel, useUpdateMazeLevel } from '../../../api/maze.queries';
import { MazeLevelBuilder, MazeLevelDraft } from './MazeLevelBuilder';

export default function MazeLevelEditPage() {
  const { id = '' } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();

  const { data: level, isLoading } = useMazeLevel(id);
  const updateMutation = useUpdateMazeLevel(id);
  const [draft, setDraft] = useState<MazeLevelDraft | null>(null);

  useEffect(() => {
    if (level) {
      setDraft({
        title: level.title,
        description: level.description,
        gridConfig: level.gridConfig,
        allowedBlocks: (level.allowedBlocks ?? []) as BlockType[],
        maxBlocks: level.maxBlocks,
        difficulty: level.difficulty,
        status: (level.status as PublishStatus) ?? PublishStatus.DRAFT,
        courseId: level.courseId,
        order: level.order,
        classIds: level.classIds ?? [],
      });
    }
  }, [level]);

  if (isLoading || !draft) {
    return (
      <div className="grid place-items-center py-20 text-on-surface-variant">
        <span className="material-symbols-outlined animate-spin text-3xl">progress_activity</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-lg pt-lg max-w-[1200px] mx-auto w-full">
      <PageHeader
        title={t('maze.admin.editTitle')}
        breadcrumb={
          <Link to="/admin/maze" className="text-label-sm text-on-surface-variant hover:text-primary">
            {t('maze.admin.title')}
          </Link>
        }
      />
      <MazeLevelBuilder
        draft={draft}
        onChange={setDraft}
        saving={updateMutation.isPending}
        onSave={(payload) =>
          updateMutation.mutate(payload, {
            onSuccess: () => {
              toast.success(t('maze.admin.updated'));
              navigate('/admin/maze');
            },
            onError: () => toast.error(t('maze.admin.saveError')),
          })
        }
      />
    </div>
  );
}
