import { Car } from 'lucide-react';

export default function LoadingScreen() {
  return (
    <div className="min-h-screen bg-surface flex items-center justify-center">
      <div className="text-center">
        <div className="relative inline-block mb-4">
          <div className="w-16 h-16 bg-brand-600/20 rounded-2xl flex items-center justify-center">
            <Car className="w-8 h-8 text-brand-400" />
          </div>
          <div className="absolute inset-0 rounded-2xl border-2 border-brand-500/50 animate-ping" />
        </div>
        <p className="text-slate-400 text-sm font-medium">Loading CampusRide...</p>
      </div>
    </div>
  );
}
