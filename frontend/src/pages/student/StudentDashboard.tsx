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
    <div className="space-y-6 max-w-6xl mx-auto animate-fadeIn">
      {/* Student Welcome & SOS Banner */}
      <div className="glass-panel p-6 rounded-3xl border border-cyan-500/30 flex flex-wrap items-center justify-between gap-4 bg-gradient-to-r from-cyan-600/20 via-slate-900 to-blue-600/20 shadow-2xl">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-2xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center justify-center shadow-lg">
            <Compass className="w-8 h-8 animate-spin-slow text-cyan-400" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-black text-white">{student.name}</h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                {student.rollNumber}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Department: <strong className="text-slate-200">{student.gradeDepartment}</strong> | Boarding Stop: <span className="font-bold text-cyan-300">{assignedStop.name}</span>
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsSOSOpen(true)}
          className="px-6 py-3.5 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs uppercase tracking-wider shadow-xl shadow-red-600/40 transition-all flex items-center space-x-2 sos-pulse"
        >
          <ShieldAlert className="w-5 h-5 animate-pulse" />
          <span>STUDENT SOS PANIC</span>
        </button>
      </div>

      {/* Main Grid: Single Live Map & Telemetry Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Strictly ONE Live GPS Map */}
        <div className="lg:col-span-2 space-y-4">
          <div className="glass-panel p-2 rounded-3xl border border-slate-800 shadow-xl overflow-hidden">
            <LiveMap
              trips={trips}
              routes={routes}
              alerts={alerts}
              selectedBusId={bus.id}
              singleBusOnly={true}
              height="h-[520px]"
            />
          </div>
        </div>

        {/* Live ETA, Bus Info, Driver Details, and Stop Sequence */}
        <div className="space-y-6">
          {/* Live ETA Card */}
          <div className="glass-panel p-6 rounded-3xl border border-cyan-500/30 bg-cyan-950/20 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">Live Arrival ETA</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                LIVE GPS
              </span>
            </div>

            <div className="text-center py-4 space-y-1">
              <p className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-400 tracking-tight">
                ~{trip?.etaMinutesToNextStop || 5} <span className="text-lg text-slate-400 font-normal">mins</span>
              </p>
              <p className="text-xs text-slate-300">
                Estimated arrival at <strong className="text-cyan-300">{assignedStop.name}</strong>
              </p>
            </div>

            <div className="glass-card p-3.5 rounded-2xl border border-slate-800 space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-300">
                <span>Bus Status:</span>
                <strong className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  bus.status === 'IN_TRANSIT' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                  bus.status === 'DELAYED' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-slate-800 text-slate-400'
                }`}>
                  {bus.status}
                </strong>
              </div>
              {trip?.delayReason && (
                <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px]">
                  ⚠️ Driver Delay Note: {trip.delayReason}
                </div>
              )}
            </div>
          </div>

          {/* Bus & Driver Info Card */}
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4 shadow-xl">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Assigned Bus & Driver</h3>
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700 overflow-hidden text-cyan-400">
                <User className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">{driver.name}</p>
                <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                  <Phone className="w-3 h-3 text-cyan-400" />
                  <a href={`tel:${driver.phone}`} className="text-cyan-300 hover:underline font-mono">
                    {driver.phone}
                  </a>
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-300">
              <span className="flex items-center gap-1.5">
                <Bus className="w-4 h-4 text-cyan-400" />
                Vehicle: <strong>{bus.busNumber}</strong>
              </span>
              <span className="font-mono text-slate-400">{bus.regNumber}</span>
            </div>
          </div>

          {/* Route Stops Sequence */}
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-3 shadow-xl">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Route Stop Sequence</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {route.stops.map((stop, idx) => {
                const isAssigned = stop.id === assignedStop.id;
                return (
                  <div
                    key={stop.id}
                    className={`p-2.5 rounded-xl border flex items-center justify-between text-xs transition-all ${
                      isAssigned
                        ? 'bg-cyan-500/20 border-cyan-400 text-white font-bold'
                        : 'glass-card border-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <MapPin className={`w-3.5 h-3.5 ${isAssigned ? 'text-cyan-400' : 'text-slate-500'}`} />
                      <span>{stop.name}</span>
                    </div>
                    {isAssigned && (
                      <span className="px-2 py-0.5 rounded text-[9px] font-extrabold bg-cyan-400 text-slate-950">
                        YOUR STOP
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
