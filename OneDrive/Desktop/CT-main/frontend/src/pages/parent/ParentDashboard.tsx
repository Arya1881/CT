import React, { useState, useEffect } from 'react';
import { Users, Clock, ShieldCheck, ShieldAlert, Heart, CheckCircle2, Bell, AlertTriangle, Phone, Bus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTracking } from '../../context/TrackingContext';
import { LiveMap } from '../../components/LiveMap';
import { SOSModal } from '../../components/SOSModal';
import type { ChildTrackingData } from '../../types';

interface ParentDashboardProps {
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
}

export const ParentDashboard: React.FC<ParentDashboardProps> = ({ activeTab, setActiveTab }) => {
  const { user } = useAuth();
  const { students, buses, drivers, routes, trips, alerts } = useTracking();
  const [isSOSOpen, setIsSOSOpen] = useState(false);

  useEffect(() => {
    if (activeTab === 'emergency') {
      setIsSOSOpen(true);
    }
  }, [activeTab]);

  if (!user) return null;

  // Filter children matching logged-in parent user ID or fallback to demo parent children
  const childrenList = students.filter(
    s => s.parentUserId === user.id || s.parentUserId === 'u-parent-1'
  );
  const [selectedChildId, setSelectedChildId] = useState<string>(childrenList[0]?.id || 's-1');

  const childrenData: ChildTrackingData[] = childrenList.map(student => {
    const bus = buses.find(b => b.id === student.assignedBusId) || buses[0];
    const driver = drivers.find(d => d.id === bus.driverId) || drivers[0];
    const route = routes.find(r => r.id === bus.routeId) || routes[0];
    const trip = trips.find(t => t.busId === bus.id) || trips[0];
    return { student, bus, driver, route, trip };
  });

  const selectedChildData = childrenData.find(c => c.student.id === selectedChildId) || childrenData[0];
  const isSameBusFamily = childrenData.every(c => c.bus.id === childrenData[0]?.bus.id);

  const handleCloseSOS = () => {
    setIsSOSOpen(false);
    if (setActiveTab && activeTab === 'emergency') {
      setActiveTab('dashboard');
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-fadeIn">
      {/* Parent Header Banner */}
      <div className="glass-panel p-6 rounded-3xl border border-indigo-500/30 flex flex-wrap items-center justify-between gap-4 bg-gradient-to-r from-indigo-600/20 via-slate-900 to-purple-600/20 shadow-2xl">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center justify-center shadow-lg">
            <Users className="w-8 h-8 text-indigo-400" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-black text-white">{user.name}</h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                FAMILY SAFETY MONITOR
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Household registered with <strong className="text-indigo-300">{childrenData.length} Children</strong> in transit.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsSOSOpen(true)}
            className="px-5 py-3 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs uppercase tracking-wider shadow-xl shadow-red-600/40 transition-all flex items-center space-x-2 sos-pulse"
          >
            <ShieldAlert className="w-4 h-4 animate-pulse" />
            <span>PARENT EMERGENCY SOS</span>
          </button>
        </div>
      </div>

      {/* Child Selection Cards */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Select Child to Track</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {childrenData.map(({ student, bus }) => {
            const isSelected = student.id === selectedChildId;
            return (
              <div
                key={student.id}
                onClick={() => setSelectedChildId(student.id)}
                className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                  isSelected
                    ? 'bg-gradient-to-r from-indigo-500/20 to-purple-600/20 border-indigo-400 text-white shadow-xl shadow-indigo-950/50 scale-[1.02]'
                    : 'glass-card border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-950 border border-indigo-500/40 flex items-center justify-center text-indigo-300 font-bold">
                    {student.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-extrabold text-sm text-white">{student.name}</p>
                    <p className="text-[11px] text-slate-400">{student.gradeDepartment}</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    {bus.busNumber}
                  </span>
                  <p className="text-[10px] text-emerald-400 mt-1 font-semibold flex items-center gap-1 justify-end">
                    <CheckCircle2 className="w-3 h-3" /> On Board
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Single Live Map & Child Details */}
      {selectedChildData && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="glass-panel p-2 rounded-3xl border border-slate-800 shadow-xl overflow-hidden">
              <LiveMap
                trips={trips}
                routes={routes}
                alerts={alerts}
                selectedBusId={selectedChildData.bus.id}
                singleBusOnly={true}
                height="h-[520px]"
              />
            </div>
          </div>

          <div className="space-y-6">
            {/* Transit ETA Card */}
            <div className="glass-panel p-6 rounded-3xl border border-indigo-500/30 bg-indigo-950/20 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                  Transit ETA for {selectedChildData.student.name}
                </span>
                <Clock className="w-4 h-4 text-indigo-400" />
              </div>

              <div className="text-center py-4 space-y-1">
                <p className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-purple-400 tracking-tight">
                  ~{selectedChildData.trip?.etaMinutesToNextStop || 6} <span className="text-lg text-slate-400 font-normal">mins</span>
                </p>
                <p className="text-xs text-slate-300">
                  Bus <strong className="text-indigo-300">{selectedChildData.bus.busNumber}</strong> approaching stop
                </p>
              </div>

              <div className="glass-card p-3.5 rounded-2xl border border-slate-800 space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-300">
                  <span>Assigned Bus:</span>
                  <strong className="text-white">{selectedChildData.bus.busNumber} ({selectedChildData.bus.regNumber})</strong>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span>Driver Name:</span>
                  <strong className="text-indigo-300">{selectedChildData.driver.name}</strong>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span>Driver Contact:</span>
                  <a href={`tel:${selectedChildData.driver.phone}`} className="font-mono text-indigo-400 hover:underline flex items-center gap-1">
                    <Phone className="w-3 h-3" /> {selectedChildData.driver.phone}
                  </a>
                </div>
              </div>
            </div>

            {/* Parent Notifications & Activity Feed */}
            <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <Bell className="w-4 h-4 text-indigo-400" />
                  Live Safety & Arrival Feed
                </h3>
                <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-indigo-500/20 text-indigo-300">
                  UPDATED
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-slate-200 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-400">Boarding Confirmed</span>
                    <span className="text-[10px] text-slate-400">08:15 AM</span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    {selectedChildData.student.name} safely boarded Bus {selectedChildData.bus.busNumber} at Hostel Stop.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-slate-200 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-indigo-300">GPS Stream Active</span>
                    <span className="text-[10px] text-slate-400">Just Now</span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    Bus speed is smooth at {selectedChildData.trip?.speedKmh || 35} km/h on corridor.
                  </p>
                </div>

                {selectedChildData.trip?.delayReason && (
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold">Delay Broadcast</span>
                      <span className="text-[10px] text-amber-400">Driver Note</span>
                    </div>
                    <p className="text-[11px]">
                      {selectedChildData.trip.delayReason}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {isSameBusFamily && (
              <div className="glass-panel p-4 rounded-2xl border border-purple-500/30 bg-purple-950/20 text-xs space-y-1">
                <p className="font-bold text-purple-300 flex items-center gap-1.5">
                  <Heart className="w-4 h-4 text-pink-400 fill-pink-400" />
                  Same Bus Household View Active
                </p>
                <p className="text-slate-400 text-[11px]">
                  All children in your household attend the same neighborhood stop and travel together on <strong>Bus 101</strong>.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      <SOSModal isOpen={isSOSOpen} onClose={handleCloseSOS} busId={selectedChildData?.bus.id} />
    </div>
  );
};
