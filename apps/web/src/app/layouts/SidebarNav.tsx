import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export type SidebarNavItem = {
  to: string;
  icon: string;
  key: string;
  end?: boolean;
};

export type SidebarNavGroup = {
  icon: string;
  key: string;
  items: SidebarNavItem[];
};

export type SidebarNavEntry = SidebarNavItem | SidebarNavGroup;

type SidebarNavProps = {
  entries: SidebarNavEntry[];
  collapsed?: boolean;
  activeTo?: string | null;
  roundedClassName?: string;
  className?: string;
  inactiveClassName?: string;
  activeClassName?: string;
  groupActiveClassName?: string;
  groupInactiveClassName?: string;
  renderBadge?: (item: SidebarNavItem, options: { collapsed: boolean }) => ReactNode;
};

function isGroup(entry: SidebarNavEntry): entry is SidebarNavGroup {
  return 'items' in entry;
}

export function flattenNavEntries(entries: SidebarNavEntry[]): SidebarNavItem[] {
  return entries.flatMap((entry) => (isGroup(entry) ? entry.items : [entry]));
}

export function getActiveNavItem(entries: SidebarNavEntry[], pathname: string): SidebarNavItem | null {
  let best: SidebarNavItem | null = null;

  for (const item of flattenNavEntries(entries)) {
    const matches = item.end
      ? pathname === item.to
      : pathname === item.to || pathname.startsWith(`${item.to}/`);

    if (matches && (best === null || item.to.length > best.to.length)) {
      best = item;
    }
  }

  return best;
}

export function SidebarNav({
  entries,
  collapsed = false,
  activeTo,
  roundedClassName = 'rounded-lg',
  className = 'flex flex-col gap-xs',
  activeClassName = 'bg-primary-container text-on-primary-container font-bold',
  inactiveClassName = 'text-on-surface-variant hover:bg-surface-container-highest',
  groupActiveClassName = 'bg-surface-container-high text-on-surface font-bold',
  groupInactiveClassName = 'text-on-surface-variant hover:bg-surface-container-highest',
  renderBadge,
}: SidebarNavProps) {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const resolvedActiveTo = activeTo ?? getActiveNavItem(entries, pathname)?.to ?? null;
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  const activeGroupKeys = useMemo(
    () =>
      entries
        .filter((entry): entry is SidebarNavGroup => isGroup(entry))
        .filter((group) => group.items.some((item) => item.to === resolvedActiveTo))
        .map((group) => group.key),
    [entries, resolvedActiveTo]
  );
  const activeGroupKeySignature = activeGroupKeys.join('|');

  useEffect(() => {
    if (collapsed || !activeGroupKeySignature) return;

    setOpenGroups((current) => {
      let changed = false;
      const next = { ...current };

      for (const key of activeGroupKeySignature.split('|')) {
        if (!next[key]) {
          next[key] = true;
          changed = true;
        }
      }

      return changed ? next : current;
    });
  }, [activeGroupKeySignature, collapsed]);

  const renderLink = (item: SidebarNavItem, nested = false) => {
    const isActive = item.to === resolvedActiveTo;

    return (
      <Link
        key={item.to}
        to={item.to}
        aria-current={isActive ? 'page' : undefined}
        title={collapsed ? t(item.key) : undefined}
        className={[
          'relative flex items-center py-sm transition-all text-label-sm overflow-hidden',
          roundedClassName,
          collapsed ? 'justify-center px-0' : nested ? 'gap-sm pl-10 pr-md' : 'gap-md px-md',
          nested ? 'min-h-[36px]' : 'min-h-[40px]',
          isActive ? activeClassName : inactiveClassName,
        ].join(' ')}
      >
        <span className={`material-symbols-outlined shrink-0 ${nested ? 'text-[18px]' : ''}`}>
          {item.icon}
        </span>
        {!collapsed && <span className="truncate">{t(item.key)}</span>}
        {renderBadge?.(item, { collapsed })}
      </Link>
    );
  };

  if (collapsed) {
    return <div className={className}>{flattenNavEntries(entries).map((item) => renderLink(item))}</div>;
  }

  return (
    <div className={className}>
      {entries.map((entry) => {
        if (!isGroup(entry)) return renderLink(entry);

        const isOpen = openGroups[entry.key] ?? false;
        const isActiveGroup = entry.items.some((item) => item.to === resolvedActiveTo);
        const panelId = `${entry.key.replace(/\./g, '-')}-panel`;

        return (
          <div key={entry.key} className="flex flex-col gap-1">
            <button
              type="button"
              aria-expanded={isOpen}
              aria-controls={panelId}
              onClick={() => setOpenGroups((current) => ({ ...current, [entry.key]: !isOpen }))}
              className={[
                'flex w-full items-center gap-md px-md py-sm min-h-[40px] transition-all text-label-sm overflow-hidden',
                roundedClassName,
                isActiveGroup ? groupActiveClassName : groupInactiveClassName,
              ].join(' ')}
            >
              <span className="material-symbols-outlined shrink-0">{entry.icon}</span>
              <span className="truncate">{t(entry.key)}</span>
              <span
                className={[
                  'material-symbols-outlined ml-auto text-[18px] shrink-0 transition-transform',
                  isOpen ? 'rotate-90' : '',
                ].join(' ')}
              >
                chevron_right
              </span>
            </button>

            {isOpen && (
              <div id={panelId} className="flex flex-col gap-1">
                {entry.items.map((item) => renderLink(item, true))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
