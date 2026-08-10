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
    <div className="space-y-6 animate-fadeIn font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight font-heading">Admin Operations Console</h2>
          <p className="text-xs text-slate-600 font-bold mt-0.5">Central Fleet Command, Real-Time Telemetry & Emergency Management</p>
        </div>

        {/* Console SubTab Selector */}
        <div className="flex items-center space-x-1.5 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
          {(['overview', 'buses', 'drivers', 'students', 'routes', 'emergency', 'reports'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => handleSubTabChange(tab)}
              className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap ${
                activeSubTab === tab
                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/20 scale-[1.02]'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-orange-50'
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

      {/* Top Stat Cards (High Contrast Crisp White Surface with Dark Black Text) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl shadow-lg border border-slate-100 flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold">
            <Bus className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-bold">Active Fleet</p>
            <p className="text-2xl font-black text-slate-900">{activeTripsCount} / {buses.length}</p>
            <p className="text-[11px] text-orange-600 font-extrabold mt-0.5">Buses In Operation</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl shadow-lg border border-slate-100 flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-bold">Total Enrolled Students</p>
            <p className="text-2xl font-black text-slate-900">{students.length}</p>
            <p className="text-[11px] text-emerald-600 font-extrabold mt-0.5">98% Transport Active</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl shadow-lg border border-slate-100 flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center font-bold">
            <Navigation className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-bold">Active Corridors</p>
            <p className="text-2xl font-black text-slate-900">{routes.length}</p>
            <p className="text-[11px] text-amber-600 font-extrabold mt-0.5">Campus Routes</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl shadow-lg border border-slate-100 flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center font-bold">
            <ShieldAlert className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-bold">SOS Incidents</p>
            <p className="text-2xl font-black text-slate-900">{activeSOSAlerts.length}</p>
            <p className="text-[11px] text-red-600 font-extrabold mt-0.5">Action Required</p>
          </div>
        </div>
      </div>

      {/* OVERVIEW TAB: Fleet Map & Telemetry Panel */}
      {activeSubTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <LiveMap
              trips={trips}
              routes={routes}
              alerts={alerts}
              selectedBusId={selectedBusId}
              onSelectBus={(busId) => setSelectedBusId(busId)}
              height="h-[500px]"
            />
          </div>

          <div className="space-y-6">
            {activeSOSAlerts.length > 0 && (
              <div className="bg-red-50 p-5 rounded-3xl border border-red-200 space-y-3 shadow-lg">
                <div className="flex items-center space-x-2 text-red-600 font-black text-xs uppercase tracking-wider">
                  <AlertTriangle className="w-4 h-4 animate-bounce" />
                  <span>Critical SOS Dispatch ({activeSOSAlerts.length})</span>
                </div>
                {activeSOSAlerts.map(alert => (
                  <div key={alert.id} className="bg-white p-3 rounded-2xl border border-red-200 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-red-700">{alert.role} SOS: {alert.triggeredByName}</span>
                      <span className="text-[10px] text-slate-400">{new Date(alert.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-slate-700 text-[11px] font-semibold">{alert.message}</p>
                    <button
                      onClick={() => resolveSOS(alert.id)}
                      className="w-full py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs shadow-md transition-colors"
                    >
                      Resolve & Clear Alert
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="bg-white p-5 rounded-3xl shadow-lg border border-slate-100 space-y-4">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Live Fleet Telemetry</h3>
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                {buses.map(bus => {
                  const trip = trips.find(t => t.busId === bus.id);
                  const isSelected = selectedBusId === bus.id;
                  return (
                    <div
                      key={bus.id}
                      onClick={() => setSelectedBusId(bus.id)}
                      className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-orange-50 border-orange-500 text-slate-900 shadow-md'
                          : 'bg-white border-slate-100 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs font-black">
                        <span className="text-slate-900">{bus.busNumber} ({bus.regNumber})</span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                          bus.status === 'IN_TRANSIT' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {bus.status}
                        </span>
                      </div>
                      {trip && (
                        <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] text-slate-600 font-semibold">
                          <div>Speed: <strong className="text-orange-600 font-black">{trip.speedKmh} km/h</strong></div>
                          <div>Next: <strong className="text-slate-900 font-black">{trip.nextStopName}</strong></div>
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
        <div className="bg-white p-6 rounded-3xl shadow-lg border border-slate-100 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-black text-slate-900">Registered Bus Fleet</h3>
              <p className="text-xs text-slate-600 font-bold">Manage vehicle capacity, drivers & assigned corridors</p>
            </div>
            <button
              onClick={() => setIsAddBusOpen(true)}
              className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black text-xs flex items-center gap-2 shadow-md transition-all"
            >
              <Plus className="w-4 h-4" /> Add Bus
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-black border-b border-slate-200">
                <tr>
                  <th className="p-3">Bus Identifier</th>
                  <th className="p-3">Registration No.</th>
                  <th className="p-3">Capacity</th>
                  <th className="p-3">Assigned Driver</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold">
                {buses.map(b => (
                  <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 font-extrabold text-slate-900">{b.busNumber}</td>
                    <td className="p-3 font-mono font-bold text-orange-600">{b.regNumber}</td>
                    <td className="p-3 text-slate-800">{b.capacity} Seats</td>
                    <td className="p-3 text-slate-800">{drivers.find(d => d.id === b.driverId)?.name || 'Unassigned'}</td>
                    <td className="p-3">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black ${
                        b.status === 'IN_TRANSIT' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
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
        <div className="bg-white p-6 rounded-3xl shadow-lg border border-slate-100 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-black text-slate-900">Drivers & Licenses</h3>
              <p className="text-xs text-slate-600 font-bold">Driver certifications, contact details & vehicle assignments</p>
            </div>
            <button
              onClick={() => setIsAddDriverOpen(true)}
              className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black text-xs flex items-center gap-2 shadow-md transition-all"
            >
              <Plus className="w-4 h-4" /> Register Driver
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-black border-b border-slate-200">
                <tr>
                  <th className="p-3">Driver Name</th>
                  <th className="p-3">License Number</th>
                  <th className="p-3">Contact Phone</th>
                  <th className="p-3">Assigned Vehicle</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold">
                {drivers.map(d => (
                  <tr key={d.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 font-extrabold text-slate-900">{d.name}</td>
                    <td className="p-3 font-mono font-bold text-slate-700">{d.licenseNumber}</td>
                    <td className="p-3 font-mono font-bold text-orange-600">{d.phone}</td>
                    <td className="p-3 text-slate-800">{buses.find(b => b.id === d.busId)?.busNumber}</td>
                    <td className="p-3">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black ${
                        d.status === 'ON_TRIP' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
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
        <div className="bg-white p-6 rounded-3xl shadow-lg border border-slate-100 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-black text-slate-900">Student Directory & Transport Passes</h3>
              <p className="text-xs text-slate-600 font-bold">Pass issuance, boarding status & bus assignments</p>
            </div>
            <button
              onClick={() => setIsAddStudentOpen(true)}
              className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black text-xs flex items-center gap-2 shadow-md transition-all"
            >
              <Plus className="w-4 h-4" /> Add Student
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-black border-b border-slate-200">
                <tr>
                  <th className="p-3">Student Name</th>
                  <th className="p-3">Roll Number</th>
                  <th className="p-3">Department / Grade</th>
                  <th className="p-3">Assigned Bus</th>
                  <th className="p-3">Boarding Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold">
                {students.map(s => {
                  const b = buses.find(bus => bus.id === s.assignedBusId);
                  return (
                    <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3 font-extrabold text-slate-900">{s.name}</td>
                      <td className="p-3 font-mono font-bold text-orange-600">{s.rollNumber}</td>
                      <td className="p-3 text-slate-800">{s.gradeDepartment}</td>
                      <td className="p-3 text-slate-800">{b?.busNumber || 'Unassigned'}</td>
                      <td className="p-3">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-700">
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
        <div className="bg-white p-6 rounded-3xl shadow-lg border border-slate-100 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-black text-slate-900">Campus Transit Corridors & Stops</h3>
              <p className="text-xs text-slate-600 font-bold">Route paths, distance metrics & stop sequences</p>
            </div>
            <button
              onClick={() => setIsAddRouteOpen(true)}
              className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black text-xs flex items-center gap-2 shadow-md transition-all"
            >
              <Plus className="w-4 h-4" /> Create Route
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {routes.map(r => (
              <div key={r.id} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-black text-sm text-slate-900">{r.name}</h4>
                  <span className="text-xs text-orange-600 font-mono font-extrabold">{r.distanceKm} km</span>
                </div>
                <p className="text-xs text-slate-700 font-semibold">Origin: <strong className="text-slate-900">{r.startLocation}</strong> ➔ Terminus: <strong className="text-slate-900">{r.endLocation}</strong></p>
                <div className="text-[11px] text-slate-600 space-y-1 border-t border-slate-200 pt-2 font-semibold">
                  <p className="font-black uppercase text-[10px] text-slate-400">Stops ({r.stops.length}):</p>
                  <p className="truncate text-slate-800">{r.stops.map(s => s.name).join(' ➔ ')}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* EMERGENCY CONSOLE TAB */}
      {activeSubTab === 'emergency' && (
        <div className="bg-white p-6 rounded-3xl shadow-lg border border-slate-100 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-red-600" />
              Emergency SOS Command Console
            </h3>
            <span className="px-3 py-1 rounded-full text-xs font-black bg-red-100 text-red-600 border border-red-200">
              {activeSOSAlerts.length} Active Alerts
            </span>
          </div>

          <div className="space-y-4">
            {alerts.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center font-bold">No active or historical emergency alerts.</p>
            ) : (
              alerts.map(a => (
                <div key={a.id} className={`p-4 rounded-2xl border flex flex-wrap items-center justify-between gap-4 ${
                  a.status === 'ACTIVE' ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${a.status === 'ACTIVE' ? 'bg-red-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                        {a.status}
                      </span>
                      <span className="font-extrabold text-xs text-slate-900">{a.role} SOS: {a.triggeredByName}</span>
                    </div>
                    <p className="text-xs text-slate-700 mt-1 font-semibold">{a.message}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5 font-mono">Time: {new Date(a.timestamp).toLocaleString()}</p>
                  </div>
                  {a.status === 'ACTIVE' && (
                    <button
                      onClick={() => resolveSOS(a.id)}
                      className="px-4 py-2 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs shadow-md transition-all"
                    >
                      Resolve Clearance
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
          <div className="bg-white p-6 rounded-3xl shadow-lg border border-slate-100 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-orange-600" />
                  Fleet Performance & Operations Analytics
                </h3>
                <p className="text-xs text-slate-600 font-bold">Institutional metrics, on-time rating & incident report history</p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-black bg-orange-100 text-orange-600 border border-orange-200">
                DAILY REPORT GENERATED
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1">
                <p className="text-[11px] text-slate-500 font-bold uppercase">On-Time Arrival Rating</p>
                <p className="text-2xl font-black text-emerald-600">94.8%</p>
                <p className="text-[10px] text-emerald-600 font-extrabold flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" /> +2.4% vs last week
                </p>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1">
                <p className="text-[11px] text-slate-500 font-bold uppercase">Daily Student Boardings</p>
                <p className="text-2xl font-black text-orange-600">1,420 Pass Rides</p>
                <p className="text-[10px] text-orange-600 font-bold">Across 5 Campus Corridors</p>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1">
                <p className="text-[11px] text-slate-500 font-bold uppercase">SOS Dispatch Response</p>
                <p className="text-2xl font-black text-indigo-600">&lt; 3 mins</p>
                <p className="text-[10px] text-indigo-600 font-bold">100% Incident Resolution</p>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">System Event & Delay Log</h4>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3 text-xs">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2 text-slate-500 font-black text-[10px] uppercase">
                  <span>Timestamp</span>
                  <span>Event Category</span>
                  <span>Vehicle / Route</span>
                  <span>Status</span>
                </div>
                <div className="space-y-2 font-semibold">
                  <div className="flex items-center justify-between text-slate-800">
                    <span className="font-mono text-[11px] font-bold">08:30 AM</span>
                    <span className="text-amber-600 font-extrabold">Traffic Delay Reported</span>
                    <span>Bus 101 (Route A)</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-100 text-amber-700 font-black">Broadcasted</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-800">
                    <span className="font-mono text-[11px] font-bold">08:15 AM</span>
                    <span className="text-emerald-600 font-extrabold">Fleet Morning Departure</span>
                    <span>All Corridors</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-100 text-emerald-700 font-black">Completed</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-800">
                    <span className="font-mono text-[11px] font-bold">07:45 AM</span>
                    <span className="text-orange-600 font-extrabold">GPS Telemetry Sync</span>
                    <span>Central Grid</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-orange-100 text-orange-700 font-black">Active</span>
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
