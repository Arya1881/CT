import React from 'react';
import { Bus, ShieldAlert, User, LogOut, ChevronDown, Radio } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTracking } from '../context/TrackingContext';
import type { UserRole } from '../types';

export const Navbar: React.FC = () => {
  const { user, switchRole, logout } = useAuth();
  const { alerts } = useTracking();
  const activeSOSCount = alerts.filter(a => a.status === 'ACTIVE').length;

  const roleLabels: Record<string, { label: string; color: string }> = {
    ADMIN: { label: 'Admin Command', color: 'bg-orange-100 text-orange-700 border-orange-300' },
    MANAGEMENT: { label: 'Management Portal', color: 'bg-amber-100 text-amber-800 border-amber-300' },
    DRIVER: { label: 'Driver Console', color: 'bg-orange-100 text-orange-700 border-orange-300' },
    STUDENT: { label: 'Student Portal', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
    PARENT: { label: 'Parent Family View', color: 'bg-orange-100 text-orange-700 border-orange-300' }
  };

  const currentRoleConfig = roleLabels[user.role] || roleLabels.ADMIN;

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-orange-100 px-4 lg:px-8 py-3.5 flex items-center justify-between shadow-sm font-['Plus_Jakarta_Sans',sans-serif]">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-500/20 border border-orange-300">
          <Bus className="w-6 h-6 text-white" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="font-extrabold text-xl tracking-tight text-slate-900 font-heading">
              Where Is My Bus
            </h1>
            <span className="flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-orange-100 text-orange-600 border border-orange-200">
              <Radio className="w-2.5 h-2.5 animate-pulse text-orange-600" />
              <span>LIVE GPS</span>
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium hidden sm:block">Sahrdaya College of Engineering & Technology</p>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        {/* Role Switcher Demo */}
        <div className="relative group">
          <button className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-xl border text-xs font-extrabold transition-all shadow-sm ${currentRoleConfig.color}`}>
            <span>Role: {user.role}</span>
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
          
          <div className="absolute right-0 mt-2 w-52 py-2 bg-white rounded-2xl shadow-2xl border border-orange-100 hidden group-hover:block transition-all z-50">
            <div className="px-3 py-1 text-[10px] font-black text-slate-400 uppercase tracking-wider">Switch Portal View</div>
            {(['MANAGEMENT', 'ADMIN', 'DRIVER', 'STUDENT', 'PARENT'] as UserRole[]).map((r) => (
              <button
                key={r}
                onClick={() => switchRole(r)}
                className={`w-full text-left px-3.5 py-2 text-xs font-bold hover:bg-orange-50 transition-colors ${user.role === r ? 'text-orange-600 font-black bg-orange-50' : 'text-slate-700'}`}
              >
                {r === 'MANAGEMENT' && '🏆 Executive Management'}
                {r === 'ADMIN' && '🛠️ Admin Command'}
                {r === 'DRIVER' && '🚌 Driver Console'}
                {r === 'STUDENT' && '👨‍🎓 Student Portal'}
                {r === 'PARENT' && '👨‍👩‍👧‍¨ Parent Family View'}
              </button>
            ))}
          </div>
        </div>

        {activeSOSCount > 0 && (
          <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-red-100 text-red-600 border border-red-200 font-extrabold text-xs animate-pulse">
            <ShieldAlert className="w-4 h-4 text-red-600" />
            <span>{activeSOSCount} Active SOS</span>
          </div>
        )}

        <div className="flex items-center space-x-3 pl-3 border-l border-slate-200">
          <div className="w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center overflow-hidden border border-orange-200">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              <User className="w-4 h-4 text-orange-600" />
            )}
          </div>
          <div className="hidden md:block text-left">
            <p className="text-xs font-black text-slate-900">{user.name}</p>
            <p className="text-[11px] text-slate-500 font-medium">{user.email}</p>
          </div>
          <button
            onClick={logout}
            title="Logout"
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
