import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Icon } from '@cp/ui';
import { ICreateQuestPayload, QuestType } from '@cp/shared';

const QUEST_TYPE_CONFIG: Record<string, { icon: string; color: string }> = {
  DAILY: { icon: 'today', color: 'text-emerald-400' },
  MAIN: { icon: 'auto_stories', color: 'text-cyan-400' },
  BOUNTY: { icon: 'local_fire_department', color: 'text-orange-400' },
};

const SUGGESTED_ICONS = [
  'military_tech', 'code', 'terminal', 'bug_report', 'rocket_launch',
  'psychology', 'school', 'emoji_events', 'star', 'bolt',
  'timer', 'trending_up', 'analytics', 'science', 'calculate',
];

interface QuestFormProps {
  defaultValues?: Partial<ICreateQuestPayload>;
  onSubmit: (data: ICreateQuestPayload) => void;
  isLoading?: boolean;
}

export function QuestForm({ defaultValues, onSubmit, isLoading }: QuestFormProps) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<ICreateQuestPayload>({
    title: defaultValues?.title || '',
    description: defaultValues?.description || '',
    type: defaultValues?.type || QuestType.DAILY,
    targetCount: defaultValues?.targetCount || 1,
    rewardXp: defaultValues?.rewardXp || 50,
    rewardGems: defaultValues?.rewardGems || 10,
    icon: defaultValues?.icon || 'military_tech',
    isActive: defaultValues?.isActive ?? true,
  });

  const handleChange = (field: keyof ICreateQuestPayload, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const typeCfg = QUEST_TYPE_CONFIG[formData.type] ?? QUEST_TYPE_CONFIG.DAILY;

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* ── Section: Basic Information ── */}
      <fieldset>
        <legend className="font-manrope text-headline-md text-on-surface font-bold mb-md flex items-center gap-sm">
          <Icon name="info" size={20} className="text-primary" />
          {t('pages.admin.questForm.sectionBasic')}
        </legend>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
          {/* Title */}
          <div className="flex flex-col gap-1 md:col-span-2">
            <label className="text-label-sm font-semibold text-on-surface">{t('pages.admin.questForm.questTitle')}</label>
            <input
              required
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder={t('pages.admin.questForm.titlePlaceholder')}
              className="h-[42px] px-sm bg-surface-container-highest border border-outline-variant rounded-md text-body-md focus:ring-2 focus:ring-primary outline-none transition-shadow"
            />
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1 md:col-span-2">
            <label className="text-label-sm font-semibold text-on-surface">{t('pages.admin.questForm.description')}</label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder={t('pages.admin.questForm.descriptionPlaceholder')}
              rows={3}
              className="px-sm py-xs bg-surface-container-highest border border-outline-variant rounded-md text-body-md focus:ring-2 focus:ring-primary outline-none resize-none transition-shadow"
            />
          </div>

          {/* Quest Type */}
          <div className="flex flex-col gap-1">
            <label className="text-label-sm font-semibold text-on-surface">{t('pages.admin.questForm.questType')}</label>
            <div className="grid grid-cols-3 gap-2">
              {([QuestType.DAILY, QuestType.MAIN, QuestType.BOUNTY] as const).map((type) => {
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
                      {t(`pages.admin.questForm.types.${type}`)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Target Count */}
          <div className="flex flex-col gap-1">
            <label className="text-label-sm font-semibold text-on-surface">{t('pages.admin.questForm.targetCount')}</label>
            <input
              type="number"
              min={1}
              value={formData.targetCount}
              onChange={(e) => handleChange('targetCount', Math.max(1, Number(e.target.value)))}
              className="h-[42px] px-sm bg-surface-container-highest border border-outline-variant rounded-md text-body-md focus:ring-2 focus:ring-primary outline-none transition-shadow"
            />
          </div>
        </div>
      </fieldset>

      {/* ── Section: Icon ── */}
      <fieldset>
        <legend className="font-manrope text-headline-md text-on-surface font-bold mb-md flex items-center gap-sm">
          <Icon name="palette" size={20} className="text-secondary" />
          {t('pages.admin.questForm.sectionIcon')}
        </legend>
        <div className="flex flex-col gap-md">
          {/* Icon preview */}
          <div className="flex items-center gap-md">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center border-2 border-dashed border-outline-variant ${typeCfg.color} bg-surface-container-high transition-all`}>
              <Icon name={formData.icon || 'help'} size={32} />
            </div>
            <div className="flex-1">
              <label className="text-label-sm font-semibold text-on-surface block mb-1">{t('pages.admin.questForm.icon')}</label>
              <input
                value={formData.icon}
                onChange={(e) => handleChange('icon', e.target.value)}
                placeholder="military_tech"
                className="h-[42px] px-sm bg-surface-container-highest border border-outline-variant rounded-md text-body-md focus:ring-2 focus:ring-primary outline-none w-full transition-shadow"
              />
            </div>
          </div>

          {/* Quick pick icons */}
          <div>
            <p className="text-[12px] text-on-surface-variant mb-2">{t('pages.admin.questForm.quickPick')}</p>
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

      {/* ── Section: Rewards ── */}
      <fieldset>
        <legend className="font-manrope text-headline-md text-on-surface font-bold mb-md flex items-center gap-sm">
          <Icon name="redeem" size={20} className="text-tertiary" />
          {t('pages.admin.questForm.sectionRewards')}
        </legend>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
          {/* XP Reward */}
          <div className="flex flex-col gap-1">
            <label className="text-label-sm font-semibold text-on-surface flex items-center gap-1">
              <Icon name="star" size={14} className="text-emerald-500" />
              {t('pages.admin.questForm.xpReward')}
            </label>
            <input
              type="number"
              min={0}
              step={10}
              value={formData.rewardXp}
              onChange={(e) => handleChange('rewardXp', Math.max(0, Number(e.target.value)))}
              className="h-[42px] px-sm bg-surface-container-highest border border-outline-variant rounded-md text-body-md focus:ring-2 focus:ring-primary outline-none transition-shadow"
            />
          </div>

          {/* Gems Reward */}
          <div className="flex flex-col gap-1">
            <label className="text-label-sm font-semibold text-on-surface flex items-center gap-1">
              <Icon name="diamond" size={14} className="text-fuchsia-500" />
              {t('pages.admin.questForm.gemsReward')}
            </label>
            <input
              type="number"
              min={0}
              step={5}
              value={formData.rewardGems}
              onChange={(e) => handleChange('rewardGems', Math.max(0, Number(e.target.value)))}
              className="h-[42px] px-sm bg-surface-container-highest border border-outline-variant rounded-md text-body-md focus:ring-2 focus:ring-primary outline-none transition-shadow"
            />
          </div>

          {/* Reward preview */}
          <div className="md:col-span-2 bg-surface-container-high rounded-xl p-md flex items-center gap-md border border-outline-variant/30">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${typeCfg.color} bg-surface-container-highest`}>
              <Icon name={formData.icon || 'help'} size={24} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-on-surface truncate">{formData.title || t('pages.admin.questForm.previewUntitled')}</p>
              <p className="text-[12px] text-on-surface-variant">{t(`pages.admin.questForm.types.${formData.type}`)} · {t('pages.admin.questForm.targetLabel', { count: formData.targetCount })}</p>
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

      {/* ── Section: Status ── */}
      <fieldset>
        <legend className="font-manrope text-headline-md text-on-surface font-bold mb-md flex items-center gap-sm">
          <Icon name="toggle_on" size={20} className="text-primary" />
          {t('pages.admin.questForm.sectionStatus')}
        </legend>
        <label className="flex items-center gap-sm cursor-pointer group">
          <div className="relative">
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) => handleChange('isActive', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-outline-variant rounded-full peer-checked:bg-primary transition-colors" />
            <div className="absolute left-[2px] top-[2px] bg-white w-5 h-5 rounded-full transition-transform peer-checked:translate-x-5 shadow-sm" />
          </div>
          <div>
            <span className="text-body-md text-on-surface font-medium">{t('pages.admin.questForm.isActive')}</span>
            <p className="text-[12px] text-on-surface-variant">{t('pages.admin.questForm.isActiveHint')}</p>
          </div>
        </label>
      </fieldset>

      {/* ── Actions ── */}
      <div className="flex justify-end gap-3 pt-md border-t border-outline-variant/30">
        <Button type="button" variant="outline" onClick={() => window.history.back()}>
          {t('pages.admin.questForm.cancel')}
        </Button>
        <Button type="submit" disabled={isLoading} leadingIcon={<Icon name="save" size={18} />}>
          {isLoading ? t('common.loading') : t('pages.admin.questForm.save')}
        </Button>
      </div>
    </form>
  );
}
