import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Avatar,
  BarChart,
  Breadcrumb,
  Button,
  EnrollmentStatusBadge,
  Icon,
  PageHeader,
  StatusBadge,
  TabPills,
  TrendBadge,
} from '@cp/ui';
import { GENDER_LABEL, GUARDIAN_RELATIONSHIP_LABEL, IGuardian, ISubjectGrade } from '@cp/shared';

import { useStudent } from '../../../api/student.queries';

type Tab = 'academics' | 'courses' | 'attendance' | 'activity';

export default function StudentProfilePage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { studentId: idParam } = useParams<{ studentId: string }>();
  const locale = i18n.language === 'vi' ? 'vi-VN' : 'en-US';

  const studentQuery = useStudent(idParam);
  const [tab, setTab] = useState<Tab>('academics');

  const subjectGrades: ISubjectGrade[] = useMemo(
    () => [
      { subject: 'Math', percentage: 92 },
      { subject: 'Science', percentage: 88 },
      { subject: 'English', percentage: 96 },
      { subject: 'History', percentage: 85 },
      { subject: 'Art', percentage: 98 },
    ],
    [],
  );

  if (studentQuery.isLoading) {
    return (
      <div className="grid place-items-center min-h-[40vh] text-on-surface-variant">
        <span className="material-symbols-outlined animate-spin text-3xl">progress_activity</span>
      </div>
    );
  }

  if (studentQuery.isError || !studentQuery.data) {
    return (
      <div className="grid place-items-center min-h-[40vh] text-center">
        <Icon name="error" size={36} className="mb-sm text-error" />
        <p className="text-body-md text-on-surface">
          {(studentQuery.error as Error | undefined)?.message ?? t('common.notFound')}
        </p>
        <Button variant="ghost" className="mt-md" onClick={() => navigate('/admin/students')}>
          {t('pages.admin.studentProfile.backToDirectory')}
        </Button>
      </div>
    );
  }

  const s = studentQuery.data;
  const fullName = `${s.firstName} ${s.lastName}`.trim();
  const initials = `${s.firstName[0] ?? ''}${s.lastName[0] ?? ''}`.toUpperCase();

  const age = s.dateOfBirth ? yearsBetween(new Date(s.dateOfBirth), new Date()) : null;
  const dobFormatted = s.dateOfBirth
    ? new Date(s.dateOfBirth).toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' })
    : null;

  return (
    <div className="flex flex-col gap-lg">
      <PageHeader
        breadcrumb={
          <Breadcrumb
            items={[
              { label: t('nav.admin.students'), onClick: () => navigate('/admin/students') },
              { label: fullName },
            ]}
          />
        }
        eyebrow={
          <div className="flex items-center gap-sm text-label-sm text-on-surface-variant">
            <span>{t('pages.admin.studentProfile.gradeShort', { grade: s.grade })}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-outline-variant" />
            <span>{t('pages.admin.studentProfile.cohortOf', { year: s.cohortYear })}</span>
          </div>
        }
        title={
          <div className="flex items-center gap-md">
            <span className="relative">
              <Avatar size="lg" initials={initials} src={s.avatarUrl ?? undefined} />
              {s.honorRoll && (
                <span
                  className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-tertiary-container text-tertiary border-2 border-surface grid place-items-center"
                  aria-label={t('pages.admin.studentProfile.honorRoll')}
                  title={t('pages.admin.studentProfile.honorRoll')}
                >
                  <Icon name="stars" size={12} />
                </span>
              )}
            </span>
            <div className="min-w-0">
              <div className="font-manrope text-headline-lg text-on-surface truncate">{fullName}</div>
              <div className="flex items-center gap-sm mt-xs">
                <EnrollmentStatusBadge status={s.status} />
                <span className="text-label-sm text-on-surface-variant font-mono">{s.studentId}</span>
              </div>
            </div>
          </div>
        }
        actions={
          <>
            <Button
              variant="ghost"
              leadingIcon={<Icon name="edit" size={18} />}
              onClick={() => navigate(`/admin/students/${idParam}/edit`)}
            >
              {t('pages.admin.studentProfile.edit')}
            </Button>
            <Button variant="ghost" leadingIcon={<Icon name="lock_reset" size={18} />}>
              {t('pages.admin.studentProfile.resetPassword')}
            </Button>
            <Button variant="admin" leadingIcon={<Icon name="mail" size={18} />}>
              {t('pages.admin.studentProfile.message')}
            </Button>
          </>
        }
      />

      {/* Main bento: left = demographics + guardians, right = KPIs + tabs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-lg">
        {/* Left column */}
        <aside className="lg:col-span-4 flex flex-col gap-md">
          <div className="bg-surface-container-lowest border border-outline-variant/50 rounded-xl p-md">
            <h3 className="font-manrope text-headline-md text-on-surface mb-sm">
              {t('pages.admin.studentProfile.demographics.title')}
            </h3>
            <dl className="flex flex-col gap-sm">
              <Detail
                icon="cake"
                label={t('pages.admin.studentProfile.demographics.dob')}
                value={
                  dobFormatted
                    ? age != null
                      ? `${dobFormatted} · ${t('pages.admin.studentProfile.demographics.years', { count: age })}`
                      : dobFormatted
                    : '—'
                }
              />
              <Detail
                icon="mail"
                label={t('pages.admin.studentProfile.demographics.email')}
                value={s.email}
              />
              <Detail
                icon="home"
                label={t('pages.admin.studentProfile.demographics.address')}
                value={s.homeAddress ?? '—'}
              />
              {s.gender && (
                <Detail
                  icon="person"
                  label={t('pages.admin.studentProfile.demographics.gender')}
                  value={GENDER_LABEL[s.gender]}
                />
              )}
            </dl>
          </div>

          <div className="bg-surface-container-lowest border border-outline-variant/50 rounded-xl p-md">
            <header className="flex items-center justify-between mb-sm">
              <h3 className="font-manrope text-headline-md text-on-surface">
                {t('pages.admin.studentProfile.guardians.title')}
              </h3>
              <Button variant="ghost" size="sm" leadingIcon={<Icon name="add" size={16} />}>
                {t('common.add')}
              </Button>
            </header>
            {s.guardians.length === 0 ? (
              <p className="text-label-sm text-on-surface-variant text-center py-md italic">
                {t('pages.admin.studentProfile.guardians.empty')}
              </p>
            ) : (
              <ul className="flex flex-col divide-y divide-outline-variant/30">
                {s.guardians.map((g) => (
                  <GuardianRow key={g.id} guardian={g} />
                ))}
              </ul>
            )}
          </div>
        </aside>

        {/* Right column */}
        <section className="lg:col-span-8 flex flex-col gap-md">
          {/* KPI row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
            <KpiCard
              icon="grade"
              iconColor="text-primary"
              label={t('pages.admin.studentProfile.kpi.gpa')}
              value={s.cumulativeGpa.toFixed(2)}
              caption={
                <TrendBadge
                  trend="up"
                  label={t('pages.admin.studentProfile.kpi.gpaTrend', { value: 0.2 })}
                />
              }
            />
            <KpiCard
              icon="event_available"
              iconColor="text-tertiary"
              label={t('pages.admin.studentProfile.kpi.attendance')}
              value={`${s.attendanceRate.toFixed(1)}%`}
              caption={
                <span className="text-label-sm text-on-surface-variant">
                  {t('pages.admin.studentProfile.kpi.daysAbsent', { count: s.daysAbsent })}
                </span>
              }
            />
            <KpiCard
              icon="rocket_launch"
              iconColor="text-secondary"
              label={t('pages.admin.studentProfile.kpi.questsCompleted')}
              value={String(s.questsCompleted)}
              caption={
                <span className="text-label-sm text-on-surface-variant">
                  {s.cohortPercentile ?? '—'}
                </span>
              }
              decoration
            />
          </div>

          {/* Tabbed panel */}
          <div className="bg-surface-container-lowest border border-outline-variant/50 rounded-xl shadow-elev-1 overflow-hidden">
            <header className="px-md md:px-lg pt-md border-b border-outline-variant/30">
              <TabPills
                value={tab}
                onChange={setTab}
                options={[
                  { value: 'academics', label: t('pages.admin.studentProfile.tabs.academics') },
                  { value: 'courses', label: t('pages.admin.studentProfile.tabs.courses') },
                  { value: 'attendance', label: t('pages.admin.studentProfile.tabs.attendance') },
                  { value: 'activity', label: t('pages.admin.studentProfile.tabs.activity') },
                ]}
                className="mb-md"
              />
            </header>

            {tab === 'academics' && (
              <div className="p-md md:p-lg">
                <header className="flex items-center justify-between mb-md">
                  <h4 className="font-manrope text-headline-md text-on-surface">
                    {t('pages.admin.studentProfile.academics.title')}
                  </h4>
                  <select className="bg-surface-container-low border border-outline-variant rounded-md px-md py-xs text-label-sm">
                    <option>2023–2024 · Fall</option>
                    <option>2023–2024 · Spring</option>
                  </select>
                </header>
                <BarChart
                  data={subjectGrades.map((g) => ({ label: g.subject, value: g.percentage }))}
                  barClassName="bg-primary/80"
                  height={220}
                />
              </div>
            )}

            {tab === 'courses' && (
              <div className="p-md md:p-lg text-center text-on-surface-variant">
                {t('pages.admin.studentProfile.courses.empty')}
              </div>
            )}
            {tab === 'attendance' && (
              <div className="p-md md:p-lg text-center text-on-surface-variant">
                {t('pages.admin.studentProfile.attendance.empty')}
              </div>
            )}
            {tab === 'activity' && (
              <div className="p-md md:p-lg text-center text-on-surface-variant">
                {t('pages.admin.studentProfile.activity.empty')}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function Detail({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex items-start gap-sm">
      <Icon name={icon} size={18} className="text-primary mt-0.5" />
      <div className="min-w-0">
        <dt className="text-[12px] text-on-surface-variant uppercase tracking-wider">{label}</dt>
        <dd className="text-on-surface text-body-md break-words">{value}</dd>
      </div>
    </div>
  );
}

function GuardianRow({ guardian: g }: { guardian: IGuardian }) {
  const initials = g.fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();
  return (
    <li className="flex items-center gap-sm py-sm">
      <Avatar size="sm" initials={initials} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-xs">
          <span className="text-on-surface font-medium truncate">{g.fullName}</span>
          {g.isPrimary && (
            <StatusBadge tone="info" className="!py-0 !px-xs">
              Primary
            </StatusBadge>
          )}
        </div>
        <div className="text-[12px] text-on-surface-variant">
          {GUARDIAN_RELATIONSHIP_LABEL[g.relationship]} · {g.phoneNumber}
        </div>
      </div>
      <a
        href={`tel:${g.phoneNumber}`}
        className="p-1 rounded text-on-surface-variant hover:text-primary"
        aria-label="Call"
      >
        <Icon name="call" size={18} />
      </a>
      {g.email && (
        <a
          href={`mailto:${g.email}`}
          className="p-1 rounded text-on-surface-variant hover:text-primary"
          aria-label="Email"
        >
          <Icon name="mail" size={18} />
        </a>
      )}
    </li>
  );
}

function KpiCard({
  icon,
  iconColor,
  label,
  value,
  caption,
  decoration,
}: {
  icon: string;
  iconColor: string;
  label: string;
  value: string;
  caption: React.ReactNode;
  decoration?: boolean;
}) {
  return (
    <div className="relative overflow-hidden bg-surface-container-lowest border border-outline-variant/50 rounded-xl p-md flex flex-col gap-xs">
      {decoration && (
        <div
          className="absolute -right-4 -top-4 w-24 h-24 bg-primary-container/40 rounded-full blur-xl"
          aria-hidden
        />
      )}
      <div className={`flex items-center gap-sm relative ${iconColor}`}>
        <Icon name={icon} size={20} />
        <span className="text-label-sm uppercase tracking-wider text-on-surface-variant">{label}</span>
      </div>
      <div className="font-manrope text-headline-lg text-on-surface relative">{value}</div>
      <div className="relative">{caption}</div>
    </div>
  );
}

function yearsBetween(from: Date, to: Date): number {
  let y = to.getFullYear() - from.getFullYear();
  const m = to.getMonth() - from.getMonth();
  if (m < 0 || (m === 0 && to.getDate() < from.getDate())) y--;
  return y;
}
