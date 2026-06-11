import { useState } from 'react';
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
  ICreateClassPayload,
} from '@cp/shared';

import { useCreateClass } from '../../../api/class.queries';
import { usePortalBase } from '../../../hooks/usePortalBase';

type Draft = {
  name: string;
  code: string;
  description: string;
};

const INITIAL_DRAFT: Draft = {
  name: '',
  code: '',
  description: '',
};

/**
 * Class Create — posts the `ICreateClassPayload` to `POST /api/classes`.
 */
export default function ClassCreatePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const base = usePortalBase();

  const [draft, setDraft] = useState<Draft>(INITIAL_DRAFT);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const createClass = useCreateClass();
  const submitting = createClass.isPending;

  function patch(p: Partial<Draft>) {
    setDraft((prev) => ({ ...prev, ...p }));
  }

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!draft.name.trim()) e.name = t('pages.admin.classes.create.validation.nameRequired');
    if (!draft.code.trim()) e.code = t('pages.admin.classes.create.validation.codeRequired');
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function previous() {
    navigate(`${base}/classes`);
  }

  async function submit() {
    if (!validate()) return;
    const payload: ICreateClassPayload = {
      name: draft.name.trim(),
      code: draft.code.trim(),
      description: draft.description || undefined,
    };
    try {
      const created = await createClass.mutateAsync(payload);
      navigate(`${base}/classes/${created.id}`);
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
              { label: t('nav.admin.classes'), onClick: () => navigate(`${base}/classes`) },
              { label: t('pages.admin.classes.create.title') },
            ]}
          />
        }
        title={t('pages.admin.classes.create.title')}
        subtitle={t('pages.admin.classes.create.subtitle')}
      />

      <div className="bg-surface-container-lowest border border-outline-variant/50 rounded-xl p-md md:p-lg">
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
          {t('pages.admin.classes.create.actions.cancel')}
        </Button>
        <Button
          variant="admin"
          trailingIcon={
            submitting ? (
              <Icon name="progress_activity" size={18} className="animate-spin" />
            ) : (
              <Icon name="check" size={18} />
            )
          }
          onClick={() => void submit()}
          disabled={submitting}
        >
          {t('pages.admin.classes.create.actions.createClass')}
        </Button>
      </div>
    </div>
  );
}
