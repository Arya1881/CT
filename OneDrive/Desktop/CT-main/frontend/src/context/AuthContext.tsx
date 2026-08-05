import React, { createContext, useContext, useState } from 'react';
import type { User, UserRole } from '../types';
import { USERS } from '../mockData';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  selectedRole: UserRole | null;
  setSelectedRole: (role: UserRole | null) => void;
  login: (user: User) => void;
  switchRole: (role: UserRole) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);

  const login = (userToLogin: User) => {
    setCurrentUser(userToLogin);
    setSelectedRole(userToLogin.role);
  };

  const switchRole = (role: UserRole) => {
    const targetUser = USERS.find(u => u.role === role) || USERS[0];
    setCurrentUser(targetUser);
    setSelectedRole(role);
  };

  const logout = () => {
    setCurrentUser(null);
    setSelectedRole(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user: currentUser,
        isAuthenticated: !!currentUser,
        selectedRole,
        setSelectedRole,
        login,
        switchRole,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
