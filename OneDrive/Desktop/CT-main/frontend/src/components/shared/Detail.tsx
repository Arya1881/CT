import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export function DetailRow({
  label,
  value,
  className,
}: {
  label: ReactNode;
  value?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex items-start justify-between gap-4 py-1.5', className)}>
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-right text-sm font-medium">{value ?? '—'}</span>
    </div>
  );
}

export function StatPill({ label, value, tone }: { label: string; value: ReactNode; tone?: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface-raised p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={cn('mt-1 text-xl font-bold', tone === 'success' && 'text-emerald-600 dark:text-emerald-400', tone === 'danger' && 'text-red-600 dark:text-red-400', tone === 'warn' && 'text-amber-600 dark:text-amber-400')}>
        {value}
      </p>
    </div>
  );
}
