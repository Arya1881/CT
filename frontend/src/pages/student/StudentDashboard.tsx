import React, { useState, useEffect } from 'react';
import { Compass, ShieldAlert, User, Phone, Bus, Clock, MapPin, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTracking } from '../../context/TrackingContext';
import { LiveMap } from '../../components/LiveMap';
import { SOSModal } from '../../components/SOSModal';

interface StudentDashboardProps {
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({ activeTab, setActiveTab }) => {
  const { user } = useAuth();
  const { students, buses, drivers, routes, trips, alerts } = useTracking();
  const [isSOSOpen, setIsSOSOpen] = useState(false);

  useEffect(() => {
    if (activeTab === 'emergency') {
      setIsSOSOpen(true);
    }
  }, [activeTab]);

  if (!user) return null;

  // Locate logged-in student record
  const student = students.find(s => s.userId === user.id) || students[0];
  const bus = buses.find(b => b.id === student.assignedBusId) || buses[0];
  const driver = drivers.find(d => d.id === bus.driverId) || drivers[0];
  const route = routes.find(r => r.id === bus.routeId) || routes[0];
  const trip = trips.find(t => t.busId === bus.id);

  // Find exact assigned boarding stop
  const assignedStop = route.stops.find(s => s.id === student.assignedStopId) || route.stops[0];

  const handleCloseSOS = () => {
    setIsSOSOpen(false);
    if (setActiveTab && activeTab === 'emergency') {
      setActiveTab('dashboard');
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Desktop Web Banner Header */}
      <div className="bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 p-6 rounded-3xl text-white shadow-xl shadow-orange-500/20 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 text-white shadow-lg">
            <Compass className="w-8 h-8 animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-black tracking-tight text-white font-heading">{student.name}</h1>
              <span className="px-3 py-1 rounded-full text-[10px] font-black bg-white text-orange-600 shadow-sm">
                {student.rollNumber}
              </span>
            </div>
            <p className="text-xs text-orange-100 mt-1 font-semibold">
              Department: <strong className="text-white">{student.gradeDepartment}</strong> | Boarding Stop: <span className="font-extrabold text-white underline">{assignedStop.name}</span>
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsSOSOpen(true)}
          className="px-6 py-3 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-wider shadow-xl shadow-red-600/30 transition-all flex items-center space-x-2 sos-pulse"
        >
          <ShieldAlert className="w-5 h-5 animate-pulse" />
          <span>STUDENT SOS PANIC</span>
        </button>
      </div>

      {/* 2-Column Responsive Web Application Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Real Map Engine & Telemetry BELOW Map */}
        <div className="lg:col-span-2 space-y-4">
          <LiveMap
            trips={trips}
            routes={routes}
            alerts={alerts}
            selectedBusId={bus.id}
            singleBusOnly={true}
            height="h-[500px]"
          />
        </div>

        {/* Right Column: Bus Details, Driver Contacts, & Route Stop Progression */}
        <div className="space-y-6">
          {/* Assigned Bus & Driver Card */}
          <div className="bg-white p-6 rounded-3xl shadow-lg border border-slate-100 space-y-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">Assigned Bus & Driver</h3>
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center font-black">
                <User className="w-6 h-6" />
              </div>
              <div>
                <p className="text-base font-black text-slate-900">{driver.name}</p>
                <p className="text-xs text-slate-500 font-semibold mt-0.5 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-orange-600" />
                  <a href={`tel:${driver.phone}`} className="text-orange-600 hover:underline font-mono font-bold">
                    {driver.phone}
                  </a>
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-700">
              <span className="flex items-center gap-1.5">
                <Bus className="w-4 h-4 text-orange-600" />
                Vehicle: <strong>{bus.busNumber}</strong>
              </span>
              <span className="font-mono text-slate-500">{bus.regNumber}</span>
            </div>
          </div>

          {/* Route Stops Sequence */}
          <div className="bg-white p-6 rounded-3xl shadow-lg border border-slate-100 space-y-3">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">Route Stop Progression</h3>
            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {route.stops.map((stop) => {
                const isAssigned = stop.id === assignedStop.id;
                return (
                  <div
                    key={stop.id}
                    className={`p-3 rounded-2xl border flex items-center justify-between text-xs transition-all ${
                      isAssigned
                        ? 'bg-orange-50 border-orange-500 text-slate-900 font-black shadow-sm'
                        : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <MapPin className={`w-4 h-4 ${isAssigned ? 'text-orange-600' : 'text-slate-400'}`} />
                      <span>{stop.name}</span>
                    </div>
                    {isAssigned && (
                      <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black bg-orange-500 text-white shadow-sm">
                        YOUR BOARDING STOP
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <SOSModal isOpen={isSOSOpen} onClose={handleCloseSOS} busId={bus.id} />
    </div>
  );
};
