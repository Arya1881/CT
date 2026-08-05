import { useState } from 'react';
import type { FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Bus, Eye, EyeOff, Shield } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { ApiError } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

const DEMO_ACCOUNTS = [
  { label: 'Student', email: 'student1@campustransit.app', password: 'Student@123' },
  { label: 'Parent', email: 'parent1@campustransit.app', password: 'Parent@123' },
  { label: 'Driver', email: 'driver1@campustransit.app', password: 'Driver@123' },
  { label: 'Admin', email: 'admin@campustransit.app', password: 'Admin@123' },
  { label: 'Management', email: 'management@campustransit.app', password: 'Management@123' },
];

export function LoginPage() {
  const { user, status, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (status === 'authenticated' && user) {
    return <Navigate to="/dashboard" replace />;
  }

  const submit = async (e?: FormEvent) => {
    e?.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to sign in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-4">
      <div className="grid w-full max-w-4xl gap-8 lg:grid-cols-2">
        {/* Left: brand */}
        <div className="hidden flex-col justify-center lg:flex">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-pop">
              <Bus className="h-6 w-6" />
            </div>
            <div>
              <p className="text-2xl font-bold tracking-tight">CampusTransit</p>
              <p className="text-sm text-muted-foreground">Smart College Transportation</p>
            </div>
          </div>
          <h1 className="mt-8 max-w-md text-3xl font-bold leading-tight tracking-tight">
            Live bus tracking, ETA alerts &amp; safe rides for your entire campus.
          </h1>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
            A complete transportation management platform with GPS simulation, role-based dashboards for students,
            parents, drivers and administrators, emergency alerts and deep analytics.
          </p>
          <ul className="mt-6 space-y-2 text-sm text-muted-foreground">
            {['Real-time GPS simulation over Socket.IO', 'ETAs, delays & near-stop alerts', 'Emergency alerts & incident workflow', 'Fleet, route, driver & analytics reports'].map(
              (f) => (
                <li key={f} className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 text-xs">✓</span>
                  {f}
                </li>
              ),
            )}
          </ul>
        </div>

        {/* Right: form */}
        <Card className="shadow-pop">
          <CardContent className="p-6 sm:p-8">
            <div className="mb-6 flex items-center gap-2.5 lg:hidden">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Shield className="h-5 w-5" />
              </div>
              <p className="text-lg font-bold">CampusTransit</p>
            </div>
            <h2 className="text-xl font-bold tracking-tight">Sign in</h2>
            <p className="mt-1 text-sm text-muted-foreground">Use a demo account to explore the platform.</p>

            <form onSubmit={submit} className="mt-6 space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted-foreground">Email</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@campus.edu"
                  autoComplete="email"
                  required
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted-foreground">Password</label>
                <div className="relative">
                  <Input
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    required
                    className="pr-10"
                  />
                  <button
                    type="button"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPw((s) => !s)}
                    aria-label={showPw ? 'Hide password' : 'Show password'}
                  >
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400">{error}</p>
              )}

              <Button type="submit" variant="primary" className="w-full" loading={loading}>
                Sign in
              </Button>
            </form>

            <div className="mt-7">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Demo accounts (click to fill)</p>
              <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                {DEMO_ACCOUNTS.map((a) => (
                  <button
                    key={a.email}
                    type="button"
                    onClick={() => {
                      setEmail(a.email);
                      setPassword(a.password);
                      setError(null);
                    }}
                    className="rounded-lg border border-border px-3 py-2 text-left text-xs transition-colors hover:border-primary/50 hover:bg-primary/5"
                  >
                    <span className="font-semibold">{a.label}</span>
                    <span className="block text-[11px] text-muted-foreground">{a.email}</span>
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
