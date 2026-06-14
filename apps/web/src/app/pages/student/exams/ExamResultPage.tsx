import { Link, useParams } from 'react-router-dom';
import { Card, PageHeader } from '@cp/ui';
import { useMyExamResult } from '../../../api/studentExams.queries';

export default function ExamResultPage() {
  const { id = '' } = useParams<{ id: string }>();
  const { data, isLoading } = useMyExamResult(id);

  if (isLoading || !data) return <div className="p-lg text-on-surface-variant">Đang tải…</div>;

  return (
    <div className="p-lg flex flex-col gap-lg max-w-3xl">
      <PageHeader
        title="Kết quả của tôi"
        subtitle={data.exam.title}
        actions={<Link to={`/student/exams/${id}/leaderboard`} className="text-label-md text-primary hover:underline">Bảng xếp hạng →</Link>}
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-md">
        <Card className="p-md text-center">
          <div className="text-display-sm font-bold text-primary">#{data.displayRank ?? '—'}</div>
          <div className="text-label-sm text-on-surface-variant">Hạng</div>
        </Card>
        <Card className="p-md text-center">
          <div className="text-display-sm font-bold">{data.totalScore}</div>
          <div className="text-label-sm text-on-surface-variant">Tổng điểm</div>
        </Card>
        <Card className="p-md text-center">
          <div className="text-display-sm font-bold">{data.solvedCount}</div>
          <div className="text-label-sm text-on-surface-variant">Bài giải được</div>
        </Card>
        <Card className="p-md text-center">
          <div className="text-display-sm font-bold">{data.penalty}</div>
          <div className="text-label-sm text-on-surface-variant">Penalty</div>
        </Card>
      </div>

      <Card className="p-md">
        <h3 className="text-title-sm font-semibold mb-sm">Chi tiết từng bài</h3>
        <div className="flex flex-col gap-1">
          {data.problemResults.map((p) => (
            <div key={p.examProblemId} className="flex items-center gap-sm border-b border-outline-variant/30 py-1 text-label-md">
              <span className="font-bold w-8">{p.label ?? '?'}</span>
              <span className="flex-1">{p.solved ? '✅ Giải được' : 'Chưa giải'}</span>
              <span className="text-on-surface-variant">{p.score}/{p.maxScore}</span>
              {p.penalty > 0 && <span className="text-on-surface-variant text-label-sm">+{p.penalty} penalty</span>}
            </div>
          ))}
          {data.problemResults.length === 0 && <p className="text-on-surface-variant text-label-md">Không có dữ liệu.</p>}
        </div>
      </Card>

      <Card className="p-md">
        <h3 className="text-title-sm font-semibold mb-sm">Phần thưởng đạt được</h3>
        {data.rewards.length === 0 && <p className="text-on-surface-variant text-label-md">Chưa có phần thưởng.</p>}
        <div className="flex flex-col gap-2">
          {data.rewards.map((r) => (
            <div key={r.id} className="flex items-center gap-sm bg-surface-container-low rounded-lg px-md py-sm">
              <span className="material-symbols-outlined text-amber-500">emoji_events</span>
              <span className="flex-1">{r.rule?.label ?? r.rule?.type ?? 'Reward'}</span>
              <span className="text-label-md font-semibold">
                {r.grantedGems > 0 && <span className="mr-2">+{r.grantedGems} 💎</span>}
                {r.grantedXp > 0 && <span>+{r.grantedXp} XP</span>}
              </span>
              <span className={`text-label-sm ${r.status === 'GRANTED' ? 'text-emerald-600' : 'text-on-surface-variant'}`}>{r.status}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
