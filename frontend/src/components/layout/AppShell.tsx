import { useState } from 'react';
import type { ReactNode } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Bell,
  Bus,
  Clock,
  Gauge,
  GraduationCap,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Map as MapIcon,
  Menu,
  Route as RouteIcon,
  ScrollText,
  Settings,
  Shield,
  UserRound,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/components/ui/toast';
import { useRealtimeEvents } from '@/hooks/useRealtimeEvents';
import { useUnreadCount } from '@/hooks/queries';
import { EVENTS } from '@/lib/socket-events';
import { NOTIFICATION_TYPE, TRIP_STATUS } from '@/lib/format';
import { cn } from '@/lib/cn';
import type { EmergencyAlert, Notification as NotificationType, Trip } from '@/types';

interface NavItem {
  to: string;
  label: string;
  icon: ReactNode;
  end?: boolean;
}

function roleNav(role: string, isAdmin: boolean): NavItem[] {
  if (role === 'student') {
    return [
      { to: '/dashboard', label: 'My Bus', icon: <LayoutDashboard className="h-4 w-4" />, end: true },
      { to: '/student/trips', label: 'Trip History', icon: <ListChecks className="h-4 w-4" /> },
    ];
  }
  if (role === 'parent') {
    return [
      { to: '/dashboard', label: 'My Children', icon: <Users className="h-4 w-4" />, end: true },
    ];
  }
  if (role === 'driver') {
    return [
      { to: '/dashboard', label: 'Dashboard', icon: <Gauge className="h-4 w-4" />, end: true },
      { to: '/driver/trips', label: 'My Trips', icon: <Clock className="h-4 w-4" /> },
    ];
  }
  const items: NavItem[] = [
    { to: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" />, end: true },
    { to: '/admin/live', label: 'Live Map', icon: <MapIcon className="h-4 w-4" /> },
    { to: '/admin/buses', label: 'Buses', icon: <Bus className="h-4 w-4" /> },
    { to: '/admin/routes', label: 'Routes', icon: <RouteIcon className="h-4 w-4" /> },
    { to: '/admin/drivers', label: 'Drivers', icon: <UserRound className="h-4 w-4" /> },
    { to: '/admin/students', label: 'Students', icon: <GraduationCap className="h-4 w-4" /> },
    { to: '/admin/trips', label: 'Trips', icon: <ListChecks className="h-4 w-4" /> },
    { to: '/admin/alerts', label: 'Emergency', icon: <AlertTriangle className="h-4 w-4" /> },
  ];
  if (isAdmin) {
    items.push({ to: '/admin/settings', label: 'Settings', icon: <Settings className="h-4 w-4" /> });
    items.push({ to: '/admin/audit', label: 'Audit Log', icon: <ScrollText className="h-4 w-4" /> });
  }
  return items;
}

function pageTitle(pathname: string): string {
  const map: Record<string, string> = {
    '/dashboard': 'Dashboard',
    '/student/trips': 'My Trips',
    '/parent/children': 'My Children',
    '/driver/trips': 'My Trips',
    '/admin/live': 'Live Fleet Map',
    '/admin/buses': 'Bus Fleet',
    '/admin/routes': 'Routes & Stops',
    '/admin/drivers': 'Drivers',
    '/admin/students': 'Students',
    '/admin/trips': 'Trips',
    '/admin/alerts': 'Emergency Alerts',
    '/admin/settings': 'Settings',
    '/admin/audit': 'Audit Log',
  };
  return map[pathname] ?? 'CampusTransit';
}

function NotificationBell({ show }: { show: boolean }) {
  const navigate = useNavigate();
  const { data } = useUnreadCount();
  const count = data?.count ?? 0;
  if (!show) return null;
  return (
    <button
      onClick={() => navigate('/admin/alerts')}
      className="relative rounded-md p-2 text-muted-foreground hover:bg-surface-hover hover:text-foreground"
      aria-label="Notifications"
    >
      <Bell className="h-5 w-5" />
      {count > 0 && (
        <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </button>
  );
}

function UserMenu() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  if (!user) return null;
  const initials = `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase() || '?';
  return (
    <div className="flex items-center gap-3">
      <NotificationBell show={user.role === 'admin' || user.role === 'management'} />
      <button
        onClick={() => navigate('/dashboard')}
        className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-surface-hover"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
          {initials}
        </div>
        <div className="hidden text-left sm:block">
          <p className="text-sm font-medium leading-tight">
            {user.firstName} {user.lastName}
          </p>
          <p className="text-xs capitalize text-muted-foreground">{user.role}</p>
        </div>
      </button>
      <button
        onClick={() => {
          logout();
          navigate('/login');
        }}
        className="rounded-md p-2 text-muted-foreground hover:bg-surface-hover hover:text-foreground"
        title="Log out"
      >
        <LogOut className="h-4 w-4" />
      </button>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const location = useLocation();
  const { toast } = useToast();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isAdmin = user?.role === 'admin';
  const nav = user ? roleNav(user.role, isAdmin) : [];

  // Realtime notifications → toasts
  useRealtimeEvents((event, payload) => {
    switch (event) {
      case EVENTS.NOTIFICATION: {
        const n = payload as NotificationType;
        const tone = NOTIFICATION_TYPE[n.type]?.tone ?? 'default';
        toast(n.title, { message: n.message, tone });
        break;
      }
      case EVENTS.TRIP_STARTED: {
        const { trip } = payload as { trip: Trip };
        toast('Trip started', {
          message: trip.route?.name ? `${trip.route.name} is now in service.` : undefined,
          tone: 'success',
        });
        break;
      }
      case EVENTS.TRIP_COMPLETED: {
        const { trip } = payload as { trip: Trip };
        toast('Trip completed', {
          message: trip.route?.name ? `${trip.route.name} trip completed.` : undefined,
          tone: 'info',
        });
        break;
      }
      case EVENTS.TRIP_DELAYED: {
        const { delayMinutes } = payload as { delayMinutes: number };
        toast('Bus delayed', { message: `Bus running ${delayMinutes} min late.`, tone: 'warning' });
        break;
      }
      case EVENTS.BUS_NEAR_STOP: {
        const { stopName } = payload as { stopName: string };
        toast('Bus near stop', { message: `Approaching ${stopName}.`, tone: 'info' });
        break;
      }
      case EVENTS.EMERGENCY_ALERT: {
        const a = payload as EmergencyAlert;
        toast('Emergency alert raised', {
          message: `Type: ${a.type}. Action required.`,
          tone: 'destructive',
        });
        break;
      }
    }
  });

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar (desktop) */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-border bg-card lg:flex">
        <SidebarContent nav={nav} />
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/50 animate-fade-in-overlay" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-64 flex-col border-r border-border bg-card">
            <div className="flex items-center justify-between p-4">
              <Brand />
              <button className="rounded-md p-1 text-muted-foreground" onClick={() => setMobileOpen(false)} aria-label="Close menu">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-3 pb-6">
              <SidebarContent nav={nav} onNavigate={() => setMobileOpen(false)} />
            </div>
          </aside>
        </div>
      )}

      {/* Main column */}
      <div className="flex min-h-screen flex-1 flex-col lg:pl-60">
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-border bg-background/90 px-4 backdrop-blur sm:px-6">
          <div className="flex items-center gap-3">
            <button
              className="rounded-md p-2 text-muted-foreground hover:bg-surface-hover lg:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="text-base font-semibold tracking-tight">{pageTitle(location.pathname)}</h1>
          </div>
          <UserMenu />
        </header>
        <main className="flex-1 px-4 py-6 sm:px-6">{children}</main>
        <footer className="border-t border-border px-6 py-4 text-xs text-muted-foreground">
          CampusTransit · Smart College Transportation Management · Demo build
        </footer>
      </div>
    </div>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <Shield className="h-5 w-5" />
      </div>
      <div className="leading-tight">
        <p className="text-sm font-bold tracking-tight">CampusTransit</p>
        <p className="text-[11px] text-muted-foreground">College Transport</p>
      </div>
    </div>
  );
}

function SidebarContent({ nav, onNavigate }: { nav: NavItem[]; onNavigate?: () => void }) {
  return (
    <>
      <div className="flex h-14 items-center border-b border-border px-4">
        <Brand />
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
        {nav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-surface-hover hover:text-foreground',
              )
            }
          >
            {item.icon}
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-border p-3 text-[11px] text-muted-foreground">
        <p className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          Live simulation active
        </p>
      </div>
    </>
  );
}
