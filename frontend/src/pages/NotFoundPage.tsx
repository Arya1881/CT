import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-4 text-center">
      <p className="text-6xl font-black tracking-tight text-primary">404</p>
      <h1 className="text-xl font-bold">Page not found</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        The page you are looking for doesn't exist or has been moved.
      </p>
      <Button variant="primary" onClick={() => navigate('/dashboard')}>
        Back to dashboard
      </Button>
    </div>
  );
}
