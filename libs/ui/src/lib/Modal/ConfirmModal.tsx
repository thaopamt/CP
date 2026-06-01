import React from 'react';
import { Button } from '../Button/Button';
import { Icon } from '../Icon/Icon';
import { cn } from '../cn';

export interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  /** 'danger' | 'warning' | 'primary' */
  intent?: 'danger' | 'warning' | 'primary';
  /** Indicates if button should show loading state */
  isLoading?: boolean;
}

export function ConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel = 'Xác nhận',
  cancelLabel = 'Huỷ',
  onConfirm,
  onCancel,
  isLoading = false,
  intent = 'danger',
}: ConfirmModalProps) {
  if (!isOpen) return null;

  // Map intents to icon and button styles
  const config = {
    danger: {
      icon: 'delete',
      iconClass: 'text-error bg-error/10',
      btnVariant: 'danger' as const,
    },
    warning: {
      icon: 'warning',
      iconClass: 'text-tertiary bg-tertiary/10',
      btnVariant: 'admin' as const,
    },
    primary: {
      icon: 'help',
      iconClass: 'text-primary bg-primary/10',
      btnVariant: 'admin' as const,
    },
  }[intent];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-scrim/50 animate-in fade-in" onClick={onCancel}>
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
          {cancelLabel && (
            <Button variant="ghost" onClick={onCancel} disabled={isLoading}>
              {cancelLabel}
            </Button>
          )}
          <Button 
            variant={config.btnVariant} 
            onClick={onConfirm} 
            disabled={isLoading}
            trailingIcon={isLoading ? <Icon name="progress_activity" size={18} className="animate-spin" /> : undefined}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
