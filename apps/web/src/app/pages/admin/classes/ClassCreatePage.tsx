import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Breadcrumb,
  Button,
  FormField,
  Icon,
  PageHeader,
  SelectFilter,
  WizardSteps,
} from '@cp/ui';
import {
  DayOfWeek,
  ICreateClassPayload,
} from '@cp/shared';

import { useCreateClass } from '../../../api/class.queries';

type SessionDraft = {
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  room: string;
};

type Draft = {
  name: string;
  code: string;
  description: string;
  term: string;
  capacity: number;
  sessions: SessionDraft[];
};

const INITIAL_DRAFT: Draft = {
  name: '',
  code: '',
  description: '',
  term: '',
  capacity: 30,
  sessions: [
    { dayOfWeek: DayOfWeek.MON, startTime: '09:00', endTime: '10:30', room: '' },
  ],
};

/**
 * Class Create — 3-step wizard.
 *   1. Basics (name · code · department · description)
 *   2. Schedule (one or more weekly sessions: day/start/end/room)
 *   3. Capacity & instructor
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
      { key: 'schedule', label: t('pages.admin.classes.create.steps.schedule') },
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
      if (draft.sessions.length === 0) {
        e.sessions = t('pages.admin.classes.create.validation.sessionMin');
      } else {
        for (let i = 0; i < draft.sessions.length; i++) {
          const s = draft.sessions[i];
          if (s.startTime >= s.endTime) {
            e[`sessions.${i}.time`] = t('pages.admin.classes.create.validation.timeOrder');
          }
        }
      }
    }
    if (idx === 2) {
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
      sessions: draft.sessions.map((s) => ({
        dayOfWeek: s.dayOfWeek,
        startTime: s.startTime,
        endTime: s.endTime,
        room: s.room || undefined,
      })),
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

  function addSession() {
    setDraft((prev) => ({
      ...prev,
      sessions: [
        ...prev.sessions,
        { dayOfWeek: DayOfWeek.WED, startTime: '09:00', endTime: '10:30', room: '' },
      ],
    }));
  }

  function updateSession(idx: number, p: Partial<SessionDraft>) {
    setDraft((prev) => ({
      ...prev,
      sessions: prev.sessions.map((s, i) => (i === idx ? { ...s, ...p } : s)),
    }));
  }

  function removeSession(idx: number) {
    setDraft((prev) => ({
      ...prev,
      sessions: prev.sessions.filter((_, i) => i !== idx),
    }));
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
          <div className="flex flex-col gap-md">
            <header className="flex items-center justify-between">
              <h3 className="font-manrope text-headline-md text-on-surface">
                {t('pages.admin.classes.create.fields.sessions')}
              </h3>
              <Button
                variant="ghost"
                size="sm"
                leadingIcon={<Icon name="add" size={16} />}
                onClick={addSession}
              >
                {t('pages.admin.classes.create.fields.addSession')}
              </Button>
            </header>

            {errors.sessions && <div className="text-[12px] text-error">{errors.sessions}</div>}

            <div className="flex flex-col gap-sm">
              {draft.sessions.map((s, i) => (
                <div
                  key={i}
                  className="grid grid-cols-1 md:grid-cols-[120px_1fr_1fr_1fr_auto] gap-sm items-end p-sm rounded-lg bg-surface-container-low border border-outline-variant/40"
                >
                  <FormField label={t('pages.admin.classes.create.fields.day')}>
                    <select
                      value={s.dayOfWeek}
                      onChange={(e) => updateSession(i, { dayOfWeek: e.target.value as DayOfWeek })}
                      className="bg-surface-container-lowest border border-outline-variant rounded-md px-sm py-xs"
                    >
                      {Object.values(DayOfWeek).map((d) => (
                        <option key={d} value={d}>
                          {t(`enums.dayOfWeek.${d}`)}
                        </option>
                      ))}
                    </select>
                  </FormField>
                  <FormField label={t('pages.admin.classes.create.fields.startTime')}>
                    <input
                      type="time"
                      value={s.startTime}
                      onChange={(e) => updateSession(i, { startTime: e.target.value })}
                      className="bg-surface-container-lowest border border-outline-variant rounded-md px-sm py-xs"
                    />
                  </FormField>
                  <FormField
                    label={t('pages.admin.classes.create.fields.endTime')}
                    error={errors[`sessions.${i}.time`]}
                  >
                    <input
                      type="time"
                      value={s.endTime}
                      onChange={(e) => updateSession(i, { endTime: e.target.value })}
                      className="bg-surface-container-lowest border border-outline-variant rounded-md px-sm py-xs"
                    />
                  </FormField>
                  <FormField label={t('pages.admin.classes.create.fields.sessionRoom')}>
                    <input
                      type="text"
                      value={s.room}
                      onChange={(e) => updateSession(i, { room: e.target.value })}
                      placeholder={t('pages.admin.classes.create.fields.roomPh')}
                      className="bg-surface-container-lowest border border-outline-variant rounded-md px-sm py-xs"
                    />
                  </FormField>
                  <button
                    type="button"
                    onClick={() => removeSession(i)}
                    className="p-1 rounded text-on-surface-variant hover:text-error"
                    aria-label={t('pages.admin.classes.create.fields.removeSession')}
                  >
                    <Icon name="delete" size={20} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
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

      {/* Submit error from the API (e.g. duplicate code, missing instructor) */}
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
