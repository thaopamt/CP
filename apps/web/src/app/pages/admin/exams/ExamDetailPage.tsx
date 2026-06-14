import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Card, PageHeader, useToast } from '@cp/ui';
import {
  ExamRewardType,
  ExamScoringMode,
  ExamStatus,
  IExamRewardCondition,
  IExamReward,
} from '@cp/shared';
import {
  useExam,
  useExamAction,
  useExamAudit,
  useExamGrants,
  useExamLeaderboard,
  useExamParticipantMutations,
  useExamParticipants,
  useExamProblemMutations,
  useExamProblems,
  useExamRewardRuleMutations,
  useExamRewardRules,
} from '../../../api/exams.queries';
import { useAssignmentsList } from '../../../api/curriculum.queries';
import { useStudentsList } from '../../../api/student.queries';
import { usePortalBase } from '../../../hooks/usePortalBase';

type Tab = 'overview' | 'problems' | 'participants' | 'rewards' | 'leaderboard' | 'audit';
const TABS: { key: Tab; label: string }[] = [
  { key: 'overview', label: 'Tổng quan' },
  { key: 'problems', label: 'Bài thi' },
  { key: 'participants', label: 'Thí sinh' },
  { key: 'rewards', label: 'Phần thưởng' },
  { key: 'leaderboard', label: 'Bảng xếp hạng' },
  { key: 'audit', label: 'Nhật ký' },
];

export default function ExamDetailPage() {
  const { id = '' } = useParams<{ id: string }>();
  const base = usePortalBase();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('overview');
  const { data: exam, isLoading } = useExam(id);

  if (isLoading || !exam) return <div className="p-lg text-on-surface-variant">Đang tải…</div>;

  return (
    <div className="p-lg flex flex-col gap-lg">
      <PageHeader
        title={exam.title}
        subtitle={`${exam.format} · ${exam.rankingRule} · ${exam.status}${exam.phase ? ` · ${exam.phase}` : ''}`}
        actions={
          <Button variant="outline" onClick={() => navigate(`${base}/exams/${id}/edit`)}
            leadingIcon={<span className="material-symbols-outlined">edit</span>}>Sửa</Button>
        }
      />

      <div className="flex gap-1 border-b border-outline-variant overflow-x-auto">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-md py-sm text-label-md whitespace-nowrap border-b-2 -mb-px ${
              tab === t.key ? 'border-primary text-primary font-semibold' : 'border-transparent text-on-surface-variant'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && <OverviewTab examId={id} status={exam.status} isFrozen={exam.isFrozen} autoGrant={exam.autoGrantReward} />}
      {tab === 'problems' && <ProblemsTab examId={id} />}
      {tab === 'participants' && <ParticipantsTab examId={id} />}
      {tab === 'rewards' && <RewardsTab examId={id} />}
      {tab === 'leaderboard' && <LeaderboardTab examId={id} />}
      {tab === 'audit' && <AuditTab examId={id} />}
    </div>
  );
}

// ── Overview / lifecycle ─────────────────────────────────────────────────────
function OverviewTab({ examId, status, isFrozen }: { examId: string; status: ExamStatus; isFrozen: boolean; autoGrant: boolean }) {
  const toast = useToast();
  const a = useExamAction(examId);
  const run = (p: Promise<unknown>, ok: string) => p.then(() => toast.success(ok)).catch((e: any) => toast.error(e?.response?.data?.message ?? 'Thất bại'));

  return (
    <Card className="p-lg flex flex-col gap-md">
      <h3 className="text-title-md font-semibold">Hành động kỳ thi</h3>
      <div className="flex flex-wrap gap-sm">
        {status === ExamStatus.DRAFT && (
          <Button variant="admin" onClick={() => run(a.publish.mutateAsync(), 'Đã xuất bản')}>Xuất bản</Button>
        )}
        {status === ExamStatus.PUBLISHED && !isFrozen && (
          <Button variant="outline" onClick={() => run(a.freeze.mutateAsync(), 'Đã đóng băng leaderboard')}>Freeze leaderboard</Button>
        )}
        {status === ExamStatus.PUBLISHED && isFrozen && (
          <Button variant="outline" onClick={() => run(a.unfreeze.mutateAsync(), 'Đã mở băng')}>Unfreeze</Button>
        )}
        {status === ExamStatus.PUBLISHED && (
          <>
            <Button variant="admin" onClick={() => run(a.finalize.mutateAsync(false), 'Đã chốt kết quả')}>Chốt kết quả</Button>
            <Button variant="danger" onClick={() => run(a.finalize.mutateAsync(true), 'Đã chốt (force)')}>Chốt ngay (force)</Button>
          </>
        )}
        {status === ExamStatus.FINALIZED && (
          <>
            <Button variant="outline" onClick={() => run(a.recalculate.mutateAsync(), 'Đã tính lại ranking')}>Tính lại ranking</Button>
            <Button variant="admin" onClick={() => run(a.grantRewards.mutateAsync(), 'Đã trao thưởng')}>Trao thưởng</Button>
            <Button variant="outline" onClick={() => run(a.retryGrants.mutateAsync(), 'Đã thử lại')}>Retry reward lỗi</Button>
          </>
        )}
        <Button variant="outline" onClick={() => run(a.rejudge.mutateAsync(status === ExamStatus.FINALIZED), 'Đã rejudge')}>Rejudge toàn bộ</Button>
        {status !== ExamStatus.ARCHIVED && (
          <Button variant="ghost" onClick={() => run(a.archive.mutateAsync(), 'Đã lưu trữ')}>Lưu trữ</Button>
        )}
      </div>
      <p className="text-label-sm text-on-surface-variant">
        Lưu ý: rejudge sau khi đã chốt yêu cầu admin (force) và nên bấm "Tính lại ranking" sau đó.
      </p>
    </Card>
  );
}

// ── Problems ─────────────────────────────────────────────────────────────────
function ProblemsTab({ examId }: { examId: string }) {
  const toast = useToast();
  const { data: problems } = useExamProblems(examId);
  const mut = useExamProblemMutations(examId);
  const [search, setSearch] = useState('');
  const { data: assignments } = useAssignmentsList({ page: 1, limit: 15, search: search || undefined } as never);

  const add = (assignmentId: string) =>
    mut.add.mutateAsync({ assignmentId, scoringMode: ExamScoringMode.PARTIAL_TESTCASE })
      .then(() => toast.success('Đã thêm bài'))
      .catch((e: any) => toast.error(e?.response?.data?.message ?? 'Lỗi'));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-lg">
      <Card className="p-md">
        <h3 className="text-title-sm font-semibold mb-sm">Bài trong kỳ thi</h3>
        {(problems?.length ?? 0) === 0 && <p className="text-on-surface-variant text-label-md">Chưa có bài nào.</p>}
        <div className="flex flex-col gap-2">
          {problems?.map((p, i) => (
            <div key={p.id} className="flex items-center gap-sm bg-surface-container-low rounded-lg px-md py-sm">
              <span className="font-bold w-6">{p.label ?? String.fromCharCode(65 + i)}</span>
              <span className="flex-1 truncate">{p.assignment?.title ?? p.assignmentId}</span>
              <input type="number" defaultValue={p.points} className="w-16 px-2 py-1 bg-surface-container-highest rounded text-label-sm"
                onBlur={(e) => mut.update.mutateAsync({ id: p.id, payload: { points: Number(e.target.value) } })} />
              <select defaultValue={p.scoringMode} className="px-2 py-1 bg-surface-container-highest rounded text-label-sm"
                onChange={(e) => mut.update.mutateAsync({ id: p.id, payload: { scoringMode: e.target.value as ExamScoringMode } })}>
                {Object.values(ExamScoringMode).map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
              <button className="text-error material-symbols-outlined text-[18px]"
                onClick={() => mut.remove.mutateAsync(p.id)}>delete</button>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-md">
        <h3 className="text-title-sm font-semibold mb-sm">Thêm bài từ ngân hàng</h3>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm bài tập…"
          className="px-3 py-2 bg-surface-container-highest rounded-lg text-label-md w-full mb-sm outline-none" />
        <div className="flex flex-col gap-1 max-h-[400px] overflow-y-auto">
          {(assignments?.items ?? []).map((a: any) => (
            <div key={a.id} className="flex items-center gap-sm px-md py-sm hover:bg-surface-container-low rounded-lg">
              <span className="flex-1 truncate">{a.title}</span>
              <Button size="sm" variant="outline" onClick={() => add(a.id)}>Thêm</Button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ── Participants ─────────────────────────────────────────────────────────────
function ParticipantsTab({ examId }: { examId: string }) {
  const toast = useToast();
  const { data: parts } = useExamParticipants(examId);
  const mut = useExamParticipantMutations(examId);
  const [search, setSearch] = useState('');
  const { data: students } = useStudentsList({ page: 1, limit: 20, search: search || undefined } as never);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-lg">
      <Card className="p-md">
        <h3 className="text-title-sm font-semibold mb-sm">Thí sinh ({parts?.length ?? 0})</h3>
        <div className="flex flex-col gap-1 max-h-[460px] overflow-y-auto">
          {parts?.map((p) => (
            <div key={p.id} className="flex items-center gap-sm bg-surface-container-low rounded-lg px-md py-sm">
              <span className="flex-1 truncate">
                {p.user ? `${p.user.firstName} ${p.user.lastName}` : p.userId}
              </span>
              <span className="text-label-sm text-on-surface-variant">{p.state}</span>
              {p.state === 'BANNED'
                ? <Button size="sm" variant="outline" onClick={() => mut.unban.mutateAsync(p.userId)}>Unban</Button>
                : <Button size="sm" variant="ghost" onClick={() => mut.ban.mutateAsync({ userId: p.userId })}>Ban</Button>}
              <button className="text-error material-symbols-outlined text-[18px]"
                onClick={() => mut.remove.mutateAsync(p.userId)}>delete</button>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-md">
        <h3 className="text-title-sm font-semibold mb-sm">Mời thí sinh</h3>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm học sinh…"
          className="px-3 py-2 bg-surface-container-highest rounded-lg text-label-md w-full mb-sm outline-none" />
        <div className="flex flex-col gap-1 max-h-[400px] overflow-y-auto">
          {(students?.items ?? []).map((s: any) => (
            <div key={s.userId ?? s.id} className="flex items-center gap-sm px-md py-sm hover:bg-surface-container-low rounded-lg">
              <span className="flex-1 truncate">{s.user ? `${s.user.firstName} ${s.user.lastName}` : s.userId}</span>
              <Button size="sm" variant="outline"
                onClick={() => mut.invite.mutateAsync([s.userId ?? s.user?.id]).then(() => toast.success('Đã mời'))}>Mời</Button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ── Rewards ──────────────────────────────────────────────────────────────────
function RewardsTab({ examId }: { examId: string }) {
  const toast = useToast();
  const { data: rules } = useExamRewardRules(examId);
  const { data: grants } = useExamGrants(examId);
  const mut = useExamRewardRuleMutations(examId);
  const a = useExamAction(examId);

  const [type, setType] = useState<ExamRewardType>(ExamRewardType.RANK);
  const [cond, setCond] = useState<IExamRewardCondition>({ rankFrom: 1, rankTo: 1 });
  const [reward, setReward] = useState<IExamReward>({ gems: 100, xp: 50 });
  const [label, setLabel] = useState('');

  const create = () =>
    mut.create.mutateAsync({ type, condition: cond, reward, label: label || undefined })
      .then(() => { toast.success('Đã tạo rule'); setLabel(''); })
      .catch(() => toast.error('Lỗi'));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-lg">
      <Card className="p-md flex flex-col gap-sm">
        <h3 className="text-title-sm font-semibold">Reward rules</h3>
        {rules?.map((r) => (
          <div key={r.id} className="flex items-center gap-sm bg-surface-container-low rounded-lg px-md py-sm">
            <span className="flex-1">
              <b>{r.type}</b> {r.label ? `· ${r.label}` : ''}
              <span className="text-label-sm text-on-surface-variant block">
                {JSON.stringify(r.condition)} → {JSON.stringify(r.reward)}
              </span>
            </span>
            <button className="text-error material-symbols-outlined text-[18px]" onClick={() => mut.remove.mutateAsync(r.id)}>delete</button>
          </div>
        ))}
        <div className="border-t border-outline-variant pt-sm flex flex-col gap-2">
          <h4 className="text-label-md font-semibold">Thêm rule</h4>
          <select value={type} onChange={(e) => setType(e.target.value as ExamRewardType)}
            className="px-3 py-2 bg-surface-container-highest rounded-lg text-label-md">
            {Object.values(ExamRewardType).map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <input placeholder="Nhãn (vd Gold Medal)" value={label} onChange={(e) => setLabel(e.target.value)}
            className="px-3 py-2 bg-surface-container-highest rounded-lg text-label-md" />
          <div className="grid grid-cols-2 gap-2">
            <input type="number" placeholder="rankFrom" onChange={(e) => setCond((c) => ({ ...c, rankFrom: Number(e.target.value) || undefined }))}
              className="px-3 py-2 bg-surface-container-highest rounded-lg text-label-md" />
            <input type="number" placeholder="rankTo" onChange={(e) => setCond((c) => ({ ...c, rankTo: Number(e.target.value) || undefined }))}
              className="px-3 py-2 bg-surface-container-highest rounded-lg text-label-md" />
            <input type="number" placeholder="minScore" onChange={(e) => setCond((c) => ({ ...c, minScore: Number(e.target.value) || undefined }))}
              className="px-3 py-2 bg-surface-container-highest rounded-lg text-label-md" />
            <input type="number" placeholder="minSolved" onChange={(e) => setCond((c) => ({ ...c, minSolved: Number(e.target.value) || undefined }))}
              className="px-3 py-2 bg-surface-container-highest rounded-lg text-label-md" />
            <input type="number" placeholder="gems" value={reward.gems ?? ''} onChange={(e) => setReward((r) => ({ ...r, gems: Number(e.target.value) || undefined }))}
              className="px-3 py-2 bg-surface-container-highest rounded-lg text-label-md" />
            <input type="number" placeholder="xp" value={reward.xp ?? ''} onChange={(e) => setReward((r) => ({ ...r, xp: Number(e.target.value) || undefined }))}
              className="px-3 py-2 bg-surface-container-highest rounded-lg text-label-md" />
          </div>
          <Button variant="admin" size="sm" onClick={create}>Thêm rule</Button>
        </div>
      </Card>

      <Card className="p-md flex flex-col gap-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-title-sm font-semibold">Phần thưởng đã trao</h3>
          <div className="flex gap-sm">
            <Button size="sm" variant="admin" onClick={() => a.grantRewards.mutateAsync().then(() => toast.success('Đã trao'))}>Trao thưởng</Button>
            <Button size="sm" variant="outline" onClick={() => a.retryGrants.mutateAsync().then(() => toast.success('Đã thử lại'))}>Retry</Button>
          </div>
        </div>
        {(grants?.length ?? 0) === 0 && <p className="text-on-surface-variant text-label-md">Chưa trao thưởng.</p>}
        <div className="flex flex-col gap-1 max-h-[460px] overflow-y-auto">
          {grants?.map((g) => (
            <div key={g.id} className="flex items-center gap-sm bg-surface-container-low rounded-lg px-md py-sm text-label-md">
              <span className="flex-1 truncate">{g.user ? `${g.user.firstName} ${g.user.lastName}` : g.userId}</span>
              <span className="text-label-sm">+{g.grantedGems}💎 +{g.grantedXp}xp</span>
              <span className={`text-label-sm ${g.status === 'GRANTED' ? 'text-emerald-600' : g.status === 'FAILED' ? 'text-error' : 'text-on-surface-variant'}`}>{g.status}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ── Leaderboard ──────────────────────────────────────────────────────────────
function LeaderboardTab({ examId }: { examId: string }) {
  const { data } = useExamLeaderboard(examId);
  return (
    <Card className="overflow-hidden">
      <div className="px-md py-sm text-label-sm text-on-surface-variant">
        {data?.official ? 'Bảng xếp hạng chính thức' : data?.frozen ? 'Đang freeze' : 'Live (xem quản trị)'}
      </div>
      <table className="w-full text-label-md">
        <thead className="bg-surface-container-high text-left text-on-surface-variant">
          <tr><th className="px-md py-sm">#</th><th className="px-md py-sm">Thí sinh</th>
            <th className="px-md py-sm text-center">Điểm</th><th className="px-md py-sm text-center">Giải</th>
            <th className="px-md py-sm text-center">Penalty</th></tr>
        </thead>
        <tbody>
          {data?.rows.map((r) => (
            <tr key={r.userId} className="border-t border-outline-variant/40">
              <td className="px-md py-sm font-bold">{r.displayRank}</td>
              <td className="px-md py-sm">{r.name}</td>
              <td className="px-md py-sm text-center">{r.totalScore}</td>
              <td className="px-md py-sm text-center">{r.solvedCount}</td>
              <td className="px-md py-sm text-center">{r.penalty}</td>
            </tr>
          ))}
          {(data?.rows.length ?? 0) === 0 && <tr><td colSpan={5} className="px-md py-lg text-center text-on-surface-variant">Chưa có dữ liệu</td></tr>}
        </tbody>
      </table>
    </Card>
  );
}

// ── Audit ────────────────────────────────────────────────────────────────────
function AuditTab({ examId }: { examId: string }) {
  const { data } = useExamAudit(examId);
  return (
    <Card className="p-md flex flex-col gap-1">
      {(data?.length ?? 0) === 0 && <p className="text-on-surface-variant text-label-md">Chưa có nhật ký.</p>}
      {data?.map((e) => (
        <div key={e.id} className="flex items-center gap-sm text-label-sm border-b border-outline-variant/30 py-1">
          <span className="text-on-surface-variant w-[150px]">{new Date(e.createdAt).toLocaleString()}</span>
          <span className="font-semibold">{e.action}</span>
          {e.meta && <span className="text-on-surface-variant truncate">{JSON.stringify(e.meta)}</span>}
        </div>
      ))}
    </Card>
  );
}
