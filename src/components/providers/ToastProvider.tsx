'use client';

import * as React from 'react';
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider as RadixToastProvider,
  ToastTitle,
  ToastViewport,
} from '@/components/ui/Toast';

interface ToastItem {
  id: string;
  title?: string;
  description: string;
  variant?: 'default' | 'success' | 'destructive' | 'warning' | 'info';
  duration: number;
}

interface ToastContextType {
  toast: (toast: Omit<ToastItem, 'id'>) => void;
  success: (description: string, title?: string) => void;
  error: (description: string, title?: string) => void;
  warning: (description: string, title?: string) => void;
  info: (description: string, title?: string) => void;
}

const ToastContext = React.createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);

  const addToast = React.useCallback((toast: Omit<ToastItem, 'id' | 'duration'> & { duration?: number }) => {
    const id = Math.random().toString(36).substring(2, 9);
    const duration = toast.duration ?? 5000;
    const newToast: ToastItem = {
      id,
      ...toast,
      duration,
    };

    setToasts((prevToasts) => [...prevToasts, newToast]);

    // Auto remove toast after duration
    if (duration > 0) {
      setTimeout(() => {
        setToasts((prevToasts) => prevToasts.filter((t) => t.id !== id));
      }, duration);
    }
  }, []);

  const removeToast = React.useCallback((id: string) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  }, []);

  const success = React.useCallback(
    (description: string, title?: string) => {
      addToast({
        title,
        description,
        variant: 'success',
      });
    },
    [addToast]
  );

  const error = React.useCallback(
    (description: string, title?: string) => {
      addToast({
        title,
        description,
        variant: 'destructive',
      });
    },
    [addToast]
  );

  const warning = React.useCallback(
    (description: string, title?: string) => {
      addToast({
        title,
        description,
        variant: 'warning',
      });
    },
    [addToast]
  );

  const info = React.useCallback(
    (description: string, title?: string) => {
      addToast({
        title,
        description,
        variant: 'info',
      });
    },
    [addToast]
  );

  const contextValue = React.useMemo(
    () => ({
      toast: addToast,
      success,
      error,
      warning,
      info,
    }),
    [addToast, success, error, warning, info]
  );

  return (
    <ToastContext.Provider value={contextValue}>
      <RadixToastProvider swipeDirection="right">
        {children}
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            variant={toast.variant}
            duration={toast.duration}
            onOpenChange={(open) => !open && removeToast(toast.id)}
          >
            <div className="grid gap-1">
              {toast.title && <ToastTitle>{toast.title}</ToastTitle>}
              <ToastDescription>{toast.description}</ToastDescription>
            </div>
            <ToastClose />
          </Toast>
        ))}
        <ToastViewport />
      </RadixToastProvider>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = React.useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
} 