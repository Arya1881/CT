import React, { useState } from 'react';
import { X, Bus, Users, Navigation, Plus, CheckCircle2 } from 'lucide-react';
import { useTracking } from '../../context/TrackingContext';
import type { Bus as BusType, Driver, Student, Route } from '../../types';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/* 1. ADD BUS MODAL */
export const AddBusModal: React.FC<ModalProps> = ({ isOpen, onClose }) => {
  const { routes, drivers, addBus } = useTracking();
  const [busNumber, setBusNumber] = useState('');
  const [regNumber, setRegNumber] = useState('');
  const [capacity, setCapacity] = useState(45);
  const [routeId, setRouteId] = useState(routes[0]?.id || 'route-101');
  const [driverId, setDriverId] = useState(drivers[0]?.id || 'd-1');
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newBus: BusType = {
      id: `bus-${Date.now()}`,
      busNumber: busNumber || `Bus ${Math.floor(100 + Math.random() * 900)}`,
      regNumber: regNumber || `KA-01-EQ-${Math.floor(1000 + Math.random() * 9000)}`,
      capacity: Number(capacity),
      routeId,
      driverId,
      status: 'IDLE'
    };
    addBus(newBus);
    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md glass-panel rounded-3xl border border-cyan-500/40 p-6 shadow-2xl space-y-4">
        <button onClick={onClose} className="absolute top-5 right-5 text-slate-400 hover:text-white p-2 rounded-full hover:bg-slate-800">
          <X className="w-5 h-5" />
        </button>

        {isSuccess ? (
          <div className="py-8 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-cyan-400 mx-auto animate-bounce" />
            <h3 className="text-lg font-bold text-white">Bus Added to Fleet</h3>
            <p className="text-xs text-slate-400">Vehicle registered and available in live telemetry.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center">
                <Bus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white">Register New Bus</h3>
                <p className="text-xs text-slate-400">Add vehicle to college fleet roster</p>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Bus Identifier Name</label>
              <input
                type="text"
                value={busNumber}
                onChange={e => setBusNumber(e.target.value)}
                placeholder="e.g. Bus 106"
                required
                className="w-full px-4 py-2.5 rounded-xl glass-input text-xs text-slate-200"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Registration Plate Number</label>
              <input
                type="text"
                value={regNumber}
                onChange={e => setRegNumber(e.target.value)}
                placeholder="e.g. KA-01-EQ-1006"
                required
                className="w-full px-4 py-2.5 rounded-xl glass-input text-xs text-slate-200 font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Seating Capacity</label>
                <input
                  type="number"
                  value={capacity}
                  onChange={e => setCapacity(Number(e.target.value))}
                  required
                  className="w-full px-4 py-2.5 rounded-xl glass-input text-xs text-slate-200"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Assign Route</label>
                <select
                  value={routeId}
                  onChange={e => setRouteId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl glass-input text-xs text-slate-200 bg-slate-900"
                >
                  {routes.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg transition-all"
            >
              Add Vehicle To Fleet
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

/* 2. REGISTER DRIVER MODAL */
export const AddDriverModal: React.FC<ModalProps> = ({ isOpen, onClose }) => {
  const { buses, addDriver } = useTracking();
  const [name, setName] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [busId, setBusId] = useState(buses[0]?.id || 'bus-101');
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newDriver: Driver = {
      id: `d-${Date.now()}`,
      userId: `u-driver-${Date.now()}`,
      name: name || 'Driver Name',
      licenseNumber: licenseNumber || `DL-2026-${Math.floor(10000 + Math.random() * 90000)}`,
      phone: phone || '+91 98765 00000',
      busId,
      status: 'AVAILABLE'
    };
    addDriver(newDriver);
    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md glass-panel rounded-3xl border border-emerald-500/40 p-6 shadow-2xl space-y-4">
        <button onClick={onClose} className="absolute top-5 right-5 text-slate-400 hover:text-white p-2 rounded-full hover:bg-slate-800">
          <X className="w-5 h-5" />
        </button>

        {isSuccess ? (
          <div className="py-8 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto animate-bounce" />
            <h3 className="text-lg font-bold text-white">Driver Registered</h3>
            <p className="text-xs text-slate-400">Roster updated and driver assigned.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white">Register New Driver</h3>
                <p className="text-xs text-slate-400">Add certified driver to roster</p>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Driver Full Name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Vikram Singh"
                required
                className="w-full px-4 py-2.5 rounded-xl glass-input text-xs text-slate-200"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">License Number</label>
              <input
                type="text"
                value={licenseNumber}
                onChange={e => setLicenseNumber(e.target.value)}
                placeholder="e.g. DL-2024-99112"
                required
                className="w-full px-4 py-2.5 rounded-xl glass-input text-xs text-slate-200 font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Contact Phone</label>
                <input
                  type="text"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  required
                  className="w-full px-4 py-2.5 rounded-xl glass-input text-xs text-slate-200 font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Assigned Bus</label>
                <select
                  value={busId}
                  onChange={e => setBusId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl glass-input text-xs text-slate-200 bg-slate-900"
                >
                  {buses.map(b => (
                    <option key={b.id} value={b.id}>{b.busNumber} ({b.regNumber})</option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg transition-all"
            >
              Register Driver To Roster
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

/* 3. ADD STUDENT MODAL */
export const AddStudentModal: React.FC<ModalProps> = ({ isOpen, onClose }) => {
  const { buses, routes, addStudent } = useTracking();
  const [name, setName] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [gradeDepartment, setGradeDepartment] = useState('Computer Science (Yr 2)');
  const [assignedBusId, setAssignedBusId] = useState(buses[0]?.id || 'bus-101');
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const selectedBus = buses.find(b => b.id === assignedBusId) || buses[0];
  const selectedRoute = routes.find(r => r.id === selectedBus?.routeId) || routes[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newStudent: Student = {
      id: `s-${Date.now()}`,
      userId: `u-student-${Date.now()}`,
      name: name || 'Student Name',
      rollNumber: rollNumber || `CS-2026-${Math.floor(100 + Math.random() * 900)}`,
      gradeDepartment,
      assignedBusId,
      assignedStopId: selectedRoute?.stops[0]?.id || 'stop-1',
      parentUserId: 'u-parent-1',
      boardingStatus: 'OFF_BOARD'
    };
    addStudent(newStudent);
    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md glass-panel rounded-3xl border border-indigo-500/40 p-6 shadow-2xl space-y-4">
        <button onClick={onClose} className="absolute top-5 right-5 text-slate-400 hover:text-white p-2 rounded-full hover:bg-slate-800">
          <X className="w-5 h-5" />
        </button>

        {isSuccess ? (
          <div className="py-8 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-indigo-400 mx-auto animate-bounce" />
            <h3 className="text-lg font-bold text-white">Student Registered</h3>
            <p className="text-xs text-slate-400">Pass issued & assigned to bus tracker.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white">Register New Student</h3>
                <p className="text-xs text-slate-400">Issue transit pass & bus assignment</p>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Student Full Name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Diya Sen"
                required
                className="w-full px-4 py-2.5 rounded-xl glass-input text-xs text-slate-200"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Roll Number</label>
                <input
                  type="text"
                  value={rollNumber}
                  onChange={e => setRollNumber(e.target.value)}
                  placeholder="CS-2025-055"
                  required
                  className="w-full px-4 py-2.5 rounded-xl glass-input text-xs text-slate-200 font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Department</label>
                <input
                  type="text"
                  value={gradeDepartment}
                  onChange={e => setGradeDepartment(e.target.value)}
                  placeholder="CS (Yr 2)"
                  required
                  className="w-full px-4 py-2.5 rounded-xl glass-input text-xs text-slate-200"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Assigned Transit Bus</label>
              <select
                value={assignedBusId}
                onChange={e => setAssignedBusId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl glass-input text-xs text-slate-200 bg-slate-900"
              >
                {buses.map(b => (
                  <option key={b.id} value={b.id}>{b.busNumber} ({b.regNumber})</option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-black text-xs uppercase tracking-wider shadow-lg transition-all"
            >
              Add Student To Directory
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

/* 4. CREATE ROUTE MODAL */
export const AddRouteModal: React.FC<ModalProps> = ({ isOpen, onClose }) => {
  const { addRoute } = useTracking();
  const [routeName, setRouteName] = useState('');
  const [startLocation, setStartLocation] = useState('');
  const [endLocation, setEndLocation] = useState('');
  const [distanceKm, setDistanceKm] = useState(15);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newRoute: Route = {
      id: `route-${Date.now()}`,
      name: routeName || 'New Express Line',
      startLocation: startLocation || 'Central Campus',
      endLocation: endLocation || 'Outer Ring Residency',
      distanceKm: Number(distanceKm),
      stops: [
        { id: `s-1-${Date.now()}`, name: startLocation || 'Central Campus', lat: 12.9716, lng: 77.5946, sequenceOrder: 1, estimatedTimeFromStart: 0 },
        { id: `s-2-${Date.now()}`, name: 'Tech Hub Interchange', lat: 12.9800, lng: 77.6020, sequenceOrder: 2, estimatedTimeFromStart: 15 },
        { id: `s-3-${Date.now()}`, name: endLocation || 'Outer Ring Residency', lat: 12.9900, lng: 77.6150, sequenceOrder: 3, estimatedTimeFromStart: 30 }
      ]
    };
    addRoute(newRoute);
    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md glass-panel rounded-3xl border border-amber-500/40 p-6 shadow-2xl space-y-4">
        <button onClick={onClose} className="absolute top-5 right-5 text-slate-400 hover:text-white p-2 rounded-full hover:bg-slate-800">
          <X className="w-5 h-5" />
        </button>

        {isSuccess ? (
          <div className="py-8 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-amber-400 mx-auto animate-bounce" />
            <h3 className="text-lg font-bold text-white">Transit Corridor Created</h3>
            <p className="text-xs text-slate-400">Route and stops sequence added to grid.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
                <Navigation className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white">Create Transit Corridor</h3>
                <p className="text-xs text-slate-400">Define route path & station sequence</p>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Corridor Route Name</label>
              <input
                type="text"
                value={routeName}
                onChange={e => setRouteName(e.target.value)}
                placeholder="e.g. East Tech Corridor (Route F)"
                required
                className="w-full px-4 py-2.5 rounded-xl glass-input text-xs text-slate-200"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Origin Terminal</label>
                <input
                  type="text"
                  value={startLocation}
                  onChange={e => setStartLocation(e.target.value)}
                  placeholder="Central Campus"
                  required
                  className="w-full px-4 py-2.5 rounded-xl glass-input text-xs text-slate-200"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Destination Terminal</label>
                <input
                  type="text"
                  value={endLocation}
                  onChange={e => setEndLocation(e.target.value)}
                  placeholder="Suburban Residency"
                  required
                  className="w-full px-4 py-2.5 rounded-xl glass-input text-xs text-slate-200"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Total Distance (km)</label>
              <input
                type="number"
                value={distanceKm}
                onChange={e => setDistanceKm(Number(e.target.value))}
                required
                className="w-full px-4 py-2.5 rounded-xl glass-input text-xs text-slate-200"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg transition-all"
            >
              Add Route To Grid
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
