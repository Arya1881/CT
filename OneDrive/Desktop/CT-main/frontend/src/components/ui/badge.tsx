import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export type BadgeTone = 'default' | 'primary' | 'success' | 'warning' | 'destructive' | 'info' | 'muted';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
}

const tones: Record<BadgeTone, string> = {
  default: 'bg-surface-raised text-foreground border-border',
  primary: 'bg-primary/15 text-primary border-primary/30',
  success: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30 dark:text-emerald-400',
  warning: 'bg-amber-500/15 text-amber-600 border-amber-500/30 dark:text-amber-400',
  destructive: 'bg-red-500/15 text-red-600 border-red-500/30 dark:text-red-400',
  info: 'bg-sky-500/15 text-sky-600 border-sky-500/30 dark:text-sky-400',
  muted: 'bg-muted text-muted-foreground border-transparent',
};

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, tone = 'default', ...props }, ref) => (
    <span
      ref={ref}
      className={cn(
        'inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-medium',
        tones[tone],
        className,
      )}
      {...props}
    />
  ),
);
Badge.displayName = 'Badge';
