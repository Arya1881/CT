import React, { useState, useEffect } from 'react';
import { Bus, Users, ShieldAlert, Navigation, Award, AlertTriangle, Plus } from 'lucide-react';
import { useTracking } from '../../context/TrackingContext';
import { LiveMap } from '../../components/LiveMap';
import { AddBusModal, AddDriverModal, AddStudentModal, AddRouteModal } from '../../components/admin/ManagementModals';

interface ManagementDashboardProps {
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
}

export const ManagementDashboard: React.FC<ManagementDashboardProps> = ({ activeTab = 'dashboard' }) => {
  const { buses, drivers, students, routes, trips, alerts, resolveSOS } = useTracking();
  const [selectedBusId, setSelectedBusId] = useState<string>('bus-101');
  const [activeSection, setActiveSection] = useState<'overview' | 'buses' | 'drivers' | 'students' | 'routes' | 'emergency'>('overview');

  // Modals state
  const [isAddBusOpen, setIsAddBusOpen] = useState(false);
  const [isAddDriverOpen, setIsAddDriverOpen] = useState(false);
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [isAddRouteOpen, setIsAddRouteOpen] = useState(false);

  useEffect(() => {
    if (activeTab === 'dashboard') setActiveSection('overview');
    else if (activeTab === 'buses') setActiveSection('buses');
    else if (activeTab === 'drivers') setActiveSection('drivers');
    else if (activeTab === 'students') setActiveSection('students');
    else if (activeTab === 'routes') setActiveSection('routes');
    else if (activeTab === 'emergency') setActiveSection('emergency');
  }, [activeTab]);

  const activeTripsCount = trips.filter(t => t.status === 'IN_TRANSIT').length;
  const activeSOSAlerts = alerts.filter(a => a.status === 'ACTIVE');

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Management Portal Executive Banner */}
      <div className="bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 p-6 rounded-3xl text-white shadow-xl shadow-orange-500/20 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white shadow-lg">
            <Award className="w-8 h-8 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-black tracking-tight text-white font-heading">EXECUTIVE MANAGEMENT PORTAL</h1>
              <span className="px-3 py-1 rounded-full text-[10px] font-black bg-white text-orange-600 shadow-sm">
                SYSTEM CONTROL
              </span>
            </div>
            <p className="text-xs text-orange-100 mt-1">
              College Transportation Management & Telemetry Oversight
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="bg-white/15 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/20 text-right">
            <p className="text-[10px] text-orange-100 font-bold uppercase">System Efficiency</p>
            <p className="text-lg font-black text-white">98.4% On-Time</p>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tab Bar in Orange Theme */}
      <div className="bg-white p-2 rounded-2xl shadow-md border border-slate-100 flex items-center space-x-2 overflow-x-auto">
        {(['overview', 'buses', 'drivers', 'students', 'routes', 'emergency'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveSection(tab)}
            className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap ${
              activeSection === tab
                ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/20'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            {tab}
            {tab === 'emergency' && activeSOSAlerts.length > 0 && (
              <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] bg-red-600 text-white animate-pulse">
                {activeSOSAlerts.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Management Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl shadow-lg border border-slate-100 flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center">
            <Bus className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-bold">Active Fleet Ratio</p>
            <p className="text-2xl font-black text-slate-900">{activeTripsCount} / {buses.length}</p>
            <p className="text-[11px] text-orange-600 font-bold mt-0.5">Buses In Operation</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl shadow-lg border border-slate-100 flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-bold">Total Enrolled Students</p>
            <p className="text-2xl font-black text-slate-900">{students.length}</p>
            <p className="text-[11px] text-emerald-600 font-bold mt-0.5">Transport Passes Active</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl shadow-lg border border-slate-100 flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center">
            <Navigation className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-bold">Active Corridors</p>
            <p className="text-2xl font-black text-slate-900">{routes.length}</p>
            <p className="text-[11px] text-amber-600 font-bold mt-0.5">Campus Routes</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl shadow-lg border border-slate-100 flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-bold">Emergency Alerts</p>
            <p className="text-2xl font-black text-slate-900">{activeSOSAlerts.length}</p>
            <p className="text-[11px] text-indigo-600 font-bold mt-0.5">Active Incidents</p>
          </div>
        </div>
      </div>

      {/* Main Section Content */}
      {activeSection === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <LiveMap
              trips={trips}
              routes={routes}
              alerts={alerts}
              selectedBusId={selectedBusId}
              onSelectBus={(busId) => setSelectedBusId(busId)}
              height="h-[460px]"
            />
          </div>

          <div className="space-y-6">
            {activeSOSAlerts.length > 0 && (
              <div className="bg-red-50 p-5 rounded-3xl border border-red-200 space-y-3 shadow-lg">
                <div className="flex items-center space-x-2 text-red-600 font-black text-xs uppercase tracking-wider">
                  <AlertTriangle className="w-4 h-4 animate-bounce" />
                  <span>Emergency Dispatch ({activeSOSAlerts.length})</span>
                </div>
                {activeSOSAlerts.map(alert => (
                  <div key={alert.id} className="bg-white p-3 rounded-2xl border border-red-200 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-red-700">{alert.role} SOS: {alert.triggeredByName}</span>
                      <span className="text-[10px] text-slate-400">{new Date(alert.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-slate-600 text-[11px]">{alert.message}</p>
                    <button
                      onClick={() => resolveSOS(alert.id)}
                      className="w-full py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs shadow-md transition-colors"
                    >
                      Resolve & Dispatch Clearance
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="bg-white p-5 rounded-3xl shadow-lg border border-slate-100 space-y-4">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Live Fleet Telemetry</h3>
              <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
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
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span>{bus.busNumber} ({bus.regNumber})</span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                          bus.status === 'IN_TRANSIT' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {bus.status}
                        </span>
                      </div>
                      {trip && (
                        <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] text-slate-500 font-semibold">
                          <div>Speed: <strong className="text-orange-600">{trip.speedKmh} km/h</strong></div>
                          <div>Next: <strong className="text-slate-800">{trip.nextStopName}</strong></div>
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

      {activeSection === 'buses' && (
        <div className="bg-white p-6 rounded-3xl shadow-lg border border-slate-100 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black text-slate-900">Campus Fleet Management</h3>
            <button
              onClick={() => setIsAddBusOpen(true)}
              className="px-4 py-2 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-black text-xs flex items-center gap-2 shadow-md hover:from-orange-600 hover:to-amber-600 transition-all"
            >
              <Plus className="w-4 h-4" /> Add Vehicle
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-black border-b border-slate-200">
                <tr>
                  <th className="p-3">Bus Identifier</th>
                  <th className="p-3">Reg. Number</th>
                  <th className="p-3">Capacity</th>
                  <th className="p-3">Assigned Driver</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold">
                {buses.map(b => (
                  <tr key={b.id} className="hover:bg-slate-50">
                    <td className="p-3 font-extrabold text-slate-900">{b.busNumber}</td>
                    <td className="p-3 font-mono">{b.regNumber}</td>
                    <td className="p-3">{b.capacity} Seats</td>
                    <td className="p-3">{drivers.find(d => d.id === b.driverId)?.name || 'Unassigned'}</td>
                    <td className="p-3">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black ${
                        b.status === 'IN_TRANSIT' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
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

      {activeSection === 'drivers' && (
        <div className="bg-white p-6 rounded-3xl shadow-lg border border-slate-100 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black text-slate-900">Drivers & Licenses</h3>
            <button
              onClick={() => setIsAddDriverOpen(true)}
              className="px-4 py-2 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-black text-xs flex items-center gap-2 shadow-md hover:from-orange-600 hover:to-amber-600 transition-all"
            >
              <Plus className="w-4 h-4" /> Register Driver
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-black border-b border-slate-200">
                <tr>
                  <th className="p-3">Driver Name</th>
                  <th className="p-3">License No.</th>
                  <th className="p-3">Contact</th>
                  <th className="p-3">Assigned Bus</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold">
                {drivers.map(d => (
                  <tr key={d.id} className="hover:bg-slate-50">
                    <td className="p-3 font-extrabold text-slate-900">{d.name}</td>
                    <td className="p-3 font-mono">{d.licenseNumber}</td>
                    <td className="p-3">{d.phone}</td>
                    <td className="p-3">{buses.find(b => b.id === d.busId)?.busNumber}</td>
                    <td className="p-3">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black ${
                        d.status === 'ON_TRIP' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
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

      {activeSection === 'students' && (
        <div className="bg-white p-6 rounded-3xl shadow-lg border border-slate-100 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black text-slate-900">Student Transport Passes</h3>
            <button
              onClick={() => setIsAddStudentOpen(true)}
              className="px-4 py-2 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-black text-xs flex items-center gap-2 shadow-md hover:from-orange-600 hover:to-amber-600 transition-all"
            >
              <Plus className="w-4 h-4" /> Add Student
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-black border-b border-slate-200">
                <tr>
                  <th className="p-3">Student Name</th>
                  <th className="p-3">Roll No.</th>
                  <th className="p-3">Department</th>
                  <th className="p-3">Assigned Bus</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold">
                {students.map(s => (
                  <tr key={s.id} className="hover:bg-slate-50">
                    <td className="p-3 font-extrabold text-slate-900">{s.name}</td>
                    <td className="p-3 font-mono">{s.rollNumber}</td>
                    <td className="p-3">{s.gradeDepartment}</td>
                    <td className="p-3">{buses.find(b => b.id === s.assignedBusId)?.busNumber}</td>
                    <td className="p-3">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-700">
                        {s.boardingStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeSection === 'routes' && (
        <div className="bg-white p-6 rounded-3xl shadow-lg border border-slate-100 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black text-slate-900">Route Corridors & Stops</h3>
            <button
              onClick={() => setIsAddRouteOpen(true)}
              className="px-4 py-2 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-black text-xs flex items-center gap-2 shadow-md hover:from-orange-600 hover:to-amber-600 transition-all"
            >
              <Plus className="w-4 h-4" /> Create Route
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {routes.map(r => (
              <div key={r.id} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-sm text-slate-900">{r.name}</h4>
                  <span className="text-xs font-mono font-bold text-orange-600">{r.distanceKm} km</span>
                </div>
                <p className="text-xs text-slate-600 font-semibold">Origin: {r.startLocation} ➔ Terminus: {r.endLocation}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeSection === 'emergency' && (
        <div className="bg-white p-6 rounded-3xl shadow-lg border border-slate-100 space-y-6">
          <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-red-600" />
            Emergency Command Console
          </h3>

          <div className="space-y-4">
            {alerts.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center font-bold">No active emergency alerts.</p>
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
                      <span className="font-bold text-xs text-slate-900">{a.role} SOS: {a.triggeredByName}</span>
                    </div>
                    <p className="text-slate-600 text-[11px] mt-1">{a.message}</p>
                  </div>
                  {a.status === 'ACTIVE' && (
                    <button
                      onClick={() => resolveSOS(a.id)}
                      className="px-4 py-2 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs shadow-md"
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

      {/* Interactive Modals */}
      <AddBusModal isOpen={isAddBusOpen} onClose={() => setIsAddBusOpen(false)} />
      <AddDriverModal isOpen={isAddDriverOpen} onClose={() => setIsAddDriverOpen(false)} />
      <AddStudentModal isOpen={isAddStudentOpen} onClose={() => setIsAddStudentOpen(false)} />
      <AddRouteModal isOpen={isAddRouteOpen} onClose={() => setIsAddRouteOpen(false)} />
    </div>
  );
};
