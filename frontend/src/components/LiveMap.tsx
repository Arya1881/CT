import React from 'react';
import { Bus, MapPin, AlertTriangle, Gauge, Clock } from 'lucide-react';
import type { Trip, Route, EmergencyAlert } from '../types';

interface LiveMapProps {
  trips: Trip[];
  routes: Route[];
  alerts?: EmergencyAlert[];
  selectedBusId?: string;
  singleBusOnly?: boolean;
  onSelectBus?: (busId: string) => void;
  height?: string;
}

export const LiveMap: React.FC<LiveMapProps> = ({
  trips,
  routes,
  alerts = [],
  selectedBusId,
  singleBusOnly = false,
  onSelectBus,
  height = 'h-[500px]'
}) => {
  const activeTrip = trips.find(t => t.busId === selectedBusId) || trips[0];
  const activeRoute = routes.find(r => r.id === activeTrip?.routeId) || routes[0];

  // If singleBusOnly is true, render strictly ONLY the assigned bus trip
  const tripsToDisplay = singleBusOnly && selectedBusId
    ? trips.filter(t => t.busId === selectedBusId)
    : trips;

  return (
    <div className={`relative w-full ${height} rounded-2xl glass-panel border border-slate-800 overflow-hidden flex flex-col shadow-2xl`}>
      <div className="absolute top-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        <div className="glass-panel px-4 py-2 rounded-xl border border-slate-700/80 shadow-lg flex items-center space-x-3 pointer-events-auto">
          <div className="w-3 h-3 rounded-full bg-emerald-400 animate-ping"></div>
          <div>
            <p className="text-xs font-bold text-slate-200">
              {activeTrip ? `Bus ${activeTrip.busId.replace('bus-', '')} Tracking` : 'Fleet Live GPS Corridor'}
            </p>
            <p className="text-[10px] text-slate-400">
              {activeRoute ? activeRoute.name : 'All Active Routes'}
            </p>
          </div>
        </div>

        {activeTrip && (
          <div className="glass-panel px-4 py-2 rounded-xl border border-slate-700/80 shadow-lg flex items-center space-x-6 pointer-events-auto text-xs">
            <div className="flex items-center space-x-2 text-slate-300">
              <Gauge className="w-4 h-4 text-cyan-400" />
              <span>Speed: <strong className="text-cyan-300 font-extrabold">{activeTrip.speedKmh} km/h</strong></span>
            </div>
            <div className="flex items-center space-x-2 text-slate-300">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>Next Stop: <strong className="text-amber-300 font-bold">{activeTrip.nextStopName}</strong> (~{activeTrip.etaMinutesToNextStop}m)</span>
            </div>
          </div>
        )}
      </div>

      <div className="relative flex-1 bg-slate-950 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] flex items-center justify-center p-8 overflow-hidden">
        <svg className="absolute inset-0 w-full h-full text-slate-800 opacity-60">
          <line x1="10%" y1="70%" x2="30%" y2="50%" stroke="#0284c7" strokeWidth="4" strokeDasharray="6 6" />
          <line x1="30%" y1="50%" x2="60%" y2="40%" stroke="#0284c7" strokeWidth="4" strokeDasharray="6 6" />
          <line x1="60%" y1="40%" x2="85%" y2="25%" stroke="#0284c7" strokeWidth="4" strokeDasharray="6 6" />
        </svg>

        {activeRoute?.stops.map((stop, idx) => {
          const positions = [
            { left: '10%', top: '70%' },
            { left: '30%', top: '50%' },
            { left: '48%', top: '45%' },
            { left: '68%', top: '35%' },
            { left: '85%', top: '25%' }
          ];
          const pos = positions[idx % positions.length];
          const isPassed = idx <= (activeTrip?.currentStopIndex || 0);

          return (
            <div
              key={stop.id}
              style={{ left: pos.left, top: pos.top }}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group z-10"
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                isPassed ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-lg shadow-cyan-500/20' : 'bg-slate-900 border-slate-700 text-slate-500'
              }`}>
                <MapPin className="w-4 h-4" />
              </div>
              <div className="mt-1 px-2.5 py-1 rounded-md glass-panel text-[10px] font-bold text-slate-200 shadow-md group-hover:scale-105 transition-transform whitespace-nowrap">
                {stop.name}
              </div>
            </div>
          );
        })}

        {tripsToDisplay.map((trip, idx) => {
          const busPosList = [
            { left: '22%', top: '58%' },
            { left: '55%', top: '42%' },
            { left: '78%', top: '30%' }
          ];
          const busPos = busPosList[idx % busPosList.length];
          const isSelected = selectedBusId === trip.busId;
          const isDelayed = trip.status === 'DELAYED';

          return (
            <div
              key={trip.id}
              onClick={() => onSelectBus && onSelectBus(trip.busId)}
              style={{ left: busPos.left, top: busPos.top }}
              className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer z-30 transition-all duration-700 ${
                isSelected ? 'scale-125' : 'hover:scale-110'
              }`}
            >
              <div className="relative">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-2xl border-2 transition-colors ${
                  isDelayed
                    ? 'bg-amber-500 text-slate-950 border-amber-300 shadow-amber-500/50'
                    : 'bg-gradient-to-tr from-cyan-500 to-blue-600 text-white border-cyan-300 shadow-cyan-500/50'
                }`}>
                  <Bus className="w-6 h-6 animate-bounce" />
                </div>

                <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 px-2 py-0.5 rounded-full bg-slate-900/90 border border-slate-700 text-[10px] font-extrabold text-cyan-400 whitespace-nowrap shadow-xl">
                  {trip.busId.toUpperCase()}
                </div>
              </div>
            </div>
          );
        })}

        {alerts.filter(a => a.status === 'ACTIVE').map((alert) => (
          <div
            key={alert.id}
            style={{ left: '42%', top: '48%' }}
            className="absolute transform -translate-x-1/2 -translate-y-1/2 z-40 sos-pulse flex flex-col items-center"
          >
            <div className="w-10 h-10 rounded-full bg-red-600 text-white flex items-center justify-center shadow-2xl border-2 border-red-300 animate-spin-slow">
              <AlertTriangle className="w-6 h-6 animate-pulse" />
            </div>
            <div className="mt-1 px-3 py-1 rounded-lg bg-red-950/90 border border-red-500/50 text-[11px] font-extrabold text-red-200 shadow-2xl whitespace-nowrap">
              🚨 {alert.role} SOS ALERT
            </div>
          </div>
        ))}
      </div>

      <div className="glass-panel px-6 py-2.5 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
        <div className="flex items-center space-x-6">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md bg-cyan-500"></span> Active Bus
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md bg-amber-500"></span> Delayed Bus
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-600 animate-pulse"></span> Active SOS Beacon
          </span>
        </div>
        <div>
          <span>{singleBusOnly ? 'Live Assigned Bus GPS Stream' : 'Click bus marker to select telemetry'}</span>
        </div>
      </div>
    </div>
  );
};
