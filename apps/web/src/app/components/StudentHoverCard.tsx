import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Icon } from '@cp/ui';
import { useStudentByUserId } from '../api/student.queries';
import { themeGradientClass } from '../lib/cosmetics';

interface StudentHoverCardProps {
  userId: string;
  fallbackName?: string;
  fallbackAvatar?: string | null;
  className?: string;
  children: React.ReactNode;
}

export function StudentHoverCard({
  userId,
  fallbackName,
  fallbackAvatar,
  className,
  children,
}: StudentHoverCardProps) {
  const { t } = useTranslation();
  const [isHovered, setIsHovered] = useState(false);
  const [showCard, setShowCard] = useState(false);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0, height: 0 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleMouseEnter = () => {
    setIsHovered(true);
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setCoords({
        top: rect.top + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
        height: rect.height,
      });
    }

    hoverTimeoutRef.current = setTimeout(() => {
      setShowCard(true);
    }, 400); // 400ms delay
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
      setShowCard(false);
    }, 200); // 200ms delay to close, allowing mouse to enter the card
  };

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={className || "inline-flex items-center"}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      {mounted && createPortal(
        <AnimatePresence>
          {showCard && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute z-[99999]"
              style={{ 
                top: coords.top - 8,
                left: coords.left + coords.width / 2,
                transform: 'translate(-50%, -100%)',
                width: 'max-content' 
              }}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <InnerHoverCard
                userId={userId}
                fallbackName={fallbackName}
                fallbackAvatar={fallbackAvatar}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                t={t}
              />
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}

function InnerHoverCard({
  userId,
  fallbackName,
  fallbackAvatar,
  onMouseEnter,
  onMouseLeave,
  t,
}: {
  userId: string;
  fallbackName?: string;
  fallbackAvatar?: string | null;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  t: any;
}) {
  // Only fetches when InnerHoverCard mounts (after 400ms hover)
  const { data: profile, isLoading } = useStudentByUserId(userId);

  const name = profile?.firstName ? `${profile.firstName} ${profile.lastName}` : (fallbackName || 'Unknown');
  const avatarUrl = profile?.avatarUrl || fallbackAvatar;
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('') || '?';

  const themeBg = profile?.equippedTheme 
    ? themeGradientClass(profile.equippedTheme) 
    : '';

  return (
    <div
      className={`bg-surface-container dark:bg-[#16161e] ${themeBg} border border-outline-variant rounded-2xl shadow-elev-3 p-4 flex flex-col gap-3 min-w-[240px] dark:border-white/10`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="flex items-center gap-4">
        {avatarUrl ? (
          <img src={avatarUrl} alt={name} className="w-14 h-14 rounded-full object-cover shrink-0" />
        ) : (
          <div className="w-14 h-14 rounded-full grid place-items-center text-lg font-black bg-surface-container-high text-on-surface border border-outline-variant shrink-0 dark:border-white/10">
            {initials}
          </div>
        )}
        <div className="flex flex-col min-w-0">
          <span 
            className="font-bold text-base truncate text-on-surface"
            style={profile?.nameColor ? { color: profile.nameColor } : undefined}
          >
            {name}
          </span>
          {profile?.equippedTitle && (
            <span className="text-xs font-semibold text-fuchsia-600 dark:text-fuchsia-300 truncate">
              {profile.equippedTitle}
            </span>
          )}
          {isLoading && !profile && (
            <div className="h-3 w-20 bg-surface-container-high rounded animate-pulse mt-1" />
          )}
        </div>
      </div>

      <div className="h-px bg-outline-variant/50 dark:bg-white/5 w-full" />

      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 text-sm font-semibold text-on-surface">
          <div className="w-8 h-8 rounded-full bg-cyan-100 text-cyan-700 flex items-center justify-center dark:bg-cyan-500/20 dark:text-cyan-300">
            <Icon name="military_tech" size={18} />
          </div>
          {isLoading ? (
            <div className="h-4 w-12 bg-surface-container-high rounded animate-pulse" />
          ) : (
            <span>{t('gamif.student.leaderboard.level', { defaultValue: 'Level' })} {profile?.level ?? 1}</span>
          )}
        </div>

        <div className="flex items-center gap-1.5 text-sm font-semibold text-on-surface">
          <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center dark:bg-amber-500/20 dark:text-amber-300">
            <Icon name="workspace_premium" size={18} />
          </div>
          {isLoading ? (
            <div className="h-4 w-12 bg-surface-container-high rounded animate-pulse" />
          ) : (
            <span>{profile?.badgesEarned ?? 0}</span>
          )}
        </div>
      </div>
    </div>
  );
}
