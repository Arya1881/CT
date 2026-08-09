import React from 'react';
import { LayoutDashboard, Bus, Navigation, Users, ShieldAlert, Compass, AlertCircle, ShieldCheck, Award } from 'lucide-react';
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

  const managementNav: NavItem[] = [
    { id: 'dashboard', label: 'Executive Dashboard', icon: Award },
    { id: 'buses', label: 'Fleet Oversight', icon: Bus },
    { id: 'drivers', label: 'Driver Rosters', icon: Users },
    { id: 'students', label: 'Student Transport Passes', icon: Users },
    { id: 'routes', label: 'Route Corridors', icon: Navigation },
    { id: 'emergency', label: 'Emergency Command', icon: ShieldAlert, badge: activeAlerts }
  ];

  const adminNav: NavItem[] = [
    { id: 'dashboard', label: 'Fleet Dashboard', icon: LayoutDashboard },
    { id: 'buses', label: 'Bus Management', icon: Bus },
    { id: 'drivers', label: 'Driver Management', icon: Users },
    { id: 'students', label: 'Student Directory', icon: Users },
    { id: 'routes', label: 'Routes & Stops', icon: Navigation },
    { id: 'emergency', label: 'Emergency Console', icon: ShieldAlert, badge: activeAlerts }
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
    { id: 'safety', label: 'Safety Guidelines & Contacts', icon: ShieldCheck }
  ];

  const getNavItems = (): NavItem[] => {
    switch (user.role) {
      case 'MANAGEMENT': return managementNav;
      case 'ADMIN': return adminNav;
      case 'DRIVER': return driverNav;
      case 'STUDENT': return studentNav;
      case 'PARENT': return parentNav;
      default: return adminNav;
    }
  };

  return (
    <aside className="w-64 bg-white border-r border-orange-100 p-4 flex flex-col justify-between hidden md:flex min-h-[calc(100vh-65px)] shadow-sm font-['Plus_Jakarta_Sans',sans-serif]">
      <div className="space-y-6">
        <div>
          <p className="px-3 text-[10px] font-black tracking-wider text-slate-400 uppercase">Navigation</p>
          <nav className="mt-3 space-y-1.5">
            {getNavItems().map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl font-black text-xs transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/20 scale-[1.02]'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-orange-50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-red-500 text-white shadow-md animate-pulse">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      <div className="bg-orange-50 p-4 rounded-2xl border border-orange-200 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-500 font-bold">System Status</span>
          <span className="font-black text-emerald-600 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            Operational
          </span>
        </div>
        <div className="text-[11px] text-slate-500 font-mono font-bold">
          Where Is My Bus v2.0 Live
        </div>
      </div>
    </aside>
  );
};
