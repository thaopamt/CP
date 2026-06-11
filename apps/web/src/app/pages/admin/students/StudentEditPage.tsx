import { ReactNode, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
  EnrollmentStatus,
  GuardianRelationship,
  IUpdateStudentPayload,
  IGuardianInput,
} from '@cp/shared';

import { useStudent, useUpdateStudent } from '../../../api/student.queries';
import { usePortalBase } from '../../../hooks/usePortalBase';

type Draft = {
  fullName: string;
  username: string;

  grade: number;
  startDate: string;
  status: EnrollmentStatus;
  isAccountActive: boolean;
  defaultLanguage: string;
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

  grade: 1,
  startDate: '',
  status: EnrollmentStatus.ACTIVE,
  isAccountActive: true,
  defaultLanguage: 'cpp',
  guardians: [],
};

export default function StudentEditPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const base = usePortalBase();
  const { studentId: idParam } = useParams<{ studentId: string }>();

  const studentQuery = useStudent(idParam);
  const updateStudent = useUpdateStudent(idParam as string);

  const [draft, setDraft] = useState<Draft>(INITIAL);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (studentQuery.data && !initialized) {
      const s = studentQuery.data;
      setDraft({
        fullName: `${s.firstName} ${s.lastName}`.trim(),
        username: s.username ?? '',

        grade: s.grade,
        startDate: s.startDate ?? '',
        status: s.status,
        isAccountActive: true,
        defaultLanguage: (s as any).defaultLanguage ?? 'cpp',
        guardians: s.guardians.map((g) => ({
          fullName: g.fullName,
          relationship: g.relationship,
          phoneNumber: g.phoneNumber,
          isPrimary: g.isPrimary,
        })),
      });
      setInitialized(true);
    }
  }, [studentQuery.data, initialized]);

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

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!draft.fullName.trim()) e.fullName = t('pages.admin.studentCreate.validation.fullNameRequired');

    if (draft.grade < 1 || draft.grade > 9) e.grade = t('pages.admin.studentCreate.validation.gradeRange');
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function submit() {
    if (!validate()) return;
    const payload: IUpdateStudentPayload = {
      fullName: draft.fullName.trim(),
      username: draft.username.trim() || undefined,

      grade: draft.grade,
      startDate: draft.startDate || undefined,
      status: draft.status,
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
      await updateStudent.mutateAsync(payload);
      navigate(`${base}/students/${idParam}`);
    } catch (err) {
      const msg =
        (err as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
      const flat = Array.isArray(msg) ? msg.join(', ') : msg;
      setErrors({ submit: flat ?? (err as Error).message });
    }
  }

  if (studentQuery.isLoading || !initialized) {
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
        <Button variant="ghost" className="mt-md" onClick={() => navigate(`${base}/students`)}>
          {t('pages.admin.studentProfile.backToDirectory')}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-lg max-w-4xl mx-auto pb-[80px]">
      <PageHeader
        breadcrumb={
          <Breadcrumb
            items={[
              { label: t('nav.admin.students'), onClick: () => navigate(`${base}/students`) },
              { label: `${studentQuery.data.firstName} ${studentQuery.data.lastName}`, onClick: () => navigate(`${base}/students/${idParam}`) },
              { label: t('common.edit') },
            ]}
          />
        }
        title={t('pages.admin.studentProfile.edit')}
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
              <button
                type="button"
                onClick={() => removeGuardian(i)}
                className="absolute top-sm right-sm p-1 rounded text-on-surface-variant hover:text-error"
                aria-label={t('common.delete')}
              >
                <Icon name="close" size={18} />
              </button>
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
      <div className="sticky bottom-0 bg-surface/95 backdrop-blur-md border-t border-outline-variant flex items-center justify-between gap-sm py-sm px-md -mx-md md:-mx-lg lg:-mx-xl z-20">
        <Button
          variant="ghost"
          leadingIcon={<Icon name="arrow_back" size={18} />}
          onClick={() => navigate(`${base}/students/${idParam}`)}
          disabled={updateStudent.isPending}
        >
          {t('common.cancel')}
        </Button>
        <Button
          variant="admin"
          trailingIcon={
            updateStudent.isPending ? (
              <Icon name="progress_activity" size={18} className="animate-spin" />
            ) : (
              <Icon name="check" size={18} />
            )
          }
          onClick={submit}
          disabled={updateStudent.isPending}
        >
          {t('common.save')}
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
