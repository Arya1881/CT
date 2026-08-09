import React, { useState } from 'react';
import { Bus, Eye, EyeOff, Lock, User, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { USERS } from '../../mockData';
import type { User as UserType, UserRole } from '../../types';

interface RolePortal {
  role: UserRole;
  label: string;
  description: string;
  demoUser: UserType;
}

export const MultiRoleLogin: React.FC = () => {
  const { login } = useAuth();
  const [selectedRole, setSelectedRole] = useState<UserRole>('STUDENT');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const portals: RolePortal[] = [
    {
      role: 'STUDENT',
      label: 'Student Portal',
      description: 'Track assigned bus & live arrival ETAs',
      demoUser: USERS.find(u => u.role === 'STUDENT') || USERS[7]
    },
    {
      role: 'PARENT',
      label: 'Parent Portal',
      description: 'Monitor children in transit & safety alerts',
      demoUser: USERS.find(u => u.role === 'PARENT') || USERS[6]
    },
    {
      role: 'DRIVER',
      label: 'Driver Portal',
      description: 'Vehicle trip simulation & delay reporting',
      demoUser: USERS.find(u => u.role === 'DRIVER') || USERS[1]
    },
    {
      role: 'ADMIN',
      label: 'Admin Portal',
      description: 'Fleet management, roster & route control',
      demoUser: USERS.find(u => u.role === 'ADMIN') || USERS[0]
    }
  ];

  const currentPortal = portals.find(p => p.role === selectedRole) || portals[0];

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    const matchedUser = USERS.find(u => u.role === role);
    if (matchedUser) {
      setEmail(matchedUser.email);
      setPassword('password123');
    }
    setError(null);
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const matchedUser = USERS.find(
      u => u.email.toLowerCase() === email.toLowerCase() && u.role === selectedRole
    ) || USERS.find(u => u.role === selectedRole);

    if (matchedUser) {
      login(matchedUser);
    } else {
      setError(`No account found for ${selectedRole} portal with email ${email}`);
    }
  };

  const handleQuickDemoLogin = (role: UserRole) => {
    const demoUser = USERS.find(u => u.role === role) || USERS[0];
    login(demoUser);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-4 md:p-8 font-sans">
      {/* Top Header */}
      <header className="max-w-4xl w-full mx-auto flex items-center justify-between py-4 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md">
            <Bus className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">Where is my Bus</h1>
            <p className="text-xs text-slate-400">Transportation Portal</p>
          </div>
        </div>
      </header>

      {/* Main Login Body */}
      <main className="max-w-md w-full mx-auto my-8 space-y-6">
        <div className="text-center space-y-1">
          <h2 className="text-2xl font-bold text-white">Sign In</h2>
          <p className="text-xs text-slate-400">Select your portal to log into your account</p>
        </div>

        {/* Minimalist Portal Selector Tabs */}
        <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-900 rounded-xl border border-slate-800">
          {portals.map(p => (
            <button
              key={p.role}
              type="button"
              onClick={() => handleRoleSelect(p.role)}
              className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all text-center ${
                selectedRole === p.role
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Minimalist Form Container */}
        <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 space-y-5 shadow-xl">
          <div className="space-y-1 border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white">{currentPortal.label}</h3>
            <p className="text-xs text-slate-400">{currentPortal.description}</p>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Email or Username</label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="user@campus.edu"
                  required
                  className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors flex items-center justify-center space-x-2"
            >
              <span>Sign In to {currentPortal.label}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Sign In Shortcut */}
          <div className="pt-3 border-t border-slate-800 space-y-2">
            <p className="text-[11px] font-medium text-slate-400">Quick Demo Access:</p>
            <button
              type="button"
              onClick={() => handleQuickDemoLogin(selectedRole)}
              className="w-full p-2.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 text-left transition-colors flex items-center justify-between text-xs"
            >
              <div>
                <span className="font-bold text-white">{currentPortal.demoUser.name}</span>
                <span className="block text-[11px] text-slate-400">{currentPortal.demoUser.email}</span>
              </div>
              <span className="text-[11px] font-semibold text-blue-400">1-Click Sign In &rarr;</span>
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-4xl w-full mx-auto pt-4 border-t border-slate-800 text-center text-xs text-slate-500">
        Where is my Bus &copy; 2026. All rights reserved.
      </footer>
    </div>
  );
};
