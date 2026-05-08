import { ReactNode, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Breadcrumb,
  Button,
  FormField,
  Icon,
  PageHeader,
  SelectFilter,
} from '@cp/ui';
import {
  ENROLLMENT_STATUS_LABEL,
  EnrollmentStatus,
  GENDER_LABEL,
  Gender,
  GUARDIAN_RELATIONSHIP_LABEL,
  GuardianRelationship,
  ICreateStudentPayload,
  IGuardianInput,
} from '@cp/shared';

import { useCreateStudent } from '../../../api/student.queries';

type Draft = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  studentId: string;
  dateOfBirth: string;
  gender: Gender;
  homeAddress: string;
  grade: number;
  cohortYear: number;
  startDate: string;
  status: EnrollmentStatus;
  isAccountActive: boolean;
  guardians: IGuardianInput[];
};

const INITIAL: Draft = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  studentId: '',
  dateOfBirth: '',
  gender: Gender.UNDISCLOSED,
  homeAddress: '',
  grade: 9,
  cohortYear: new Date().getFullYear() + 4,
  startDate: '',
  status: EnrollmentStatus.ACTIVE,
  isAccountActive: true,
  guardians: [
    { fullName: '', relationship: GuardianRelationship.GUARDIAN, phoneNumber: '', email: '', isPrimary: true },
  ],
};

export default function StudentCreatePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
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
        { fullName: '', relationship: GuardianRelationship.GUARDIAN, phoneNumber: '', email: '', isPrimary: false },
      ],
    }));
  }

  function removeGuardian(idx: number) {
    setDraft((prev) => ({
      ...prev,
      guardians: prev.guardians.filter((_, i) => i !== idx),
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
    if (!draft.firstName.trim()) e.firstName = t('pages.admin.studentCreate.validation.firstNameRequired');
    if (!draft.lastName.trim()) e.lastName = t('pages.admin.studentCreate.validation.lastNameRequired');
    if (!draft.email.trim()) e.email = t('pages.admin.studentCreate.validation.emailRequired');
    if (!draft.password.trim() || draft.password.length < 6)
      e.password = t('pages.admin.studentCreate.validation.passwordMin');
    if (!draft.dateOfBirth) e.dateOfBirth = t('pages.admin.studentCreate.validation.dobRequired');
    if (draft.grade < 1 || draft.grade > 13) e.grade = t('pages.admin.studentCreate.validation.gradeRange');
    draft.guardians.forEach((g, i) => {
      if (!g.fullName.trim()) e[`g.${i}.fullName`] = t('pages.admin.studentCreate.validation.guardianNameRequired');
      if (!g.phoneNumber.trim()) e[`g.${i}.phone`] = t('pages.admin.studentCreate.validation.guardianPhoneRequired');
    });
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function submit() {
    if (!validate()) return;
    const payload: ICreateStudentPayload = {
      firstName: draft.firstName.trim(),
      lastName: draft.lastName.trim(),
      email: draft.email.trim(),
      password: draft.password,
      studentId: draft.studentId.trim() || undefined,
      dateOfBirth: draft.dateOfBirth || undefined,
      gender: draft.gender,
      homeAddress: draft.homeAddress.trim() || undefined,
      grade: draft.grade,
      cohortYear: draft.cohortYear,
      startDate: draft.startDate || undefined,
      status: draft.status,
      guardians: draft.guardians
        .filter((g) => g.fullName.trim())
        .map((g) => ({
          fullName: g.fullName.trim(),
          relationship: g.relationship,
          phoneNumber: g.phoneNumber.trim(),
          email: g.email?.trim() || undefined,
          isPrimary: g.isPrimary ?? false,
        })),
    };
    try {
      const created = await createStudent.mutateAsync(payload);
      navigate(`/admin/students/${created.id}`);
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
              { label: t('nav.admin.students'), onClick: () => navigate('/admin/students') },
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
            label={t('pages.admin.studentCreate.fields.firstName')}
            required
            error={errors.firstName}
          >
            <input
              type="text"
              value={draft.firstName}
              onChange={(e) => patch({ firstName: e.target.value })}
              className="bg-surface-container-low border border-outline-variant rounded-lg px-md py-sm focus:ring-2 focus:ring-primary outline-none"
            />
          </FormField>
          <FormField
            label={t('pages.admin.studentCreate.fields.lastName')}
            required
            error={errors.lastName}
          >
            <input
              type="text"
              value={draft.lastName}
              onChange={(e) => patch({ lastName: e.target.value })}
              className="bg-surface-container-low border border-outline-variant rounded-lg px-md py-sm focus:ring-2 focus:ring-primary outline-none"
            />
          </FormField>
          <FormField
            label={t('pages.admin.studentCreate.fields.email')}
            required
            error={errors.email}
            className="md:col-span-2"
          >
            <input
              type="email"
              value={draft.email}
              onChange={(e) => patch({ email: e.target.value })}
              className="bg-surface-container-low border border-outline-variant rounded-lg px-md py-sm focus:ring-2 focus:ring-primary outline-none"
            />
          </FormField>
          <FormField
            label={t('pages.admin.studentCreate.fields.dateOfBirth')}
            required
            error={errors.dateOfBirth}
          >
            <input
              type="date"
              value={draft.dateOfBirth}
              onChange={(e) => patch({ dateOfBirth: e.target.value })}
              className="bg-surface-container-low border border-outline-variant rounded-lg px-md py-sm focus:ring-2 focus:ring-primary outline-none"
            />
          </FormField>
          <SelectFilter
            label={t('pages.admin.studentCreate.fields.gender')}
            value={draft.gender}
            onChange={(e) => patch({ gender: e.target.value as Gender })}
            options={Object.values(Gender).map((g) => ({
              value: g,
              label: GENDER_LABEL[g],
            }))}
          />
          <FormField
            label={t('pages.admin.studentCreate.fields.address')}
            className="md:col-span-2"
          >
            <textarea
              rows={2}
              value={draft.homeAddress}
              onChange={(e) => patch({ homeAddress: e.target.value })}
              className="bg-surface-container-low border border-outline-variant rounded-lg px-md py-sm focus:ring-2 focus:ring-primary outline-none resize-none"
            />
          </FormField>
        </div>
      </FormSection>

      {/* Section 2: Account credentials */}
      <FormSection icon="vpn_key" title={t('pages.admin.studentCreate.sections.account')}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
          <FormField
            label={t('pages.admin.studentCreate.fields.studentId')}
            hint={t('pages.admin.studentCreate.fields.studentIdHint')}
          >
            <input
              type="text"
              value={draft.studentId}
              onChange={(e) => patch({ studentId: e.target.value })}
              placeholder="STU-2024-…"
              className="bg-surface-container-low border border-outline-variant rounded-lg px-md py-sm focus:ring-2 focus:ring-primary outline-none font-mono text-[13px]"
            />
          </FormField>
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
          <SelectFilter
            label={t('pages.admin.studentCreate.fields.accountStatus')}
            value={draft.status}
            onChange={(e) => patch({ status: e.target.value as EnrollmentStatus })}
            options={[
              { value: EnrollmentStatus.ACTIVE, label: ENROLLMENT_STATUS_LABEL[EnrollmentStatus.ACTIVE] },
              { value: EnrollmentStatus.PENDING, label: ENROLLMENT_STATUS_LABEL[EnrollmentStatus.PENDING] },
              { value: EnrollmentStatus.INACTIVE, label: ENROLLMENT_STATUS_LABEL[EnrollmentStatus.INACTIVE] },
            ]}
          />
        </div>
      </FormSection>

      {/* Section 3: Enrollment */}
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
              {[9, 10, 11, 12].map((g) => (
                <option key={g} value={g}>
                  {t('pages.admin.students.gradeOptions.g' + g)}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label={t('pages.admin.studentCreate.fields.cohortYear')}>
            <input
              type="number"
              min={2000}
              max={2100}
              value={draft.cohortYear}
              onChange={(e) => patch({ cohortYear: Number(e.target.value) || 0 })}
              className="bg-surface-container-low border border-outline-variant rounded-lg px-md py-sm focus:ring-2 focus:ring-primary outline-none"
            />
          </FormField>
          <FormField label={t('pages.admin.studentCreate.fields.startDate')}>
            <input
              type="date"
              value={draft.startDate}
              onChange={(e) => patch({ startDate: e.target.value })}
              className="bg-surface-container-low border border-outline-variant rounded-lg px-md py-sm focus:ring-2 focus:ring-primary outline-none"
            />
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
                required
                error={errors[`g.${i}.fullName`]}
              >
                <input
                  type="text"
                  value={g.fullName}
                  onChange={(e) => patchGuardian(i, { fullName: e.target.value })}
                  className="bg-surface-container-lowest border border-outline-variant rounded-md px-md py-sm focus:ring-2 focus:ring-primary outline-none"
                />
              </FormField>
              <SelectFilter
                label={t('pages.admin.studentCreate.fields.relationship')}
                value={g.relationship}
                onChange={(e) => patchGuardian(i, { relationship: e.target.value as GuardianRelationship })}
                options={Object.values(GuardianRelationship).map((r) => ({
                  value: r,
                  label: GUARDIAN_RELATIONSHIP_LABEL[r],
                }))}
              />
              <FormField
                label={t('pages.admin.studentCreate.fields.guardianPhone')}
                required
                error={errors[`g.${i}.phone`]}
              >
                <input
                  type="tel"
                  value={g.phoneNumber}
                  onChange={(e) => patchGuardian(i, { phoneNumber: e.target.value })}
                  className="bg-surface-container-lowest border border-outline-variant rounded-md px-md py-sm focus:ring-2 focus:ring-primary outline-none"
                />
              </FormField>
              <FormField label={t('pages.admin.studentCreate.fields.guardianEmail')}>
                <input
                  type="email"
                  value={g.email ?? ''}
                  onChange={(e) => patchGuardian(i, { email: e.target.value })}
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
          onClick={() => navigate('/admin/students')}
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
