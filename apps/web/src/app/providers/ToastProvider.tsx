import { create } from 'zustand';
import { Icon } from '@cp/ui';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastStore {
  toasts: ToastMessage[];
  addToast: (message: string, type?: ToastType) => void;
  removeToast: (id: string) => void;
}

const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  addToast: (message, type = 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    set((state) => ({ toasts: [...state.toasts, { id, message, type }] }));
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    }, 3000);
  },
  removeToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));

export function useToast() {
  return useToastStore((state) => ({
    success: (msg: string) => state.addToast(msg, 'success'),
    error: (msg: string) => state.addToast(msg, 'error'),
    info: (msg: string) => state.addToast(msg, 'info'),
    warning: (msg: string) => state.addToast(msg, 'warning'),
  }));
}

export function ToastProvider() {
  const toasts = useToastStore((state) => state.toasts);
  const removeToast = useToastStore((state) => state.removeToast);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 50, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.95, transition: { duration: 0.2 } }}
            className={`pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl shadow-elev-3 max-w-sm w-full font-body-md text-[14px] border border-white/10 ${
              toast.type === 'error'
                ? 'bg-error text-on-error'
                : toast.type === 'success'
                ? 'bg-inverse-surface text-inverse-on-surface'
                : toast.type === 'warning'
                ? 'bg-tertiary-container text-on-tertiary-container'
                : 'bg-surface-container-highest text-on-surface'
            }`}
          >
            <div className="mt-0.5 shrink-0">
              <Icon
                name={
                  toast.type === 'error'
                    ? 'error'
                    : toast.type === 'success'
                    ? 'check_circle'
                    : toast.type === 'warning'
                    ? 'warning'
                    : 'info'
                }
                size={20}
                className={
                  toast.type === 'error'
                    ? 'text-on-error'
                    : toast.type === 'success'
                    ? 'text-primary'
                    : toast.type === 'warning'
                    ? 'text-tertiary'
                    : 'text-primary'
                }
              />
            </div>
            <span className="flex-1 whitespace-pre-wrap">{toast.message}</span>
            <button onClick={() => removeToast(toast.id)} className="opacity-70 hover:opacity-100 transition-opacity mt-0.5 shrink-0">
              <Icon name="close" size={18} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
