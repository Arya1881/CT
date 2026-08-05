import React from 'react';
import { LayoutDashboard, Bus, Navigation, Users, ShieldAlert, FileText, Compass, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTracking } from '../context/TrackingContext';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const { user } = useAuth();
  const { alerts } = useTracking();

  if (!user) return null;

  const activeAlerts = alerts.filter(a => a.status === 'ACTIVE').length;

  const adminNav: NavItem[] = [
    { id: 'dashboard', label: 'Fleet Dashboard', icon: LayoutDashboard },
    { id: 'buses', label: 'Bus Management', icon: Bus },
    { id: 'drivers', label: 'Driver Management', icon: Users },
    { id: 'students', label: 'Student Directory', icon: Users },
    { id: 'routes', label: 'Routes & Stops', icon: Navigation },
    { id: 'emergency', label: 'Emergency Console', icon: ShieldAlert, badge: activeAlerts },
    { id: 'reports', label: 'Analytics & Logs', icon: FileText }
  ];

  const driverNav: NavItem[] = [
    { id: 'dashboard', label: 'My Trip & Route', icon: Navigation },
    { id: 'delays', label: 'Report Delay', icon: AlertCircle },
    { id: 'emergency', label: 'Driver SOS Panic', icon: ShieldAlert }
  ];

  const studentNav: NavItem[] = [
    { id: 'dashboard', label: 'Live Bus Tracker', icon: Compass },
    { id: 'emergency', label: 'Student SOS Panic', icon: ShieldAlert }
  ];

  const parentNav: NavItem[] = [
    { id: 'dashboard', label: 'Children Bus Tracker', icon: Users },
    { id: 'emergency', label: 'Safety & Emergency', icon: ShieldAlert }
  ];

  const getNavItems = (): NavItem[] => {
    switch (user.role) {
      case 'ADMIN': return adminNav;
      case 'DRIVER': return driverNav;
      case 'STUDENT': return studentNav;
      case 'PARENT': return parentNav;
      default: return adminNav;
    }
  };

  return (
    <aside className="w-64 glass-panel border-r border-slate-800/80 p-4 flex flex-col justify-between hidden md:flex min-h-[calc(100vh-65px)]">
      <div className="space-y-6">
        <div>
          <p className="px-3 text-[11px] font-extrabold tracking-wider text-slate-400 uppercase">Navigation</p>
          <nav className="mt-3 space-y-1">
            {getNavItems().map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-semibold text-xs transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-cyan-600/30 to-blue-600/30 text-cyan-300 border border-cyan-500/30 shadow-lg shadow-cyan-950/50 scale-[1.02]'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-red-500 text-white shadow-md animate-pulse">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      <div className="glass-card p-3.5 rounded-2xl border border-slate-800 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400">System Mode</span>
          <span className="font-semibold text-emerald-400 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            Operational
          </span>
        </div>
        <div className="text-[11px] text-slate-500 font-mono">
          Where is my Bus v1.0.4
        </div>
      </div>
    </aside>
  );
};
