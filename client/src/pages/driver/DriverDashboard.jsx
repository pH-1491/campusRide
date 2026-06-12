import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../../context/SocketContext';
import api from '../../services/api';
import StatusBadge from '../../components/common/StatusBadge';
import StarRating from '../../components/common/StarRating';
import {
  Car, TrendingUp, Star, ToggleLeft, ToggleRight,
  Navigation, Clock, CheckCircle, AlertCircle, MapPin
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function DriverDashboard() {
  const navigate = useNavigate();
  const { getSocket } = useSocket();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [togglingOnline, setTogglingOnline] = useState(false);

  const fetchDashboard = async () => {
    try {
      const res = await api.get('/drivers/dashboard');
      setDashboard(res.data.dashboard);
    } catch (err) {
      if (err.response?.status === 404) {
        navigate('/driver/onboarding');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDashboard(); }, []);

  // Socket: listen for active ride updates
  useEffect(() => {
    const socket = getSocket();
    if (!socket || !dashboard?.activeRide) return;
    const rideId = dashboard.activeRide.id;

    socket.on(`ride:${rideId}:cancelled`, () => {
      toast.error('Passenger cancelled the ride');
      fetchDashboard();
    });

    return () => {
      socket.off(`ride:${rideId}:cancelled`);
    };
  }, [getSocket, dashboard?.activeRide?.id]);

  const handleToggleOnline = async () => {
    setTogglingOnline(true);
    try {
      const res = await api.patch('/drivers/availability');
      setDashboard(prev => ({
        ...prev,
        driver: { ...prev.driver, isOnline: res.data.driver.isOnline },
        stats: { ...prev.stats, isOnline: res.data.driver.isOnline },
      }));
      toast.success(res.data.driver.isOnline ? '🟢 You are now online' : '🔴 You are now offline');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    } finally {
      setTogglingOnline(false);
    }
  };

  const handleStartRide = async (rideId) => {
    try {
      await api.patch(`/rides/${rideId}/start`);
      toast.success('Ride started!');
      fetchDashboard();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to start ride');
    }
  };

  const handleCompleteRide = async (rideId) => {
    const fare = prompt('Enter fare amount (₹):');
    if (fare === null) return;
    try {
      await api.patch(`/rides/${rideId}/complete`, { fare: parseFloat(fare) || null });
      toast.success('Ride completed!');
      fetchDashboard();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to complete ride');
    }
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
  }) : '—';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!dashboard) return null;

  const { driver, stats, activeRide, recentRides, recentRatings } = dashboard;
  const isOnline = stats.isOnline;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Driver Dashboard</h1>
          <p className="text-slate-400 mt-1">{driver.vehicleNumber} · {driver.vehicleType}</p>
        </div>

        {/* Online toggle */}
        <button
          onClick={handleToggleOnline}
          disabled={togglingOnline}
          className={`flex items-center gap-3 px-5 py-3 rounded-xl border font-semibold text-sm transition-all
            ${isOnline
              ? 'bg-brand-600/20 border-brand-500/50 text-brand-400 hover:bg-brand-600/30'
              : 'bg-panel border-border text-slate-400 hover:border-slate-500'
            } ${togglingOnline ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <div className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-brand-400 animate-pulse' : 'bg-slate-600'}`} />
          {togglingOnline ? 'Updating...' : isOnline ? 'Online – Accepting Rides' : 'Go Online'}
          {isOnline
            ? <ToggleRight className="w-5 h-5 text-brand-400" />
            : <ToggleLeft className="w-5 h-5 text-slate-500" />
          }
        </button>
      </div>

      {/* Verification warning */}
      {!driver.isVerified && (
        <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0" />
          <p className="text-sm text-amber-300">
            Your account is pending admin verification. You cannot go online until verified.
          </p>
        </div>
      )}

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Rides',   value: stats.totalRides,     icon: Car,         color: 'blue'   },
          { label: 'Completed',     value: stats.completedRides,  icon: CheckCircle, color: 'green'  },
          { label: 'Avg Rating',    value: stats.averageRating ? `${stats.averageRating.toFixed(1)} ★` : '—', icon: Star, color: 'yellow' },
          { label: 'Cancelled',     value: stats.cancelledRides,  icon: AlertCircle, color: 'red'    },
        ].map(({ label, value, icon: Icon, color }) => {
          const colorMap = {
            blue:   'bg-blue-500/10 text-blue-400',
            green:  'bg-brand-500/10 text-brand-400',
            yellow: 'bg-yellow-500/10 text-yellow-400',
            red:    'bg-red-500/10 text-red-400',
          };
          return (
            <div key={label} className="card">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${colorMap[color]}`}>
                <Icon className="w-5 h-5" />
              </div>
              <p className="text-2xl font-bold text-white">{value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{label}</p>
            </div>
          );
        })}
      </div>

      {/* Active ride */}
      {activeRide && (
        <div className="card mb-6 border-brand-500/30 bg-brand-500/5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-brand-400 uppercase tracking-wide">Active Ride</h2>
            <StatusBadge status={activeRide.status} />
          </div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-600/20 rounded-full flex items-center justify-center font-bold text-blue-400">
              {activeRide.passenger?.name?.[0]}
            </div>
            <div>
              <p className="font-semibold text-white">{activeRide.passenger?.name}</p>
              {activeRide.passenger?.phone && (
                <a href={`tel:${activeRide.passenger.phone}`} className="text-xs text-brand-400 hover:underline">
                  {activeRide.passenger.phone}
                </a>
              )}
            </div>
          </div>
          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 bg-brand-400 rounded-full" />
              <span className="text-white">{activeRide.pickupLocation}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 bg-red-400 rounded-full" />
              <span className="text-slate-300">{activeRide.dropLocation}</span>
            </div>
          </div>
          <div className="flex gap-3">
            {activeRide.status === 'ACCEPTED' && (
              <button onClick={() => handleStartRide(activeRide.id)} className="btn-primary flex-1 py-2">
                Start Ride
              </button>
            )}
            {activeRide.status === 'IN_PROGRESS' && (
              <button onClick={() => handleCompleteRide(activeRide.id)} className="btn-primary flex-1 py-2 bg-blue-600 hover:bg-blue-500">
                Complete Ride
              </button>
            )}
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent rides */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">Recent Rides</h2>
            <button onClick={() => navigate('/driver/history')} className="text-xs text-brand-400 hover:text-brand-300">
              View all →
            </button>
          </div>
          {recentRides.length === 0 ? (
            <p className="text-slate-500 text-sm py-6 text-center">No rides yet</p>
          ) : (
            <div className="space-y-3">
              {recentRides.map(ride => (
                <div key={ride.id} className="flex items-center gap-3 p-2.5 bg-card rounded-lg">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-white font-medium truncate">{ride.pickupLocation}</span>
                      <span className="text-slate-600">→</span>
                      <span className="text-slate-400 truncate">{ride.dropLocation}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{formatDate(ride.createdAt)}</p>
                  </div>
                  <div className="flex-shrink-0">
                    {ride.rating
                      ? <span className="text-xs text-yellow-400">★ {ride.rating.score}</span>
                      : <StatusBadge status={ride.status} />
                    }
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent ratings */}
        <div className="card">
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide mb-4">Recent Ratings</h2>
          {recentRatings.length === 0 ? (
            <p className="text-slate-500 text-sm py-6 text-center">No ratings yet</p>
          ) : (
            <div className="space-y-3">
              {recentRatings.map(r => (
                <div key={r.id} className="p-2.5 bg-card rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-white">{r.giver?.name}</span>
                    <StarRating value={r.score} readonly size="sm" />
                  </div>
                  {r.feedback && (
                    <p className="text-xs text-slate-400 italic">"{r.feedback}"</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
