import React, { useState } from 'react';
import { AlertTriangle, X, ShieldAlert, CheckCircle2, Wrench, Ambulance } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTracking } from '../context/TrackingContext';
import type { SOSType } from '../types';

interface SOSModalProps {
  isOpen: boolean;
  onClose: () => void;
  busId?: string;
}

export const SOSModal: React.FC<SOSModalProps> = ({ isOpen, onClose, busId = 'bus-101' }) => {
  const { user } = useAuth();
  const { triggerSOS } = useTracking();
  const [selectedType, setSelectedType] = useState<SOSType>(
    user.role === 'DRIVER' ? 'DRIVER_BREAKDOWN' : 'STUDENT_SAFETY'
  );
  const [message, setMessage] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    triggerSOS(
      busId,
      user.id,
      user.name,
      user.role,
      selectedType,
      message || (user.role === 'DRIVER' ? 'Emergency reported by Bus Driver' : 'Emergency safety alert triggered by student')
    );
    setIsSubmitted(true);
    setTimeout(() => {
      setIsSubmitted(false);
      onClose();
    }, 2000);
  };

  const driverOptions = [
    { type: 'DRIVER_BREAKDOWN' as SOSType, label: 'Vehicle Breakdown / Engine Failure', icon: Wrench, desc: 'Bus engine issue or mechanical failure' },
    { type: 'DRIVER_ACCIDENT' as SOSType, label: 'Collision / Road Accident', icon: AlertTriangle, desc: 'Vehicle accident on transit corridor' },
    { type: 'DRIVER_MEDICAL' as SOSType, label: 'Medical Emergency (Passenger/Driver)', icon: Ambulance, desc: 'Medical assistance urgently needed' },
  ];

  const studentOptions = [
    { type: 'STUDENT_SAFETY' as SOSType, label: 'Personal Safety / Harassment SOS', icon: ShieldAlert, desc: 'Immediate security intervention needed' },
    { type: 'DRIVER_MEDICAL' as SOSType, label: 'Medical Emergency on Bus', icon: Ambulance, desc: 'Request medical support at next stop' },
  ];

  const options = user.role === 'DRIVER' ? driverOptions : studentOptions;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg glass-panel rounded-3xl border border-red-500/40 p-6 sm:p-8 shadow-2xl shadow-red-950/50">
        
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-2 rounded-full hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {isSubmitted ? (
          <div className="py-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto animate-bounce">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-extrabold text-white">EMERGENCY SOS DISPATCHED</h3>
            <p className="text-xs text-slate-300">
              Campus Security & Transport Control Room have received your live location and alert. Support is en route.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-2xl bg-red-600/20 text-red-500 border border-red-500/40 flex items-center justify-center shadow-lg shadow-red-500/20">
                <AlertTriangle className="w-7 h-7 animate-pulse" />
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-white uppercase tracking-tight flex items-center gap-2">
                  <span>EMERGENCY SOS BUTTON</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-red-500/30 text-red-300 font-mono">
                    {user.role}
                  </span>
                </h2>
                <p className="text-xs text-slate-400">Instantly alerts Campus Control & Dispatch Room</p>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Select Issue Category</label>
              <div className="space-y-2">
                {options.map((opt) => {
                  const Icon = opt.icon;
                  const isSelected = selectedType === opt.type;
                  return (
                    <div
                      key={opt.type}
                      onClick={() => setSelectedType(opt.type)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center space-x-3 ${
                        isSelected
                          ? 'bg-red-500/20 border-red-500 text-white shadow-lg shadow-red-950/40'
                          : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${isSelected ? 'text-red-400' : 'text-slate-500'}`} />
                      <div>
                        <p className="text-xs font-bold">{opt.label}</p>
                        <p className="text-[11px] text-slate-400">{opt.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Additional Message (Optional)</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Provide any location details or specific assistance needed..."
                className="w-full px-4 py-3 rounded-xl glass-input text-xs text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-red-500/50 min-h-[80px]"
              />
            </div>

            <button
              type="submit"
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 text-white font-extrabold text-sm tracking-wider uppercase shadow-xl shadow-red-600/30 hover:brightness-110 active:scale-[0.99] transition-all flex items-center justify-center space-x-2"
            >
              <ShieldAlert className="w-5 h-5" />
              <span>TRANSMIT EMERGENCY SOS NOW</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
