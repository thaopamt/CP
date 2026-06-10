import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Icon } from '@cp/ui';
import {
  ICreateQuestPayload,
  IQuestObjectiveConfig,
  QUEST_OBJECTIVE_META,
  QuestObjectiveType,
  QuestRecurrence,
  QuestStatus,
  QuestType,
} from '@cp/shared';
import { useQuestOptions } from '../../../api/quests.queries';
import { useBadges } from '../../../api/badges.queries';
import { useClassesList } from '../../../api/class.queries';

const QUEST_TYPE_CONFIG: Record<QuestType, { icon: string; color: string }> = {
  [QuestType.DAILY]: { icon: 'today', color: 'text-emerald-400' },
  [QuestType.WEEKLY]: { icon: 'date_range', color: 'text-sky-400' },
  [QuestType.MAIN]: { icon: 'auto_stories', color: 'text-cyan-400' },
  [QuestType.BOUNTY]: { icon: 'local_fire_department', color: 'text-orange-400' },
  [QuestType.EVENT]: { icon: 'celebration', color: 'text-fuchsia-400' },
};

const SUGGESTED_ICONS = [
  'military_tech', 'code', 'terminal', 'bug_report', 'rocket_launch',
  'psychology', 'school', 'emoji_events', 'star', 'bolt',
  'timer', 'trending_up', 'analytics', 'science', 'calculate',
];

const DIFFICULTIES: Array<'EASY' | 'MEDIUM' | 'HARD'> = ['EASY', 'MEDIUM', 'HARD'];

const inputCls =
  'h-[42px] px-sm bg-surface-container-highest border border-outline-variant rounded-md text-body-md focus:ring-2 focus:ring-primary outline-none transition-shadow w-full';

/** Convert a stored ISO string to the value a datetime-local input expects. */
function isoToLocalInput(iso?: string | null): string {
  if (!iso) return '';
  return iso.slice(0, 16);
}

/** Convert a datetime-local input value back into an ISO string (or null). */
function localInputToIso(value: string): string | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

interface QuestFormProps {
  defaultValues?: Partial<ICreateQuestPayload>;
  onSubmit: (data: ICreateQuestPayload) => void;
  isLoading?: boolean;
}

export function QuestForm({ defaultValues, onSubmit, isLoading }: QuestFormProps) {
  const { t } = useTranslation();

  const { data: questOptions } = useQuestOptions();
  const { data: badgesData } = useBadges();
  const { data: classesData } = useClassesList({ page: 1, limit: 100 });
  const badges = badgesData?.data ?? [];
  const classes = classesData?.items ?? [];

  const [formData, setFormData] = useState<ICreateQuestPayload>({
    title: defaultValues?.title ?? '',
    description: defaultValues?.description ?? '',
    type: defaultValues?.type ?? QuestType.DAILY,
    status: defaultValues?.status ?? QuestStatus.PUBLISHED,
    objectiveType: defaultValues?.objectiveType ?? QuestObjectiveType.SUBMIT_ACCEPTED,
    objectiveConfig: defaultValues?.objectiveConfig ?? {},
    targetCount: defaultValues?.targetCount ?? 1,
    rewardXp: defaultValues?.rewardXp ?? 50,
    rewardGems: defaultValues?.rewardGems ?? 10,
    rewardBadgeId: defaultValues?.rewardBadgeId ?? null,
    icon: defaultValues?.icon ?? 'military_tech',
    category: defaultValues?.category ?? '',
    sortOrder: defaultValues?.sortOrder ?? 0,
    recurrence: defaultValues?.recurrence ?? QuestRecurrence.NONE,
    startsAt: defaultValues?.startsAt ?? null,
    endsAt: defaultValues?.endsAt ?? null,
    prerequisiteQuestId: defaultValues?.prerequisiteQuestId ?? null,
    classIds: defaultValues?.classIds ?? [],
    isActive: defaultValues?.isActive ?? true,
  });

  const handleChange = <K extends keyof ICreateQuestPayload>(field: K, value: ICreateQuestPayload[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleConfigChange = <K extends keyof IQuestObjectiveConfig>(field: K, value: IQuestObjectiveConfig[K]) => {
    setFormData((prev) => ({ ...prev, objectiveConfig: { ...(prev.objectiveConfig ?? {}), [field]: value } }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const meta = QUEST_OBJECTIVE_META[formData.objectiveType];
  const config = formData.objectiveConfig ?? {};
  const typeCfg = QUEST_TYPE_CONFIG[formData.type] ?? QUEST_TYPE_CONFIG[QuestType.DAILY];
  const unitLabel = t(`gamif.unit.${meta.unit}`);

  const classIds = formData.classIds ?? [];

  const idListText = (ids?: string[]) => (ids ?? []).join('\n');
  const parseIdList = (text: string): string[] =>
    text
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

  const objectiveTypes = useMemo(() => Object.values(QuestObjectiveType), []);

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* ── Section: Basics ── */}
      <fieldset>
        <legend className="font-manrope text-headline-md text-on-surface font-bold mb-md flex items-center gap-sm">
          <Icon name="info" size={20} className="text-primary" />
          {t('gamif.admin.form.sectionBasic')}
        </legend>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
          <div className="flex flex-col gap-1 md:col-span-2">
            <label className="text-label-sm font-semibold text-on-surface">{t('gamif.admin.form.questTitle')}</label>
            <input
              required
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder={t('gamif.admin.form.titlePlaceholder')}
              className={inputCls}
            />
          </div>

          <div className="flex flex-col gap-1 md:col-span-2">
            <label className="text-label-sm font-semibold text-on-surface">{t('gamif.admin.form.description')}</label>
            <textarea
              value={formData.description ?? ''}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder={t('gamif.admin.form.descriptionPlaceholder')}
              rows={3}
              className="px-sm py-xs bg-surface-container-highest border border-outline-variant rounded-md text-body-md focus:ring-2 focus:ring-primary outline-none resize-none transition-shadow"
            />
          </div>

          <div className="flex flex-col gap-1 md:col-span-2">
            <label className="text-label-sm font-semibold text-on-surface">{t('gamif.admin.form.questType')}</label>
            <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
              {Object.values(QuestType).map((type) => {
                const cfg = QUEST_TYPE_CONFIG[type];
                const isSelected = formData.type === type;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => handleChange('type', type)}
                    className={`flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all duration-200 ${
                      isSelected
                        ? 'border-primary bg-primary-container/30 shadow-sm'
                        : 'border-outline-variant/50 bg-surface-container-high hover:bg-surface-container-highest'
                    }`}
                  >
                    <Icon name={cfg.icon} size={20} className={isSelected ? cfg.color : 'text-on-surface-variant'} />
                    <span className={`text-[12px] font-bold ${isSelected ? 'text-on-surface' : 'text-on-surface-variant'}`}>
                      {t(`gamif.questType.${type}`)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-label-sm font-semibold text-on-surface">{t('gamif.admin.form.category')}</label>
            <input
              value={formData.category ?? ''}
              onChange={(e) => handleChange('category', e.target.value)}
              placeholder={t('gamif.admin.form.categoryPlaceholder')}
              className={inputCls}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-label-sm font-semibold text-on-surface">{t('gamif.admin.form.sortOrder')}</label>
            <input
              type="number"
              value={formData.sortOrder ?? 0}
              onChange={(e) => handleChange('sortOrder', Number(e.target.value))}
              className={inputCls}
            />
          </div>
        </div>
      </fieldset>

      {/* ── Section: Objective ── */}
      <fieldset>
        <legend className="font-manrope text-headline-md text-on-surface font-bold mb-md flex items-center gap-sm">
          <Icon name="flag" size={20} className="text-tertiary" />
          {t('gamif.admin.form.sectionObjective')}
        </legend>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
          <div className="flex flex-col gap-1 md:col-span-2">
            <label className="text-label-sm font-semibold text-on-surface">{t('gamif.admin.form.objectiveType')}</label>
            <select
              value={formData.objectiveType}
              onChange={(e) => handleChange('objectiveType', e.target.value as QuestObjectiveType)}
              className={`${inputCls} appearance-none`}
            >
              {objectiveTypes.map((ot) => (
                <option key={ot} value={ot}>
                  {t(`gamif.objective.${ot}`)}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-label-sm font-semibold text-on-surface flex items-center gap-1">
              {t('gamif.admin.form.targetCount')}
              <span className="text-on-surface-variant font-normal lowercase">({unitLabel})</span>
            </label>
            <input
              type="number"
              min={1}
              value={formData.targetCount}
              onChange={(e) => handleChange('targetCount', Math.max(1, Number(e.target.value)))}
              className={inputCls}
            />
          </div>

          {meta.needsDifficulty && (
            <div className="flex flex-col gap-1">
              <label className="text-label-sm font-semibold text-on-surface">{t('gamif.admin.form.difficulty')}</label>
              <select
                value={config.difficulty ?? 'MEDIUM'}
                onChange={(e) => handleConfigChange('difficulty', e.target.value as 'EASY' | 'MEDIUM' | 'HARD')}
                className={`${inputCls} appearance-none`}
              >
                {DIFFICULTIES.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          )}

          {meta.needsTag && (
            <div className="flex flex-col gap-1">
              <label className="text-label-sm font-semibold text-on-surface">{t('gamif.admin.form.tag')}</label>
              <input
                value={config.tag ?? ''}
                onChange={(e) => handleConfigChange('tag', e.target.value)}
                placeholder={t('gamif.admin.form.tagPlaceholder')}
                className={inputCls}
              />
            </div>
          )}

          {meta.needsAssignments && (
            <div className="flex flex-col gap-1 md:col-span-2">
              <label className="text-label-sm font-semibold text-on-surface">{t('gamif.admin.form.assignments')}</label>
              <textarea
                value={idListText(config.assignmentIds)}
                onChange={(e) => handleConfigChange('assignmentIds', parseIdList(e.target.value))}
                rows={3}
                placeholder="one assignment id per line"
                className="px-sm py-xs bg-surface-container-highest border border-outline-variant rounded-md text-body-sm font-mono focus:ring-2 focus:ring-primary outline-none resize-y transition-shadow"
              />
              <p className="text-[12px] text-on-surface-variant">{t('gamif.admin.form.assignmentsHint')}</p>
            </div>
          )}

          {meta.needsMazeLevels && (
            <div className="flex flex-col gap-1 md:col-span-2">
              <label className="text-label-sm font-semibold text-on-surface">{t('gamif.admin.form.mazeLevels')}</label>
              <textarea
                value={idListText(config.mazeLevelIds)}
                onChange={(e) => handleConfigChange('mazeLevelIds', parseIdList(e.target.value))}
                rows={3}
                placeholder="one maze level id per line"
                className="px-sm py-xs bg-surface-container-highest border border-outline-variant rounded-md text-body-sm font-mono focus:ring-2 focus:ring-primary outline-none resize-y transition-shadow"
              />
              <p className="text-[12px] text-on-surface-variant">{t('gamif.admin.form.assignmentsHint')}</p>
            </div>
          )}

          <div className="md:col-span-2">
            <label className="flex items-center gap-sm cursor-pointer">
              <input
                type="checkbox"
                checked={config.allowRepeat ?? false}
                onChange={(e) => handleConfigChange('allowRepeat', e.target.checked)}
                className="w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary"
              />
              <span className="text-body-md text-on-surface">{t('gamif.admin.form.allowRepeat')}</span>
            </label>
          </div>
        </div>
      </fieldset>

      {/* ── Section: Schedule & gating ── */}
      <fieldset>
        <legend className="font-manrope text-headline-md text-on-surface font-bold mb-md flex items-center gap-sm">
          <Icon name="event" size={20} className="text-secondary" />
          {t('gamif.admin.form.sectionSchedule')}
        </legend>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
          <div className="flex flex-col gap-1 md:col-span-2">
            <label className="text-label-sm font-semibold text-on-surface">{t('gamif.admin.form.recurrence')}</label>
            <div className="grid grid-cols-3 gap-2 max-w-md">
              {Object.values(QuestRecurrence).map((rec) => {
                const isSelected = formData.recurrence === rec;
                return (
                  <button
                    key={rec}
                    type="button"
                    onClick={() => handleChange('recurrence', rec)}
                    className={`py-2 rounded-lg border-2 text-[12px] font-bold transition-all ${
                      isSelected
                        ? 'border-primary bg-primary-container/30 text-on-surface'
                        : 'border-outline-variant/50 bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'
                    }`}
                  >
                    {t(`gamif.recurrence.${rec}`)}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-label-sm font-semibold text-on-surface">{t('gamif.admin.form.startsAt')}</label>
            <input
              type="datetime-local"
              value={isoToLocalInput(formData.startsAt)}
              onChange={(e) => handleChange('startsAt', localInputToIso(e.target.value))}
              className={inputCls}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-label-sm font-semibold text-on-surface">{t('gamif.admin.form.endsAt')}</label>
            <input
              type="datetime-local"
              value={isoToLocalInput(formData.endsAt)}
              onChange={(e) => handleChange('endsAt', localInputToIso(e.target.value))}
              className={inputCls}
            />
          </div>

          <div className="flex flex-col gap-1 md:col-span-2">
            <label className="text-label-sm font-semibold text-on-surface">{t('gamif.admin.form.prerequisite')}</label>
            <select
              value={formData.prerequisiteQuestId ?? ''}
              onChange={(e) => handleChange('prerequisiteQuestId', e.target.value || null)}
              className={`${inputCls} appearance-none`}
            >
              <option value="">{t('gamif.admin.form.prerequisiteNone')}</option>
              {(questOptions ?? []).map((q) => (
                <option key={q.id} value={q.id}>
                  {q.title}
                </option>
              ))}
            </select>
            <p className="text-[12px] text-on-surface-variant">{t('gamif.admin.form.prerequisiteHint')}</p>
          </div>

          <div className="flex flex-col gap-1 md:col-span-2">
            <label className="text-label-sm font-semibold text-on-surface">{t('gamif.admin.form.classIds')}</label>
            <p className="text-[12px] text-on-surface-variant">{t('gamif.admin.form.classIdsHint')}</p>
            <div className="mt-1 max-h-40 overflow-y-auto rounded-lg border border-outline-variant divide-y divide-outline-variant/40 bg-surface-container-high">
              {classes.length === 0 ? (
                <div className="p-3 text-[12px] text-on-surface-variant">—</div>
              ) : (
                classes.map((c) => {
                  const checked = classIds.includes(c.id);
                  return (
                    <label key={c.id} className="flex items-center gap-3 p-2.5 cursor-pointer hover:bg-surface-container-highest">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) =>
                          handleChange(
                            'classIds',
                            e.target.checked ? [...classIds, c.id] : classIds.filter((id) => id !== c.id),
                          )
                        }
                        className="w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary"
                      />
                      <span className="text-sm text-on-surface">{c.name}</span>
                      <span className="text-[11px] text-on-surface-variant ml-auto">{c.code}</span>
                    </label>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </fieldset>

      {/* ── Section: Rewards ── */}
      <fieldset>
        <legend className="font-manrope text-headline-md text-on-surface font-bold mb-md flex items-center gap-sm">
          <Icon name="redeem" size={20} className="text-tertiary" />
          {t('gamif.admin.form.sectionRewards')}
        </legend>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
          <div className="flex flex-col gap-1">
            <label className="text-label-sm font-semibold text-on-surface flex items-center gap-1">
              <Icon name="star" size={14} className="text-emerald-500" />
              {t('gamif.admin.form.xpReward')}
            </label>
            <input
              type="number"
              min={0}
              step={10}
              value={formData.rewardXp}
              onChange={(e) => handleChange('rewardXp', Math.max(0, Number(e.target.value)))}
              className={inputCls}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-label-sm font-semibold text-on-surface flex items-center gap-1">
              <Icon name="diamond" size={14} className="text-fuchsia-500" />
              {t('gamif.admin.form.gemsReward')}
            </label>
            <input
              type="number"
              min={0}
              step={5}
              value={formData.rewardGems}
              onChange={(e) => handleChange('rewardGems', Math.max(0, Number(e.target.value)))}
              className={inputCls}
            />
          </div>

          <div className="flex flex-col gap-1 md:col-span-2">
            <label className="text-label-sm font-semibold text-on-surface">{t('gamif.admin.form.rewardBadge')}</label>
            <select
              value={formData.rewardBadgeId ?? ''}
              onChange={(e) => handleChange('rewardBadgeId', e.target.value || null)}
              className={`${inputCls} appearance-none`}
            >
              <option value="">{t('gamif.admin.form.rewardBadgeNone')}</option>
              {badges.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.title}
                </option>
              ))}
            </select>
          </div>

          {/* Reward preview */}
          <div className="md:col-span-2 bg-surface-container-high rounded-xl p-md flex items-center gap-md border border-outline-variant/30">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${typeCfg.color} bg-surface-container-highest`}>
              <Icon name={formData.icon || 'help'} size={24} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-on-surface truncate">
                {formData.title || t('gamif.admin.form.previewUntitled')}
              </p>
              <p className="text-[12px] text-on-surface-variant">
                {t(`gamif.questType.${formData.type}`)} · {formData.targetCount} {unitLabel}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="inline-flex items-center gap-1 text-[12px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-md">
                +{formData.rewardXp} XP
              </span>
              <span className="inline-flex items-center gap-1 text-[12px] font-bold text-fuchsia-600 dark:text-fuchsia-400 bg-fuchsia-400/10 px-2 py-1 rounded-md">
                <Icon name="diamond" size={12} /> {formData.rewardGems}
              </span>
            </div>
          </div>
        </div>
      </fieldset>

      {/* ── Section: Appearance ── */}
      <fieldset>
        <legend className="font-manrope text-headline-md text-on-surface font-bold mb-md flex items-center gap-sm">
          <Icon name="palette" size={20} className="text-secondary" />
          {t('gamif.admin.form.sectionAppearance')}
        </legend>
        <div className="flex flex-col gap-md">
          <div className="flex items-center gap-md">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center border-2 border-dashed border-outline-variant ${typeCfg.color} bg-surface-container-high transition-all`}>
              <Icon name={formData.icon || 'help'} size={32} />
            </div>
            <div className="flex-1">
              <label className="text-label-sm font-semibold text-on-surface block mb-1">{t('gamif.admin.form.icon')}</label>
              <input
                value={formData.icon ?? ''}
                onChange={(e) => handleChange('icon', e.target.value)}
                placeholder="military_tech"
                className={inputCls}
              />
            </div>
          </div>

          <div>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_ICONS.map((iconName) => (
                <button
                  key={iconName}
                  type="button"
                  onClick={() => handleChange('icon', iconName)}
                  className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
                    formData.icon === iconName
                      ? 'bg-primary text-on-primary shadow-md scale-110'
                      : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest hover:scale-105'
                  }`}
                  title={iconName}
                >
                  <Icon name={iconName} size={18} />
                </button>
              ))}
            </div>
          </div>
        </div>
      </fieldset>

      {/* ── Section: Visibility / Status ── */}
      <fieldset>
        <legend className="font-manrope text-headline-md text-on-surface font-bold mb-md flex items-center gap-sm">
          <Icon name="toggle_on" size={20} className="text-primary" />
          {t('gamif.admin.form.sectionStatus')}
        </legend>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-md items-start">
          <div className="flex flex-col gap-1">
            <label className="text-label-sm font-semibold text-on-surface">{t('gamif.admin.form.status')}</label>
            <select
              value={formData.status ?? QuestStatus.PUBLISHED}
              onChange={(e) => handleChange('status', e.target.value as QuestStatus)}
              className={`${inputCls} appearance-none`}
            >
              {Object.values(QuestStatus).map((s) => (
                <option key={s} value={s}>
                  {t(`gamif.questStatus.${s}`)}
                </option>
              ))}
            </select>
          </div>

          <label className="flex items-center gap-sm cursor-pointer group md:pt-6">
            <div className="relative">
              <input
                type="checkbox"
                checked={formData.isActive ?? true}
                onChange={(e) => handleChange('isActive', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-outline-variant rounded-full peer-checked:bg-primary transition-colors" />
              <div className="absolute left-[2px] top-[2px] bg-white w-5 h-5 rounded-full transition-transform peer-checked:translate-x-5 shadow-sm" />
            </div>
            <div>
              <span className="text-body-md text-on-surface font-medium">{t('gamif.admin.form.isActive')}</span>
              <p className="text-[12px] text-on-surface-variant">{t('gamif.admin.form.isActiveHint')}</p>
            </div>
          </label>
        </div>
      </fieldset>

      {/* ── Actions ── */}
      <div className="flex justify-end gap-3 pt-md border-t border-outline-variant/30">
        <Button type="button" variant="outline" onClick={() => window.history.back()}>
          {t('gamif.admin.form.cancel')}
        </Button>
        <Button type="submit" disabled={isLoading} leadingIcon={<Icon name="save" size={18} />}>
          {isLoading ? t('common.loading') : t('gamif.admin.form.save')}
        </Button>
      </div>
    </form>
  );
}
