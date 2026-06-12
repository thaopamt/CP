import { ReactNode, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Breadcrumb,
  Button,
  FormField,
  Icon,
  PageHeader,
} from '@cp/ui';
import {
  ENROLLMENT_STATUS_LABEL,
  DayOfWeek,
  EnrollmentStatus,

  GuardianRelationship,
  ICreateStudentPayload,
  ICreateStudentSchedulePayload,
  IGuardianInput,
} from '@cp/shared';

import { useCreateStudent } from '../../../api/student.queries';
import { studentScheduleApi } from '../../../api/studentSchedule.api';
import { usePortalBase } from '../../../hooks/usePortalBase';

type ScheduleDraft = {
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  note: string;
};

type Draft = {
  fullName: string;
  username: string;
  password: string;

  grade: number;
  startDate: string;
  status: EnrollmentStatus;
  monthlyTuition: number;
  isAccountActive: boolean;
  defaultLanguage: string;
  schedules: ScheduleDraft[];
  guardians: IGuardianInput[];
};

const LANG_OPTIONS = [
  { value: 'cpp', label: 'C++ 20' },
  { value: 'java', label: 'Java 17' },
  { value: 'python', label: 'Python 3' },
  { value: 'javascript', label: 'JavaScript' },
];

const INITIAL: Draft = {
  fullName: '',
  username: '',
  password: '',

  grade: 1,
  startDate: '',
  status: EnrollmentStatus.ACTIVE,
  monthlyTuition: 500000,
  isAccountActive: true,
  defaultLanguage: 'cpp',
  schedules: [],
  guardians: [
    { fullName: '', relationship: GuardianRelationship.GUARDIAN, phoneNumber: '', isPrimary: true },
  ],
};

export default function StudentCreatePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const base = usePortalBase();
  const createStudent = useCreateStudent();

  const [draft, setDraft] = useState<Draft>(INITIAL);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function patch(p: Partial<Draft>) {
    setDraft((prev) => ({ ...prev, ...p }));
  }

  function patchGuardian(idx: number, p: Partial<IGuardianInput>) {
    setDraft((prev) => ({
      ...prev,
      guardians: prev.guardians.map((g, i) => (i === idx ? { ...g, ...p } : g)),
    }));
  }

  function addGuardian() {
    setDraft((prev) => ({
      ...prev,
      guardians: [
        ...prev.guardians,
        { fullName: '', relationship: GuardianRelationship.GUARDIAN, phoneNumber: '', isPrimary: false },
      ],
    }));
  }

  function removeGuardian(idx: number) {
    setDraft((prev) => ({
      ...prev,
      guardians: prev.guardians.filter((_, i) => i !== idx),
    }));
  }

  function addSchedule() {
    setDraft((prev) => ({
      ...prev,
      schedules: [
        ...prev.schedules,
        { dayOfWeek: DayOfWeek.MON, startTime: '08:00', endTime: '09:30', note: '' },
      ],
    }));
  }

  function patchSchedule(idx: number, p: Partial<ScheduleDraft>) {
    setDraft((prev) => ({
      ...prev,
      schedules: prev.schedules.map((s, i) => (i === idx ? { ...s, ...p } : s)),
    }));
  }

  function removeSchedule(idx: number) {
    setDraft((prev) => ({
      ...prev,
      schedules: prev.schedules.filter((_, i) => i !== idx),
    }));
  }

  function generatePassword() {
    const out = Array.from(crypto.getRandomValues(new Uint8Array(12)))
      .map((b) => 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$'[b % 56])
      .join('');
    patch({ password: out });
  }

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!draft.fullName.trim()) e.fullName = t('pages.admin.studentCreate.validation.fullNameRequired');
    if (!draft.password.trim() || draft.password.length < 6)
      e.password = t('pages.admin.studentCreate.validation.passwordMin');

    if (draft.grade < 1 || draft.grade > 9) e.grade = t('pages.admin.studentCreate.validation.gradeRange');
    if (![500000, 600000].includes(draft.monthlyTuition)) {
      e.monthlyTuition = t('pages.admin.studentCreate.validation.monthlyTuition');
    }
    draft.schedules.forEach((s, i) => {
      if (!s.startTime || !s.endTime || s.startTime >= s.endTime) {
        e[`schedule.${i}.time`] = t('pages.admin.studentCreate.validation.scheduleTime');
      }
    });
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function submit() {
    if (!validate()) return;
    const payload: ICreateStudentPayload = {
      fullName: draft.fullName.trim(),
      username: draft.username.trim() || undefined,
      password: draft.password,

      grade: draft.grade,
      startDate: draft.startDate || undefined,
      status: draft.status,
      monthlyTuition: draft.monthlyTuition,
      guardians: draft.guardians
        .filter((g) => g.fullName.trim() || g.phoneNumber?.trim())
        .map((g) => ({
          fullName: g.fullName.trim(),
          relationship: g.relationship,
          phoneNumber: g.phoneNumber?.trim() ?? '',

          isPrimary: g.isPrimary ?? false,
        })),
    };
    try {
      const created = await createStudent.mutateAsync(payload);
      const schedules: ICreateStudentSchedulePayload[] = draft.schedules.map((s) => ({
        classId: null,
        dayOfWeek: s.dayOfWeek,
        startTime: s.startTime,
        endTime: s.endTime,
        ...(s.note.trim() ? { note: s.note.trim() } : {}),
      }));
      await Promise.all(schedules.map((schedule) => studentScheduleApi.addCustomSession(created.userId, schedule)));
      navigate(`${base}/students/${created.id}`);
    } catch (err) {
      const msg =
        (err as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
      const flat = Array.isArray(msg) ? msg.join(', ') : msg;
      setErrors({ submit: flat ?? (err as Error).message });
    }
  }

  return (
    <div className="flex flex-col gap-lg max-w-4xl mx-auto pb-[80px]">
      <PageHeader
        breadcrumb={
          <Breadcrumb
            items={[
              { label: t('nav.admin.students'), onClick: () => navigate(`${base}/students`) },
              { label: t('pages.admin.studentCreate.title') },
            ]}
          />
        }
        title={t('pages.admin.studentCreate.title')}
        subtitle={t('pages.admin.studentCreate.subtitle')}
      />

      {/* Section 1: Basic info */}
      <FormSection icon="badge" title={t('pages.admin.studentCreate.sections.basics')}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
          <FormField
            label={t('pages.admin.studentCreate.fields.fullName')}
            required
            error={errors.fullName}
          >
            <input
              type="text"
              value={draft.fullName}
              onChange={(e) => patch({ fullName: e.target.value })}
              className="bg-surface-container-low border border-outline-variant rounded-lg px-md py-sm focus:ring-2 focus:ring-primary outline-none"
            />
          </FormField>
          <FormField
            label="Username"
            hint="Tên đăng nhập (có thể dùng thay email)"
          >
            <input
              type="text"
              value={draft.username}
              onChange={(e) => patch({ username: e.target.value })}
              placeholder="vd: hocsinh01"
              className="bg-surface-container-low border border-outline-variant rounded-lg px-md py-sm focus:ring-2 focus:ring-primary outline-none"
            />
          </FormField>

        </div>
      </FormSection>

      {/* Section 2: Account credentials */}
      <FormSection icon="vpn_key" title={t('pages.admin.studentCreate.sections.account')}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-md">

          <FormField
            label={t('pages.admin.studentCreate.fields.password')}
            required
            error={errors.password}
          >
            <div className="flex gap-sm">
              <input
                type="text"
                value={draft.password}
                onChange={(e) => patch({ password: e.target.value })}
                className="flex-1 bg-surface-container-low border border-outline-variant rounded-lg px-md py-sm focus:ring-2 focus:ring-primary outline-none font-mono text-[13px]"
              />
              <Button variant="ghost" size="sm" onClick={generatePassword} leadingIcon={<Icon name="autorenew" size={16} />}>
                {t('pages.admin.studentCreate.fields.generatePassword')}
              </Button>
            </div>
          </FormField>
          <FormField label={t('pages.admin.studentCreate.fields.accountStatus')}>
            <select
              value={draft.status}
              onChange={(e) => patch({ status: e.target.value as EnrollmentStatus })}
              className="bg-surface-container-low border border-outline-variant rounded-lg px-md py-sm focus:ring-2 focus:ring-primary outline-none"
            >
              {[EnrollmentStatus.ACTIVE, EnrollmentStatus.PENDING, EnrollmentStatus.INACTIVE].map((s) => (
                <option key={s} value={s}>
                  {ENROLLMENT_STATUS_LABEL[s]}
                </option>
              ))}
            </select>
          </FormField>
        </div>
      </FormSection>

      <FormSection icon="school" title={t('pages.admin.studentCreate.sections.enrollment')}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
          <FormField
            label={t('pages.admin.studentCreate.fields.grade')}
            required
            error={errors.grade}
          >
            <select
              value={draft.grade}
              onChange={(e) => patch({ grade: Number(e.target.value) })}
              className="bg-surface-container-low border border-outline-variant rounded-lg px-md py-sm focus:ring-2 focus:ring-primary outline-none"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((g) => (
                <option key={g} value={g}>
                  {`Lớp ${g}`}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label={t('pages.admin.studentCreate.fields.startDate')}>
            <input
              type="date"
              value={draft.startDate}
              onChange={(e) => patch({ startDate: e.target.value })}
              className="bg-surface-container-low border border-outline-variant rounded-lg px-md py-sm focus:ring-2 focus:ring-primary outline-none"
            />
          </FormField>
          <FormField label={'Ngôn ngữ mặc định'}>
            <select
              value={draft.defaultLanguage}
              onChange={(e) => patch({ defaultLanguage: e.target.value })}
              className="bg-surface-container-low border border-outline-variant rounded-lg px-md py-sm focus:ring-2 focus:ring-primary outline-none"
            >
              {LANG_OPTIONS.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>
          </FormField>
        </div>
      </FormSection>

      <FormSection icon="payments" title={t('pages.admin.studentCreate.sections.finance')}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
          <FormField
            label={t('pages.admin.studentCreate.fields.monthlyTuition')}
            hint={t('pages.admin.studentCreate.fields.monthlyTuitionHint')}
            error={errors.monthlyTuition}
          >
            <select
              value={draft.monthlyTuition}
              onChange={(e) => patch({ monthlyTuition: Number(e.target.value) })}
              className="bg-surface-container-low border border-outline-variant rounded-lg px-md py-sm focus:ring-2 focus:ring-primary outline-none"
            >
              <option value={500000}>500.000 VND</option>
              <option value={600000}>600.000 VND</option>
            </select>
          </FormField>
        </div>
      </FormSection>

      <FormSection
        icon="calendar_month"
        title={t('pages.admin.studentCreate.sections.schedule')}
        action={
          <Button variant="ghost" size="sm" leadingIcon={<Icon name="add" size={16} />} onClick={addSchedule}>
            {t('pages.admin.studentCreate.fields.addSchedule')}
          </Button>
        }
      >
        {draft.schedules.length === 0 ? (
          <div className="rounded-lg border border-dashed border-outline-variant bg-surface-container-low px-md py-lg text-center text-body-sm text-on-surface-variant">
            {t('pages.admin.studentCreate.schedule.empty')}
          </div>
        ) : (
          <div className="flex flex-col gap-sm">
            {draft.schedules.map((s, i) => (
              <div
                key={i}
                className="grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr_1.4fr_auto] gap-sm items-end p-sm rounded-lg bg-surface-container-low border border-outline-variant/40"
              >
                <FormField label={t('pages.admin.studentCreate.fields.scheduleDay')}>
                  <select
                    value={s.dayOfWeek}
                    onChange={(e) => patchSchedule(i, { dayOfWeek: e.target.value as DayOfWeek })}
                    className="bg-surface-container-lowest border border-outline-variant rounded-md px-sm py-xs"
                  >
                    {Object.values(DayOfWeek).map((day) => (
                      <option key={day} value={day}>
                        {t(`enums.dayOfWeek.${day}`)}
                      </option>
                    ))}
                  </select>
                </FormField>
                <FormField label={t('pages.admin.studentCreate.fields.scheduleStart')}>
                  <input
                    type="time"
                    value={s.startTime}
                    onChange={(e) => patchSchedule(i, { startTime: e.target.value })}
                    className="bg-surface-container-lowest border border-outline-variant rounded-md px-sm py-xs"
                  />
                </FormField>
                <FormField
                  label={t('pages.admin.studentCreate.fields.scheduleEnd')}
                  error={errors[`schedule.${i}.time`]}
                >
                  <input
                    type="time"
                    value={s.endTime}
                    onChange={(e) => patchSchedule(i, { endTime: e.target.value })}
                    className="bg-surface-container-lowest border border-outline-variant rounded-md px-sm py-xs"
                  />
                </FormField>
                <FormField label={t('pages.admin.studentCreate.fields.scheduleNote')}>
                  <input
                    type="text"
                    value={s.note}
                    onChange={(e) => patchSchedule(i, { note: e.target.value })}
                    className="bg-surface-container-lowest border border-outline-variant rounded-md px-sm py-xs"
                  />
                </FormField>
                <button
                  type="button"
                  onClick={() => removeSchedule(i)}
                  className="p-1 rounded text-on-surface-variant hover:text-error"
                  aria-label={t('common.delete')}
                >
                  <Icon name="delete" size={20} />
                </button>
              </div>
            ))}
          </div>
        )}
      </FormSection>

      {/* Section 4: Guardians */}
      <FormSection
        icon="family_restroom"
        title={t('pages.admin.studentCreate.sections.guardians')}
        action={
          <Button variant="ghost" size="sm" leadingIcon={<Icon name="person_add" size={16} />} onClick={addGuardian}>
            {t('pages.admin.studentCreate.fields.addGuardian')}
          </Button>
        }
      >
        <div className="flex flex-col gap-md">
          {draft.guardians.map((g, i) => (
            <div
              key={i}
              className="grid grid-cols-1 md:grid-cols-2 gap-md p-md rounded-lg bg-surface-container-low border border-outline-variant/40 relative"
            >
              <FormField
                label={t('pages.admin.studentCreate.fields.guardianName')}
                error={errors[`g.${i}.fullName`]}
              >
                <input
                  type="text"
                  value={g.fullName}
                  onChange={(e) => patchGuardian(i, { fullName: e.target.value })}
                  className="bg-surface-container-lowest border border-outline-variant rounded-md px-md py-sm focus:ring-2 focus:ring-primary outline-none"
                />
              </FormField>
              <FormField
                label={t('pages.admin.studentCreate.fields.guardianPhone')}
                error={errors[`g.${i}.phone`]}
              >
                <input
                  type="tel"
                  value={g.phoneNumber}
                  onChange={(e) => patchGuardian(i, { phoneNumber: e.target.value })}
                  className="bg-surface-container-lowest border border-outline-variant rounded-md px-md py-sm focus:ring-2 focus:ring-primary outline-none"
                />
              </FormField>

              <label className="md:col-span-2 inline-flex items-center gap-xs text-label-sm text-on-surface-variant">
                <input
                  type="checkbox"
                  checked={!!g.isPrimary}
                  onChange={(e) => {
                    const isPrimary = e.target.checked;
                    setDraft((prev) => ({
                      ...prev,
                      guardians: prev.guardians.map((x, idx) => ({
                        ...x,
                        isPrimary: idx === i ? isPrimary : isPrimary ? false : x.isPrimary,
                      })),
                    }));
                  }}
                  className="rounded text-primary focus:ring-primary"
                />
                {t('pages.admin.studentCreate.fields.primaryContact')}
              </label>
              {draft.guardians.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeGuardian(i)}
                  className="absolute top-sm right-sm p-1 rounded text-on-surface-variant hover:text-error"
                  aria-label={t('common.delete')}
                >
                  <Icon name="close" size={18} />
                </button>
              )}
            </div>
          ))}
        </div>
      </FormSection>

      {errors.submit && (
        <div className="bg-error-container/60 text-on-error-container rounded-md px-md py-sm text-label-sm">
          {errors.submit}
        </div>
      )}

      {/* Sticky footer */}
      <div className="sticky bottom-0 bg-surface/95 backdrop-blur-md border-t border-outline-variant flex items-center justify-between gap-sm py-sm px-md -mx-md md:-mx-lg lg:-mx-xl">
        <Button
          variant="ghost"
          leadingIcon={<Icon name="arrow_back" size={18} />}
          onClick={() => navigate(`${base}/students`)}
          disabled={createStudent.isPending}
        >
          {t('common.cancel')}
        </Button>
        <Button
          variant="admin"
          trailingIcon={
            createStudent.isPending ? (
              <Icon name="progress_activity" size={18} className="animate-spin" />
            ) : (
              <Icon name="check" size={18} />
            )
          }
          onClick={submit}
          disabled={createStudent.isPending}
        >
          {t('pages.admin.studentCreate.actions.save')}
        </Button>
      </div>
    </div>
  );
}

function FormSection({
  icon,
  title,
  action,
  children,
}: {
  icon: string;
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="bg-surface-container-lowest border border-outline-variant/50 rounded-xl p-md md:p-lg">
      <header className="flex items-center justify-between mb-md">
        <div className="flex items-center gap-sm">
          <span className="w-9 h-9 rounded-lg bg-primary-container/40 text-primary grid place-items-center">
            <Icon name={icon} />
          </span>
          <h3 className="font-manrope text-headline-md text-on-surface">{title}</h3>
        </div>
        {action}
      </header>
      {children}
    </section>
  );
}
