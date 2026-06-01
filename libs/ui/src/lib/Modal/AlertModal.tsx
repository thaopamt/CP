import React from 'react';
import { Button } from '../Button/Button';
import { Icon } from '../Icon/Icon';
import { cn } from '../cn';

export interface AlertModalProps {
  isOpen: boolean;
  title: string;
  message: React.ReactNode;
  closeLabel?: string;
  onClose: () => void;
  intent?: 'info' | 'warning' | 'error' | 'success';
}

export function AlertModal({
  isOpen,
  title,
  message,
  closeLabel = 'Đóng',
  onClose,
  intent = 'info',
}: AlertModalProps) {
  if (!isOpen) return null;

  // Map intents to icon and button styles
  const config = {
    info: {
      icon: 'info',
      iconClass: 'text-primary bg-primary/10',
    },
    warning: {
      icon: 'warning',
      iconClass: 'text-tertiary bg-tertiary/10',
    },
    error: {
      icon: 'error',
      iconClass: 'text-error bg-error/10',
    },
    success: {
      icon: 'check_circle',
      iconClass: 'text-secondary bg-secondary/10',
    },
  }[intent];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-scrim/50 animate-in fade-in" onClick={onClose}>
      <div 
        className="bg-surface-container-lowest rounded-2xl shadow-elev-3 w-full max-w-sm mx-md animate-in zoom-in-95 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-lg pb-md">
          <div className="flex items-start gap-md">
            <div className={cn('p-sm rounded-full shrink-0', config.iconClass)}>
              <Icon name={config.icon} size={24} />
            </div>
            <div className="flex-1">
              <h3 className="text-headline-sm font-manrope text-on-surface">{title}</h3>
              <div className="mt-xs text-body-md text-on-surface-variant leading-relaxed">
                {message}
              </div>
            </div>
          </div>
        </div>
        
        <div className="p-md pt-0 flex gap-sm justify-end">
          <Button variant="admin" onClick={onClose}>
            {closeLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
