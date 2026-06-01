import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { ConfirmModal } from './ConfirmModal';

interface ConfirmOptions {
  title?: string;
  message: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  intent?: 'danger' | 'warning' | 'primary';
}

interface ConfirmContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  alert: (options: Omit<ConfirmOptions, 'cancelLabel'>) => Promise<void>;
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const [resolveFn, setResolveFn] = useState<(val: boolean) => void>();

  const confirm = useCallback((opts: ConfirmOptions) => {
    setOptions(opts);
    setIsOpen(true);
    return new Promise<boolean>((resolve) => {
      setResolveFn(() => resolve);
    });
  }, []);

  const alert = useCallback((opts: Omit<ConfirmOptions, 'cancelLabel'>) => {
    setOptions({ ...opts, cancelLabel: undefined }); // omit cancel
    setIsOpen(true);
    return new Promise<void>((resolve) => {
      setResolveFn(() => resolve as any);
    });
  }, []);

  const handleConfirm = useCallback(() => {
    setIsOpen(false);
    resolveFn?.(true);
  }, [resolveFn]);

  const handleCancel = useCallback(() => {
    setIsOpen(false);
    resolveFn?.(false);
  }, [resolveFn]);

  return (
    <ConfirmContext.Provider value={{ confirm, alert }}>
      {children}
      {options && (
        <ConfirmModal
          isOpen={isOpen}
          title={options.title || 'Xác nhận'}
          message={options.message}
          confirmLabel={options.confirmLabel}
          cancelLabel={options.cancelLabel}
          intent={options.intent}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error('useConfirm must be used within a ConfirmProvider');
  }
  return context.confirm;
}

export function useAlert() {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error('useAlert must be used within a ConfirmProvider');
  }
  return context.alert;
}
