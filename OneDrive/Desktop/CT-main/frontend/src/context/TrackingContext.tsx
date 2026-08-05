import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Bus, Driver, Route, Student, Trip, EmergencyAlert, SOSType } from '../types';
import { BUSES, DRIVERS, ROUTES, STUDENTS, INITIAL_TRIPS, INITIAL_ALERTS } from '../mockData';

interface TrackingContextType {
  buses: Bus[];
  drivers: Driver[];
  routes: Route[];
  students: Student[];
  trips: Trip[];
  alerts: EmergencyAlert[];
  startTrip: (busId: string, routeId: string) => void;
  endTrip: (busId: string) => void;
  reportDelay: (busId: string, reason: string) => void;
  triggerSOS: (busId: string, userId: string, userName: string, role: any, alertType: SOSType, message: string) => void;
  resolveSOS: (alertId: string) => void;
  addBus: (newBus: Bus) => void;
  addDriver: (newDriver: Driver) => void;
  addStudent: (newStudent: Student) => void;
  addRoute: (newRoute: Route) => void;
}

const TrackingContext = createContext<TrackingContextType | undefined>(undefined);

export const TrackingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [buses, setBuses] = useState<Bus[]>(BUSES);
  const [drivers, setDrivers] = useState<Driver[]>(DRIVERS);
  const [routes, setRoutes] = useState<Route[]>(ROUTES);
  const [students, setStudents] = useState<Student[]>(STUDENTS);
  const [trips, setTrips] = useState<Trip[]>(INITIAL_TRIPS);
  const [alerts, setAlerts] = useState<EmergencyAlert[]>(INITIAL_ALERTS);

  useEffect(() => {
    const timer = setInterval(() => {
      setTrips(prevTrips =>
        prevTrips.map(trip => {
          if (trip.status !== 'IN_TRANSIT') return trip;

          const route = ROUTES.find(r => r.id === trip.routeId);
          if (!route) return trip;

          const targetStop = route.stops[(trip.currentStopIndex + 1) % route.stops.length];
          const dLat = (targetStop.lat - trip.currentLat) * 0.05;
          const dLng = (targetStop.lng - trip.currentLng) * 0.05;

          return {
            ...trip,
            currentLat: trip.currentLat + dLat,
            currentLng: trip.currentLng + dLng,
            speedKmh: Math.floor(30 + Math.random() * 15)
          };
        })
      );
    }, 2500);

    return () => clearInterval(timer);
  }, []);

  const startTrip = (busId: string, routeId: string) => {
    setBuses(prev => prev.map(b => b.id === busId ? { ...b, status: 'IN_TRANSIT' } : b));
    const route = ROUTES.find(r => r.id === routeId) || ROUTES[0];
    const newTrip: Trip = {
      id: `trip-${Date.now()}`,
      busId,
      driverId: 'd-1',
      routeId,
      status: 'IN_TRANSIT',
      startTime: new Date().toISOString(),
      currentLat: route.stops[0].lat,
      currentLng: route.stops[0].lng,
      speedKmh: 35,
      currentStopIndex: 0,
      nextStopName: route.stops[1].name,
      etaMinutesToNextStop: 5
    };
    setTrips(prev => [...prev.filter(t => t.busId !== busId), newTrip]);
  };

  const endTrip = (busId: string) => {
    setBuses(prev => prev.map(b => b.id === busId ? { ...b, status: 'IDLE' } : b));
    setTrips(prev => prev.map(t => t.busId === busId ? { ...t, status: 'COMPLETED', speedKmh: 0 } : t));
  };

  const reportDelay = (busId: string, reason: string) => {
    setBuses(prev => prev.map(b => b.id === busId ? { ...b, status: 'DELAYED' } : b));
    setTrips(prev => prev.map(t => t.busId === busId ? { ...t, status: 'DELAYED', delayReason: reason } : t));
  };

  const triggerSOS = (
    busId: string,
    userId: string,
    userName: string,
    role: any,
    alertType: SOSType,
    message: string
  ) => {
    const trip = trips.find(t => t.busId === busId);
    const newAlert: EmergencyAlert = {
      id: `alert-${Date.now()}`,
      tripId: trip?.id,
      busId,
      triggeredByUserId: userId,
      triggeredByName: userName,
      role,
      alertType,
      message,
      lat: trip?.currentLat || 12.9750,
      lng: trip?.currentLng || 77.5980,
      status: 'ACTIVE',
      timestamp: new Date().toISOString()
    };
    setAlerts(prev => [newAlert, ...prev]);
  };

  const resolveSOS = (alertId: string) => {
    setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, status: 'RESOLVED' } : a));
  };

  const addBus = (newBus: Bus) => {
    setBuses(prev => [...prev, newBus]);
  };

  const addDriver = (newDriver: Driver) => {
    setDrivers(prev => [...prev, newDriver]);
  };

  const addStudent = (newStudent: Student) => {
    setStudents(prev => [...prev, newStudent]);
  };

  const addRoute = (newRoute: Route) => {
    setRoutes(prev => [...prev, newRoute]);
  };

  return (
    <TrackingContext.Provider value={{
      buses,
      drivers,
      routes,
      students,
      trips,
      alerts,
      startTrip,
      endTrip,
      reportDelay,
      triggerSOS,
      resolveSOS,
      addBus,
      addDriver,
      addStudent,
      addRoute
    }}>
      {children}
    </TrackingContext.Provider>
  );
};

export const useTracking = () => {
  const context = useContext(TrackingContext);
  if (!context) {
    throw new Error('useTracking must be used within a TrackingProvider');
  }
  return context;
};
