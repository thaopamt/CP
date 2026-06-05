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
  const completedCount = levels.filter((level) => level.solved).length;

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
        <>
          <div className="flex items-center justify-between gap-md rounded-xl border border-outline-variant bg-surface-container-lowest px-4 py-3">
            <span className="flex items-center gap-2 text-label-sm font-semibold text-on-surface-variant">
              <Icon name="task_alt" size={18} className="text-emerald-600" />
              {completedCount} / {levels.length}
            </span>
            <div className="h-2 w-32 overflow-hidden rounded-full bg-surface-container-high">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all"
                style={{ width: `${levels.length > 0 ? Math.round((completedCount / levels.length) * 100) : 0}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-md">
            {levels.map((lvl) => {
              const solved = !!lvl.solved;
              const attempted = !solved && (lvl.attempts ?? 0) > 0;

              return (
                <button
                  key={lvl.id}
                  onClick={() => navigate(`/student/maze/${lvl.id}`)}
                  className="text-left"
                >
                  <Card
                    className={`p-5 h-full transition-transform hover:-translate-y-1 hover:shadow-lg cursor-pointer ${
                      solved
                        ? 'border-emerald-500/40 bg-emerald-500/5'
                        : attempted
                          ? 'border-amber-500/40 bg-amber-500/5'
                          : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-2xl">
                        🧩
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <DifficultyBadge difficulty={lvl.difficulty as DifficultyLevel} />
                        {attempted && (
                          <span className="inline-flex items-center justify-center rounded-full bg-amber-500/10 p-1.5 text-amber-700 dark:text-amber-300">
                            <Icon name="history" size={14} />
                          </span>
                        )}
                      </div>
                    </div>
                    <h3 className="mt-3 font-bold text-on-surface">{lvl.title}</h3>
                    <p className="mt-1 text-body-md text-on-surface-variant line-clamp-2">
                      {lvl.description}
                    </p>
                    <div className="mt-4 flex items-center gap-1 text-primary text-label-sm font-semibold">
                      <Icon name={solved ? 'replay' : attempted ? 'restart_alt' : 'play_circle'} />
                    </div>
                  </Card>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
