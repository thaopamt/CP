import { Icon } from '../Icon/Icon';

type Trend = 'up' | 'flat' | 'down';

interface StatCardProps {
  label: string;
  value: string;
  icon: string;
  /** Tailwind text color class for the icon, e.g. "text-primary" */
  iconColor?: string;
  trend?: Trend;
  delta?: string;
}

const TREND_ICON: Record<Trend, string> = {
  up: 'trending_up',
  flat: 'trending_flat',
  down: 'trending_down',
};

const TREND_COLOR: Record<Trend, string> = {
  up: 'text-tertiary-container',
  flat: 'text-on-surface-variant',
  down: 'text-error',
};

/**
 * KPI card used on the Admin Dashboard. Mirrors the prototype at
 *   admin_portal_foundation/code.html lines 200–252.
 */
export function StatCard({ label, value, icon, iconColor = 'text-primary', trend, delta }: StatCardProps) {
  return (
    <div className="bg-surface-container-lowest border border-outline-variant/50 rounded-xl p-md shadow-elev-1 hover:shadow-elev-2 transition-shadow relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-md opacity-10 group-hover:opacity-20 transition-opacity">
        <Icon name={icon} className={`${iconColor} text-[64px]`} />
      </div>
      <div className="flex items-center gap-sm mb-sm text-on-surface-variant">
        <Icon name={icon} className={`${iconColor} text-[20px]`} />
        <h3 className="text-label-sm font-semibold uppercase tracking-wider">{label}</h3>
      </div>
      <div className="flex items-end gap-md">
        <span className="text-display-lg md:text-display-xl font-manrope font-extrabold text-on-surface truncate">{value}</span>
        {trend && delta && (
          <div className={`flex items-center text-label-sm mb-2 ${TREND_COLOR[trend]}`}>
            <Icon name={TREND_ICON[trend]} className="text-[16px]" />
            <span>{delta}</span>
          </div>
        )}
      </div>
    </div>
  );
}
