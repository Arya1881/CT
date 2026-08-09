import { forwardRef, type HTMLAttributes, type ReactNode, type Ref } from 'react';
import { cn } from '@/lib/cn';

export function Card({ className, ref, ...props }: HTMLAttributes<HTMLDivElement> & { ref?: Ref<HTMLDivElement> }) {
  return (
    <div
      ref={ref}
      className={cn('rounded-xl border border-border bg-card text-card-foreground shadow-sm', className)}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-col space-y-1 p-5 pb-3', className)} {...props} />;
}

export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn('text-sm font-semibold leading-none tracking-tight', className)} {...props} />;
}

export function CardDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('text-xs text-muted-foreground', className)} {...props} />;
}

export function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-5 pt-2', className)} {...props} />;
}

export function CardFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex items-center px-5 pb-5', className)} {...props} />;
}

export const StatCard = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement> & { label: string; value: ReactNode; hint?: ReactNode; icon?: ReactNode }
>(({ label, value, hint, icon, className, ...props }, ref) => (
  <Card ref={ref} className={cn('', className)} {...props}>
    <CardContent className="flex items-start justify-between gap-2 pt-4">
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="mt-1.5 text-2xl font-bold tracking-tight">{value}</p>
        {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      </div>
      {icon && <div className="rounded-lg bg-primary/10 p-2 text-primary">{icon}</div>}
    </CardContent>
  </Card>
));
StatCard.displayName = 'StatCard';
