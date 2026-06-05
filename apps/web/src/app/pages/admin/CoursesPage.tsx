import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Breadcrumb, Button, Icon, MetaChip, ModuleItem, PageHeader, StatusBadge } from '@cp/ui';
import { IModule, LessonType } from '@cp/shared';

export default function AdminCoursesPage() {
  const { t } = useTranslation();

  const initialModules: IModule[] = useMemo(
    () => [
      {
        id: 'mod-1',
        index: 1,
        title: t('pages.admin.courses.modules.foundations'),
        lessons: [
          { id: 'l1', title: t('pages.admin.courses.lessons.welcome'), type: LessonType.VIDEO, durationMin: 8 },
          { id: 'l2', title: t('pages.admin.courses.lessons.cellSystem'), type: LessonType.READING, durationMin: 25 },
          { id: 'l3', title: t('pages.admin.courses.lessons.quizComponents'), type: LessonType.QUIZ, durationMin: 15 },
        ],
      },
      {
        id: 'mod-2',
        index: 2,
        title: t('pages.admin.courses.modules.genetics'),
        lessons: [
          { id: 'l4', title: t('pages.admin.courses.lessons.mendelian'), type: LessonType.VIDEO, durationMin: 18 },
          { id: 'l5', title: t('pages.admin.courses.lessons.punnett'), type: LessonType.ASSIGNMENT, durationMin: 30 },
        ],
      },
      {
        id: 'mod-3',
        index: 3,
        title: t('pages.admin.courses.modules.evolution'),
        lessons: [
          { id: 'l6', title: t('pages.admin.courses.lessons.naturalSelection'), type: LessonType.VIDEO, durationMin: 22 },
        ],
      },
    ],
    [t],
  );

  const [modules, setModules] = useState<IModule[]>(initialModules);
  const [prereqs, setPrereqs] = useState<string[]>([
    t('pages.admin.courses.prereqValues.algebra'),
    t('pages.admin.courses.prereqValues.labSafety'),
  ]);

  function addModule() {
    setModules((prev) => [
      ...prev,
      {
        id: `mod-${prev.length + 1}`,
        index: prev.length + 1,
        title: t('pages.admin.courses.curriculum.newModule'),
        lessons: [],
      },
    ]);
  }

  return (
    <div className="flex flex-col gap-lg">
      <PageHeader
        breadcrumb={
          <Breadcrumb
            items={[
              { label: t('pages.admin.courses.breadcrumb.curriculum'), onClick: () => undefined },
              { label: t('pages.admin.courses.breadcrumb.dept'), onClick: () => undefined },
              { label: t('pages.admin.courses.breadcrumb.course') },
            ]}
          />
        }
        eyebrow={<StatusBadge tone="warning">{t('enums.courseStatus.DRAFT')}</StatusBadge>}
        title={t('pages.admin.courses.breadcrumb.course')}
        actions={
          <>
            <Button variant="ghost" leadingIcon={<Icon name="visibility" size={18} />}>
              {t('common.preview')}
            </Button>
            <Button variant="admin" leadingIcon={<Icon name="rocket_launch" size={18} />}>
              {t('common.publish')}
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-md">
        <aside className="flex flex-col gap-md">
          <div className="relative bg-surface-container-low rounded-xl border border-outline-variant/50 overflow-hidden aspect-video grid place-items-center">
            <Icon name="image" size={48} className="text-on-surface-variant opacity-40" />
            <button
              type="button"
              className="absolute bottom-sm right-sm bg-surface/80 backdrop-blur-sm border border-outline-variant rounded-lg px-md py-xs text-label-sm font-semibold text-on-surface flex items-center gap-xs hover:bg-surface"
            >
              <Icon name="edit" size={16} />
              {t('pages.admin.courses.coverChange')}
            </button>
          </div>

          <div className="bg-surface-container-lowest border border-outline-variant/50 rounded-xl p-md">
            <h3 className="font-manrope text-headline-md text-on-surface mb-sm">
              {t('pages.admin.courses.details')}
            </h3>
            <p className="text-body-md text-on-surface-variant mb-md">
              {t('pages.admin.courses.description')}
            </p>
            <dl className="grid grid-cols-2 gap-sm text-label-sm">
              <Meta icon="person" label={t('pages.admin.courses.meta.instructor')} value={t('pages.admin.courses.meta.instructorValue')} />
              <Meta icon="groups" label={t('pages.admin.courses.meta.enrolled')} value={t('pages.admin.courses.meta.enrolledValue')} />
            </dl>
          </div>

          <div className="bg-surface-container-lowest border border-outline-variant/50 rounded-xl p-md">
            <header className="flex items-center justify-between mb-sm">
              <h3 className="font-manrope text-headline-md text-on-surface">
                {t('pages.admin.courses.prereqs.title')}
              </h3>
              <button
                type="button"
                className="text-primary text-label-sm font-semibold hover:underline"
                onClick={() => setPrereqs((p) => [...p, ''])}
              >
                {t('pages.admin.courses.prereqs.add')}
              </button>
            </header>
            <div className="flex flex-wrap gap-xs">
              {prereqs.map((p, i) => (
                <MetaChip key={`${p}-${i}`} onRemove={() => setPrereqs((prev) => prev.filter((_, idx) => idx !== i))}>
                  {p}
                </MetaChip>
              ))}
            </div>
          </div>
        </aside>

        <section className="lg:col-span-2 bg-surface-container-lowest border border-outline-variant/50 rounded-xl p-md">
          <header className="flex items-center justify-between mb-md">
            <div>
              <h3 className="font-manrope text-headline-md text-on-surface">
                {t('pages.admin.courses.curriculum.title')}
              </h3>
              <p className="text-label-sm text-on-surface-variant">
                {t('pages.admin.courses.curriculum.subtitle')}
              </p>
            </div>
            <Button variant="admin" size="sm" leadingIcon={<Icon name="add" size={16} />} onClick={addModule}>
              {t('pages.admin.courses.curriculum.addModule')}
            </Button>
          </header>

          <div className="flex flex-col gap-md">
            {modules.map((m) => (
              <ModuleItem key={m.id} module={m} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function Meta({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex items-start gap-sm">
      <Icon name={icon} size={18} className="text-primary mt-0.5" />
      <div>
        <div className="text-on-surface-variant text-[12px]">{label}</div>
        <div className="text-on-surface font-semibold">{value}</div>
      </div>
    </div>
  );
}
