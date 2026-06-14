import { Link, useParams } from 'react-router-dom';
import { Card, PageHeader } from '@cp/ui';
import { useStudentExamLeaderboard } from '../../../api/studentExams.queries';

export default function ExamLeaderboardPage() {
  const { id = '' } = useParams<{ id: string }>();
  const { data, isLoading } = useStudentExamLeaderboard(id);

  return (
    <div className="p-lg flex flex-col gap-lg">
      <PageHeader
        title="Bảng xếp hạng"
        subtitle={data?.official ? 'Kết quả chính thức' : data?.frozen ? 'Đã đóng băng (frozen)' : 'Trực tiếp'}
        actions={<Link to="/student/exams" className="text-label-md text-primary hover:underline">← Kỳ thi</Link>}
      />
      {data?.frozen && (
        <Card className="p-md bg-amber-500/10 text-amber-700 text-label-md">
          🔒 Bảng xếp hạng đang bị đóng băng. Kết quả các lần nộp gần đây sẽ được công bố sau khi kỳ thi chốt.
        </Card>
      )}
      <Card className="overflow-hidden">
        <table className="w-full text-label-md">
          <thead className="bg-surface-container-high text-left text-on-surface-variant">
            <tr>
              <th className="px-md py-sm">#</th>
              <th className="px-md py-sm">Thí sinh</th>
              <th className="px-md py-sm text-center">Điểm</th>
              <th className="px-md py-sm text-center">Giải</th>
              <th className="px-md py-sm text-center">Penalty</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={5} className="px-md py-lg text-center text-on-surface-variant">Đang tải…</td></tr>}
            {data?.rows.map((r) => (
              <tr key={r.userId} className={`border-t border-outline-variant/40 ${r.isMe ? 'bg-primary/10 font-semibold' : ''}`}>
                <td className="px-md py-sm font-bold">{r.displayRank}</td>
                <td className="px-md py-sm">{r.name}{r.isMe ? ' (bạn)' : ''}</td>
                <td className="px-md py-sm text-center">{r.totalScore}</td>
                <td className="px-md py-sm text-center">{r.solvedCount}</td>
                <td className="px-md py-sm text-center">{r.penalty}</td>
              </tr>
            ))}
            {!isLoading && (data?.rows.length ?? 0) === 0 && (
              <tr><td colSpan={5} className="px-md py-lg text-center text-on-surface-variant">Chưa có dữ liệu</td></tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
