import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSocket } from '../../context/SocketContext';
import api from '../../services/api';
import StatusBadge from '../../components/common/StatusBadge';
import StarRating from '../../components/common/StarRating';
import {
  MapPin, Navigation, Car, Phone, Star, CheckCircle,
  XCircle, Clock, AlertCircle, ArrowLeft
} from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS_STEPS = ['REQUESTED', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED'];

export default function RideTracking() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getSocket } = useSocket();
  const [ride, setRide] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [rating, setRating] = useState({ score: 0, feedback: '' });
  const [submittingRating, setSubmittingRating] = useState(false);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);

  const fetchRide = async () => {
    try {
      const res = await api.get(`/rides/${id}`);
      const r = res.data.ride;
      setRide(r);
      if (r.rating) setRatingSubmitted(true);
    } catch (err) {
      toast.error('Ride not found');
      navigate('/passenger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRide();
  }, [id]);

  // Socket: real-time updates
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    socket.on(`ride:${id}:accepted`, (data) => {
      setRide(prev => ({ ...prev, status: 'ACCEPTED', driver: data.driver, driverId: data.driver.id }));
      toast.success('🎉 Driver accepted your ride!', { duration: 4000 });
    });

    socket.on(`ride:${id}:started`, (data) => {
      setRide(prev => ({ ...prev, status: 'IN_PROGRESS', startedAt: data.startedAt }));
      toast.success('🚗 Your ride has started!');
    });

    socket.on(`ride:${id}:completed`, (data) => {
      setRide(prev => ({ ...prev, status: 'COMPLETED', completedAt: data.completedAt, fare: data.fare }));
      toast.success('✅ Ride completed!');
    });

    socket.on(`ride:${id}:cancelled`, (data) => {
      setRide(prev => ({ ...prev, status: 'CANCELLED' }));
      toast.error('Ride was cancelled');
    });

    return () => {
      socket.off(`ride:${id}:accepted`);
      socket.off(`ride:${id}:started`);
      socket.off(`ride:${id}:completed`);
      socket.off(`ride:${id}:cancelled`);
    };
  }, [id, getSocket]);

  const handleCancel = async () => {
    if (!window.confirm('Cancel this ride?')) return;
    setCancelling(true);
    try {
      await api.patch(`/rides/${id}/cancel`);
      setRide(prev => ({ ...prev, status: 'CANCELLED' }));
      toast.success('Ride cancelled');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cannot cancel');
    } finally {
      setCancelling(false);
    }
  };

  const handleRating = async () => {
    if (rating.score === 0) {
      toast.error('Please select a rating');
      return;
    }
    setSubmittingRating(true);
    try {
      await api.post('/ratings', { rideId: id, ...rating });
      setRatingSubmitted(true);
      toast.success('Thanks for your feedback!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit rating');
    } finally {
      setSubmittingRating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!ride) return null;

  const currentStep = STATUS_STEPS.indexOf(ride.status);
  const canCancel = ['REQUESTED', 'ACCEPTED'].includes(ride.status);
  const isTerminal = ['COMPLETED', 'CANCELLED'].includes(ride.status);

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <button
        onClick={() => navigate('/passenger')}
        className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors text-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to booking
      </button>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">Ride Tracking</h1>
          <p className="text-slate-500 text-xs mt-0.5">#{id.slice(0, 8).toUpperCase()}</p>
        </div>
        <StatusBadge status={ride.status} />
      </div>

      {/* Progress steps */}
      {ride.status !== 'CANCELLED' && (
        <div className="card mb-5">
          <div className="flex items-center">
            {STATUS_STEPS.map((step, i) => (
              <div key={step} className="flex items-center flex-1">
                <div className={`flex flex-col items-center flex-shrink-0`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all
                    ${i < currentStep ? 'bg-brand-600 text-white'
                      : i === currentStep ? 'bg-brand-600/30 border-2 border-brand-500 text-brand-400'
                      : 'bg-slate-800 text-slate-600'}`}>
                    {i < currentStep ? '✓' : i + 1}
                  </div>
                  <span className={`text-xs mt-1.5 font-medium text-center leading-tight max-w-[60px]
                    ${i <= currentStep ? 'text-white' : 'text-slate-600'}`}>
                    {step.replace('_', ' ')}
                  </span>
                </div>
                {i < STATUS_STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 mb-4 ${i < currentStep ? 'bg-brand-600' : 'bg-slate-800'}`} />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ride details */}
      <div className="card mb-5">
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="mt-1 flex-shrink-0">
              <div className="w-3 h-3 bg-brand-400 rounded-full" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">PICKUP</p>
              <p className="text-white font-medium">{ride.pickupLocation}</p>
            </div>
          </div>
          <div className="ml-1.5 w-0.5 h-4 bg-border" />
          <div className="flex items-start gap-3">
            <div className="mt-1 flex-shrink-0">
              <div className="w-3 h-3 bg-red-400 rounded-full" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">DROP</p>
              <p className="text-white font-medium">{ride.dropLocation}</p>
            </div>
          </div>
        </div>

        {ride.fare && (
          <div className="mt-4 pt-4 border-t border-border flex justify-between items-center">
            <span className="text-sm text-slate-400">Fare</span>
            <span className="text-lg font-bold text-white">₹{ride.fare}</span>
          </div>
        )}
      </div>

      {/* Driver info */}
      {ride.driver && (
        <div className="card mb-5">
          <h3 className="text-xs text-slate-500 font-semibold uppercase tracking-wide mb-3">Driver</h3>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-600/20 rounded-full flex items-center justify-center text-xl font-bold text-blue-400">
              {(ride.driver.user?.name || ride.driver.name)?.[0]}
            </div>
            <div className="flex-1">
              <p className="font-semibold text-white">{ride.driver.user?.name || ride.driver.name}</p>
              <p className="text-sm text-slate-400">{ride.driver.vehicleNumber} · {ride.driver.vehicleType}</p>
              <div className="flex items-center gap-1 mt-1">
                <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                <span className="text-sm text-slate-300">
                  {ride.driver.averageRating?.toFixed(1) || '—'}
                </span>
              </div>
            </div>
            {ride.driver.user?.phone && (
              <a href={`tel:${ride.driver.user.phone}`}
                className="w-10 h-10 bg-brand-600/20 border border-brand-500/30 rounded-full 
                           flex items-center justify-center hover:bg-brand-600/40 transition-colors">
                <Phone className="w-4 h-4 text-brand-400" />
              </a>
            )}
          </div>
        </div>
      )}

      {/* Waiting for driver */}
      {ride.status === 'REQUESTED' && (
        <div className="card mb-5 text-center">
          <div className="relative inline-block mb-3">
            <div className="w-16 h-16 bg-brand-600/20 rounded-full flex items-center justify-center">
              <Car className="w-8 h-8 text-brand-400" />
            </div>
            <div className="absolute inset-0 rounded-full border-2 border-brand-500/30 animate-ping" />
          </div>
          <p className="text-white font-semibold">Looking for a driver...</p>
          <p className="text-slate-400 text-sm mt-1">Please wait while we connect you with a nearby driver</p>
        </div>
      )}

      {/* Rating section */}
      {ride.status === 'COMPLETED' && !ratingSubmitted && (
        <div className="card mb-5">
          <h3 className="text-sm font-semibold text-white mb-4">How was your ride?</h3>
          <div className="flex justify-center mb-4">
            <StarRating value={rating.score} onChange={score => setRating(p => ({ ...p, score }))} size="lg" />
          </div>
          <textarea
            placeholder="Share your feedback (optional)..."
            value={rating.feedback}
            onChange={e => setRating(p => ({ ...p, feedback: e.target.value }))}
            className="input-field resize-none h-20 text-sm"
          />
          <button
            onClick={handleRating}
            disabled={submittingRating || rating.score === 0}
            className="btn-primary w-full mt-3 py-2.5"
          >
            {submittingRating ? 'Submitting...' : 'Submit Rating'}
          </button>
        </div>
      )}

      {ratingSubmitted && ride.status === 'COMPLETED' && (
        <div className="card mb-5 flex items-center gap-3 text-brand-400">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm font-medium">Rating submitted. Thanks!</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        {canCancel && (
          <button
            onClick={handleCancel}
            disabled={cancelling}
            className="btn-danger flex-1 py-2.5 flex items-center justify-center gap-2"
          >
            <XCircle className="w-4 h-4" />
            {cancelling ? 'Cancelling...' : 'Cancel Ride'}
          </button>
        )}
        {isTerminal && (
          <button
            onClick={() => navigate('/passenger')}
            className="btn-primary flex-1 py-2.5"
          >
            Book Another Ride
          </button>
        )}
      </div>
    </div>
  );
}
