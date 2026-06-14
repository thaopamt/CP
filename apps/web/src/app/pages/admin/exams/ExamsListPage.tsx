import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Card, PageHeader } from '@cp/ui';
import { ContestFormat, ExamStatus } from '@cp/shared';
import { useExams } from '../../../api/exams.queries';
import { usePortalBase } from '../../../hooks/usePortalBase';

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-surface-container-high text-on-surface-variant',
  PUBLISHED: 'bg-primary/15 text-primary',
  FINALIZING: 'bg-amber-500/15 text-amber-600',
  FINALIZED: 'bg-emerald-500/15 text-emerald-600',
  ARCHIVED: 'bg-surface-container-high text-on-surface-variant',
};

export default function ExamsListPage() {
  const base = usePortalBase();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('ALL');
  const [format, setFormat] = useState<string>('ALL');
  const { data, isLoading } = useExams({ search: search || undefined, status, format, limit: 50 });

  return (
    <div className="p-lg flex flex-col gap-lg">
      <PageHeader
        title="Kỳ thi"
        subtitle="Quản lý các kỳ thi / contest lập trình"
        actions={
          <Button variant="admin" leadingIcon={<span className="material-symbols-outlined">add</span>}
            onClick={() => navigate(`${base}/exams/new`)}>
            Tạo kỳ thi
          </Button>
        }
      />

      <Card className="p-md flex flex-wrap gap-sm items-center">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm theo tiêu đề…"
          className="px-3 py-2 bg-surface-container-highest rounded-lg text-label-md outline-none focus:ring-2 focus:ring-primary min-w-[200px]"
        />
        <select value={status} onChange={(e) => setStatus(e.target.value)}
          className="px-3 py-2 bg-surface-container-highest rounded-lg text-label-md outline-none">
          <option value="ALL">Mọi trạng thái</option>
          {Object.values(ExamStatus).map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={format} onChange={(e) => setFormat(e.target.value)}
          className="px-3 py-2 bg-surface-container-highest rounded-lg text-label-md outline-none">
          <option value="ALL">Mọi thể thức</option>
          {Object.values(ContestFormat).map((f) => <option key={f} value={f}>{f}</option>)}
        </select>
      </Card>

      <Card className="overflow-hidden">
        <table className="w-full text-label-md">
          <thead className="bg-surface-container-high text-on-surface-variant text-left">
            <tr>
              <th className="px-md py-sm">Tiêu đề</th>
              <th className="px-md py-sm">Thể thức</th>
              <th className="px-md py-sm">Trạng thái</th>
              <th className="px-md py-sm">Bắt đầu</th>
              <th className="px-md py-sm">Kết thúc</th>
              <th className="px-md py-sm text-center">Bài</th>
              <th className="px-md py-sm text-center">TS</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={7} className="px-md py-lg text-center text-on-surface-variant">Đang tải…</td></tr>
            )}
            {!isLoading && (data?.data.length ?? 0) === 0 && (
              <tr><td colSpan={7} className="px-md py-lg text-center text-on-surface-variant">Chưa có kỳ thi nào</td></tr>
            )}
            {data?.data.map((exam) => (
              <tr key={exam.id} className="border-t border-outline-variant/40 hover:bg-surface-container-low cursor-pointer"
                onClick={() => navigate(`${base}/exams/${exam.id}`)}>
                <td className="px-md py-sm font-semibold text-on-surface">
                  <Link to={`${base}/exams/${exam.id}`} className="hover:text-primary" onClick={(e) => e.stopPropagation()}>
                    {exam.title}
                  </Link>
                </td>
                <td className="px-md py-sm">{exam.format}</td>
                <td className="px-md py-sm">
                  <span className={`px-2 py-0.5 rounded-full text-label-sm ${STATUS_COLORS[exam.status] ?? ''}`}>
                    {exam.status}
                  </span>
                  {exam.phase && exam.status === ExamStatus.PUBLISHED && (
                    <span className="ml-2 text-label-sm text-on-surface-variant">{exam.phase}</span>
                  )}
                </td>
                <td className="px-md py-sm text-on-surface-variant">{new Date(exam.startAt).toLocaleString()}</td>
                <td className="px-md py-sm text-on-surface-variant">{new Date(exam.endAt).toLocaleString()}</td>
                <td className="px-md py-sm text-center">{exam.problemCount ?? '—'}</td>
                <td className="px-md py-sm text-center">{exam.participantCount ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
