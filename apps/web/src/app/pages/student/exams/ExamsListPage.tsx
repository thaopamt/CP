import { Link } from 'react-router-dom';
import { Button, Card, PageHeader } from '@cp/ui';
import { ExamPhase, ExamStatus, IExamListItem } from '@cp/shared';
import { useMyExams } from '../../../api/studentExams.queries';

function phaseLabel(e: IExamListItem): { label: string; color: string } {
  if (e.status === ExamStatus.FINALIZED) return { label: 'Đã có kết quả', color: 'text-emerald-600' };
  if (e.status === ExamStatus.FINALIZING) return { label: 'Đang chấm', color: 'text-amber-600' };
  if (e.phase === ExamPhase.RUNNING) return { label: 'Đang diễn ra', color: 'text-primary' };
  if (e.phase === ExamPhase.UPCOMING) return { label: 'Sắp diễn ra', color: 'text-on-surface-variant' };
  return { label: 'Đã kết thúc', color: 'text-on-surface-variant' };
}

export default function StudentExamsListPage() {
  const { data, isLoading } = useMyExams();

  return (
    <div className="p-lg flex flex-col gap-lg">
      <PageHeader title="Kỳ thi của tôi" subtitle="Các kỳ thi bạn được tham gia" />
      {isLoading && <p className="text-on-surface-variant">Đang tải…</p>}
      {!isLoading && (data?.length ?? 0) === 0 && (
        <Card className="p-lg text-center text-on-surface-variant">Hiện chưa có kỳ thi nào.</Card>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md">
        {data?.map((e) => {
          const ph = phaseLabel(e);
          const finalized = e.status === ExamStatus.FINALIZED;
          const running = e.phase === ExamPhase.RUNNING && e.status === ExamStatus.PUBLISHED;
          return (
            <Card key={e.id} className="p-md flex flex-col gap-sm">
              <div className="flex items-center justify-between">
                <span className="text-label-sm font-semibold px-2 py-0.5 rounded-full bg-surface-container-high">{e.format}</span>
                <span className={`text-label-sm font-semibold ${ph.color}`}>{ph.label}</span>
              </div>
              <h3 className="text-title-sm font-bold">{e.title}</h3>
              <p className="text-label-sm text-on-surface-variant line-clamp-2">{e.description}</p>
              <div className="text-label-sm text-on-surface-variant">
                {new Date(e.startAt).toLocaleString()} → {new Date(e.endAt).toLocaleString()}
              </div>
              <div className="text-label-sm text-on-surface-variant">{e.problemCount} bài</div>
              <div className="flex gap-sm mt-auto pt-sm">
                {running && <Link to={`/student/exams/${e.id}/take`}><Button variant="student" size="sm">Vào thi</Button></Link>}
                {finalized && <Link to={`/student/exams/${e.id}/result`}><Button variant="student" size="sm">Xem kết quả</Button></Link>}
                <Link to={`/student/exams/${e.id}/leaderboard`}><Button variant="outline" size="sm">Bảng xếp hạng</Button></Link>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
