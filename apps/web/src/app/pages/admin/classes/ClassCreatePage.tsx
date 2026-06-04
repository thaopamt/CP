import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Breadcrumb,
  Button,
  FormField,
  Icon,
  PageHeader,
  WizardSteps,
} from '@cp/ui';
import {
  ICreateClassPayload,
} from '@cp/shared';

import { useCreateClass } from '../../../api/class.queries';

type Draft = {
  name: string;
  code: string;
  description: string;
  term: string;
  capacity: number;
};

const INITIAL_DRAFT: Draft = {
  name: '',
  code: '',
  description: '',
  term: '',
  capacity: 30,
};

/**
 * Class Create — 2-step wizard.
 *   1. Basics (name · code · department · description)
 *   2. Capacity & term
 *
 * On submit, posts the `ICreateClassPayload` to `POST /api/classes`
 * (currently mocked — wire via apiClient when backend is reachable).
 */
export default function ClassCreatePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const steps = useMemo(
    () => [
      { key: 'basics', label: t('pages.admin.classes.create.steps.basics') },
      { key: 'capacity', label: t('pages.admin.classes.create.steps.capacity') },
    ],
    [t],
  );

  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Draft>(INITIAL_DRAFT);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const createClass = useCreateClass();
  const submitting = createClass.isPending;

  function patch(p: Partial<Draft>) {
    setDraft((prev) => ({ ...prev, ...p }));
  }

  function validateStep(idx: number): boolean {
    const e: Record<string, string> = {};
    if (idx === 0) {
      if (!draft.name.trim()) e.name = t('pages.admin.classes.create.validation.nameRequired');
      if (!draft.code.trim()) e.code = t('pages.admin.classes.create.validation.codeRequired');
    }
    if (idx === 1) {
      if (draft.capacity < 1) e.capacity = t('pages.admin.classes.create.validation.capacityRange');
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function next() {
    if (!validateStep(step)) return;
    if (step < steps.length - 1) setStep(step + 1);
    else void submit();
  }

  function previous() {
    if (step === 0) navigate('/admin/classes');
    else setStep(step - 1);
  }

  async function submit() {
    if (!validateStep(step)) return;
    const payload: ICreateClassPayload = {
      name: draft.name.trim(),
      code: draft.code.trim(),
      description: draft.description || undefined,
      capacity: draft.capacity,
      term: draft.term,
    };
    try {
      const created = await createClass.mutateAsync(payload);
      navigate(`/admin/classes/${created.id}`);
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
              { label: t('nav.admin.classes'), onClick: () => navigate('/admin/classes') },
              { label: t('pages.admin.classes.create.title') },
            ]}
          />
        }
        title={t('pages.admin.classes.create.title')}
        subtitle={t('pages.admin.classes.create.subtitle')}
      />

      <div className="bg-surface-container-lowest border border-outline-variant/50 rounded-xl p-md md:p-lg">
        <WizardSteps steps={steps} current={step} className="mb-lg" />

        {step === 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
            <FormField
              label={t('pages.admin.classes.create.fields.name')}
              required
              error={errors.name}
              className="md:col-span-2"
            >
              <input
                type="text"
                value={draft.name}
                onChange={(e) => patch({ name: e.target.value })}
                placeholder={t('pages.admin.classes.create.fields.namePh')}
                className="bg-surface-container-low border border-outline-variant rounded-lg px-md py-sm focus:ring-2 focus:ring-primary outline-none"
              />
            </FormField>

            <FormField
              label={t('pages.admin.classes.create.fields.code')}
              required
              error={errors.code}
            >
              <input
                type="text"
                value={draft.code}
                onChange={(e) => patch({ code: e.target.value })}
                placeholder={t('pages.admin.classes.create.fields.codePh')}
                className="bg-surface-container-low border border-outline-variant rounded-lg px-md py-sm focus:ring-2 focus:ring-primary outline-none"
              />
            </FormField>



            <FormField
              label={t('pages.admin.classes.create.fields.description')}
              className="md:col-span-2"
            >
              <textarea
                rows={4}
                value={draft.description}
                onChange={(e) => patch({ description: e.target.value })}
                placeholder={t('pages.admin.classes.create.fields.descriptionPh')}
                className="bg-surface-container-low border border-outline-variant rounded-lg px-md py-sm focus:ring-2 focus:ring-primary outline-none resize-none"
              />
            </FormField>
          </div>
        )}

        {step === 1 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
            <FormField
              label={t('pages.admin.classes.create.fields.capacity')}
              required
              error={errors.capacity}
            >
              <input
                type="number"
                min={1}
                value={draft.capacity}
                onChange={(e) => patch({ capacity: Number(e.target.value) || 0 })}
                className="bg-surface-container-low border border-outline-variant rounded-lg px-md py-sm focus:ring-2 focus:ring-primary outline-none"
              />
            </FormField>

            <FormField label={t('pages.admin.classes.create.fields.term')} required>
              <input
                type="text"
                value={draft.term}
                onChange={(e) => patch({ term: e.target.value })}
                placeholder={t('pages.admin.classes.create.fields.termPh')}
                className="bg-surface-container-low border border-outline-variant rounded-lg px-md py-sm focus:ring-2 focus:ring-primary outline-none"
              />
            </FormField>


          </div>
        )}
      </div>

      {/* Submit error from the API (e.g. duplicate code) */}
      {errors.submit && (
        <div className="bg-error-container/60 text-on-error-container rounded-md px-md py-sm text-label-sm">
          {errors.submit}
        </div>
      )}

      {/* Sticky footer nav */}
      <div className="sticky bottom-0 bg-surface/95 backdrop-blur-md border-t border-outline-variant flex items-center justify-between gap-sm py-sm px-md -mx-md md:-mx-lg lg:-mx-xl">
        <Button
          variant="ghost"
          leadingIcon={<Icon name="arrow_back" size={18} />}
          onClick={previous}
          disabled={submitting}
        >
          {step === 0 ? t('pages.admin.classes.create.actions.cancel') : t('pages.admin.classes.create.actions.previous')}
        </Button>
        <Button
          variant="admin"
          trailingIcon={
            submitting ? (
              <Icon name="progress_activity" size={18} className="animate-spin" />
            ) : step === steps.length - 1 ? (
              <Icon name="check" size={18} />
            ) : (
              <Icon name="arrow_forward" size={18} />
            )
          }
          onClick={next}
          disabled={submitting}
        >
          {step === steps.length - 1
            ? t('pages.admin.classes.create.actions.createClass')
            : t('pages.admin.classes.create.actions.next')}
        </Button>
      </div>
    </div>
  );
}
