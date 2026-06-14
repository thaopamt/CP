import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button, Card, useToast } from '@cp/ui';
import { ISubmission, SubmissionStatus } from '@cp/shared';
import {
  useMyExamSubmissions,
  useStudentExamProblem,
  useSubmitExam,
  useTakeExam,
} from '../../../api/studentExams.queries';

const LANGS = ['cpp', 'python', 'java'];

function useServerCountdown(serverTime?: string, endsAt?: string) {
  const offsetRef = useRef(0);
  const [remaining, setRemaining] = useState<number>(0);
  useEffect(() => {
    if (!serverTime || !endsAt) return;
    offsetRef.current = new Date(serverTime).getTime() - Date.now();
    const end = new Date(endsAt).getTime();
    const tick = () => setRemaining(Math.max(0, end - (Date.now() + offsetRef.current)));
    tick();
    const h = setInterval(tick, 1000);
    return () => clearInterval(h);
  }, [serverTime, endsAt]);
  return remaining;
}

function fmt(ms: number): string {
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

export default function TakeExamPage() {
  const { id = '' } = useParams<{ id: string }>();
  const toast = useToast();
  const { data: take, isLoading } = useTakeExam(id);
  const [selected, setSelected] = useState<string | null>(null);
  const [language, setLanguage] = useState('cpp');
  const [code, setCode] = useState('');
  const { data: problem } = useStudentExamProblem(id, selected);
  const { data: submissions } = useMyExamSubmissions(id);
  const submitMut = useSubmitExam(id);
  const [lastResult, setLastResult] = useState<ISubmission | null>(null);

  const remaining = useServerCountdown(take?.serverTime, take?.endsAt);
  const ended = remaining <= 0;

  useEffect(() => {
    if (take && !selected && take.problems.length) setSelected(take.problems[0].id);
  }, [take, selected]);

  const mySubsForProblem = useMemo(
    () => (submissions ?? []).filter((s) => s.assignmentId === problem?.assignment.id),
    [submissions, problem],
  );

  if (isLoading || !take) return <div className="p-lg text-on-surface-variant">Đang tải…</div>;

  async function submit() {
    if (!selected) return;
    try {
      const res = await submitMut.mutateAsync({ examProblemId: selected, language, code });
      setLastResult(res);
      toast.success(`Đã nộp: ${res.status}`);
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? 'Nộp bài thất bại');
    }
  }

  return (
    <div className="p-lg flex flex-col gap-md">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-headline-sm font-bold">{take.exam.title}</h2>
          <p className="text-label-sm text-on-surface-variant">{take.exam.format} · {take.exam.rankingRule}</p>
        </div>
        <div className="text-right">
          <div className={`text-headline-sm font-mono font-bold ${ended ? 'text-error' : 'text-primary'}`}>
            {ended ? 'Hết giờ' : fmt(remaining)}
          </div>
          <Link to={`/student/exams/${id}/leaderboard`} className="text-label-sm text-primary hover:underline">Bảng xếp hạng →</Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-md">
        {/* Problem sidebar */}
        <Card className="p-sm flex lg:flex-col gap-1 h-fit">
          {take.problems.map((p, i) => (
            <button key={p.id} onClick={() => { setSelected(p.id); setLastResult(null); }}
              className={`px-md py-sm rounded-lg text-left text-label-md ${
                selected === p.id ? 'bg-primary/15 text-primary font-semibold' : 'hover:bg-surface-container-low'
              }`}>
              {p.label ?? String.fromCharCode(65 + i)}. {p.assignment?.title ?? ''}
              <span className="block text-label-sm text-on-surface-variant">{p.points} điểm</span>
            </button>
          ))}
        </Card>

        {/* Working area */}
        <div className="flex flex-col gap-md">
          {problem && (
            <Card className="p-md">
              <h3 className="text-title-md font-bold mb-sm">{problem.assignment.title}</h3>
              <div className="prose prose-sm max-w-none whitespace-pre-wrap text-body-md text-on-surface">
                {problem.assignment.description}
              </div>
            </Card>
          )}

          <Card className="p-md flex flex-col gap-sm">
            <div className="flex items-center gap-sm">
              <select value={language} onChange={(e) => setLanguage(e.target.value)}
                className="px-3 py-2 bg-surface-container-highest rounded-lg text-label-md outline-none">
                {LANGS.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
              <div className="flex-1" />
              <Button variant="student" onClick={submit} disabled={ended || submitMut.isPending || !code.trim()}>
                {submitMut.isPending ? 'Đang chấm…' : 'Nộp bài'}
              </Button>
            </div>
            <textarea value={code} onChange={(e) => setCode(e.target.value)} spellCheck={false}
              placeholder="Viết code của bạn ở đây…"
              className="font-mono text-label-md bg-surface-container-lowest border border-outline-variant rounded-lg p-3 min-h-[320px] outline-none focus:ring-2 focus:ring-primary" />
          </Card>

          {lastResult && <ResultPanel sub={lastResult} />}

          {mySubsForProblem.length > 0 && (
            <Card className="p-md">
              <h4 className="text-title-sm font-semibold mb-sm">Lần nộp trước</h4>
              <div className="flex flex-col gap-1">
                {mySubsForProblem.map((s) => (
                  <div key={s.id} className="flex items-center gap-sm text-label-md border-b border-outline-variant/30 py-1">
                    <span className="text-on-surface-variant w-[150px]">{new Date(s.createdAt).toLocaleTimeString()}</span>
                    <VerdictBadge status={s.status} />
                    <span className="text-on-surface-variant">{s.passedCount}/{s.totalCount}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function VerdictBadge({ status }: { status: SubmissionStatus }) {
  const ok = status === SubmissionStatus.ACCEPTED;
  return (
    <span className={`px-2 py-0.5 rounded-full text-label-sm font-semibold ${ok ? 'bg-emerald-500/15 text-emerald-600' : 'bg-error/15 text-error'}`}>
      {status}
    </span>
  );
}

function ResultPanel({ sub }: { sub: ISubmission }) {
  return (
    <Card className="p-md flex flex-col gap-sm">
      <div className="flex items-center gap-sm">
        <VerdictBadge status={sub.status} />
        <span className="text-label-md text-on-surface-variant">{sub.passedCount}/{sub.totalCount} testcase</span>
      </div>
      <div className="flex flex-col gap-1">
        {(sub.testResults ?? []).map((tr) => (
          <div key={tr.testCaseIndex} className="flex items-center gap-sm text-label-sm">
            <span className="w-20">Test #{tr.testCaseIndex + 1}</span>
            <VerdictBadge status={tr.status} />
            {tr.executionTimeMs != null && <span className="text-on-surface-variant">{tr.executionTimeMs} ms</span>}
          </div>
        ))}
      </div>
    </Card>
  );
}
