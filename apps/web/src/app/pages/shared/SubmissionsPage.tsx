import { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Icon } from '@cp/ui';
import { SubmissionStatus, UserRole } from '@cp/shared';
import { useAllMySubmissions, useAllSubmissions } from '../../api/submissions.queries';
import { useAuthStore } from '../../stores/auth.store';

/* ── Status config ──────────────────────────────────────────────── */
const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: string; border: string }> = {
  [SubmissionStatus.ACCEPTED]:             { label: 'AC', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10', icon: 'check_circle',   border: 'border-emerald-500/30' },
  [SubmissionStatus.WRONG_ANSWER]:         { label: 'WA',       color: 'text-red-600 dark:text-red-400',         bg: 'bg-red-500/10',     icon: 'cancel',         border: 'border-red-500/30' },
  [SubmissionStatus.TIME_LIMIT_EXCEEDED]:  { label: 'TLE',      color: 'text-amber-600 dark:text-amber-400',     bg: 'bg-amber-500/10',   icon: 'timer_off',      border: 'border-amber-500/30' },
  [SubmissionStatus.MEMORY_LIMIT_EXCEEDED]:{ label: 'MLE',      color: 'text-orange-600 dark:text-orange-400',   bg: 'bg-orange-500/10',  icon: 'memory',         border: 'border-orange-500/30' },
  [SubmissionStatus.COMPILATION_ERROR]:    { label: 'CE',       color: 'text-purple-600 dark:text-purple-400',   bg: 'bg-purple-500/10',  icon: 'code_off',       border: 'border-purple-500/30' },
  [SubmissionStatus.RUNTIME_ERROR]:        { label: 'RE',       color: 'text-rose-600 dark:text-rose-400',       bg: 'bg-rose-500/10',    icon: 'error',          border: 'border-rose-500/30' },
  [SubmissionStatus.PENDING]:              { label: 'Pending',  color: 'text-blue-600 dark:text-blue-400',       bg: 'bg-blue-500/10',    icon: 'hourglass_top',  border: 'border-blue-500/30' },
  [SubmissionStatus.INTERNAL_ERROR]:       { label: 'IE',       color: 'text-gray-600 dark:text-gray-400',       bg: 'bg-gray-500/10',    icon: 'warning',        border: 'border-gray-500/30' },
};

const LANG_ICON: Record<string, string> = {
  cpp: 'C++',
  java: 'Java',
  python: 'Python',
  javascript: 'JS',
};

function formatDate(dateStr: string) {
  try {
    const d = new Date(dateStr.endsWith('Z') || dateStr.includes('+') ? dateStr : `${dateStr}Z`);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60_000);
    const diffH = Math.floor(diffMs / 3_600_000);
    const diffD = Math.floor(diffMs / 86_400_000);

    if (diffMin < 1) return 'vừa xong';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffH < 24) return `${diffH}h ago`;
    if (diffD < 7) return `${diffD}d ago`;
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

function formatDateFull(dateStr: string) {
  try {
    const d = new Date(dateStr.endsWith('Z') || dateStr.includes('+') ? dateStr : `${dateStr}Z`);
    return d.toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch {
    return dateStr;
  }
}

/* ── Main Component ──────────────────────────────────────────────── */
export default function SubmissionsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  
  const isAdminOrTeacher = user?.role === UserRole.ADMIN || user?.role === UserRole.TEACHER;
  
  const { data: mySubmissions = [], isLoading: loadingMy } = useAllMySubmissions();
  const { data: allSubmissions = [], isLoading: loadingAll } = useAllSubmissions();
  
  const submissions = isAdminOrTeacher ? allSubmissions : mySubmissions;
  const isLoading = isAdminOrTeacher ? loadingAll : loadingMy;

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [langFilter, setLangFilter] = useState<string>('ALL');
  const [selectedSub, setSelectedSub] = useState<any>(null);

  // Close modal on Escape
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') setSelectedSub(null);
  }, []);
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Filter & search
  const filtered = useMemo(() => {
    return submissions.filter((sub: any) => {
      if (statusFilter !== 'ALL' && sub.status !== statusFilter) return false;
      if (langFilter !== 'ALL' && sub.language !== langFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const title = sub.assignment?.title?.toLowerCase() || '';
        const studentName = isAdminOrTeacher
          ? `${sub.user?.firstName || ''} ${sub.user?.lastName || ''}`.toLowerCase()
          : '';
        if (!title.includes(q) && !studentName.includes(q)) return false;
      }
      return true;
    });
  }, [submissions, statusFilter, langFilter, search, isAdminOrTeacher]);

  // Stats
  const stats = useMemo(() => {
    const total = submissions.length;
    const accepted = submissions.filter((s: any) => s.status === SubmissionStatus.ACCEPTED).length;
    const wrong = submissions.filter((s: any) => s.status === SubmissionStatus.WRONG_ANSWER).length;
    const other = total - accepted - wrong;
    return { total, accepted, wrong, other };
  }, [submissions]);

  const portalPrefix = location.pathname.startsWith('/admin') ? '/admin' : location.pathname.startsWith('/teacher') ? '/teacher' : '/student';

  return (
    <div className="max-w-[1400px] mx-auto py-lg space-y-lg">
      {/* ── Header ───────────────────────────────────────────────── */}
      <div>
        <h1 className="text-headline-md font-manrope font-extrabold text-on-surface">
          {t('pages.submissions.title', 'Submissions')}
        </h1>
        <p className="text-body-md text-on-surface-variant mt-xs">
          {t('pages.submissions.subtitle', isAdminOrTeacher ? 'All student submissions across assignments.' : 'Your submission history across all assignments.')}
        </p>
      </div>

      {/* ── Stats cards ──────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-md">
        <StatCard icon="description" label="Total" value={stats.total} color="text-primary" bg="bg-primary-container" />
        <StatCard icon="check_circle" label="Accepted" value={stats.accepted} color="text-emerald-500" bg="bg-emerald-500/10" />
        <StatCard icon="cancel" label="Wrong Answer" value={stats.wrong} color="text-red-400" bg="bg-red-500/10" />
        <StatCard icon="warning" label="Other" value={stats.other} color="text-amber-400" bg="bg-amber-500/10" />
      </div>

      {/* ── Filters ──────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-sm">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-[400px]">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">
            search
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('pages.submissions.searchPlaceholder', isAdminOrTeacher ? 'Search by problem or student...' : 'Search by problem name...')}
            className="w-full pl-10 pr-4 py-2.5 bg-surface-container-highest rounded-xl text-label-sm text-on-surface border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
          />
        </div>

        {/* Status filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2.5 bg-surface-container-highest rounded-xl text-label-sm text-on-surface border border-outline-variant focus:border-primary outline-none cursor-pointer min-w-[140px]"
        >
          <option value="ALL">{t('pages.submissions.allStatuses', 'All statuses')}</option>
          {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
            <option key={key} value={key}>{cfg.label}</option>
          ))}
        </select>

        {/* Language filter */}
        <select
          value={langFilter}
          onChange={(e) => setLangFilter(e.target.value)}
          className="px-3 py-2.5 bg-surface-container-highest rounded-xl text-label-sm text-on-surface border border-outline-variant focus:border-primary outline-none cursor-pointer min-w-[120px]"
        >
          <option value="ALL">{t('pages.submissions.allLanguages', 'All languages')}</option>
          <option value="cpp">C++</option>
          <option value="java">Java</option>
          <option value="python">Python</option>
          <option value="javascript">JavaScript</option>
        </select>

        <span className="text-label-sm text-on-surface-variant ml-auto">
          {filtered.length} / {submissions.length} {t('pages.submissions.results', 'results')}
        </span>
      </div>

      {/* ── Table ────────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="flex items-center justify-center py-xl">
          <Icon name="progress_activity" size={32} className="animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-xl gap-md text-center">
          <span className="material-symbols-outlined text-[64px] text-on-surface-variant/30">history</span>
          <p className="text-body-lg text-on-surface-variant">
            {submissions.length === 0
              ? t('pages.submissions.empty', 'No submissions yet. Start solving problems!')
              : t('pages.submissions.noMatch', 'No submissions match your filters.')}
          </p>
        </div>
      ) : (
        <div className="bg-surface-container-low rounded-2xl border border-outline-variant overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-[200px_1fr_100px_110px_100px_90px_110px] gap-0 px-md py-sm border-b border-outline-variant bg-surface-container-lowest text-center">
            <span className="text-label-sm font-semibold text-on-surface-variant uppercase tracking-wider text-left">Student</span>
            <span className="text-label-sm font-semibold text-on-surface-variant uppercase tracking-wider text-left">Problem</span>
            <span className="text-label-sm font-semibold text-on-surface-variant uppercase tracking-wider">Language</span>
            <span className="text-label-sm font-semibold text-on-surface-variant uppercase tracking-wider">Status</span>
            <span className="text-label-sm font-semibold text-on-surface-variant uppercase tracking-wider">Passed</span>
            <span className="text-label-sm font-semibold text-on-surface-variant uppercase tracking-wider">Time</span>
            <span className="text-label-sm font-semibold text-on-surface-variant uppercase tracking-wider">Submitted</span>
          </div>

          {/* Table rows */}
          <div className="divide-y divide-outline-variant">
            {filtered.map((sub: any) => {
              const sc = STATUS_CONFIG[sub.status] || STATUS_CONFIG[SubmissionStatus.INTERNAL_ERROR];

              return (
                <div
                  key={sub.id}
                  onClick={() => setSelectedSub(sub)}
                  className="grid grid-cols-[200px_1fr_100px_110px_100px_90px_110px] gap-0 px-md py-sm items-center cursor-pointer hover:bg-surface-container-highest/50 transition-colors group text-center"
                >
                  {/* Student */}
                  <div className="flex items-center gap-sm min-w-0 pr-sm text-left">
                    <div className="w-7 h-7 rounded-full bg-primary-container text-on-primary-container grid place-items-center text-[11px] font-bold shrink-0">
                      {((sub.user?.username || sub.user?.firstName)?.[0] || '?').toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-label-sm text-on-surface font-medium truncate">
                        {sub.user?.username ? `@${sub.user.username}` : `${sub.user?.firstName || ''} ${sub.user?.lastName || ''}`.trim() || 'Unknown'}
                      </p>
                    </div>
                  </div>

                  {/* Problem */}
                  <div className="min-w-0 pr-sm text-left">
                    <p className="text-label-sm text-on-surface font-medium truncate group-hover:text-primary transition-colors">
                      {sub.assignment?.title || 'Unknown'}
                    </p>
                  </div>

                  {/* Language */}
                  <span className="text-label-sm text-on-surface-variant font-mono">
                    {LANG_ICON[sub.language] || sub.language}
                  </span>

                  {/* Status badge */}
                  <div className="flex justify-center">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-bold ${sc.bg} ${sc.color}`}>
                      <span className="material-symbols-outlined text-[13px]">{sc.icon}</span>
                      {sc.label}
                    </span>
                  </div>

                  {/* Passed */}
                  <span className="text-label-sm text-on-surface-variant">
                    <span className="text-on-surface font-semibold">{sub.passedCount}</span>
                    <span className="text-on-surface-variant"> / {sub.totalCount}</span>
                  </span>

                  {/* Time */}
                  <span className="text-label-sm text-on-surface-variant">
                    {sub.totalExecutionTimeMs != null ? `${sub.totalExecutionTimeMs}ms` : '—'}
                  </span>

                  {/* Submitted */}
                  <span className="text-label-sm text-on-surface-variant" title={formatDateFull(sub.createdAt)}>
                    {formatDate(sub.createdAt)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Submission Detail Modal ──────────────────────────────── */}
      {selectedSub && (
        <SubmissionModal
          sub={selectedSub}
          isAdminOrTeacher={isAdminOrTeacher}
          portalPrefix={portalPrefix}
          onClose={() => setSelectedSub(null)}
          onNavigate={(assignmentId: string, submissionCode?: string, submissionLang?: string) => navigate(`${portalPrefix}/assignments/${assignmentId}`, { state: { submissionCode, submissionLang } })}
        />
      )}
    </div>
  );
}

function SubmissionModal({
  sub,
  isAdminOrTeacher,
  portalPrefix,
  onClose,
  onNavigate,
}: {
  sub: any;
  isAdminOrTeacher: boolean;
  portalPrefix: string;
  onClose: () => void;
  onNavigate: (assignmentId: string, code?: string, lang?: string) => void;
}) {
  const sc = STATUS_CONFIG[sub.status] || STATUS_CONFIG[SubmissionStatus.INTERNAL_ERROR];
  const testResults: any[] = sub.testResults || [];
  const [expandedTests, setExpandedTests] = useState<Set<number>>(new Set());

  const toggleTest = (idx: number) => {
    setExpandedTests((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-md"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative bg-surface-container rounded-3xl border border-outline-variant shadow-2xl w-full max-w-[560px] max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-lg py-md border-b border-outline-variant shrink-0">
          <div className="flex items-center gap-sm min-w-0">
            <span className={`material-symbols-outlined text-[22px] ${sc.color}`}>{sc.icon}</span>
            <div className="min-w-0">
              <h3 className="text-title-md font-manrope font-bold text-on-surface truncate">
                {sub.assignment?.title || 'Submission'}
              </h3>
              <div className="flex items-center gap-sm mt-0.5">
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-bold ${sc.bg} ${sc.color}`}>
                  {sc.label}
                </span>
                <span className="text-[11px] text-on-surface-variant font-mono">{LANG_ICON[sub.language] || sub.language}</span>
                <span className="text-[11px] text-on-surface-variant">{formatDateFull(sub.createdAt)}</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl grid place-items-center hover:bg-surface-container-highest text-on-surface-variant hover:text-on-surface transition-colors shrink-0"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-lg px-lg py-sm border-b border-outline-variant/50 bg-surface-container-lowest shrink-0">
          <div className="flex items-center gap-xs text-label-sm">
            <span className="material-symbols-outlined text-[15px] text-emerald-400">check_circle</span>
            <span className="text-on-surface font-semibold">{sub.passedCount}</span>
            <span className="text-on-surface-variant">/ {sub.totalCount} passed</span>
          </div>
          {sub.totalExecutionTimeMs != null && (
            <div className="flex items-center gap-xs text-label-sm text-on-surface-variant">
              <span className="material-symbols-outlined text-[15px]">timer</span>
              {sub.totalExecutionTimeMs}ms
            </div>
          )}
          {sub.maxMemoryBytes != null && (
            <div className="flex items-center gap-xs text-label-sm text-on-surface-variant">
              <span className="material-symbols-outlined text-[15px]">memory</span>
              {(sub.maxMemoryBytes / 1024 / 1024).toFixed(1)} MB
            </div>
          )}
          {sub.user && (
            <div className="flex items-center gap-xs text-label-sm text-on-surface-variant ml-auto">
              <span className="material-symbols-outlined text-[15px]">person</span>
              {sub.user.username ? `@${sub.user.username}` : `${sub.user.firstName || ''} ${sub.user.lastName || ''}`.trim() || 'Unknown'}
            </div>
          )}
        </div>

        {/* Test Cases List */}
        <div className="flex-1 overflow-y-auto px-lg py-md">
          <h4 className="text-label-sm font-semibold text-on-surface-variant uppercase tracking-wider mb-sm flex items-center gap-xs">
            <span className="material-symbols-outlined text-[15px] text-primary">science</span>
            Test Cases
          </h4>

          {testResults.length > 0 ? (
            <div className="space-y-xs">
              {testResults.map((tr: any, idx: number) => {
                const trSc = STATUS_CONFIG[tr.status] || STATUS_CONFIG[SubmissionStatus.INTERNAL_ERROR];
                const isExpanded = expandedTests.has(idx);
                
                // Extract input and expected output (fallback to assignment config if missing)
                const tcInput = sub.assignment?.codingConfig?.testCases?.[tr.testCaseIndex]?.input;
                const tcExpected = tr.expectedOutput || sub.assignment?.codingConfig?.testCases?.[tr.testCaseIndex]?.expectedOutput;

                return (
                  <div key={idx} className={`rounded-xl border ${trSc.border} overflow-hidden transition-all`}>
                    {/* Row header — clickable */}
                    <div
                      onClick={() => toggleTest(idx)}
                      className={`flex items-center gap-sm px-sm py-xs ${trSc.bg} cursor-pointer hover:brightness-110 transition-all select-none`}
                    >
                      {/* Status icon */}
                      <span className={`material-symbols-outlined text-[18px] ${trSc.color} shrink-0`}>
                        {trSc.icon}
                      </span>

                      {/* Test info */}
                      <span className="text-label-sm text-on-surface font-medium flex-1">
                        Test #{tr.testCaseIndex + 1}
                      </span>

                      {/* Status badge */}
                      <span className={`text-[11px] font-bold ${trSc.color} shrink-0`}>
                        {trSc.label}
                      </span>

                      {/* Time */}
                      {tr.executionTimeMs != null && (
                        <span className="text-[11px] text-on-surface-variant shrink-0 tabular-nums">
                          {tr.executionTimeMs}ms
                        </span>
                      )}

                      {/* Chevron */}
                      <span className={`material-symbols-outlined text-[16px] text-on-surface-variant shrink-0 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
                        expand_more
                      </span>
                    </div>

                    {/* Expanded detail */}
                    {isExpanded && (
                      <div className="px-sm py-sm space-y-sm bg-surface-container-lowest border-t border-outline-variant/30">
                        {/* Input */}
                        <div>
                          <span className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider">Input</span>
                          <pre className="mt-0.5 text-[11px] font-mono text-on-surface bg-surface-container-highest rounded-lg px-sm py-xs max-h-[100px] overflow-auto whitespace-pre-wrap break-all">
                            {tcInput || '(empty)'}
                          </pre>
                        </div>

                        {/* Expected Output */}
                        <div>
                          <span className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider">Expected Output</span>
                          <pre className="mt-0.5 text-[11px] font-mono text-on-surface bg-surface-container-highest rounded-lg px-sm py-xs max-h-[100px] overflow-auto whitespace-pre-wrap break-all">
                            {tcExpected || '(empty)'}
                          </pre>
                        </div>

                        {/* Actual Output */}
                        <div>
                          <span className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider">Your Output</span>
                          <pre className={`mt-0.5 text-[11px] font-mono rounded-lg px-sm py-xs max-h-[100px] overflow-auto whitespace-pre-wrap break-all ${
                            tr.status === SubmissionStatus.ACCEPTED 
                              ? 'text-emerald-600 bg-emerald-500/5' 
                              : 'text-red-500 bg-red-500/5'
                          }`}>
                            {tr.actualOutput || '(empty)'}
                          </pre>
                        </div>

                        {/* Error message if any */}
                        {tr.errorMessage && (
                          <div>
                            <span className="text-[10px] font-semibold text-red-400 uppercase tracking-wider">Error</span>
                            <pre className="mt-0.5 text-[11px] font-mono text-red-400 bg-red-500/5 rounded-lg px-sm py-xs max-h-[100px] overflow-auto whitespace-pre-wrap break-all">
                              {tr.errorMessage}
                            </pre>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-lg text-center">
              <span className="material-symbols-outlined text-[40px] text-on-surface-variant/30 mb-sm">quiz</span>
              <p className="text-label-sm text-on-surface-variant">No test result details available.</p>
            </div>
          )}
        </div>

        {/* Footer with action */}
        <div className="flex items-center justify-between px-lg py-sm border-t border-outline-variant shrink-0 bg-surface-container-lowest">
          <button
            onClick={onClose}
            className="px-md py-xs rounded-xl text-label-sm text-on-surface-variant hover:bg-surface-container-highest transition-colors"
          >
            Close
          </button>
          <button
            onClick={() => onNavigate(sub.assignmentId, sub.code, sub.language)}
            className="flex items-center gap-xs px-md py-xs rounded-xl text-label-sm font-semibold text-primary hover:bg-primary/10 transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">open_in_new</span>
            View Problem
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Stat Card ──────────────────────────────────────────────────── */
function StatCard({ icon, label, value, color, bg }: { icon: string; label: string; value: number; color: string; bg: string }) {
  return (
    <div className={`flex items-center gap-md p-md rounded-2xl ${bg} border border-outline-variant/30 transition-transform hover:scale-[1.02]`}>
      <div className={`w-10 h-10 rounded-xl grid place-items-center ${bg}`}>
        <span className={`material-symbols-outlined text-[20px] ${color}`}>{icon}</span>
      </div>
      <div>
        <p className={`text-headline-sm font-extrabold font-manrope ${color}`}>{value}</p>
        <p className="text-[11px] text-on-surface-variant font-medium uppercase tracking-wider">{label}</p>
      </div>
    </div>
  );
}
