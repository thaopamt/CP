import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, Icon, PageHeader, StatusBadge } from '@cp/ui';
import { DifficultyBadge } from '@cp/ui';
import { DifficultyLevel } from '@cp/shared';

import { useMazeProgress, useMazeProgressSummary } from '../../../api/maze.queries';
import { usePortalBase } from '../../../hooks/usePortalBase';

export default function MazeProgressPage() {
  const { t } = useTranslation();
  const base = usePortalBase();
  const { data: summary = [], isLoading } = useMazeProgressSummary();
  const [selected, setSelected] = useState<string | null>(null);
  const { data: detail = [] } = useMazeProgress(selected ?? undefined);

  return (
    <div className="flex flex-col gap-lg pt-lg max-w-[1100px] mx-auto w-full">
      <PageHeader
        title={t('maze.progress.title')}
        subtitle={t('maze.progress.subtitle')}
        breadcrumb={
          <Link to={`${base}/maze`} className="text-label-sm text-on-surface-variant hover:text-primary">
            {t('maze.admin.title')}
          </Link>
        }
      />

      {isLoading ? (
        <div className="grid place-items-center py-16 text-on-surface-variant">
          <span className="material-symbols-outlined animate-spin text-3xl">progress_activity</span>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {summary.map((row) => (
            <Card key={row.levelId} className="overflow-hidden">
              <button
                className="flex w-full items-center gap-4 p-4 text-left hover:bg-surface-container-low"
                onClick={() => setSelected(selected === row.levelId ? null : row.levelId)}
              >
                <Icon name={selected === row.levelId ? 'expand_more' : 'chevron_right'} />
                <span className="flex-1 font-bold text-on-surface truncate">{row.title}</span>
                <DifficultyBadge difficulty={row.difficulty as DifficultyLevel} />
                <StatusBadge tone="success">
                  {t('maze.progress.solvedN', { n: row.solvedCount })}
                </StatusBadge>
                <StatusBadge tone="neutral">
                  {t('maze.progress.attemptedN', { n: row.attemptedCount })}
                </StatusBadge>
              </button>

              {selected === row.levelId && (
                <div className="border-t border-outline-variant">
                  {detail.length === 0 ? (
                    <p className="p-4 text-center text-on-surface-variant">{t('maze.progress.noAttempts')}</p>
                  ) : (
                    <table className="w-full text-body-md">
                      <thead className="text-label-sm text-on-surface-variant">
                        <tr className="border-b border-outline-variant">
                          <th className="px-4 py-2 text-left">{t('maze.progress.student')}</th>
                          <th className="px-4 py-2 text-center">{t('maze.progress.status')}</th>
                          <th className="px-4 py-2 text-center">{t('maze.progress.attempts')}</th>
                          <th className="px-4 py-2 text-center">{t('maze.progress.bestBlocks')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detail.map((s) => (
                          <tr key={s.userId} className="border-b border-outline-variant last:border-0">
                            <td className="px-4 py-2">{s.studentName || s.userId}</td>
                            <td className="px-4 py-2 text-center">
                              {s.solved ? (
                                <span className="text-emerald-600 font-semibold">✅ {t('maze.progress.solved')}</span>
                              ) : (
                                <span className="text-amber-600 font-semibold">⏳ {t('maze.progress.trying')}</span>
                              )}
                            </td>
                            <td className="px-4 py-2 text-center">{s.attempts}</td>
                            <td className="px-4 py-2 text-center">{s.bestBlocks ?? '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
