import React, { useState } from 'react';
import { Bus, Eye, EyeOff, ArrowRight } from 'lucide-react';
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
      demoUser: USERS.find(u => u.role === 'STUDENT') || USERS[8]
    },
    {
      role: 'PARENT',
      label: 'Parent Portal',
      description: 'Monitor children in transit & safety helpline',
      demoUser: USERS.find(u => u.role === 'PARENT') || USERS[7]
    },
    {
      role: 'DRIVER',
      label: 'Driver Portal',
      description: 'Vehicle trip simulation & delay reporting',
      demoUser: USERS.find(u => u.role === 'DRIVER') || USERS[2]
    },
    {
      role: 'MANAGEMENT',
      label: 'Management Portal',
      description: 'Executive oversight, rosters & emergency control',
      demoUser: USERS.find(u => u.role === 'MANAGEMENT') || USERS[0]
    },
    {
      role: 'ADMIN',
      label: 'Admin Portal',
      description: 'Fleet management, roster & route control',
      demoUser: USERS.find(u => u.role === 'ADMIN') || USERS[1]
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
    <div className="min-h-screen bg-[#fff9f5] text-slate-800 flex flex-col justify-between p-4 md:p-8 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Top Header */}
      <header className="max-w-4xl w-full mx-auto flex items-center justify-between py-4 border-b border-orange-100">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 flex items-center justify-center text-white shadow-md shadow-orange-500/20">
            <Bus className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-slate-900 font-heading">Where Is My Bus</h1>
            <p className="text-xs text-slate-500 font-medium">Sahrdaya College Transportation Portal</p>
          </div>
        </div>
      </header>

      {/* Main Login Body */}
      <main className="max-w-md w-full mx-auto my-8 space-y-6">
        <div className="text-center space-y-1">
          <h2 className="text-2xl font-black text-slate-900">Sign In</h2>
          <p className="text-xs text-slate-500 font-bold">Select your portal to log into your account</p>
        </div>

        {/* Portal Selector Tabs */}
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5 p-1.5 bg-white rounded-2xl border border-orange-200 shadow-md">
          {portals.map(p => (
            <button
              key={p.role}
              type="button"
              onClick={() => handleRoleSelect(p.role)}
              className={`py-2 px-2 rounded-xl text-[11px] font-black transition-all text-center ${
                selectedRole === p.role
                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-orange-50'
              }`}
            >
              {p.label.replace(' Portal', '')}
            </button>
          ))}
        </div>

        {/* Form Container */}
        <div className="bg-white rounded-3xl border border-orange-100 p-6 space-y-5 shadow-xl">
          <div className="space-y-1 border-b border-orange-100 pb-3">
            <h3 className="text-sm font-black text-slate-900">{currentPortal.label}</h3>
            <p className="text-xs text-slate-500 font-semibold">{currentPortal.description}</p>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Email or Username</label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="user@sahrdaya.ac.in"
                  required
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-orange-200 text-xs text-slate-900 font-bold placeholder-slate-400 focus:outline-none focus:border-orange-500 focus:bg-white"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-orange-200 text-xs text-slate-900 font-bold placeholder-slate-400 focus:outline-none focus:border-orange-500 focus:bg-white pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-red-600 text-xs font-bold">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black text-xs tracking-wider shadow-lg shadow-orange-500/30 transition-all flex items-center justify-center space-x-2"
            >
              <span>Sign In to {currentPortal.label}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Sign In Shortcut */}
          <div className="pt-3 border-t border-orange-100 space-y-2">
            <p className="text-[11px] font-bold text-slate-500">Quick Demo Access:</p>
            <button
              type="button"
              onClick={() => handleQuickDemoLogin(selectedRole)}
              className="w-full p-3 rounded-2xl bg-orange-50 border border-orange-200 hover:border-orange-300 text-left transition-colors flex items-center justify-between text-xs"
            >
              <div>
                <span className="font-black text-slate-900">{currentPortal.demoUser.name}</span>
                <span className="block text-[11px] text-slate-500 font-medium">{currentPortal.demoUser.email}</span>
              </div>
              <span className="text-[11px] font-black text-orange-600">1-Click Sign In &rarr;</span>
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-4xl w-full mx-auto pt-4 border-t border-orange-100 text-center text-xs text-slate-500 font-bold">
        Where Is My Bus &copy; 2026. Sahrdaya College of Engineering and Technology.
      </footer>
    </div>
  );
};
