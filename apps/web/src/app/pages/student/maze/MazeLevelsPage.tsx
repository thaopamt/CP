import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, Icon, PageHeader } from '@cp/ui';
import { DifficultyBadge } from '@cp/ui';
import { DifficultyLevel } from '@cp/shared';

import { useStudentMazeLevels } from '../../../api/maze.queries';

export default function MazeLevelsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: levels = [], isLoading } = useStudentMazeLevels();

  return (
    <div className="flex flex-col gap-lg pt-lg max-w-5xl mx-auto w-full">
      <PageHeader title={t('maze.student.title')} subtitle={t('maze.student.subtitle')} />

      {isLoading ? (
        <div className="grid place-items-center py-16 text-on-surface-variant">
          <span className="material-symbols-outlined animate-spin text-3xl">progress_activity</span>
        </div>
      ) : levels.length === 0 ? (
        <Card className="p-8 text-center text-on-surface-variant">{t('maze.student.empty')}</Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-md">
          {levels.map((lvl, i) => (
            <button
              key={lvl.id}
              onClick={() => navigate(`/student/maze/${lvl.id}`)}
              className="text-left"
            >
              <Card className="p-5 h-full transition-transform hover:-translate-y-1 hover:shadow-lg cursor-pointer">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-2xl">
                    🧩
                  </div>
                  <DifficultyBadge difficulty={lvl.difficulty as DifficultyLevel} />
                </div>
                <h3 className="mt-3 font-bold text-on-surface">{lvl.title}</h3>
                <p className="mt-1 text-body-md text-on-surface-variant line-clamp-2">
                  {lvl.description}
                </p>
                <div className="mt-4 flex items-center gap-1 text-primary text-label-sm font-semibold">
                  <Icon name="play_circle" /> {t('maze.student.play')}
                </div>
              </Card>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
