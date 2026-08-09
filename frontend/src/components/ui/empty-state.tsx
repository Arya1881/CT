import type { ReactNode } from 'react';
import { Inbox } from 'lucide-react';

export function EmptyState({
  title,
  message,
  action,
}: {
  title: string;
  message?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border py-12 text-center">
      <div className="rounded-full bg-muted p-3 text-muted-foreground">
        <Inbox className="h-6 w-6" />
      </div>
      <p className="text-sm font-medium">{title}</p>
      {message && <p className="max-w-sm text-xs text-muted-foreground">{message}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
