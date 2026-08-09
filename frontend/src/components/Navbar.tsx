import React from 'react';
import { Bus, ShieldAlert, User, LogOut, ChevronDown, Radio, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTracking } from '../context/TrackingContext';
import type { UserRole } from '../types';

export const Navbar: React.FC = () => {
  const { user, switchRole, logout } = useAuth();
  const { alerts } = useTracking();
  const activeSOSCount = alerts.filter(a => a.status === 'ACTIVE').length;

  if (!user) return null;

  const roleLabels: Record<string, { label: string; color: string }> = {
    ADMIN: { label: 'Admin Command', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
    DRIVER: { label: 'Driver Console', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
    STUDENT: { label: 'Student Portal', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
    PARENT: { label: 'Parent Family View', color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' }
  };

  const currentRoleConfig = roleLabels[user.role] || roleLabels.ADMIN;

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-800/80 px-4 lg:px-8 py-3.5 flex items-center justify-between shadow-2xl backdrop-blur-xl">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 border border-cyan-400/30">
          <Bus className="w-6 h-6 text-white animate-pulse" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="font-extrabold text-xl tracking-tight text-white">
              Where is my Bus
            </h1>
            <span className="flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Radio className="w-2.5 h-2.5 animate-pulse text-emerald-400" />
              <span>LIVE SSE</span>
            </span>
          </div>
          <p className="text-xs text-slate-400 hidden sm:block">Live Transportation Tracking</p>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        {/* Switch Role Quick Dropdown */}
        <div className="relative group">
          <button className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${currentRoleConfig.color}`}>
            <span>Role: {user.role}</span>
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
          
          <div className="absolute right-0 mt-2 w-52 py-2 glass-panel rounded-xl shadow-2xl border border-slate-700/60 hidden group-hover:block transition-all z-50">
            <div className="px-3 py-1 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>Switch Portal</span>
              <Sparkles className="w-3 h-3 text-amber-400" />
            </div>
            {(['ADMIN', 'DRIVER', 'STUDENT', 'PARENT'] as UserRole[]).map((r) => (
              <button
                key={r}
                onClick={() => switchRole(r)}
                className={`w-full text-left px-3 py-2 text-xs font-medium hover:bg-slate-800/80 transition-colors flex items-center justify-between ${user.role === r ? 'text-cyan-400 font-bold bg-slate-800/40' : 'text-slate-300'}`}
              >
                <span>
                  {r === 'ADMIN' && '🛠️ Admin Command'}
                  {r === 'DRIVER' && '🚌 Driver Console'}
                  {r === 'STUDENT' && '🎓 Student Portal'}
                  {r === 'PARENT' && '👨‍👩‍👧‍👦 Parent Family View'}
                </span>
                {user.role === r && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />}
              </button>
            ))}
          </div>
        </div>

        {/* SOS Counter Badge */}
        {activeSOSCount > 0 && (
          <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 font-semibold text-xs animate-pulse">
            <ShieldAlert className="w-4 h-4 text-red-400" />
            <span>{activeSOSCount} SOS Active</span>
          </div>
        )}

        {/* User Info & Logout Button */}
        <div className="flex items-center space-x-3 pl-3 border-l border-slate-800">
          <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center overflow-hidden border border-slate-700">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              <User className="w-4 h-4 text-slate-300" />
            )}
          </div>
          <div className="hidden md:block text-left">
            <p className="text-xs font-bold text-slate-200">{user.name}</p>
            <p className="text-[11px] text-slate-400">{user.email}</p>
          </div>
          <button
            onClick={logout}
            title="Log Out to Role Selection"
            className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline text-xs font-semibold">Sign Out</span>
          </button>
        </div>
      </div>
    </header>
  );
};
