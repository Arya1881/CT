import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { TrackingProvider } from './context/TrackingContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { MultiRoleLogin } from './components/auth/MultiRoleLogin';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { DriverDashboard } from './pages/driver/DriverDashboard';
import { StudentDashboard } from './pages/student/StudentDashboard';
import { ParentDashboard } from './pages/parent/ParentDashboard';
import { ManagementDashboard } from './pages/management/ManagementDashboard';

const MainAppContent: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  // Reset active tab to default when user changes
  useEffect(() => {
    setActiveTab('dashboard');
  }, [user?.id, user?.role]);

  if (!isAuthenticated || !user) {
    return <MultiRoleLogin />;
  }

  const renderRolePage = () => {
    switch (user.role) {
      case 'MANAGEMENT':
        return <ManagementDashboard activeTab={activeTab} setActiveTab={setActiveTab} />;
      case 'ADMIN':
        return <AdminDashboard activeTab={activeTab} setActiveTab={setActiveTab} />;
      case 'DRIVER':
        return <DriverDashboard activeTab={activeTab} setActiveTab={setActiveTab} />;
      case 'STUDENT':
        return <StudentDashboard activeTab={activeTab} setActiveTab={setActiveTab} />;
      case 'PARENT':
        return <ParentDashboard activeTab={activeTab} setActiveTab={setActiveTab} />;
      default:
        return <AdminDashboard activeTab={activeTab} setActiveTab={setActiveTab} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#fff9f5] text-slate-800 font-sans selection:bg-orange-500 selection:text-white">
      <Navbar />
      <div className="flex-1 flex">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          {renderRolePage()}
        </main>
      </div>
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <TrackingProvider>
        <MainAppContent />
      </TrackingProvider>
    </AuthProvider>
  );
}

export default App;
