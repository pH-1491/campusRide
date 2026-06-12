import { useState, useEffect, useCallback } from 'react';
import { useSocket } from '../../context/SocketContext';
import api from '../../services/api';
import { MapPin, Clock, User, CheckCircle, XCircle, Navigation, Zap } from 'lucide-react';
import toast from 'react-hot-toast';

export default function DriverRideRequests() {
  const { getSocket } = useSocket();
  const [requests, setRequests] = useState([]);
  const [activeRide, setActiveRide] = useState(null);
  const [accepting, setAccepting] = useState(null);
  const [isOnline, setIsOnline] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);

  const fetchActiveRide = useCallback(async () => {
    try {
      const res = await api.get('/drivers/dashboard');
      setActiveRide(res.data.dashboard.activeRide);
      setIsOnline(res.data.dashboard.stats.isOnline);
    } catch {}
  }, []);

  useEffect(() => {
    const init = async () => {
      await fetchActiveRide();
      setLoadingProfile(false);
    };
    init();
  }, []);

  // Real-time socket events
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    // New ride request broadcast
    socket.on('ride:new_request', (data) => {
      if (!isOnline) return;
      setRequests(prev => {
        if (prev.find(r => r.rideId === data.rideId)) return prev;
        return [{ ...data, receivedAt: new Date() }, ...prev];
      });
      toast('🔔 New ride request!', {
        icon: '🚗',
        style: { background: '#1e3a5f', borderColor: '#3b82f6' },
        duration: 5000,
      });
    });

    // Ride taken by another driver
    socket.on('ride:taken', ({ rideId }) => {
      setRequests(prev => prev.filter(r => r.rideId !== rideId));
    });

    // Ride cancelled by passenger
    socket.on('ride:cancelled', ({ rideId }) => {
      setRequests(prev => prev.filter(r => r.rideId !== rideId));
    });

    // Active ride cancelled
    if (activeRide) {
      socket.on(`ride:${activeRide.id}:cancelled`, () => {
        toast.error('Passenger cancelled the ride');
        setActiveRide(null);
      });
    }

    return () => {
      socket.off('ride:new_request');
      socket.off('ride:taken');
      socket.off('ride:cancelled');
      if (activeRide) socket.off(`ride:${activeRide.id}:cancelled`);
    };
  }, [getSocket, isOnline, activeRide]);

  const handleAccept = async (rideId) => {
    setAccepting(rideId);
    try {
      const res = await api.patch(`/rides/${rideId}/accept`);
      setRequests(prev => prev.filter(r => r.rideId !== rideId));
      setActiveRide(res.data.ride);
      toast.success('Ride accepted!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not accept ride');
      setRequests(prev => prev.filter(r => r.rideId !== rideId));
    } finally {
      setAccepting(null);
    }
  };

  const handleReject = (rideId) => {
    setRequests(prev => prev.filter(r => r.rideId !== rideId));
    toast('Request dismissed', { icon: '👋' });
  };

  const handleStartRide = async () => {
    try {
      await api.patch(`/rides/${activeRide.id}/start`);
      setActiveRide(prev => ({ ...prev, status: 'IN_PROGRESS' }));
      toast.success('Ride started!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to start ride');
    }
  };

  const handleCompleteRide = async () => {
    const fareStr = prompt('Enter fare amount (₹):');
    if (fareStr === null) return;
    const fare = parseFloat(fareStr);
    try {
      await api.patch(`/rides/${activeRide.id}/complete`, { fare: isNaN(fare) ? null : fare });
      setActiveRide(null);
      toast.success('Ride completed! 🎉');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to complete ride');
    }
  };

  const timeSince = (date) => {
    const secs = Math.floor((new Date() - new Date(date)) / 1000);
    if (secs < 60) return `${secs}s ago`;
    return `${Math.floor(secs / 60)}m ago`;
  };

  if (loadingProfile) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Ride Requests</h1>
        <div className="flex items-center gap-2 mt-1">
          <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-brand-400 animate-pulse' : 'bg-slate-600'}`} />
          <p className="text-slate-400 text-sm">
            {isOnline ? 'Accepting incoming requests' : 'You are offline — go online from Dashboard'}
          </p>
        </div>
      </div>

      {/* Active ride card */}
      {activeRide && (
        <div className="card mb-6 border-blue-500/30 bg-blue-500/5">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-4 h-4 text-blue-400" />
            <h2 className="text-sm font-semibold text-blue-400 uppercase tracking-wide">
              Active Ride — {activeRide.status.replace('_', ' ')}
            </h2>
          </div>

          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-600/20 rounded-full flex items-center justify-center font-bold text-blue-400 text-lg">
              {activeRide.passenger?.name?.[0]}
            </div>
            <div>
              <p className="font-semibold text-white">{activeRide.passenger?.name}</p>
              {activeRide.passenger?.phone && (
                <a href={`tel:${activeRide.passenger.phone}`} className="text-xs text-blue-400 hover:underline">
                  📞 {activeRide.passenger.phone}
                </a>
              )}
            </div>
          </div>

          <div className="bg-card rounded-lg p-3 space-y-2 mb-4">
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 bg-brand-400 rounded-full" />
              <span className="text-white font-medium">{activeRide.pickupLocation}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 bg-red-400 rounded-full" />
              <span className="text-slate-300">{activeRide.dropLocation}</span>
            </div>
          </div>

          <div className="flex gap-3">
            {activeRide.status === 'ACCEPTED' && (
              <button onClick={handleStartRide} className="btn-primary flex-1 py-2.5">
                🚗 Start Ride
              </button>
            )}
            {activeRide.status === 'IN_PROGRESS' && (
              <button onClick={handleCompleteRide} className="btn-primary flex-1 py-2.5 bg-blue-600 hover:bg-blue-500">
                ✅ Complete Ride
              </button>
            )}
          </div>
        </div>
      )}

      {/* Incoming requests */}
      {!activeRide && (
        <>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">
              Incoming Requests
            </h2>
            <span className="text-xs text-slate-500 bg-panel px-2 py-1 rounded-full border border-border">
              {requests.length} pending
            </span>
          </div>

          {!isOnline ? (
            <div className="card text-center py-16">
              <Navigation className="w-12 h-12 text-slate-700 mx-auto mb-3" />
              <p className="text-slate-400 font-medium">You're offline</p>
              <p className="text-slate-600 text-sm mt-1">Go online from the Dashboard to receive requests</p>
            </div>
          ) : requests.length === 0 ? (
            <div className="card text-center py-16">
              <div className="relative inline-block mb-4">
                <div className="w-14 h-14 bg-brand-600/10 rounded-full flex items-center justify-center">
                  <MapPin className="w-7 h-7 text-slate-600" />
                </div>
              </div>
              <p className="text-slate-400 font-medium">Waiting for requests...</p>
              <p className="text-slate-600 text-sm mt-1">New ride requests will appear here instantly</p>
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map(req => (
                <div key={req.rideId} className="card border-blue-500/20 bg-blue-500/5 slide-up">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 bg-blue-600/20 rounded-full flex items-center justify-center font-bold text-blue-400">
                        {req.passenger?.name?.[0]}
                      </div>
                      <div>
                        <p className="font-semibold text-white text-sm">{req.passenger?.name}</p>
                        <p className="text-xs text-slate-500">{timeSince(req.requestedAt)}</p>
                      </div>
                    </div>
                    <span className="text-xs text-blue-400 bg-blue-500/10 px-2 py-1 rounded-full border border-blue-500/20">
                      New
                    </span>
                  </div>

                  <div className="bg-card rounded-lg p-3 space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 bg-brand-400 rounded-full flex-shrink-0" />
                      <span className="text-white font-medium">{req.pickupLocation}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 bg-red-400 rounded-full flex-shrink-0" />
                      <span className="text-slate-300">{req.dropLocation}</span>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => handleReject(req.rideId)}
                      className="btn-secondary flex-1 py-2 flex items-center justify-center gap-1.5 text-red-400 border-red-500/20 hover:bg-red-500/10"
                    >
                      <XCircle className="w-4 h-4" />
                      Decline
                    </button>
                    <button
                      onClick={() => handleAccept(req.rideId)}
                      disabled={accepting === req.rideId}
                      className="btn-primary flex-1 py-2 flex items-center justify-center gap-1.5"
                    >
                      {accepting === req.rideId ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <><CheckCircle className="w-4 h-4" />Accept</>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
