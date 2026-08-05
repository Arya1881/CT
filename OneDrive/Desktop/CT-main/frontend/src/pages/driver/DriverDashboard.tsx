import React, { useState, useEffect } from 'react';
import { Bus, Play, Square, AlertCircle, ShieldAlert, Navigation, Gauge, Clock, Phone, Radio, MapPin } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTracking } from '../../context/TrackingContext';
import { SOSModal } from '../../components/SOSModal';
import { DelayModal } from '../../components/DelayModal';

interface DriverDashboardProps {
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
}

export const DriverDashboard: React.FC<DriverDashboardProps> = ({ activeTab, setActiveTab }) => {
  const { user } = useAuth();
  const { buses, drivers, routes, trips, startTrip, endTrip } = useTracking();
  const [isSOSOpen, setIsSOSOpen] = useState(false);
  const [isDelayOpen, setIsDelayOpen] = useState(false);
  const [isGpsSharing, setIsGpsSharing] = useState(true);

  useEffect(() => {
    if (activeTab === 'delays') {
      setIsDelayOpen(true);
    } else if (activeTab === 'emergency') {
      setIsSOSOpen(true);
    }
  }, [activeTab]);

  if (!user) return null;

  const driver = drivers.find(d => d.userId === user.id) || drivers[0];
  const bus = buses.find(b => b.id === driver.busId) || buses[0];
  const route = routes.find(r => r.id === bus.routeId) || routes[0];
  const activeTrip = trips.find(t => t.busId === bus.id);

  const isInTransit = bus.status === 'IN_TRANSIT';

  const handleCloseDelay = () => {
    setIsDelayOpen(false);
    if (setActiveTab && activeTab === 'delays') {
      setActiveTab('dashboard');
    }
  };

  const handleCloseSOS = () => {
    setIsSOSOpen(false);
    if (setActiveTab && activeTab === 'emergency') {
      setActiveTab('dashboard');
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fadeIn">
      {/* Driver Header Banner & Control Bar */}
      <div className="glass-panel p-6 rounded-3xl border border-amber-500/30 flex flex-wrap items-center justify-between gap-4 bg-gradient-to-r from-amber-500/10 via-slate-900 to-cyan-500/10 shadow-2xl">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shadow-lg">
            <Bus className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-black text-white">{driver.name}</h2>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                isInTransit ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-400'
              }`}>
                {bus.status}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Vehicle: <strong className="text-slate-200">{bus.busNumber}</strong> ({bus.regNumber}) | License: <span className="font-mono text-cyan-400">{driver.licenseNumber}</span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* GPS Live Sharing Toggle */}
          <button
            onClick={() => setIsGpsSharing(!isGpsSharing)}
            className={`px-3.5 py-2.5 rounded-xl border text-xs font-bold transition-all flex items-center space-x-2 ${
              isGpsSharing
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
            title="Toggle Live GPS Location Sharing"
          >
            <Radio className={`w-4 h-4 ${isGpsSharing ? 'animate-pulse text-emerald-400' : 'text-slate-500'}`} />
            <span>{isGpsSharing ? 'GPS SHARING ON' : 'GPS PAUSED'}</span>
          </button>

          {!isInTransit ? (
            <button
              onClick={() => startTrip(bus.id, route.id)}
              className="px-6 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/30 transition-all flex items-center space-x-2"
            >
              <Play className="w-4 h-4 fill-slate-950" />
              <span>START TRIP SIMULATION</span>
            </button>
          ) : (
            <button
              onClick={() => endTrip(bus.id)}
              className="px-6 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-red-400 border border-red-500/30 font-bold text-xs uppercase tracking-wider transition-all flex items-center space-x-2"
            >
              <Square className="w-4 h-4 fill-red-400" />
              <span>END TRIP</span>
            </button>
          )}

          <button
            onClick={() => setIsSOSOpen(true)}
            className="px-5 py-3 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs uppercase tracking-wider shadow-xl shadow-red-600/40 transition-all flex items-center space-x-2 sos-pulse"
          >
            <ShieldAlert className="w-5 h-5 animate-pulse" />
            <span>DRIVER SOS</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Corridor & Delay Bar */}
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Assigned Corridor</p>
                <h3 className="text-lg font-black text-white">{route.name}</h3>
              </div>
              <button
                onClick={() => setIsDelayOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold text-xs flex items-center space-x-2 transition-all shadow-md"
              >
                <AlertCircle className="w-4 h-4" />
                <span>Report Delay</span>
              </button>
            </div>

            {/* Speedometer & Station Metrics */}
            <div className="grid grid-cols-3 gap-4">
              <div className="glass-card p-4 rounded-2xl border border-slate-800 text-center">
                <Gauge className="w-5 h-5 text-cyan-400 mx-auto mb-1" />
                <p className="text-[11px] text-slate-400">Current Speed</p>
                <p className="text-xl font-black text-white">{isInTransit ? (activeTrip?.speedKmh || 38) : 0} <span className="text-xs text-slate-400 font-normal">km/h</span></p>
              </div>

              <div className="glass-card p-4 rounded-2xl border border-slate-800 text-center">
                <Clock className="w-5 h-5 text-amber-400 mx-auto mb-1" />
                <p className="text-[11px] text-slate-400">Next Station</p>
                <p className="text-sm font-bold text-amber-300 truncate">{activeTrip?.nextStopName || route.stops[1]?.name || 'Terminal'}</p>
              </div>

              <div className="glass-card p-4 rounded-2xl border border-slate-800 text-center">
                <Navigation className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
                <p className="text-[11px] text-slate-400">ETA to Stop</p>
                <p className="text-xl font-black text-emerald-300">~{isInTransit ? (activeTrip?.etaMinutesToNextStop || 5) : 0} <span className="text-xs text-slate-400 font-normal">min</span></p>
              </div>
            </div>

            {/* Stop Sequence */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Route Stop Sequence</h4>
              <div className="space-y-2">
                {route.stops.map((stop, idx) => {
                  const isPassed = idx <= (activeTrip?.currentStopIndex || 0);
                  const isCurrent = idx === (activeTrip?.currentStopIndex || 0);

                  return (
                    <div
                      key={stop.id}
                      className={`p-3.5 rounded-xl border flex items-center justify-between text-xs transition-all ${
                        isCurrent
                          ? 'bg-cyan-500/20 border-cyan-400 text-white shadow-lg'
                          : isPassed
                          ? 'glass-card border-slate-800 text-slate-400'
                          : 'bg-slate-900/40 border-slate-800/80 text-slate-500'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                          isPassed ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                        }`}>
                          {idx + 1}
                        </div>
                        <div>
                          <p className="font-bold">{stop.name}</p>
                          <p className="text-[10px] text-slate-400">Est. {stop.estimatedTimeFromStart} mins from origin</p>
                        </div>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        isCurrent ? 'bg-cyan-400 text-slate-950' : isPassed ? 'bg-slate-800 text-slate-400' : 'text-slate-600'
                      }`}>
                        {isCurrent ? 'BUS HERE' : isPassed ? 'PASSED' : 'UPCOMING'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Emergency Assistance Panel */}
        <div className="space-y-6">
          <div className="glass-panel p-6 rounded-3xl border border-red-500/30 bg-red-950/10 space-y-4 shadow-xl">
            <div className="flex items-center space-x-3 text-red-400">
              <ShieldAlert className="w-6 h-6 animate-pulse" />
              <h4 className="text-sm font-extrabold uppercase">Emergency Assistance</h4>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              In case of a breakdown, traffic collision, or passenger safety hazard, use the red Driver SOS button above or call transport dispatch directly.
            </p>
            <div className="glass-card p-3.5 rounded-xl border border-slate-800 space-y-2 text-xs">
              <p className="text-slate-400">Control Room Hotline:</p>
              <div className="flex items-center justify-between text-cyan-300 font-mono font-bold text-sm">
                <span>+91 98765 00001</span>
                <Phone className="w-4 h-4 text-emerald-400" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <SOSModal isOpen={isSOSOpen} onClose={handleCloseSOS} busId={bus.id} />
      <DelayModal isOpen={isDelayOpen} onClose={handleCloseDelay} busId={bus.id} />
    </div>
  );
};
