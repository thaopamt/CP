import { useEffect, useState } from 'react';
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
  ICreateClassPayload,
} from '@cp/shared';

import { useClass, useUpdateClass } from '../../../api/class.queries';

type Draft = {
  name: string;
  code: string;
  description: string;
};

/**
 * Class Edit — pre-populated with the existing class data. On submit PATCHes
 * the class and navigates back to its detail page.
 */
export default function ClassEditPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { classId } = useParams<{ classId: string }>();

  const classQuery = useClass(classId);
  const updateClass = useUpdateClass(classId ?? '');
  const submitting = updateClass.isPending;

  const [draft, setDraft] = useState<Draft | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Pre-populate the form from the existing class data (runs once)
  useEffect(() => {
    if (classQuery.data && !draft) {
      const cls = classQuery.data;
      setDraft({
        name: cls.name,
        code: cls.code,
        description: cls.description ?? '',
      });
    }
  }, [classQuery.data, draft]);

  // Loading state
  if (classQuery.isLoading || !draft) {
    return (
      <div className="grid place-items-center min-h-[40vh] text-on-surface-variant">
        <span className="material-symbols-outlined animate-spin text-3xl">progress_activity</span>
      </div>
    );
  }

  if (classQuery.isError) {
    return (
      <div className="grid place-items-center min-h-[40vh] text-center">
        <Icon name="error" size={36} className="mb-sm text-error" />
        <p className="text-body-md text-on-surface">
          {(classQuery.error as Error | undefined)?.message ?? t('common.notFound')}
        </p>
        <Button variant="ghost" className="mt-md" onClick={() => navigate('/admin/classes')}>
          {t('pages.admin.classes.detail.backToClasses')}
        </Button>
      </div>
    );
  }

  function patch(p: Partial<Draft>) {
    setDraft((prev) => (prev ? { ...prev, ...p } : prev));
  }

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!draft!.name.trim()) e.name = t('pages.admin.classes.create.validation.nameRequired');
    if (!draft!.code.trim()) e.code = t('pages.admin.classes.create.validation.codeRequired');
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function previous() {
    navigate(`/admin/classes/${classId}`);
  }

  async function submit() {
    if (!validate()) return;
    const payload: Partial<ICreateClassPayload> = {
      name: draft!.name.trim(),
      code: draft!.code.trim(),
      description: draft!.description || undefined,
    };
    try {
      await updateClass.mutateAsync(payload);
      navigate(`/admin/classes/${classId}`);
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
              { label: draft.name, onClick: () => navigate(`/admin/classes/${classId}`) },
              { label: t('pages.admin.classes.edit.title') },
            ]}
          />
        }
        title={t('pages.admin.classes.edit.title')}
        subtitle={t('pages.admin.classes.edit.subtitle')}
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

      {/* Submit error from the API */}
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
          {t('pages.admin.classes.edit.actions.cancel')}
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
          {t('pages.admin.classes.edit.actions.saveChanges')}
        </Button>
      </div>
    </div>
  );
}
