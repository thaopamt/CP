import { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Icon, Pagination, Avatar, useConfirm, useToast } from '@cp/ui';
import { SubmissionStatus, UserRole } from '@cp/shared';
import { useAllSubmissions, useRejudgeSubmission } from '../../api/submissions.queries';
import { useAuthStore } from '../../stores/auth.store';
import { useSubmissionRealtimeFeed } from '../../hooks/useSubmissionRealtimeFeed';

const PAGE_SIZE = 20;

/* ── Status config ──────────────────────────────────────────────── */
const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: string; border: string }> = {
  [SubmissionStatus.ACCEPTED]: { label: 'AC', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10', icon: 'check_circle', border: 'border-emerald-500/30' },
  [SubmissionStatus.WRONG_ANSWER]: { label: 'WA', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-500/10', icon: 'cancel', border: 'border-red-500/30' },
  [SubmissionStatus.TIME_LIMIT_EXCEEDED]: { label: 'TLE', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10', icon: 'timer_off', border: 'border-amber-500/30' },
  [SubmissionStatus.MEMORY_LIMIT_EXCEEDED]: { label: 'MLE', color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-500/10', icon: 'memory', border: 'border-orange-500/30' },
  [SubmissionStatus.COMPILATION_ERROR]: { label: 'CE', color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-500/10', icon: 'code_off', border: 'border-purple-500/30' },
  [SubmissionStatus.RUNTIME_ERROR]: { label: 'RE', color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-500/10', icon: 'error', border: 'border-rose-500/30' },
  [SubmissionStatus.PENDING]: { label: 'Pending', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500/10', icon: 'hourglass_top', border: 'border-blue-500/30' },
  [SubmissionStatus.INTERNAL_ERROR]: { label: 'IE', color: 'text-gray-600 dark:text-gray-400', bg: 'bg-gray-500/10', icon: 'warning', border: 'border-gray-500/30' },
};

const LANG_CONFIG: Record<string, { label: string; color: string }> = {
  cpp: { label: 'C++', color: 'text-sky-700 bg-sky-100 dark:text-sky-300 dark:bg-sky-500/15' },
  java: { label: 'Java', color: 'text-orange-700 bg-orange-100 dark:text-orange-300 dark:bg-orange-500/15' },
  python: { label: 'Python', color: 'text-amber-700 bg-amber-100 dark:text-amber-300 dark:bg-amber-500/15' },
  javascript: { label: 'JS', color: 'text-yellow-700 bg-yellow-100 dark:text-yellow-300 dark:bg-yellow-500/15' },
};

function LangBadge({ language, className = '' }: { language: string; className?: string }) {
  const c = LANG_CONFIG[language] ?? {
    label: language,
    color: 'text-on-surface-variant bg-surface-container-high',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold font-mono ${c.color} ${className}`}>
      {c.label}
    </span>
  );
}

/** Initials fallback for a submission's author. */
function userInitials(u: { username?: string | null; firstName?: string; email?: string } | undefined): string {
  return ((u?.username || u?.firstName)?.[0] || u?.email?.[0] || '?').toUpperCase();
}

/** Display name for a submission's author — username (no `@`) or full name. */
function userName(u: { username?: string | null; firstName?: string; lastName?: string } | undefined): string {
  if (!u) return 'Unknown';
  if (u.username) return u.username;
  return `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'Unknown';
}

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

/**
 * Test case input/output can be very large (competitive problems). Only show a
 * short preview in the submission detail — the full payload lives on the server.
 */
const PREVIEW_MAX_CHARS = 500;
const PREVIEW_MAX_LINES = 15;
function previewText(value: string | null | undefined): { text: string; truncated: boolean } {
  const text = value ?? '';
  let out = text;
  let truncated = false;
  const lines = out.split('\n');
  if (lines.length > PREVIEW_MAX_LINES) {
    out = lines.slice(0, PREVIEW_MAX_LINES).join('\n');
    truncated = true;
  }
  if (out.length > PREVIEW_MAX_CHARS) {
    out = out.slice(0, PREVIEW_MAX_CHARS);
    truncated = true;
  }
  return { text: out, truncated };
}

function getJudgeProgressText(sub: any) {
  const progress = sub.judgeProgress;
  if (!progress) return null;

  if (progress.phase === 'queued') return 'Queued';
  if (progress.phase === 'running' && progress.currentTestCaseIndex != null) {
    return `Test #${progress.currentTestCaseIndex + 1} / ${progress.totalCount}`;
  }
  if (progress.phase === 'failed') return 'Failed';
  if (sub.status === SubmissionStatus.PENDING && progress.completedCount > 0) {
    return `${progress.completedCount} / ${progress.totalCount}`;
  }
  return null;
}

function isJudging(sub: any) {
  return sub.status === SubmissionStatus.PENDING || sub.judgeProgress?.phase === 'queued' || sub.judgeProgress?.phase === 'running';
}

function getDisplayTestResults(sub: any) {
  const results = [...(sub.testResults || [])].sort((a: any, b: any) => a.testCaseIndex - b.testCaseIndex);
  const totalCount = Math.max(sub.totalCount || 0, sub.judgeProgress?.totalCount || 0, results.length);

  if (totalCount <= results.length && !isJudging(sub)) {
    return results;
  }

  const byIndex = new Map<number, any>();
  for (const result of results) {
    byIndex.set(result.testCaseIndex, result);
  }

  return Array.from({ length: totalCount }, (_, idx) => {
    return byIndex.get(idx) ?? {
      testCaseIndex: idx,
      status: SubmissionStatus.PENDING,
      expectedOutput: '',
      actualOutput: '',
      errorMessage: null,
      executionTimeMs: null,
      memoryBytes: null,
      isPlaceholder: true,
    };
  });
}

function isRunningTestCase(sub: any, testCaseIndex: number) {
  return sub.judgeProgress?.phase === 'running' && sub.judgeProgress.currentTestCaseIndex === testCaseIndex;
}

/* ── Main Component ──────────────────────────────────────────────── */
export default function SubmissionsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const isAdminOrTeacher = user?.role === UserRole.ADMIN || user?.role === UserRole.TEACHER;

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [langFilter, setLangFilter] = useState<string>('ALL');
  const [page, setPage] = useState(1);
  const [selectedSubId, setSelectedSubId] = useState<string | null>(null);

  // Debounce the search box so we don't refetch on every keystroke.
  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(id);
  }, [search]);

  // Any filter change resets to page 1.
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter, langFilter]);

  const params = {
    page,
    limit: PAGE_SIZE,
    search: debouncedSearch || undefined,
    status: statusFilter,
    language: langFilter,
  };
  const allQuery = useAllSubmissions(params);
  const result = allQuery.data;
  const isLoading = allQuery.isLoading;
  const { isConnected: realtimeConnected } = useSubmissionRealtimeFeed();

  const submissions = result?.data ?? [];
  const total = result?.total ?? 0;
  const pageCount = result?.pageCount ?? 1;
  const stats = result?.stats ?? { total: 0, accepted: 0, wrong: 0, other: 0 };

  // Derive the open submission from the live list so realtime updates flow in.
  const selectedSub = useMemo(
    () => submissions.find((sub: any) => sub.id === selectedSubId) ?? null,
    [selectedSubId, submissions],
  );

  // Close modal on Escape
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') setSelectedSubId(null);
  }, []);
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const portalPrefix = location.pathname.startsWith('/admin') ? '/admin' : location.pathname.startsWith('/teacher') ? '/teacher' : '/student';

  /** Students may only view their own submission details. */
  const canViewDetail = useCallback(
    (sub: any) => isAdminOrTeacher || sub.userId === user?.id,
    [isAdminOrTeacher, user?.id],
  );

  const handleRowClick = useCallback(
    (sub: any) => {
      if (canViewDetail(sub)) {
        setSelectedSubId(sub.id);
      }
    },
    [canViewDetail],
  );

  return (
    <div className="max-w-[1400px] mx-auto py-lg space-y-lg">
      {/* ── Header ───────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-md">
        <div>
          <h1 className="text-headline-md font-manrope font-extrabold text-on-surface">
            {t('pages.submissions.title', 'Submissions')}
          </h1>
          <p className="text-body-md text-on-surface-variant mt-xs">
            {t('pages.submissions.subtitle', 'All student submissions across assignments.')}
          </p>
        </div>
      </div>

      {/* ── Stats cards ──────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-md">
        <StatCard icon="description" label="Total" value={stats.total} color="text-primary" bg="bg-primary-container" />
        <StatCard icon="check_circle" label="Accepted" value={stats.accepted} color="text-emerald-500" bg="bg-emerald-500/10" />
        <StatCard icon="cancel" label="Wrong Answer" value={stats.wrong} color="text-red-400" bg="bg-red-500/10" />
        <StatCard icon="warning" label="Other" value={stats.other} color="text-amber-400" bg="bg-amber-500/10" />
      </div>

      {/* ── Filters ──────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-sm">
        {/* Search */}
        <div className="relative flex-1 min-w-0 sm:min-w-[200px] sm:max-w-[400px]">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">
            search
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('pages.submissions.searchPlaceholder', 'Search by problem or student...')}
            className="w-full pl-10 pr-4 py-2.5 bg-surface-container-highest rounded-xl text-label-sm text-on-surface border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all min-h-[44px]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-sm">
          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="flex-1 sm:flex-none px-3 py-2.5 bg-surface-container-highest rounded-xl text-label-sm text-on-surface border border-outline-variant focus:border-primary outline-none cursor-pointer min-w-[120px] min-h-[44px]"
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
            className="flex-1 sm:flex-none px-3 py-2.5 bg-surface-container-highest rounded-xl text-label-sm text-on-surface border border-outline-variant focus:border-primary outline-none cursor-pointer min-w-[100px] min-h-[44px]"
          >
            <option value="ALL">{t('pages.submissions.allLanguages', 'All languages')}</option>
            <option value="cpp">C++</option>
            <option value="java">Java</option>
            <option value="python">Python</option>
            <option value="javascript">JavaScript</option>
          </select>
        </div>

        <div className="flex items-center gap-sm justify-between sm:justify-end sm:ml-auto">
          <span className={`inline-flex items-center gap-1 text-label-sm ${realtimeConnected ? 'text-emerald-600 dark:text-emerald-400' : 'text-on-surface-variant'}`}>
            <span className="material-symbols-outlined text-[15px]">{realtimeConnected ? 'sensors' : 'sensors_off'}</span>
            {realtimeConnected ? 'Realtime' : 'Offline'}
          </span>

          <span className="text-label-sm text-on-surface-variant">
            {total} {t('pages.submissions.results', 'results')}
          </span>
        </div>
      </div>

      {/* ── Table ────────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="flex items-center justify-center py-xl">
          <Icon name="progress_activity" size={32} className="animate-spin text-primary" />
        </div>
      ) : submissions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-xl gap-md text-center">
          <span className="material-symbols-outlined text-[64px] text-on-surface-variant/30">history</span>
          <p className="text-body-lg text-on-surface-variant">
            {!debouncedSearch && statusFilter === 'ALL' && langFilter === 'ALL'
              ? t('pages.submissions.empty', 'No submissions yet. Start solving problems!')
              : t('pages.submissions.noMatch', 'No submissions match your filters.')}
          </p>
        </div>
      ) : (
        <div className="bg-surface-container-low rounded-2xl border border-outline-variant overflow-hidden">
          {/* Desktop/tablet table with horizontal scroll */}
          <div className="hidden md:block overflow-x-auto">
            <div className="min-w-[800px]">
              {/* Table header */}
              <div className="grid grid-cols-[180px_1fr_80px_100px_80px_70px_100px] gap-0 px-md py-sm border-b border-outline-variant bg-surface-container-lowest text-center">
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
                {submissions.map((sub: any) => {
                  const sc = STATUS_CONFIG[sub.status] || STATUS_CONFIG[SubmissionStatus.INTERNAL_ERROR];
                  const progressText = getJudgeProgressText(sub);

                  return (
                    <div
                      key={sub.id}
                      onClick={() => handleRowClick(sub)}
                      className={`grid grid-cols-[180px_1fr_80px_100px_80px_70px_100px] gap-0 px-md py-sm items-center transition-colors group text-center ${canViewDetail(sub) ? 'cursor-pointer hover:bg-surface-container-highest/50' : 'cursor-not-allowed opacity-70'}`}
                      title={!canViewDetail(sub) ? t('pages.submissions.cannotViewOther', 'Bạn chỉ có thể xem chi tiết bài nộp của mình') : undefined}
                    >
                      {/* Student */}
                      <div className="flex items-center gap-sm min-w-0 pr-sm text-left">
                        <Avatar
                          size="sm"
                          shape="rounded"
                          src={sub.user?.avatarUrl}
                          initials={userInitials(sub.user)}
                          className="shrink-0"
                        />
                        <div className="min-w-0">
                          <p
                            className="text-label-sm text-on-surface font-medium truncate"
                            style={sub.user?.nameColor ? { color: sub.user.nameColor } : undefined}
                          >
                            {userName(sub.user)}
                          </p>
                          {sub.user?.equippedTitle && (
                            <p className="text-[11px] font-semibold text-fuchsia-600 dark:text-fuchsia-300 truncate">
                              {sub.user.equippedTitle}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Problem */}
                      <div className="flex items-center gap-xs min-w-0 pr-sm text-left">
                        <span className="material-symbols-outlined text-[16px] text-on-surface-variant/70 shrink-0">description</span>
                        <p className="text-label-sm text-on-surface font-medium truncate group-hover:text-primary transition-colors">
                          {sub.assignment?.title || 'Unknown'}
                        </p>
                      </div>

                      {/* Language */}
                      <div className="flex justify-center">
                        <LangBadge language={sub.language} />
                      </div>

                      {/* Status badge */}
                      <div className="flex flex-col items-center gap-0.5">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-bold ${sc.bg} ${sc.color}`}>
                          <span className={`material-symbols-outlined text-[13px] ${isJudging(sub) ? 'animate-spin' : ''}`}>
                            {isJudging(sub) ? 'progress_activity' : sc.icon}
                          </span>
                          {sc.label}
                        </span>
                        {progressText && (
                          <span className="text-[10px] text-on-surface-variant tabular-nums">{progressText}</span>
                        )}
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
          </div>

          {/* Mobile card layout */}
          <div className="md:hidden divide-y divide-outline-variant">
            {submissions.map((sub: any) => {
              const sc = STATUS_CONFIG[sub.status] || STATUS_CONFIG[SubmissionStatus.INTERNAL_ERROR];
              const progressText = getJudgeProgressText(sub);

              return (
                <div
                  key={sub.id}
                  onClick={() => handleRowClick(sub)}
                  className={`p-md transition-colors ${canViewDetail(sub) ? 'cursor-pointer hover:bg-surface-container-highest/50 active:bg-surface-container-highest' : 'cursor-not-allowed opacity-70'}`}
                  title={!canViewDetail(sub) ? t('pages.submissions.cannotViewOther', 'Bạn chỉ có thể xem chi tiết bài nộp của mình') : undefined}
                >
                  <div className="flex items-start justify-between gap-sm mb-sm">
                    <div className="flex items-center gap-sm min-w-0 flex-1">
                      <Avatar
                        size="sm"
                        shape="rounded"
                        src={sub.user?.avatarUrl}
                        initials={userInitials(sub.user)}
                        className="shrink-0"
                      />
                      <div className="min-w-0">
                        <p
                          className="text-label-sm text-on-surface font-medium truncate"
                          style={sub.user?.nameColor ? { color: sub.user.nameColor } : undefined}
                        >
                          {userName(sub.user)}
                        </p>
                        {sub.user?.equippedTitle && (
                          <p className="text-[11px] font-semibold text-fuchsia-600 dark:text-fuchsia-300 truncate">
                            {sub.user.equippedTitle}
                          </p>
                        )}
                      </div>
                    </div>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-bold shrink-0 ${sc.bg} ${sc.color}`}>
                      <span className={`material-symbols-outlined text-[13px] ${isJudging(sub) ? 'animate-spin' : ''}`}>
                        {isJudging(sub) ? 'progress_activity' : sc.icon}
                      </span>
                      {sc.label}
                    </span>
                  </div>
                  <p className="text-body-md text-on-surface font-medium truncate mb-sm">
                    {sub.assignment?.title || 'Unknown'}
                  </p>
                  <div className="flex items-center gap-md text-[12px] text-on-surface-variant">
                    <LangBadge language={sub.language} />
                    <span><span className="text-on-surface font-semibold">{sub.passedCount}</span>/{sub.totalCount}</span>
                    {sub.totalExecutionTimeMs != null && <span>{sub.totalExecutionTimeMs}ms</span>}
                    <span className="ml-auto" title={formatDateFull(sub.createdAt)}>{formatDate(sub.createdAt)}</span>
                  </div>
                  {progressText && (
                    <span className="text-[10px] text-on-surface-variant tabular-nums mt-xs block">{progressText}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Pagination ───────────────────────────────────────────── */}
      {pageCount > 1 && (
        <div className="flex justify-center pt-sm">
          <Pagination page={page} pageCount={pageCount} onChange={setPage} />
        </div>
      )}

      {/* ── Submission Detail Modal ──────────────────────────────── */}
      {selectedSub && (
        <SubmissionModal
          sub={selectedSub}
          portalPrefix={portalPrefix}
          canViewHiddenByRole={isAdminOrTeacher}
          canRejudge={isAdminOrTeacher}
          onClose={() => setSelectedSubId(null)}
          onNavigate={(assignmentId: string, submissionCode?: string, submissionLang?: string) => navigate(`${portalPrefix}/assignments/${assignmentId}`, { state: { submissionCode, submissionLang } })}
        />
      )}
    </div>
  );
}

function SubmissionModal({
  sub,
  portalPrefix,
  canViewHiddenByRole,
  canRejudge,
  onClose,
  onNavigate,
}: {
  sub: any;
  portalPrefix: string;
  canViewHiddenByRole: boolean;
  canRejudge: boolean;
  onClose: () => void;
  onNavigate: (assignmentId: string, code?: string, lang?: string) => void;
}) {
  const confirm = useConfirm();
  const toast = useToast();
  const rejudgeMutation = useRejudgeSubmission();
  const sc = STATUS_CONFIG[sub.status] || STATUS_CONFIG[SubmissionStatus.INTERNAL_ERROR];
  const testResults: any[] = getDisplayTestResults(sub);
  const progressText = getJudgeProgressText(sub);
  const judging = isJudging(sub);
  const canRejudgeSubmission = canRejudge && !sub.examId;
  const rejudgeDisabled = judging || rejudgeMutation.isPending;
  const [expandedTests, setExpandedTests] = useState<Set<number>>(new Set());

  const toggleTest = (idx: number) => {
    setExpandedTests((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const handleRejudge = async () => {
    if (!canRejudgeSubmission || rejudgeDisabled) return;

    const ok = await confirm({
      title: 'Chấm lại submission?',
      message: 'Kết quả test hiện tại sẽ được xóa và bài nộp này sẽ được đưa vào hàng đợi chấm lại.',
      confirmLabel: 'Chấm lại',
      cancelLabel: 'Hủy',
      intent: 'warning',
    });
    if (!ok) return;

    try {
      await rejudgeMutation.mutateAsync(sub.id);
      toast.success('Đã đưa submission vào hàng đợi chấm lại.');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Không thể chấm lại submission.');
    }
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
        className="relative bg-surface-container rounded-2xl sm:rounded-3xl border border-outline-variant shadow-2xl w-full max-w-full sm:max-w-[560px] max-h-[95vh] sm:max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
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
                <LangBadge language={sub.language} />
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
        <div className="flex flex-wrap items-center gap-sm sm:gap-lg px-md sm:px-lg py-sm border-b border-outline-variant/50 bg-surface-container-lowest shrink-0">
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
            <div className="flex items-center gap-xs text-label-sm text-on-surface ml-auto">
              <Avatar size="sm" shape="rounded" src={sub.user.avatarUrl} initials={userInitials(sub.user)} />
              <span className="font-medium" style={sub.user.nameColor ? { color: sub.user.nameColor } : undefined}>
                {userName(sub.user)}
              </span>
            </div>
          )}
        </div>

        {judging && (
          <div className="flex items-center gap-sm px-lg py-sm border-b border-outline-variant/50 bg-primary/5 text-primary shrink-0">
            <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
            <span className="text-label-sm font-semibold">{progressText || 'Judging submission'}</span>
            {sub.judgeProgress?.completedCount != null && (
              <span className="text-label-sm text-on-surface-variant ml-auto tabular-nums">
                {sub.judgeProgress.completedCount} / {sub.judgeProgress.totalCount} done
              </span>
            )}
          </div>
        )}

        {/* Test Cases List */}
        <div className="flex-1 overflow-y-auto px-lg py-md">
          <div className="mb-md">
            <h4 className="text-label-sm font-semibold text-on-surface-variant uppercase tracking-wider mb-sm flex items-center gap-xs">
              <span className="material-symbols-outlined text-[15px] text-primary">code</span>
              Source Code
            </h4>
            <pre className="text-[11px] font-mono text-on-surface bg-surface-container-lowest rounded-xl border border-outline-variant px-sm py-sm max-h-[220px] overflow-auto whitespace-pre-wrap break-all">
              {sub.code || '(empty)'}
            </pre>
          </div>

          <h4 className="text-label-sm font-semibold text-on-surface-variant uppercase tracking-wider mb-sm flex items-center gap-xs">
            <span className="material-symbols-outlined text-[15px] text-primary">science</span>
            Test Cases
          </h4>

          {testResults.length > 0 ? (
            <div className="space-y-xs">
              {testResults.map((tr: any, idx: number) => {
                const runningTest = isRunningTestCase(sub, tr.testCaseIndex);
                const trSc = runningTest
                  ? { label: 'RUN', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500/10', icon: 'progress_activity', border: 'border-blue-500/30' }
                  : STATUS_CONFIG[tr.status] || STATUS_CONFIG[SubmissionStatus.INTERNAL_ERROR];
                const isExpanded = expandedTests.has(idx);

                // Extract input and expected output (fallback to assignment config if missing)
                const inlineCases = sub.assignment?.codingConfig?.testCases ?? [];
                const tc = inlineCases[tr.testCaseIndex];
                const isHidden = tr.testCaseIndex >= inlineCases.length || !!tc?.isHidden;
                const canViewHidden = canViewHiddenByRole || !!sub.assignment?.codingConfig?.allowViewHiddenTestCases;
                const hideDetails = isHidden && !canViewHidden;
                const tcInput = hideDetails ? null : tr.input ?? tc?.input;
                const tcExpected = hideDetails ? null : tr.expectedOutput || tc?.expectedOutput || tc?.output;

                // Only render a short preview of potentially huge payloads.
                const inputPv = previewText(tcInput);
                const expectedPv = previewText(tcExpected);
                const actualPv = previewText(tr.actualOutput);

                return (
                  <div key={idx} className={`rounded-xl border ${trSc.border} overflow-hidden transition-all`}>
                    {/* Row header — clickable */}
                    <div
                      onClick={() => toggleTest(idx)}
                      className={`flex items-center gap-sm px-sm py-xs ${trSc.bg} cursor-pointer hover:brightness-110 transition-all select-none`}
                    >
                      {/* Status icon */}
                      <span className={`material-symbols-outlined text-[18px] ${trSc.color} ${runningTest ? 'animate-spin' : ''} shrink-0`}>
                        {trSc.icon}
                      </span>

                      {/* Test info */}
                      <span className="text-label-sm text-on-surface font-medium flex-1">
                        Test #{tr.testCaseIndex + 1}{hideDetails ? ' (Hidden)' : ''}
                      </span>

                      {/* Status badge */}
                      <span className={`text-[11px] font-bold ${trSc.color} shrink-0`}>
                        {trSc.label}
                      </span>

                      {/* Time */}
                      {tr.executionTimeMs != null && !runningTest && (
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
                        {hideDetails && (
                          <div className="rounded-lg bg-surface-container-highest px-sm py-sm text-[11px] text-on-surface-variant">
                            Hidden testcase details are not viewable for this assignment.
                          </div>
                        )}
                        {/* Input */}
                        {!hideDetails && <div>
                          <span className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider">Input</span>
                          <pre className="mt-0.5 text-[11px] font-mono text-on-surface bg-surface-container-highest rounded-lg px-sm py-xs max-h-[100px] overflow-auto whitespace-pre-wrap break-all">
                            {inputPv.text || '(empty)'}{inputPv.truncated && <span className="text-on-surface-variant"> … (đã rút gọn)</span>}
                          </pre>
                        </div>}

                        {/* Expected Output */}
                        {!hideDetails && <div>
                          <span className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider">Expected Output</span>
                          <pre className="mt-0.5 text-[11px] font-mono text-on-surface bg-surface-container-highest rounded-lg px-sm py-xs max-h-[100px] overflow-auto whitespace-pre-wrap break-all">
                            {expectedPv.text || '(empty)'}{expectedPv.truncated && <span className="text-on-surface-variant"> … (đã rút gọn)</span>}
                          </pre>
                        </div>}

                        {/* Actual Output */}
                        {!hideDetails && <div>
                          <span className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider">Your Output</span>
                          <pre className={`mt-0.5 text-[11px] font-mono rounded-lg px-sm py-xs max-h-[100px] overflow-auto whitespace-pre-wrap break-all ${runningTest || tr.isPlaceholder
                              ? 'text-on-surface-variant bg-surface-container-highest'
                              : tr.status === SubmissionStatus.ACCEPTED
                                ? 'text-emerald-600 bg-emerald-500/5'
                                : 'text-red-500 bg-red-500/5'
                            }`}>
                            {runningTest
                              ? '(running...)'
                              : tr.isPlaceholder
                                ? '(pending)'
                                : (
                                  <>
                                    {actualPv.text || '(empty)'}
                                    {actualPv.truncated && <span className="text-on-surface-variant"> … (đã rút gọn)</span>}
                                  </>
                                )}
                          </pre>
                        </div>}

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
        <div className="flex flex-wrap items-center justify-between gap-sm px-lg py-sm border-t border-outline-variant shrink-0 bg-surface-container-lowest">
          <button
            onClick={onClose}
            className="px-md py-xs rounded-xl text-label-sm text-on-surface-variant hover:bg-surface-container-highest transition-colors"
          >
            Close
          </button>
          <div className="flex flex-wrap items-center justify-end gap-sm">
            {canRejudgeSubmission && (
              <button
                onClick={handleRejudge}
                disabled={rejudgeDisabled}
                className={`flex items-center gap-xs px-md py-xs rounded-xl text-label-sm font-semibold transition-colors ${
                  rejudgeDisabled
                    ? 'cursor-not-allowed opacity-50 text-on-surface-variant'
                    : 'text-amber-700 dark:text-amber-300 hover:bg-amber-500/10'
                }`}
              >
                <span className={`material-symbols-outlined text-[16px] ${rejudgeMutation.isPending ? 'animate-spin' : ''}`}>
                  refresh
                </span>
                {rejudgeMutation.isPending ? 'Đang gửi...' : judging ? 'Đang chấm' : 'Chấm lại'}
              </button>
            )}
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
