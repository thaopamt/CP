import { IAchievement } from '@cp/shared';
import { Icon } from '../Icon/Icon';
import { cn } from '../cn';

interface AchievementTileProps {
  achievement: IAchievement;
  onClick?: () => void;
  className?: string;
}

/**
 * 2x2 bento tile used on the Student Home achievements grid. Locked
 * tiles are desaturated; unlocked tiles use a coloured icon container.
 */
export function AchievementTile({ achievement, onClick, className }: AchievementTileProps) {
  const { unlocked } = achievement;
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group flex flex-col items-start gap-xs p-md rounded-2xl border transition-all text-left',
        unlocked
          ? 'bg-surface-container-lowest border-outline-variant/40 hover:-translate-y-0.5 hover:shadow-elev-2'
          : 'bg-surface-container border-outline-variant/30 opacity-70',
        className,
      )}
    >
      <span
        className={cn(
          'w-10 h-10 rounded-xl grid place-items-center',
          unlocked
            ? 'bg-tertiary-container text-tertiary'
            : 'bg-surface-container-high text-on-surface-variant',
        )}
      >
        <Icon name={achievement.icon} filled={unlocked} />
      </span>
      <div className="text-body-md font-semibold text-on-surface">{achievement.label}</div>
      {achievement.caption && (
        <div className="text-[12px] text-on-surface-variant">{achievement.caption}</div>
      )}
    </button>
  );
}
