import { useState } from 'react';
import { Button } from '@cp/ui';
import { ICreateQuestPayload, QuestType } from '@cp/shared';

interface QuestFormProps {
  defaultValues?: Partial<ICreateQuestPayload>;
  onSubmit: (data: ICreateQuestPayload) => void;
  isLoading?: boolean;
}

export function QuestForm({ defaultValues, onSubmit, isLoading }: QuestFormProps) {
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
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex flex-col gap-1">
          <label className="text-label-sm font-semibold text-on-surface">Quest Title</label>
          <input 
            required
            value={formData.title}
            onChange={(e) => handleChange('title', e.target.value)}
            className="h-[42px] px-sm bg-surface-container-highest border border-outline-variant rounded-md text-body-md focus:ring-2 focus:ring-primary outline-none"
          />
        </div>
        
        <div className="flex flex-col gap-1">
          <label className="text-label-sm font-semibold text-on-surface">Quest Type</label>
          <select 
            value={formData.type}
            onChange={(e) => handleChange('type', e.target.value)}
            className="h-[42px] px-sm bg-surface-container-highest border border-outline-variant rounded-md text-body-md focus:ring-2 focus:ring-primary outline-none"
          >
            <option value={QuestType.DAILY}>Daily Quest</option>
            <option value={QuestType.MAIN}>Main Story</option>
            <option value={QuestType.BOUNTY}>Bounty</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-label-sm font-semibold text-on-surface">Target Count (e.g., 3 assignments)</label>
          <input 
            type="number"
            value={formData.targetCount}
            onChange={(e) => handleChange('targetCount', Number(e.target.value))}
            className="h-[42px] px-sm bg-surface-container-highest border border-outline-variant rounded-md text-body-md focus:ring-2 focus:ring-primary outline-none"
          />
        </div>
        
        <div className="flex flex-col gap-1">
          <label className="text-label-sm font-semibold text-on-surface">Icon (Material Symbol)</label>
          <input 
            value={formData.icon}
            onChange={(e) => handleChange('icon', e.target.value)}
            className="h-[42px] px-sm bg-surface-container-highest border border-outline-variant rounded-md text-body-md focus:ring-2 focus:ring-primary outline-none"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-label-sm font-semibold text-on-surface">XP Reward</label>
          <input 
            type="number"
            value={formData.rewardXp}
            onChange={(e) => handleChange('rewardXp', Number(e.target.value))}
            className="h-[42px] px-sm bg-surface-container-highest border border-outline-variant rounded-md text-body-md focus:ring-2 focus:ring-primary outline-none"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-label-sm font-semibold text-on-surface">Gems Reward</label>
          <input 
            type="number"
            value={formData.rewardGems}
            onChange={(e) => handleChange('rewardGems', Number(e.target.value))}
            className="h-[42px] px-sm bg-surface-container-highest border border-outline-variant rounded-md text-body-md focus:ring-2 focus:ring-primary outline-none"
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 mt-8">
        <Button type="button" variant="outline" onClick={() => window.history.back()}>Cancel</Button>
        <Button type="submit" disabled={isLoading}>Save Quest</Button>
      </div>
    </form>
  );
}
