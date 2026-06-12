import { useState, useEffect } from 'react';
import api from '../../services/api';
import StatusBadge from '../../components/common/StatusBadge';
import StarRating from '../../components/common/StarRating';
import { Clock, MapPin, TrendingUp } from 'lucide-react';

export default function DriverHistory() {
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/drivers/rides')
      .then(res => setRides(res.data.rides))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  }) : '—';

  const completed = rides.filter(r => r.status === 'COMPLETED');
  const totalEarnings = completed.reduce((sum, r) => sum + (r.fare || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Ride History</h1>
        <p className="text-slate-400 mt-1">All your completed and past rides</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card text-center">
          <p className="text-2xl font-bold text-white">{rides.length}</p>
          <p className="text-xs text-slate-500 mt-1">Total Rides</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-brand-400">{completed.length}</p>
          <p className="text-xs text-slate-500 mt-1">Completed</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-yellow-400">
            {totalEarnings > 0 ? `₹${totalEarnings}` : '—'}
          </p>
          <p className="text-xs text-slate-500 mt-1">Total Earnings</p>
        </div>
      </div>

      {rides.length === 0 ? (
        <div className="card text-center py-16">
          <TrendingUp className="w-12 h-12 text-slate-700 mx-auto mb-3" />
          <p className="text-slate-400 font-medium">No rides yet</p>
          <p className="text-slate-600 text-sm mt-1">Go online and accept ride requests to get started</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rides.map(ride => (
            <div key={ride.id} className="card">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Clock className="w-3.5 h-3.5" />
                  {formatDate(ride.createdAt)}
                </div>
                <div className="flex items-center gap-2">
                  {ride.fare && (
                    <span className="text-sm font-bold text-white">₹{ride.fare}</span>
                  )}
                  <StatusBadge status={ride.status} />
                </div>
              </div>

              <div className="space-y-2 mb-3">
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 bg-brand-400 rounded-full flex-shrink-0" />
                  <span className="text-white">{ride.pickupLocation}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 bg-red-400 rounded-full flex-shrink-0" />
                  <span className="text-slate-300">{ride.dropLocation}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-border">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <div className="w-6 h-6 bg-blue-600/20 rounded-full flex items-center justify-center text-blue-400 font-bold text-xs">
                    {ride.passenger?.name?.[0]}
                  </div>
                  {ride.passenger?.name}
                </div>
                {ride.rating ? (
                  <div className="flex items-center gap-2">
                    <StarRating value={ride.rating.score} readonly size="sm" />
                    {ride.rating.feedback && (
                      <span className="text-xs text-slate-500 italic max-w-[120px] truncate">
                        "{ride.rating.feedback}"
                      </span>
                    )}
                  </div>
                ) : (
                  ride.status === 'COMPLETED' && (
                    <span className="text-xs text-slate-600">No rating</span>
                  )
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
