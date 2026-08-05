import React, { useState, useEffect } from 'react';
import { Bus, Users, ShieldAlert, Navigation, AlertTriangle, Plus, FileText, CheckCircle2, TrendingUp, Clock, AlertCircle } from 'lucide-react';
import { useTracking } from '../../context/TrackingContext';
import { LiveMap } from '../../components/LiveMap';
import { AddBusModal, AddDriverModal, AddStudentModal, AddRouteModal } from '../../components/admin/ManagementModals';

interface AdminDashboardProps {
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ activeTab = 'dashboard', setActiveTab }) => {
  const { buses, drivers, students, routes, trips, alerts, resolveSOS } = useTracking();
  const [selectedBusId, setSelectedBusId] = useState<string>('bus-101');
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'buses' | 'drivers' | 'students' | 'routes' | 'emergency' | 'reports'>('overview');

  // Modals state
  const [isAddBusOpen, setIsAddBusOpen] = useState(false);
  const [isAddDriverOpen, setIsAddDriverOpen] = useState(false);
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [isAddRouteOpen, setIsAddRouteOpen] = useState(false);

  useEffect(() => {
    if (activeTab === 'dashboard') setActiveSubTab('overview');
    else if (activeTab === 'buses') setActiveSubTab('buses');
    else if (activeTab === 'drivers') setActiveSubTab('drivers');
    else if (activeTab === 'students') setActiveSubTab('students');
    else if (activeTab === 'routes') setActiveSubTab('routes');
    else if (activeTab === 'emergency') setActiveSubTab('emergency');
    else if (activeTab === 'reports') setActiveSubTab('reports');
  }, [activeTab]);

  const handleSubTabChange = (tab: typeof activeSubTab) => {
    setActiveSubTab(tab);
    if (setActiveTab) {
      if (tab === 'overview') setActiveTab('dashboard');
      else setActiveTab(tab);
    }
  };

  const activeTripsCount = trips.filter(t => t.status === 'IN_TRANSIT').length;
  const activeSOSAlerts = alerts.filter(a => a.status === 'ACTIVE');

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight">Admin Operations Console</h2>
          <p className="text-xs text-slate-400">Central Fleet Command, Real-Time Telemetry & Emergency Management</p>
        </div>

        {/* Console SubTab Selector */}
        <div className="flex items-center space-x-1.5 glass-panel p-1.5 rounded-2xl border border-slate-800 overflow-x-auto">
          {(['overview', 'buses', 'drivers', 'students', 'routes', 'emergency', 'reports'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => handleSubTabChange(tab)}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all whitespace-nowrap ${
                activeSubTab === tab
                  ? 'bg-cyan-500 text-slate-950 shadow-md scale-[1.02]'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              {tab}
              {tab === 'emergency' && activeSOSAlerts.length > 0 && (
                <span className="ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] bg-red-600 text-white animate-pulse">
                  {activeSOSAlerts.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-center space-x-4 shadow-xl">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center">
            <Bus className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-semibold">Active Fleet</p>
            <p className="text-2xl font-black text-white">{activeTripsCount} / {buses.length}</p>
            <p className="text-[11px] text-cyan-400 mt-0.5">Buses In Transit</p>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-center space-x-4 shadow-xl">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-semibold">Total Students</p>
            <p className="text-2xl font-black text-white">{students.length}</p>
            <p className="text-[11px] text-emerald-400 mt-0.5">98% Daily Boarded</p>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-center space-x-4 shadow-xl">
          <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
            <Navigation className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-semibold">Active Routes</p>
            <p className="text-2xl font-black text-white">{routes.length}</p>
            <p className="text-[11px] text-amber-400 mt-0.5">Campus Corridors</p>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-center space-x-4 shadow-xl">
          <div className="w-12 h-12 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30 flex items-center justify-center">
            <ShieldAlert className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-semibold">SOS Alerts</p>
            <p className="text-2xl font-black text-white">{activeSOSAlerts.length}</p>
            <p className="text-[11px] text-red-400 mt-0.5">Action Required</p>
          </div>
        </div>
      </div>

      {/* OVERVIEW TAB: Fleet Map & Telemetry Panel */}
      {activeSubTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="glass-panel p-2 rounded-3xl border border-slate-800 shadow-xl overflow-hidden">
              <LiveMap
                trips={trips}
                routes={routes}
                alerts={alerts}
                selectedBusId={selectedBusId}
                onSelectBus={(busId) => setSelectedBusId(busId)}
                height="h-[550px]"
              />
            </div>
          </div>

          <div className="space-y-6">
            {activeSOSAlerts.length > 0 && (
              <div className="glass-panel p-5 rounded-2xl border border-red-500/50 bg-red-950/20 space-y-3 shadow-xl">
                <div className="flex items-center space-x-2 text-red-400 font-extrabold text-xs uppercase tracking-wider">
                  <AlertTriangle className="w-4 h-4 animate-bounce" />
                  <span>Critical SOS Dispatch ({activeSOSAlerts.length})</span>
                </div>
                {activeSOSAlerts.map(alert => (
                  <div key={alert.id} className="glass-card p-3 rounded-xl border border-red-500/30 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-red-300">{alert.role} SOS: {alert.triggeredByName}</span>
                      <span className="text-[10px] text-slate-400">{new Date(alert.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-slate-300 text-[11px]">{alert.message}</p>
                    <button
                      onClick={() => resolveSOS(alert.id)}
                      className="w-full py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-[11px] transition-colors"
                    >
                      Resolve & Clear Alert
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4 shadow-xl">
              <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">Live Fleet Telemetry</h3>
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                {buses.map(bus => {
                  const trip = trips.find(t => t.busId === bus.id);
                  const isSelected = selectedBusId === bus.id;
                  return (
                    <div
                      key={bus.id}
                      onClick={() => setSelectedBusId(bus.id)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-cyan-500/20 border-cyan-500 text-white shadow-lg'
                          : 'glass-card border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span>{bus.busNumber} ({bus.regNumber})</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                          bus.status === 'IN_TRANSIT' ? 'bg-emerald-500/20 text-emerald-400' :
                          bus.status === 'DELAYED' ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-800 text-slate-400'
                        }`}>
                          {bus.status}
                        </span>
                      </div>
                      {trip && (
                        <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] text-slate-400">
                          <div>Speed: <strong className="text-cyan-300">{trip.speedKmh} km/h</strong></div>
                          <div>Next: <strong className="text-slate-200">{trip.nextStopName}</strong></div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* BUSES MANAGEMENT TAB */}
      {activeSubTab === 'buses' && (
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white">Registered Bus Fleet</h3>
              <p className="text-xs text-slate-400">Manage vehicle capacity, drivers & assigned corridors</p>
            </div>
            <button
              onClick={() => setIsAddBusOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg transition-all"
            >
              <Plus className="w-4 h-4" /> Add Bus
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800">
                <tr>
                  <th className="p-3">Bus Identifier</th>
                  <th className="p-3">Registration No.</th>
                  <th className="p-3">Capacity</th>
                  <th className="p-3">Assigned Driver</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {buses.map(b => (
                  <tr key={b.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3 font-bold text-white">{b.busNumber}</td>
                    <td className="p-3 font-mono text-cyan-400">{b.regNumber}</td>
                    <td className="p-3">{b.capacity} Seats</td>
                    <td className="p-3">{drivers.find(d => d.id === b.driverId)?.name || 'Unassigned'}</td>
                    <td className="p-3">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        b.status === 'IN_TRANSIT' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {b.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DRIVERS MANAGEMENT TAB */}
      {activeSubTab === 'drivers' && (
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white">Driver Roster</h3>
              <p className="text-xs text-slate-400">Driver certifications, contact details & vehicle assignments</p>
            </div>
            <button
              onClick={() => setIsAddDriverOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg transition-all"
            >
              <Plus className="w-4 h-4" /> Register Driver
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800">
                <tr>
                  <th className="p-3">Driver Name</th>
                  <th className="p-3">License Number</th>
                  <th className="p-3">Contact Phone</th>
                  <th className="p-3">Assigned Vehicle</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {drivers.map(d => (
                  <tr key={d.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3 font-bold text-white">{d.name}</td>
                    <td className="p-3 font-mono">{d.licenseNumber}</td>
                    <td className="p-3 font-mono text-cyan-400">{d.phone}</td>
                    <td className="p-3">{buses.find(b => b.id === d.busId)?.busNumber}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        d.status === 'ON_TRIP' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {d.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* STUDENTS MANAGEMENT TAB */}
      {activeSubTab === 'students' && (
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white">Student Directory & Transport Passes</h3>
              <p className="text-xs text-slate-400">Pass issuance, boarding status & bus assignments</p>
            </div>
            <button
              onClick={() => setIsAddStudentOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-black text-xs flex items-center gap-2 shadow-lg transition-all"
            >
              <Plus className="w-4 h-4" /> Add Student
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800">
                <tr>
                  <th className="p-3">Student Name</th>
                  <th className="p-3">Roll Number</th>
                  <th className="p-3">Department / Grade</th>
                  <th className="p-3">Assigned Bus</th>
                  <th className="p-3">Boarding Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {students.map(s => {
                  const b = buses.find(bus => bus.id === s.assignedBusId);
                  return (
                    <tr key={s.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-3 font-bold text-white">{s.name}</td>
                      <td className="p-3 font-mono text-cyan-400">{s.rollNumber}</td>
                      <td className="p-3">{s.gradeDepartment}</td>
                      <td className="p-3">{b?.busNumber || 'Unassigned'}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          s.boardingStatus === 'ON_BOARD' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'
                        }`}>
                          {s.boardingStatus}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ROUTES MANAGEMENT TAB */}
      {activeSubTab === 'routes' && (
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white">Campus Transit Corridors & Stops</h3>
              <p className="text-xs text-slate-400">Route paths, distance metrics & stop sequences</p>
            </div>
            <button
              onClick={() => setIsAddRouteOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg transition-all"
            >
              <Plus className="w-4 h-4" /> Create Route
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {routes.map(r => (
              <div key={r.id} className="glass-card p-4 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-cyan-300">{r.name}</h4>
                  <span className="text-xs text-slate-400 font-mono">{r.distanceKm} km</span>
                </div>
                <p className="text-xs text-slate-300">Origin: <strong>{r.startLocation}</strong> ➔ Destination: <strong>{r.endLocation}</strong></p>
                <div className="text-[11px] text-slate-400 space-y-1 border-t border-slate-800 pt-2">
                  <p className="font-bold uppercase text-[10px] text-slate-500">Stops ({r.stops.length}):</p>
                  <p className="truncate text-slate-300">{r.stops.map(s => s.name).join(' ➔ ')}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* EMERGENCY CONSOLE TAB */}
      {activeSubTab === 'emergency' && (
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-6 shadow-xl">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-red-500" />
              Emergency SOS Command Console
            </h3>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/30">
              {activeSOSAlerts.length} Active Alerts
            </span>
          </div>

          <div className="space-y-4">
            {alerts.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No active or historical emergency alerts.</p>
            ) : (
              alerts.map(a => (
                <div key={a.id} className={`p-4 rounded-xl border flex flex-wrap items-center justify-between gap-4 ${
                  a.status === 'ACTIVE' ? 'bg-red-950/30 border-red-500/50' : 'glass-card border-slate-800 text-slate-400'
                }`}>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${a.status === 'ACTIVE' ? 'bg-red-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
                        {a.status}
                      </span>
                      <span className="font-bold text-xs text-white">{a.role} SOS: {a.triggeredByName}</span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1">{a.message}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Time: {new Date(a.timestamp).toLocaleString()} | Coords: {a.lat.toFixed(4)}, {a.lng.toFixed(4)}</p>
                  </div>
                  {a.status === 'ACTIVE' && (
                    <button
                      onClick={() => resolveSOS(a.id)}
                      className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs shadow-md transition-all"
                    >
                      Resolve & Clear Alert
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* REPORTS & ANALYTICS TAB */}
      {activeSubTab === 'reports' && (
        <div className="space-y-6">
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-6 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-cyan-400" />
                  Fleet Performance & Operations Analytics
                </h3>
                <p className="text-xs text-slate-400">Institutional metrics, on-time rating & incident report history</p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                DAILY REPORT GENERATED
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="glass-card p-4 rounded-xl border border-slate-800 space-y-1">
                <p className="text-[11px] text-slate-400 uppercase font-semibold">On-Time Arrival Rating</p>
                <p className="text-2xl font-black text-emerald-400">94.8%</p>
                <p className="text-[10px] text-emerald-500 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" /> +2.4% vs last week
                </p>
              </div>

              <div className="glass-card p-4 rounded-xl border border-slate-800 space-y-1">
                <p className="text-[11px] text-slate-400 uppercase font-semibold">Daily Student Boardings</p>
                <p className="text-2xl font-black text-cyan-400">1,420 Pass Rides</p>
                <p className="text-[10px] text-cyan-500">Across 5 Campus Corridors</p>
              </div>

              <div className="glass-card p-4 rounded-xl border border-slate-800 space-y-1">
                <p className="text-[11px] text-slate-400 uppercase font-semibold">SOS Dispatch Response</p>
                <p className="text-2xl font-black text-indigo-400">&lt; 3 mins</p>
                <p className="text-[10px] text-indigo-400">100% Incident Resolution</p>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">System Event & Delay Log</h4>
              <div className="glass-card p-4 rounded-xl border border-slate-800 space-y-3 text-xs">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2 text-slate-400 font-bold">
                  <span>Timestamp</span>
                  <span>Event Category</span>
                  <span>Vehicle / Route</span>
                  <span>Status</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="font-mono text-[11px]">08:30 AM</span>
                    <span className="text-amber-400 font-semibold">Traffic Delay Reported</span>
                    <span>Bus 101 (Route A)</span>
                    <span className="px-2 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-300">Broadcasted</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="font-mono text-[11px]">08:15 AM</span>
                    <span className="text-emerald-400 font-semibold">Fleet Morning Departure</span>
                    <span>All Corridors</span>
                    <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300">Completed</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="font-mono text-[11px]">07:45 AM</span>
                    <span className="text-cyan-400 font-semibold">GPS Telemetry Sync</span>
                    <span>Central Grid</span>
                    <span className="px-2 py-0.5 rounded text-[10px] bg-cyan-500/20 text-cyan-300">Active</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <AddBusModal isOpen={isAddBusOpen} onClose={() => setIsAddBusOpen(false)} />
      <AddDriverModal isOpen={isAddDriverOpen} onClose={() => setIsAddDriverOpen(false)} />
      <AddStudentModal isOpen={isAddStudentOpen} onClose={() => setIsAddStudentOpen(false)} />
      <AddRouteModal isOpen={isAddRouteOpen} onClose={() => setIsAddRouteOpen(false)} />
    </div>
  );
};
