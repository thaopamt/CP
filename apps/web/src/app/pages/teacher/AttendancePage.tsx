import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AttendanceRoster,
  Breadcrumb,
  Button,
  Icon,
  PageHeader,
  SearchBox,
  SelectFilter,
} from '@cp/ui';
import { AttendanceStatus, IRosterStudent } from '@cp/shared';

export default function TeacherAttendancePage() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [period, setPeriod] = useState('p3');

  const roster: IRosterStudent[] = useMemo(
    () => [
      { id: 'a1', name: t('pages.teacher.attendance.roster.alex'), studentId: 'S-2024-001' },
      { id: 'a2', name: t('pages.teacher.attendance.roster.betty'), studentId: 'S-2024-002' },
      { id: 'a3', name: t('pages.teacher.attendance.roster.charlie'), studentId: 'S-2024-003' },
      { id: 'a4', name: t('pages.teacher.attendance.roster.david'), studentId: 'S-2024-004' },
      { id: 'a5', name: t('pages.teacher.attendance.roster.eva'), studentId: 'S-2024-005' },
      { id: 'a6', name: t('pages.teacher.attendance.roster.felix'), studentId: 'S-2024-006' },
      { id: 'a7', name: t('pages.teacher.attendance.roster.gabriela'), studentId: 'S-2024-007' },
      { id: 'a8', name: t('pages.teacher.attendance.roster.henry'), studentId: 'S-2024-008' },
    ],
    [t],
  );

  const [records, setRecords] = useState<Record<string, AttendanceStatus>>(() => {
    const out: Record<string, AttendanceStatus> = {};
    for (const s of roster) out[s.id] = AttendanceStatus.UNMARKED;
    out['a1'] = AttendanceStatus.PRESENT;
    out['a2'] = AttendanceStatus.ABSENT;
    out['a3'] = AttendanceStatus.LATE;
    return out;
  });

  const filtered = useMemo(() => {
    if (!search.trim()) return roster;
    const q = search.trim().toLowerCase();
    return roster.filter(
      (s) => s.name.toLowerCase().includes(q) || s.studentId.toLowerCase().includes(q),
    );
  }, [search, roster]);

  const stats = useMemo(() => {
    const total = roster.length;
    let present = 0;
    let absent = 0;
    let late = 0;
    for (const s of roster) {
      switch (records[s.id]) {
        case AttendanceStatus.PRESENT: present++; break;
        case AttendanceStatus.ABSENT: absent++; break;
        case AttendanceStatus.LATE: late++; break;
        default: break;
      }
    }
    const pct = total === 0 ? 0 : Math.round((present / total) * 100);
    return { total, present, absent, late, pct };
  }, [records, roster]);

  function setStatus(studentId: string, status: AttendanceStatus) {
    setRecords((prev) => ({ ...prev, [studentId]: status }));
  }

  function reset() {
    setRecords((prev) => {
      const out: Record<string, AttendanceStatus> = {};
      for (const id of Object.keys(prev)) out[id] = AttendanceStatus.UNMARKED;
      return out;
    });
  }

  return (
    <div className="flex flex-col gap-lg">
      <PageHeader
        breadcrumb={
          <Breadcrumb
            items={[
              { label: t('pages.teacher.attendance.breadcrumb.myClasses') },
              { label: t('pages.teacher.attendance.breadcrumb.className') },
              { label: t('pages.teacher.attendance.breadcrumb.today') },
            ]}
          />
        }
        title={t('pages.teacher.attendance.title')}
        subtitle={t('pages.teacher.attendance.subtitle')}
        actions={
          <>
            <Button variant="ghost" onClick={reset}>
              {t('common.resetAll')}
            </Button>
            <Button variant="teacher" leadingIcon={<Icon name="check_circle" size={18} />}>
              {t('pages.teacher.attendance.save')}
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-3 gap-sm md:gap-md">
        <SummaryCard
          label={t('pages.teacher.attendance.summary.present')}
          value={`${stats.pct}%`}
          sub={t('pages.teacher.attendance.summary.presentSub', { count: stats.present, total: stats.total })}
          tone="text-tertiary"
        />
        <SummaryCard
          label={t('pages.teacher.attendance.summary.total')}
          value={stats.total}
          sub={t('pages.teacher.attendance.summary.totalSub')}
          tone="text-on-surface"
        />
        <SummaryCard
          label={t('pages.teacher.attendance.summary.absent')}
          value={stats.absent}
          sub={t('pages.teacher.attendance.summary.lateSuffix', { count: stats.late })}
          tone="text-error"
        />
      </div>

      <div className="flex flex-col md:flex-row md:items-center gap-sm md:gap-md bg-surface-container-lowest border border-outline-variant/50 rounded-lg p-md">
        <SearchBox value={search} onChange={setSearch} placeholder={t('pages.teacher.attendance.searchPlaceholder')} />
        <SelectFilter
          label={t('common.period')}
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          options={[
            { value: 'p1', label: t('pages.teacher.attendance.periods.p1') },
            { value: 'p3', label: t('pages.teacher.attendance.periods.p3') },
            { value: 'p5', label: t('pages.teacher.attendance.periods.p5') },
          ]}
        />
      </div>

      <div className="bg-surface-container-lowest border border-outline-variant/50 rounded-xl overflow-hidden">
        <AttendanceRoster students={filtered} records={records} onChange={setStatus} />
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string | number;
  sub: string;
  tone: string;
}) {
  return (
    <div className="bg-surface-container-lowest border border-outline-variant/50 rounded-xl p-md">
      <div className="text-label-sm text-on-surface-variant uppercase tracking-wider">{label}</div>
      <div className={`font-manrope text-headline-lg ${tone}`}>{value}</div>
      <div className="text-[12px] text-on-surface-variant">{sub}</div>
    </div>
  );
}
