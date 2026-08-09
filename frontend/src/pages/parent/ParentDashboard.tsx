import React, { useState } from 'react';
import { Bus, Clock, Phone, ShieldCheck, CheckCircle2, User, MapPin, Bell, Users, Heart } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTracking } from '../../context/TrackingContext';
import { LiveMap } from '../../components/LiveMap';
import type { ChildTrackingData } from '../../types';

interface ParentDashboardProps {
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
}

export const ParentDashboard: React.FC<ParentDashboardProps> = ({ activeTab }) => {
  const { user } = useAuth();
  const { students, buses, drivers, routes, trips } = useTracking();

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

  // Render Safety Guidelines & Emergency Contacts when 'safety' tab is clicked
  if (activeTab === 'safety') {
    return (
      <div className="max-w-7xl mx-auto space-y-6 pb-12 font-['Plus_Jakarta_Sans',sans-serif]">
        <div className="bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 p-6 rounded-3xl text-white shadow-xl flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black font-heading">SAFETY GUIDELINES & HELPLINES</h1>
            <p className="text-xs text-orange-100 mt-1">College Transportation Safety Rules & Transport Emergency Directory</p>
          </div>
          <ShieldCheck className="w-10 h-10 text-white/80" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-3xl shadow-lg border border-slate-100 space-y-4">
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Phone className="w-5 h-5 text-orange-600" /> Emergency Helplines
            </h3>
            <div className="space-y-3 text-xs text-slate-600 font-semibold">
              <div className="p-4 bg-orange-50 rounded-2xl flex items-center justify-between border border-orange-200">
                <span>Central Transport Control Desk</span>
                <a href="tel:+919846000001" className="font-mono text-orange-600 font-black hover:underline text-sm">+91 98460 00001</a>
              </div>
              <div className="p-4 bg-emerald-50 rounded-2xl flex items-center justify-between border border-emerald-200">
                <span>Campus Medical Emergency Response</span>
                <a href="tel:+919846000002" className="font-mono text-emerald-600 font-black hover:underline text-sm">+91 98460 00002</a>
              </div>
              <div className="p-4 bg-sky-50 rounded-2xl flex items-center justify-between border border-sky-200">
                <span>Student Safety Officer</span>
                <a href="tel:+919846000003" className="font-mono text-sky-600 font-black hover:underline text-sm">+91 98460 00003</a>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-lg border border-slate-100 space-y-4">
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" /> Student Safety Rules & Policies
            </h3>
            <ul className="space-y-2.5 text-xs text-slate-600 font-semibold list-disc pl-5">
              <li>Students must arrive at assigned boarding stops 5 minutes before scheduled departure time.</li>
              <li>Valid transport pass or Student ID card must be presented upon entering the bus.</li>
              <li>Driver and student panic SOS buttons alert the central dispatch instantly.</li>
              <li>Parents receive live status notifications upon student boarding and drop-off.</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Desktop Web Banner Header */}
      <div className="bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 p-6 rounded-3xl text-white shadow-xl shadow-orange-500/20 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 text-white shadow-lg">
            <Users className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-black tracking-tight text-white font-heading">{user.name}</h1>
              <span className="px-3 py-1 rounded-full text-[10px] font-black bg-white text-orange-600 shadow-sm">
                PARENT FAMILY PORTAL
              </span>
            </div>
            <p className="text-xs text-orange-100 mt-1">
              Registered Household: <strong className="text-white">{childrenData.length} Children</strong> in Transit
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <a
            href="tel:+919846000001"
            className="px-5 py-3 rounded-2xl bg-white hover:bg-orange-50 text-orange-600 font-black text-xs uppercase tracking-wider shadow-lg flex items-center space-x-2 transition-all"
          >
            <Phone className="w-4 h-4 fill-orange-600" />
            <span>TRANSPORT DESK HELPLINE</span>
          </a>
        </div>
      </div>

      {/* Select Child Quick Bar */}
      <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 space-y-2">
        <p className="text-xs font-black text-slate-400 uppercase tracking-wider">Select Child to Track</p>
        <div className="flex space-x-3 overflow-x-auto pb-1">
          {childrenData.map(({ student, bus }) => {
            const isSelected = student.id === selectedChildId;
            return (
              <button
                key={student.id}
                onClick={() => setSelectedChildId(student.id)}
                className={`px-5 py-3 rounded-2xl font-black text-xs transition-all whitespace-nowrap flex items-center space-x-3 ${
                  isSelected
                    ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/25 scale-[1.01]'
                    : 'bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-xs font-black">
                  {student.name.charAt(0)}
                </div>
                <span>{student.name} ({bus.busNumber})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2-Column Responsive Web Application Grid */}
      {selectedChildData && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Full-Width Real Map Engine & Telemetry BELOW map */}
          <div className="lg:col-span-2 space-y-4">
            <LiveMap
              trips={trips}
              routes={routes}
              selectedBusId={selectedChildData.bus.id}
              singleBusOnly={true}
              height="h-[500px]"
            />
          </div>

          {/* Right Column: Live Safety Feed & Driver Details */}
          <div className="space-y-6">
            {/* Assigned Driver Card */}
            <div className="bg-white p-6 rounded-3xl shadow-lg border border-slate-100 space-y-4">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">Assigned Bus Driver</h3>
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center font-black">
                  <User className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-base font-black text-slate-900">{selectedChildData.driver.name}</p>
                  <p className="text-xs text-slate-500 font-semibold mt-0.5">License: {selectedChildData.driver.licenseNumber}</p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-700">
                <span className="flex items-center gap-1.5">
                  <Bus className="w-4 h-4 text-orange-600" />
                  Vehicle: <strong>{selectedChildData.bus.busNumber}</strong>
                </span>
                <span className="font-mono text-slate-500">{selectedChildData.bus.regNumber}</span>
              </div>
            </div>

            {/* Live Safety & Arrival Feed */}
            <div className="bg-white p-6 rounded-3xl shadow-lg border border-slate-100 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <Bell className="w-4 h-4 text-orange-600" />
                  Live Safety & Boarding Feed
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black bg-emerald-100 text-emerald-700">
                  REAL-TIME
                </span>
              </div>

              <div className="space-y-3 text-xs font-semibold">
                <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-slate-800 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-emerald-700 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Boarding Confirmed
                    </span>
                    <span className="text-[10px] text-slate-400">08:15 AM</span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    {selectedChildData.student.name} safely boarded Bus {selectedChildData.bus.busNumber} at Hostel Stop.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-orange-50 border border-orange-200 text-slate-800 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-orange-700 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-orange-600" /> Telemetry Active
                    </span>
                    <span className="text-[10px] text-slate-400">Just Now</span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    Bus speed is smooth at {selectedChildData.trip?.speedKmh || 35} km/h on corridor.
                  </p>
                </div>
              </div>
            </div>

            {isSameBusFamily && (
              <div className="bg-orange-50 p-4 rounded-3xl border border-orange-200 text-xs space-y-1">
                <p className="font-black text-orange-700 flex items-center gap-1.5">
                  <Heart className="w-4 h-4 text-orange-500 fill-orange-500" />
                  Same Bus Household View Active
                </p>
                <p className="text-slate-600 text-[11px] font-semibold">
                  All children in your household travel together on <strong>Bus 101</strong>.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
