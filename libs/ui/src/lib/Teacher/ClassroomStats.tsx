import { useTranslation } from 'react-i18next';
import { Icon } from '../Icon/Icon';
import { cn } from '../cn';

interface StatProps {
  icon: string;
  iconClass?: string;
  label: string;
  value: string | number;
}

function StatRow({ icon, iconClass, label, value }: StatProps) {
  return (
    <div className="flex items-center gap-sm p-sm rounded-lg hover:bg-surface-container-low transition-colors">
      <span
        className={cn(
          'w-9 h-9 rounded-lg grid place-items-center bg-surface-container-high',
          iconClass,
        )}
      >
        <Icon name={icon} size={20} />
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-label-sm text-on-surface-variant">{label}</div>
      </div>
      <div className="font-manrope text-headline-md text-on-surface">{value}</div>
    </div>
  );
}

interface ClassroomStatsProps {
  totalOnline: number;
  totalEnrolled: number;
  activeCoding: number;
  idleOrAway: number;
  className?: string;
}

/**
 * Compact stats panel for the live monitoring sidebar.
 */
export function ClassroomStats({
  totalOnline,
  totalEnrolled,
  activeCoding,
  idleOrAway,
  className,
}: ClassroomStatsProps) {
  const { t } = useTranslation();
  return (
    <div className={cn('flex flex-col gap-xs', className)}>
      <StatRow
        icon="wifi"
        iconClass="text-tertiary"
        label={t('ui.classroomStats.totalOnline')}
        value={`${totalOnline} / ${totalEnrolled}`}
      />
      <StatRow icon="code" iconClass="text-primary" label={t('ui.classroomStats.activeCoding')} value={activeCoding} />
      <StatRow icon="schedule" iconClass="text-on-surface-variant" label={t('ui.classroomStats.idleAway')} value={idleOrAway} />
    </div>
  );
}
