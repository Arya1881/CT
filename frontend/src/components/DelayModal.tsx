import React, { useState } from 'react';
import { X, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useTracking } from '../context/TrackingContext';

interface DelayModalProps {
  isOpen: boolean;
  onClose: () => void;
  busId: string;
}

export const DelayModal: React.FC<DelayModalProps> = ({ isOpen, onClose, busId }) => {
  const { reportDelay } = useTracking();
  const [reason, setReason] = useState('Heavy Highway Traffic');
  const [customReason, setCustomReason] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalReason = reason === 'Other' ? customReason : reason;
    reportDelay(busId, finalReason || 'Route delay reported by driver');
    setIsSubmitted(true);
    setTimeout(() => {
      setIsSubmitted(false);
      onClose();
    }, 1500);
  };

  const delayReasons = [
    'Heavy Highway Traffic',
    'Severe Weather / Rainfall',
    'Minor Mechanical Maintenance',
    'Road Work / Route Detour',
    'Other'
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md glass-panel rounded-3xl border border-amber-500/40 p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-2 rounded-full hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {isSubmitted ? (
          <div className="py-6 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-amber-400 mx-auto" />
            <h3 className="text-lg font-bold text-white">Delay Transmitted to Passengers</h3>
            <p className="text-xs text-slate-400">Students and parents will see updated ETA on their trackers.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white">Report Trip Delay</h3>
                <p className="text-xs text-slate-400">Broadcasts instant delay notice to bus passengers</p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300">Delay Reason</label>
              <div className="space-y-1.5">
                {delayReasons.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setReason(r)}
                    className={`w-full text-left px-3.5 py-2.5 rounded-xl border text-xs font-medium transition-all ${
                      reason === r
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {reason === 'Other' && (
              <input
                type="text"
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Specify delay reason..."
                className="w-full px-4 py-2.5 rounded-xl glass-input text-xs text-slate-200"
                required
              />
            )}

            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs uppercase tracking-wider shadow-lg transition-all"
            >
              Broadcast Delay Update
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
