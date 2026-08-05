import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { AlertCircle, AlertTriangle, Bell, CheckCircle2, X } from 'lucide-react';
import { cn } from '@/lib/cn';

export type ToastTone = 'default' | 'success' | 'warning' | 'destructive' | 'info';

interface Toast {
  id: string;
  title: string;
  message?: string;
  tone: ToastTone;
}

interface ToastContextValue {
  toast: (title: string, opts?: { message?: string; tone?: ToastTone }) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const ICONS: Record<ToastTone, ReactNode> = {
  default: <Bell className="h-4 w-4" />,
  success: <CheckCircle2 className="h-4 w-4 text-emerald-500" />,
  warning: <AlertTriangle className="h-4 w-4 text-amber-500" />,
  destructive: <AlertCircle className="h-4 w-4 text-red-500" />,
  info: <Bell className="h-4 w-4 text-sky-500" />,
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((title: string, opts?: { message?: string; tone?: ToastTone }) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setToasts((prev) => [...prev.slice(-3), { id, title, message: opts?.message, tone: opts?.tone ?? 'default' }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 5200);
  }, []);

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-[100] flex w-full max-w-sm flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              'pointer-events-auto animate-fade-in rounded-lg border bg-card p-3 shadow-pop',
              t.tone === 'destructive' && 'border-red-500/40',
              t.tone === 'warning' && 'border-amber-500/40',
              t.tone === 'success' && 'border-emerald-500/40',
              t.tone === 'info' && 'border-sky-500/40',
            )}
          >
            <div className="flex items-start gap-2">
              <div className="mt-0.5">{ICONS[t.tone]}</div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold leading-tight">{t.title}</p>
                {t.message && <p className="mt-0.5 text-xs text-muted-foreground">{t.message}</p>}
              </div>
              <button
                className="text-muted-foreground hover:text-foreground"
                onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
                aria-label="Dismiss"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
}
