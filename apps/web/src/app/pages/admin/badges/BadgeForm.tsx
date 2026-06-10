import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Icon } from '@cp/ui';
import { ICreateBadgePayload, BadgeRarity, BadgeCriteriaType } from '@cp/shared';

const RARITY_CONFIG: Record<BadgeRarity, { color: string; bg: string; ring: string; medallion: string }> = {
  [BadgeRarity.COMMON]: {
    color: 'text-gray-500 dark:text-gray-300',
    bg: 'bg-gray-400/10',
    ring: 'border-gray-400',
    medallion: 'from-gray-400/30 to-gray-500/10 text-gray-500 dark:text-gray-300',
  },
  [BadgeRarity.RARE]: {
    color: 'text-blue-500 dark:text-blue-400',
    bg: 'bg-blue-400/10',
    ring: 'border-blue-400',
    medallion: 'from-blue-400/30 to-blue-500/10 text-blue-500 dark:text-blue-400',
  },
  [BadgeRarity.EPIC]: {
    color: 'text-purple-500 dark:text-purple-400',
    bg: 'bg-purple-400/10',
    ring: 'border-purple-400',
    medallion: 'from-purple-400/30 to-purple-500/10 text-purple-500 dark:text-purple-400',
  },
  [BadgeRarity.LEGENDARY]: {
    color: 'text-amber-500 dark:text-amber-400',
    bg: 'bg-amber-400/10',
    ring: 'border-amber-400',
    medallion: 'from-amber-400/40 to-amber-500/10 text-amber-500 dark:text-amber-400',
  },
};

const SUGGESTED_ICONS = [
  'workspace_premium', 'military_tech', 'emoji_events', 'local_fire_department',
  'bolt', 'star', 'diamond', 'rocket_launch',
  'psychology', 'verified', 'trophy', 'shield',
];

const CRITERIA_TYPES = [
  BadgeCriteriaType.QUESTS_COMPLETED,
  BadgeCriteriaType.PROBLEMS_SOLVED,
  BadgeCriteriaType.MAZE_SOLVED,
  BadgeCriteriaType.STREAK_DAYS,
  BadgeCriteriaType.REACH_LEVEL,
  BadgeCriteriaType.EARN_XP,
  BadgeCriteriaType.EARN_GEMS,
];

interface BadgeFormProps {
  defaultValues?: Partial<ICreateBadgePayload>;
  onSubmit: (data: ICreateBadgePayload) => void;
  isLoading?: boolean;
}

export function BadgeForm({ defaultValues, onSubmit, isLoading }: BadgeFormProps) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<ICreateBadgePayload>({
    code: defaultValues?.code || '',
    title: defaultValues?.title || '',
    description: defaultValues?.description || '',
    icon: defaultValues?.icon || 'workspace_premium',
    rarity: defaultValues?.rarity || BadgeRarity.COMMON,
    criteria: {
      type: defaultValues?.criteria?.type || BadgeCriteriaType.QUESTS_COMPLETED,
      threshold: defaultValues?.criteria?.threshold ?? 1,
    },
    rewardXp: defaultValues?.rewardXp ?? 0,
    rewardGems: defaultValues?.rewardGems ?? 0,
    isActive: defaultValues?.isActive ?? true,
  });

  const handleChange = (field: keyof ICreateBadgePayload, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleCriteriaChange = (field: keyof ICreateBadgePayload['criteria'], value: unknown) => {
    setFormData((prev) => ({ ...prev, criteria: { ...prev.criteria, [field]: value } }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const rarity = formData.rarity ?? BadgeRarity.COMMON;
  const rarityCfg = RARITY_CONFIG[rarity];

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* ── Section: Basics ── */}
      <fieldset>
        <legend className="font-manrope text-headline-md text-on-surface font-bold mb-md flex items-center gap-sm">
          <Icon name="info" size={20} className="text-primary" />
          {t('gamif.admin.badges.form.sectionBasic')}
        </legend>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
          {/* Code */}
          <div className="flex flex-col gap-1">
            <label className="text-label-sm font-semibold text-on-surface">{t('gamif.admin.badges.form.code')}</label>
            <input
              required
              value={formData.code}
              onChange={(e) => handleChange('code', e.target.value.toUpperCase().replace(/\s+/g, '_'))}
              placeholder={t('gamif.admin.badges.form.codePlaceholder')}
              className="h-[42px] px-sm bg-surface-container-highest border border-outline-variant rounded-md text-body-md font-mono uppercase focus:ring-2 focus:ring-primary outline-none transition-shadow"
            />
          </div>

          {/* Title */}
          <div className="flex flex-col gap-1">
            <label className="text-label-sm font-semibold text-on-surface">{t('gamif.admin.badges.form.badgeTitle')}</label>
            <input
              required
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              className="h-[42px] px-sm bg-surface-container-highest border border-outline-variant rounded-md text-body-md focus:ring-2 focus:ring-primary outline-none transition-shadow"
            />
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1 md:col-span-2">
            <label className="text-label-sm font-semibold text-on-surface">{t('gamif.admin.badges.form.description')}</label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={2}
              className="px-sm py-xs bg-surface-container-highest border border-outline-variant rounded-md text-body-md focus:ring-2 focus:ring-primary outline-none resize-none transition-shadow"
            />
          </div>

          {/* Icon */}
          <div className="flex flex-col gap-md md:col-span-2">
            <div className="flex items-center gap-md">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center border-2 border-dashed ${rarityCfg.ring} ${rarityCfg.color} bg-surface-container-high transition-all`}>
                <Icon name={formData.icon || 'help'} size={32} />
              </div>
              <div className="flex-1">
                <label className="text-label-sm font-semibold text-on-surface block mb-1">{t('gamif.admin.badges.form.icon')}</label>
                <input
                  value={formData.icon}
                  onChange={(e) => handleChange('icon', e.target.value)}
                  placeholder="workspace_premium"
                  className="h-[42px] px-sm bg-surface-container-highest border border-outline-variant rounded-md text-body-md focus:ring-2 focus:ring-primary outline-none w-full transition-shadow"
                />
              </div>
            </div>
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

          {/* Rarity */}
          <div className="flex flex-col gap-1 md:col-span-2">
            <label className="text-label-sm font-semibold text-on-surface">{t('gamif.admin.badges.form.rarity')}</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(Object.values(BadgeRarity) as BadgeRarity[]).map((r) => {
                const cfg = RARITY_CONFIG[r];
                const isSelected = rarity === r;
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => handleChange('rarity', r)}
                    className={`flex items-center justify-center gap-1.5 p-3 rounded-lg border-2 transition-all duration-200 ${
                      isSelected
                        ? `${cfg.ring} ${cfg.bg} shadow-sm`
                        : 'border-outline-variant/50 bg-surface-container-high hover:bg-surface-container-highest'
                    }`}
                  >
                    <Icon name="hexagon" size={16} className={isSelected ? cfg.color : 'text-on-surface-variant'} />
                    <span className={`text-[12px] font-bold ${isSelected ? cfg.color : 'text-on-surface-variant'}`}>
                      {t(`gamif.rarity.${r}`)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </fieldset>

      {/* ── Section: Unlock criteria ── */}
      <fieldset>
        <legend className="font-manrope text-headline-md text-on-surface font-bold mb-md flex items-center gap-sm">
          <Icon name="lock_open" size={20} className="text-secondary" />
          {t('gamif.admin.badges.form.sectionCriteria')}
        </legend>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
          {/* Criteria type */}
          <div className="flex flex-col gap-1">
            <label className="text-label-sm font-semibold text-on-surface">{t('gamif.admin.badges.form.criteriaType')}</label>
            <select
              value={formData.criteria.type}
              onChange={(e) => handleCriteriaChange('type', e.target.value as BadgeCriteriaType)}
              className="h-[42px] px-sm bg-surface-container-highest border border-outline-variant rounded-md text-body-md focus:ring-2 focus:ring-primary outline-none transition-shadow"
            >
              {CRITERIA_TYPES.map((c) => (
                <option key={c} value={c}>
                  {t(`gamif.criteria.${c}`)}
                </option>
              ))}
            </select>
          </div>

          {/* Threshold */}
          <div className="flex flex-col gap-1">
            <label className="text-label-sm font-semibold text-on-surface">{t('gamif.admin.badges.form.threshold')}</label>
            <input
              type="number"
              min={1}
              value={formData.criteria.threshold}
              onChange={(e) => handleCriteriaChange('threshold', Math.max(1, Number(e.target.value)))}
              className="h-[42px] px-sm bg-surface-container-highest border border-outline-variant rounded-md text-body-md focus:ring-2 focus:ring-primary outline-none transition-shadow"
            />
          </div>
        </div>
      </fieldset>

      {/* ── Section: Reward ── */}
      <fieldset>
        <legend className="font-manrope text-headline-md text-on-surface font-bold mb-md flex items-center gap-sm">
          <Icon name="redeem" size={20} className="text-tertiary" />
          {t('gamif.admin.badges.form.sectionReward')}
        </legend>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
          {/* XP */}
          <div className="flex flex-col gap-1">
            <label className="text-label-sm font-semibold text-on-surface flex items-center gap-1">
              <Icon name="star" size={14} className="text-emerald-500" />
              {t('gamif.admin.badges.form.xpReward')}
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

          {/* Gems */}
          <div className="flex flex-col gap-1">
            <label className="text-label-sm font-semibold text-on-surface flex items-center gap-1">
              <Icon name="diamond" size={14} className="text-fuchsia-500" />
              {t('gamif.admin.badges.form.gemsReward')}
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

          {/* Live preview card */}
          <div className="md:col-span-2 bg-surface-container-high rounded-xl p-md flex items-center gap-md border border-outline-variant/30">
            <div className={`w-14 h-14 rounded-full grid place-items-center bg-gradient-to-br ${rarityCfg.medallion} ring-2 ${rarityCfg.ring} shrink-0`}>
              <Icon name={formData.icon || 'help'} size={26} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-on-surface truncate">
                {formData.title || t('gamif.admin.badges.form.badgeTitle')}
              </p>
              <p className="text-[12px] text-on-surface-variant">
                {t('gamif.rarity.' + rarity)} · {t('gamif.criteria.' + formData.criteria.type)} ≥ {formData.criteria.threshold}
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

      {/* ── Section: Status ── */}
      <fieldset>
        <legend className="font-manrope text-headline-md text-on-surface font-bold mb-md flex items-center gap-sm">
          <Icon name="toggle_on" size={20} className="text-primary" />
          {t('gamif.admin.badges.form.isActive')}
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
          <span className="text-body-md text-on-surface font-medium">{t('gamif.admin.badges.form.isActive')}</span>
        </label>
      </fieldset>

      {/* ── Actions ── */}
      <div className="flex justify-end gap-3 pt-md border-t border-outline-variant/30">
        <Button type="button" variant="outline" onClick={() => window.history.back()}>
          {t('gamif.admin.badges.form.cancel')}
        </Button>
        <Button type="submit" disabled={isLoading} leadingIcon={<Icon name="save" size={18} />}>
          {isLoading ? t('common.loading') : t('gamif.admin.badges.form.save')}
        </Button>
      </div>
    </form>
  );
}
