import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PageHeader, useToast } from '@cp/ui';

import { useCreateMazeLevel } from '../../../api/maze.queries';
import { usePortalBase } from '../../../hooks/usePortalBase';
import { MazeLevelBuilder, MazeLevelDraft, emptyDraft } from './MazeLevelBuilder';

export default function MazeLevelCreatePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const base = usePortalBase();
  const toast = useToast();
  const createMutation = useCreateMazeLevel();
  const [draft, setDraft] = useState<MazeLevelDraft>(emptyDraft());

  return (
    <div className="flex flex-col gap-lg pt-lg max-w-[1200px] mx-auto w-full">
      <PageHeader
        title={t('maze.admin.createTitle')}
        breadcrumb={
          <Link to={`${base}/maze`} className="text-label-sm text-on-surface-variant hover:text-primary">
            {t('maze.admin.title')}
          </Link>
        }
      />
      <MazeLevelBuilder
        draft={draft}
        onChange={setDraft}
        saving={createMutation.isPending}
        onSave={(payload) =>
          createMutation.mutate(payload, {
            onSuccess: () => {
              toast.success(t('maze.admin.created'));
              navigate(`${base}/maze`);
            },
            onError: () => toast.error(t('maze.admin.saveError')),
          })
        }
      />
    </div>
  );
}
