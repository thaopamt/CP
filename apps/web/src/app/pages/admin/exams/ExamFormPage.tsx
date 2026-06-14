import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Card, PageHeader, useToast } from '@cp/ui';
import {
  ContestFormat,
  ExamRankingRule,
  ExamTieMode,
  ExamVisibility,
  ICreateExamPayload,
} from '@cp/shared';
import { useCreateExam, useExam, useUpdateExam } from '../../../api/exams.queries';
import { usePortalBase } from '../../../hooks/usePortalBase';

function toLocalInput(iso?: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 16);
}
function fromLocalInput(local: string): string {
  return new Date(local).toISOString();
}

const FIELD = 'px-3 py-2 bg-surface-container-highest rounded-lg text-label-md outline-none focus:ring-2 focus:ring-primary w-full';
const LABEL = 'text-label-sm font-semibold text-on-surface-variant mb-1 block';

export default function ExamFormPage() {
  const base = usePortalBase();
  const navigate = useNavigate();
  const toast = useToast();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const { data: existing } = useExam(id ?? '');
  const createMut = useCreateExam();
  const updateMut = useUpdateExam(id ?? '');

  const [form, setForm] = useState<ICreateExamPayload>({
    title: '',
    description: '',
    format: ContestFormat.SCORE_BASED,
    rankingRule: ExamRankingRule.SCORE_THEN_TIME,
    tieMode: ExamTieMode.COMPETITION,
    startAt: '',
    endAt: '',
    visibility: ExamVisibility.CLASS,
    autoFinalize: true,
    autoGrantReward: false,
    settings: {},
  });

  useEffect(() => {
    if (existing && isEdit) {
      setForm({
        title: existing.title,
        description: existing.description,
        format: existing.format,
        rankingRule: existing.rankingRule,
        tieMode: existing.tieMode,
        startAt: existing.startAt,
        endAt: existing.endAt,
        durationMinutes: existing.durationMinutes,
        visibility: existing.visibility,
        classIds: existing.classIds,
        autoFinalize: existing.autoFinalize,
        autoGrantReward: existing.autoGrantReward,
        settings: existing.settings ?? {},
      });
    }
  }, [existing, isEdit]);

  const set = <K extends keyof ICreateExamPayload>(k: K, v: ICreateExamPayload[K]) =>
    setForm((f) => ({ ...f, [k]: v }));
  const setSetting = (k: string, v: unknown) =>
    setForm((f) => ({ ...f, settings: { ...(f.settings ?? {}), [k]: v } }));

  async function submit() {
    if (!form.title.trim() || !form.startAt || !form.endAt) {
      toast.error('Cần nhập tiêu đề, thời gian bắt đầu và kết thúc');
      return;
    }
    const payload: ICreateExamPayload = { ...form };
    try {
      if (isEdit) {
        await updateMut.mutateAsync(payload);
        toast.success('Đã cập nhật kỳ thi');
        navigate(`${base}/exams/${id}`);
      } else {
        const created = await createMut.mutateAsync(payload);
        toast.success('Đã tạo kỳ thi');
        navigate(`${base}/exams/${created.id}`);
      }
    } catch (e) {
      toast.error('Lưu kỳ thi thất bại');
    }
  }

  return (
    <div className="p-lg flex flex-col gap-lg max-w-3xl">
      <PageHeader title={isEdit ? 'Sửa kỳ thi' : 'Tạo kỳ thi'} />

      <Card className="p-lg flex flex-col gap-md">
        <div>
          <label className={LABEL}>Tiêu đề *</label>
          <input className={FIELD} value={form.title} onChange={(e) => set('title', e.target.value)} />
        </div>
        <div>
          <label className={LABEL}>Mô tả</label>
          <textarea className={`${FIELD} min-h-[80px]`} value={form.description} onChange={(e) => set('description', e.target.value)} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-md">
          <div>
            <label className={LABEL}>Thể thức</label>
            <select className={FIELD} value={form.format} onChange={(e) => set('format', e.target.value as ContestFormat)}>
              {Object.values(ContestFormat).map((f) => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
          <div>
            <label className={LABEL}>Luật xếp hạng</label>
            <select className={FIELD} value={form.rankingRule} onChange={(e) => set('rankingRule', e.target.value as ExamRankingRule)}>
              {Object.values(ExamRankingRule).map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className={LABEL}>Đồng hạng</label>
            <select className={FIELD} value={form.tieMode} onChange={(e) => set('tieMode', e.target.value as ExamTieMode)}>
              {Object.values(ExamTieMode).map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
          <div>
            <label className={LABEL}>Bắt đầu *</label>
            <input type="datetime-local" className={FIELD} value={toLocalInput(form.startAt)}
              onChange={(e) => set('startAt', fromLocalInput(e.target.value))} />
          </div>
          <div>
            <label className={LABEL}>Kết thúc *</label>
            <input type="datetime-local" className={FIELD} value={toLocalInput(form.endAt)}
              onChange={(e) => set('endAt', fromLocalInput(e.target.value))} />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-md">
          <div>
            <label className={LABEL}>Thời lượng (phút, tùy chọn)</label>
            <input type="number" className={FIELD} value={form.durationMinutes ?? ''}
              onChange={(e) => set('durationMinutes', e.target.value ? Number(e.target.value) : null)} />
          </div>
          <div>
            <label className={LABEL}>Hiển thị</label>
            <select className={FIELD} value={form.visibility} onChange={(e) => set('visibility', e.target.value as ExamVisibility)}>
              {Object.values(ExamVisibility).map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
          <div>
            <label className={LABEL}>Freeze trước kết thúc (phút)</label>
            <input type="number" className={FIELD} value={(form.settings?.freezeOffsetMinutes as number) ?? ''}
              onChange={(e) => setSetting('freezeOffsetMinutes', e.target.value ? Number(e.target.value) : undefined)} />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
          <div>
            <label className={LABEL}>Penalty / lần sai (phút, ICPC)</label>
            <input type="number" className={FIELD} value={(form.settings?.penaltyPerWrongMinutes as number) ?? ''}
              onChange={(e) => setSetting('penaltyPerWrongMinutes', e.target.value ? Number(e.target.value) : undefined)} />
          </div>
          <div>
            <label className={LABEL}>Giới hạn lần nộp / bài (tùy chọn)</label>
            <input type="number" className={FIELD} value={(form.settings?.maxAttemptsPerProblem as number) ?? ''}
              onChange={(e) => setSetting('maxAttemptsPerProblem', e.target.value ? Number(e.target.value) : undefined)} />
          </div>
        </div>

        <div className="flex flex-wrap gap-lg">
          <label className="flex items-center gap-2 text-label-md">
            <input type="checkbox" checked={form.autoFinalize ?? false} onChange={(e) => set('autoFinalize', e.target.checked)} />
            Tự động chốt kết quả
          </label>
          <label className="flex items-center gap-2 text-label-md">
            <input type="checkbox" checked={form.autoGrantReward ?? false} onChange={(e) => set('autoGrantReward', e.target.checked)} />
            Tự động trao thưởng khi chốt
          </label>
          <label className="flex items-center gap-2 text-label-md">
            <input type="checkbox" checked={(form.settings?.showLeaderboardToStudents as boolean) ?? false}
              onChange={(e) => setSetting('showLeaderboardToStudents', e.target.checked)} />
            Cho học sinh xem leaderboard
          </label>
        </div>

        <div className="flex gap-sm pt-md">
          <Button variant="admin" onClick={submit} disabled={createMut.isPending || updateMut.isPending}>
            {isEdit ? 'Lưu thay đổi' : 'Tạo kỳ thi'}
          </Button>
          <Button variant="outline" onClick={() => navigate(`${base}/exams`)}>Hủy</Button>
        </div>
      </Card>
    </div>
  );
}
