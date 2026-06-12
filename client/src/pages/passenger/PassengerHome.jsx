import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../../context/SocketContext';
import api from '../../services/api';
import { MapPin, Navigation, Clock, Car, Zap, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const CAMPUS_LOCATIONS = [
  'Main Gate', 'Thomso Ground', 'Convocation Hall', 'Library',
  'Lecture Hall Complex', 'New SAC', 'Old SAC', 'Rajendra Bhawan',
  'Cautley Bhawan', 'Jawahar Bhawan', 'Ganga Bhawan', 'Saraswati Bhawan',
  'Azad Bhawan', 'Civil Engineering Dept', 'Mechanical Dept', 'ECE Dept',
  'IIT Hospital', 'Roorkee Railway Station', 'Bus Stand', 'Sports Complex'
];

export default function PassengerHome() {
  const navigate = useNavigate();
  const { getSocket } = useSocket();
  const [form, setForm] = useState({ pickupLocation: '', dropLocation: '' });
  const [loading, setLoading] = useState(false);
  const [activeRide, setActiveRide] = useState(null);
  const [onlineDrivers, setOnlineDrivers] = useState([]);
  const [checkingActive, setCheckingActive] = useState(true);

  // Check for active ride on mount
  useEffect(() => {
    const checkActiveRide = async () => {
      try {
        const res = await api.get('/rides/my-rides', { params: { status: 'REQUESTED' } });
        const allActive = await api.get('/rides/my-rides');
        const active = allActive.data.rides.find(r =>
          ['REQUESTED', 'ACCEPTED', 'IN_PROGRESS'].includes(r.status)
        );
        if (active) setActiveRide(active);
      } catch {}
      setCheckingActive(false);
    };
    checkActiveRide();
  }, []);

  // Track online drivers via socket
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    socket.on('drivers:current', (drivers) => setOnlineDrivers(drivers));
    socket.on('driver:online', (driver) => {
      setOnlineDrivers(prev => {
        const exists = prev.find(d => d.driverId === driver.driverId);
        return exists ? prev : [...prev, driver];
      });
    });
    socket.on('driver:offline', ({ driverId }) => {
      setOnlineDrivers(prev => prev.filter(d => d.driverId !== driverId));
    });

    return () => {
      socket.off('drivers:current');
      socket.off('driver:online');
      socket.off('driver:offline');
    };
  }, [getSocket]);

  const handleBookRide = async (e) => {
    e.preventDefault();
    if (!form.pickupLocation || !form.dropLocation) {
      toast.error('Please select pickup and drop locations');
      return;
    }
    if (form.pickupLocation === form.dropLocation) {
      toast.error('Pickup and drop cannot be the same');
      return;
    }
    if (onlineDrivers.length === 0) {
      toast.error('No drivers available right now. Please try again later.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/rides/request', form);
      const ride = res.data.ride;
      setActiveRide(ride);
      toast.success('Ride requested! Looking for a driver...');
      navigate(`/passenger/ride/${ride.id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to book ride');
    } finally {
      setLoading(false);
    }
  };

  if (checkingActive) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Book a Ride</h1>
        <p className="text-slate-400 mt-1">Request an e-rickshaw anywhere on campus</p>
      </div>

      {/* Active ride banner */}
      {activeRide && (
        <div className="mb-6 p-4 bg-brand-500/10 border border-brand-500/30 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-brand-600/20 rounded-full flex items-center justify-center">
              <Zap className="w-4 h-4 text-brand-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-brand-400">Active Ride</p>
              <p className="text-xs text-slate-400">{activeRide.pickupLocation} → {activeRide.dropLocation}</p>
            </div>
          </div>
          <button
            onClick={() => navigate(`/passenger/ride/${activeRide.id}`)}
            className="btn-primary text-sm py-1.5"
          >
            Track Ride
          </button>
        </div>
      )}

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Booking form */}
        <div className="lg:col-span-3">
          <div className="card">
            <h2 className="text-lg font-semibold text-white mb-5">Where do you want to go?</h2>
            <form onSubmit={handleBookRide} className="space-y-4">
              <div>
                <label className="text-sm text-slate-300 font-medium mb-2 block flex items-center gap-2">
                  <div className="w-2 h-2 bg-brand-400 rounded-full" />
                  Pickup Location
                </label>
                <select
                  value={form.pickupLocation}
                  onChange={e => setForm(p => ({ ...p, pickupLocation: e.target.value }))}
                  className="input-field"
                  required
                >
                  <option value="">Select pickup point...</option>
                  {CAMPUS_LOCATIONS.map(loc => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm text-slate-300 font-medium mb-2 block flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-400 rounded-full" />
                  Drop Location
                </label>
                <select
                  value={form.dropLocation}
                  onChange={e => setForm(p => ({ ...p, dropLocation: e.target.value }))}
                  className="input-field"
                  required
                >
                  <option value="">Select destination...</option>
                  {CAMPUS_LOCATIONS.filter(l => l !== form.pickupLocation).map(loc => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
              </div>

              {form.pickupLocation && form.dropLocation && (
                <div className="flex items-center gap-2 text-xs text-slate-400 bg-card rounded-lg px-3 py-2">
                  <Navigation className="w-3.5 h-3.5 text-brand-400" />
                  <span className="font-medium text-white">{form.pickupLocation}</span>
                  <span>→</span>
                  <span className="font-medium text-white">{form.dropLocation}</span>
                </div>
              )}

              {onlineDrivers.length === 0 && (
                <div className="flex items-center gap-2 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2.5">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  No drivers online. Your request will wait until a driver becomes available.
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !form.pickupLocation || !form.dropLocation}
                className="btn-primary w-full py-3 flex items-center justify-center gap-2 mt-2"
              >
                {loading ? (
                  <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Requesting...</>
                ) : (
                  <><Car className="w-4 h-4" />Request Ride</>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Sidebar: online drivers */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">Available Drivers</h3>
              <div className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${onlineDrivers.length > 0 ? 'bg-brand-400 animate-pulse' : 'bg-slate-600'}`} />
                <span className="text-xs text-slate-400">{onlineDrivers.length} online</span>
              </div>
            </div>

            {onlineDrivers.length === 0 ? (
              <div className="text-center py-8">
                <Car className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                <p className="text-sm text-slate-500">No drivers online</p>
              </div>
            ) : (
              <div className="space-y-3">
                {onlineDrivers.slice(0, 5).map(driver => (
                  <div key={driver.driverId} className="flex items-center gap-3 p-2.5 bg-card rounded-lg">
                    <div className="w-8 h-8 bg-blue-600/20 rounded-full flex items-center justify-center text-sm font-bold text-blue-400">
                      {driver.name?.[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{driver.name}</p>
                      <p className="text-xs text-slate-500">{driver.vehicleNumber}</p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1">
                        <span className="text-yellow-400 text-xs">★</span>
                        <span className="text-xs text-slate-400">{driver.averageRating?.toFixed(1) || '—'}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick stats */}
          <div className="card mt-4">
            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide mb-3">Campus Info</h3>
            <div className="space-y-2 text-xs text-slate-400">
              <div className="flex justify-between">
                <span>E-rickshaw fare</span>
                <span className="text-white font-medium">₹10 – ₹30</span>
              </div>
              <div className="flex justify-between">
                <span>Operating hours</span>
                <span className="text-white font-medium">6 AM – 11 PM</span>
              </div>
              <div className="flex justify-between">
                <span>Pickup locations</span>
                <span className="text-white font-medium">{CAMPUS_LOCATIONS.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
