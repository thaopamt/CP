import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  AssignmentCard,
  Icon,
  PageHeader,
  Pagination,
} from '@cp/ui';
import {
  DifficultyLevel,
} from '@cp/shared';
import { useMyTasks } from '../../api/student.queries';

const PAGE_SIZE = 10;

export default function StudentAssignmentsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [category, setCategory] = useState<string>('all');
  const [difficulty, setDifficulty] = useState<DifficultyLevel | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useMyTasks({
    page,
    limit: PAGE_SIZE,
    search: searchQuery,
    category,
    difficulty,
  });

  const visible = data?.items ?? [];
  const total = data?.total ?? 0;
  const pageCount = data?.pageCount ?? 1;

  // For now we hardcode subjects since we're doing server-side filtering without a facets API
  const CATEGORY_KEYS = ['all', 'Mathematics', 'Computer Science', 'Physics'];

  function resetPage<T>(setter: (v: T) => void) {
    return (v: T) => {
      setter(v);
      setPage(1);
    };
  }

  return (
    <div className="flex flex-col gap-lg pt-lg max-w-5xl mx-auto w-full">
      <PageHeader
        title={t('pages.student.assignments.title')}
        subtitle={t('pages.student.assignments.subtitle')}
      />

      {/* Filters Section */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-md flex flex-col sm:flex-row items-center gap-md">
        <div className="flex-1 w-full relative">
          <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-outline-variant" size={20} />
          <input 
            type="text" 
            placeholder={t('common.search', 'Search assignments...')} 
            value={searchQuery}
            onChange={(e) => resetPage(setSearchQuery)(e.target.value)}
            className="w-full bg-surface-container-low border border-outline-variant rounded-xl pl-10 pr-4 py-2.5 text-sm text-on-surface focus:ring-2 focus:ring-primary outline-none transition-all placeholder:text-on-surface-variant/50"
          />
        </div>
        
        <div className="flex w-full sm:w-auto items-center gap-sm">
          <div className="relative flex-1 sm:w-40">
            <select 
              value={category} 
              onChange={(e) => resetPage(setCategory)(e.target.value)}
              className="w-full bg-surface-container-low border border-outline-variant rounded-xl pl-4 pr-10 py-2.5 text-sm text-on-surface appearance-none focus:ring-2 focus:ring-primary outline-none cursor-pointer transition-all"
            >
              <option value="all">All Subjects</option>
              {CATEGORY_KEYS.filter(c => c !== 'all').map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <Icon name="expand_more" className="absolute right-3 top-1/2 -translate-y-1/2 text-outline-variant pointer-events-none" size={20} />
          </div>

          <div className="relative flex-1 sm:w-40">
            <select 
              value={difficulty} 
              onChange={(e) => resetPage(setDifficulty)(e.target.value as DifficultyLevel | 'all')}
              className="w-full bg-surface-container-low border border-outline-variant rounded-xl pl-4 pr-10 py-2.5 text-sm text-on-surface appearance-none focus:ring-2 focus:ring-primary outline-none cursor-pointer transition-all"
            >
              <option value="all">All Difficulties</option>
              <option value={DifficultyLevel.EASY}>Easy</option>
              <option value={DifficultyLevel.MEDIUM}>Medium</option>
              <option value={DifficultyLevel.HARD}>Hard</option>
            </select>
            <Icon name="expand_more" className="absolute right-3 top-1/2 -translate-y-1/2 text-outline-variant pointer-events-none" size={20} />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-md">
        {isLoading ? (
          <div className="p-xl text-center text-on-surface-variant">{t('common.loading', 'Loading...')}</div>
        ) : visible.length === 0 ? (
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/40 p-xl text-center text-on-surface-variant">
            <Icon name="task_alt" size={36} className="mx-auto mb-sm text-on-surface-variant/50" />
            <div className="text-body-lg font-medium mb-1">No assignments found</div>
            <div className="text-body-sm text-on-surface-variant/70">Try adjusting your filters or search query.</div>
          </div>
        ) : (
          <>
            {visible.map((a) => <AssignmentCard key={a.id} assignment={a} onAction={() => navigate(`/student/assignments/${a.id}`)} />)}
            {pageCount > 1 && (
              <div className="mt-md flex justify-center">
                <Pagination page={page} pageCount={pageCount} onChange={setPage} />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
