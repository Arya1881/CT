import React, { useEffect, useRef, useState } from 'react';
import { Bus, Phone, Share2, MapPin, Gauge } from 'lucide-react';
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

// Catmull-Rom Spline generator for 100% free-flowing smooth curved route paths like Google Maps
function generateSmoothSpline(points: [number, number][], numPointsPerSegment: number = 25): [number, number][] {
  if (points.length < 2) return points;

  const result: [number, number][] = [];
  const pts: [number, number][] = [points[0], ...points, points[points.length - 1]];

  for (let i = 0; i < pts.length - 3; i++) {
    const p0 = pts[i];
    const p1 = pts[i + 1];
    const p2 = pts[i + 2];
    const p3 = pts[i + 3];

    for (let j = 0; j < numPointsPerSegment; j++) {
      const t = j / numPointsPerSegment;
      const t2 = t * t;
      const t3 = t2 * t;

      const lat = 0.5 * (
        (2 * p1[0]) +
        (-p0[0] + p2[0]) * t +
        (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 +
        (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3
      );

      const lng = 0.5 * (
        (2 * p1[1]) +
        (-p0[1] + p2[1]) * t +
        (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 +
        (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3
      );

      result.push([lat, lng]);
    }
  }

  result.push(points[points.length - 1]);
  return result;
}

export const LiveMap: React.FC<LiveMapProps> = ({
  trips,
  routes,
  selectedBusId,
  singleBusOnly = false,
  onSelectBus,
  height = 'h-[480px]'
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<{ [key: string]: any }>({});
  const polylineRef = useRef<any>(null);
  const glowPolylineRef = useRef<any>(null);

  const [isMapReady, setIsMapReady] = useState(false);

  const activeTrip = trips.find(t => t.busId === selectedBusId) || trips[0];
  const activeRoute = routes.find(r => r.id === activeTrip?.routeId) || routes[0];

  const tripsToDisplay = singleBusOnly && selectedBusId
    ? trips.filter(t => t.busId === selectedBusId)
    : trips;

  // Dynamically load Leaflet CDN for real Google/OSM Map tiles
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if ((window as any).L) {
      setIsMapReady(true);
      return;
    }

    const cssLink = document.createElement('link');
    cssLink.rel = 'stylesheet';
    cssLink.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(cssLink);

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.async = true;
    script.onload = () => {
      setIsMapReady(true);
    };
    document.head.appendChild(script);
  }, []);

  // Initialize Real Map Instance
  useEffect(() => {
    if (!isMapReady || !mapContainerRef.current || mapInstanceRef.current) return;

    const L = (window as any).L;
    if (!L) return;

    const centerLat = activeTrip?.currentLat || 10.3637;
    const centerLng = activeTrip?.currentLng || 76.3262;

    const map = L.map(mapContainerRef.current, {
      center: [centerLat, centerLng],
      zoom: 13,
      zoomControl: false
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isMapReady]);

  // Update Free-Flowing Smooth Orange Curved Spline & Markers
  useEffect(() => {
    if (!mapInstanceRef.current || !(window as any).L) return;
    const L = (window as any).L;
    const map = mapInstanceRef.current;

    if (activeRoute && activeRoute.stops && activeRoute.stops.length > 0) {
      const stopCoords: [number, number][] = activeRoute.stops.map(s => [s.lat, s.lng]);
      
      // Generate 100% free-flowing smooth spline curves like Google Maps
      const curvedRoutePath = generateSmoothSpline(stopCoords, 30);

      // Outer Orange Glow Polyline Line
      if (glowPolylineRef.current) map.removeLayer(glowPolylineRef.current);
      glowPolylineRef.current = L.polyline(curvedRoutePath, {
        color: '#ff8800',
        weight: 10,
        opacity: 0.35,
        lineCap: 'round',
        lineJoin: 'round'
      }).addTo(map);

      // Core Vibrant Orange Polyline Line
      if (polylineRef.current) map.removeLayer(polylineRef.current);
      polylineRef.current = L.polyline(curvedRoutePath, {
        color: '#ff6b00',
        weight: 6,
        opacity: 0.95,
        lineCap: 'round',
        lineJoin: 'round'
      }).addTo(map);

      map.fitBounds(polylineRef.current.getBounds(), { padding: [35, 35] });
    }

    // Clear old markers
    Object.values(markersRef.current).forEach((marker: any) => map.removeLayer(marker));
    markersRef.current = {};

    // Add Bus Vehicle Markers with Custom Orange Badge Icon
    tripsToDisplay.forEach(trip => {
      const busHtml = `
        <div style="
          width: 46px;
          height: 46px;
          background: linear-gradient(135deg, #ff6b00 0%, #ff8800 100%);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 8px 20px rgba(255, 107, 0, 0.5);
          border: 3px solid #ffffff;
        ">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M8 6v6"></path> <path d="M16 6v6"></path> <path d="M4 12v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-6"></path> <path d="M4 12h16"></path> <path d="M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v6H4V6z"></path> <circle cx="7.5" cy="16.5" r="1.5"></circle> <circle cx="16.5" cy="16.5" r="1.5"></circle>
          </svg>
        </div>
      `;

      const customIcon = L.divIcon({
        html: busHtml,
        className: 'custom-bus-marker',
        iconSize: [46, 46],
        iconAnchor: [23, 23]
      });

      const marker = L.marker([trip.currentLat, trip.currentLng], { icon: customIcon }).addTo(map);
      marker.on('click', () => {
        if (onSelectBus) onSelectBus(trip.busId);
      });
      markersRef.current[trip.busId] = marker;
    });

  }, [isMapReady, tripsToDisplay, activeRoute]);

  return (
    <div className="space-y-4">
      {/* Real Map Viewport Container (Clean 100% full-bleed map, "Track your bus" inner bar completely removed) */}
      <div className={`relative w-full ${height} rounded-3xl overflow-hidden shadow-2xl bg-slate-900 border border-orange-200/40`}>
        <div ref={mapContainerRef} className="w-full h-full z-10" />
      </div>

      {/* Details Strictly BELOW the Map Container */}
      {activeTrip && (
        <div className="bg-white p-5 rounded-3xl shadow-xl border border-slate-100 space-y-3 font-['Plus_Jakarta_Sans',sans-serif]">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-6">
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase">Distance</p>
                <p className="text-2xl font-black text-slate-900">15 <span className="text-sm font-bold text-slate-500">km</span></p>
              </div>
              <div className="pl-6 border-l border-slate-200">
                <p className="text-[10px] text-slate-400 font-bold uppercase">Travel time</p>
                <p className="text-2xl font-black text-slate-900">{activeTrip.etaMinutesToNextStop || 15} <span className="text-sm font-bold text-slate-500">min</span></p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 flex items-center justify-center transition-colors">
                <Share2 className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="space-y-1.5">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-100"></span>
                <p className="text-xs font-extrabold text-slate-800">{activeRoute?.stops[0]?.name || 'Sahrdaya Main Gate'}</p>
                <span className="text-[10px] text-slate-400 font-bold">16:00</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-500 ring-4 ring-sky-100"></span>
                <p className="text-xs font-extrabold text-slate-800">{activeTrip.nextStopName || 'Irinjalakuda Terminal'}</p>
                <span className="text-[10px] text-slate-400 font-bold">16:25</span>
              </div>
            </div>

            <a
              href="tel:+919876543210"
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold text-xs tracking-wider shadow-xl shadow-orange-500/30 transition-all flex items-center space-x-2"
            >
              <Phone className="w-4 h-4 text-white fill-white" />
              <span>CALL DRIVER</span>
            </a>
          </div>
        </div>
      )}
    </div>
  );
};
