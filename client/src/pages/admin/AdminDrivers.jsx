import { useState, useEffect } from 'react';
import api from '../../services/api';
import { Search, CheckCircle, XCircle, Car, Star, Activity } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminDrivers() {
  const [drivers, setDrivers] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [actionLoading, setActionLoading] = useState(null);

  const fetchDrivers = async () => {
    try {
      const res = await api.get('/admin/drivers');
      setDrivers(res.data.drivers);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchDrivers(); }, []);

  useEffect(() => {
    let result = drivers;
    if (statusFilter === 'VERIFIED') result = result.filter(d => d.isVerified);
    if (statusFilter === 'UNVERIFIED') result = result.filter(d => !d.isVerified);
    if (statusFilter === 'ONLINE') result = result.filter(d => d.isOnline);
    if (search) result = result.filter(d =>
      d.user?.name.toLowerCase().includes(search.toLowerCase()) ||
      d.vehicleNumber.toLowerCase().includes(search.toLowerCase()) ||
      d.user?.email.toLowerCase().includes(search.toLowerCase())
    );
    setFiltered(result);
  }, [search, statusFilter, drivers]);

  const handleVerify = async (id, verify) => {
    setActionLoading(id);
    try {
      const endpoint = verify ? `/admin/drivers/${id}/verify` : `/admin/drivers/${id}/unverify`;
      const res = await api.patch(endpoint);
      setDrivers(prev => prev.map(d => d.id === id ? { ...d, isVerified: res.data.driver.isVerified, isOnline: res.data.driver.isOnline } : d));
      toast.success(verify ? 'Driver verified!' : 'Driver unverified');
    } catch (err) {
      toast.error('Action failed');
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (d) => new Date(d).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric'
  });

  const counts = {
    ALL: drivers.length,
    VERIFIED: drivers.filter(d => d.isVerified).length,
    UNVERIFIED: drivers.filter(d => !d.isVerified).length,
    ONLINE: drivers.filter(d => d.isOnline).length,
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Drivers</h1>
        <p className="text-slate-400 mt-1">Manage and verify driver accounts</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search drivers..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-field pl-9"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {['ALL', 'VERIFIED', 'UNVERIFIED', 'ONLINE'].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${
                statusFilter === s
                  ? 'bg-brand-600/20 text-brand-400 border-brand-500/50'
                  : 'bg-panel text-slate-400 border-border hover:border-slate-500'
              }`}>
              {s} <span className="ml-1 opacity-60">({counts[s]})</span>
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.length === 0 ? (
            <div className="col-span-full card text-center py-12">
              <Car className="w-12 h-12 text-slate-700 mx-auto mb-3" />
              <p className="text-slate-500">No drivers found</p>
            </div>
          ) : filtered.map(driver => (
            <div key={driver.id} className="card">
              {/* Driver header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-600/20 rounded-full flex items-center justify-center font-bold text-blue-400 text-lg">
                    {driver.user?.name?.[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-white">{driver.user?.name}</p>
                    <p className="text-xs text-slate-500">{driver.user?.email}</p>
                  </div>
                </div>
                <div className={`w-2.5 h-2.5 rounded-full mt-1 ${driver.isOnline ? 'bg-brand-400 animate-pulse' : 'bg-slate-600'}`} />
              </div>

              {/* Vehicle info */}
              <div className="space-y-2 mb-4 p-3 bg-card rounded-lg">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Vehicle</span>
                  <span className="text-white font-medium">{driver.vehicleNumber}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Type</span>
                  <span className="text-slate-300">{driver.vehicleType}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">License</span>
                  <span className="text-slate-300 font-mono text-xs">{driver.licenseNumber}</span>
                </div>
              </div>

              {/* Stats */}
              <div className="flex gap-3 mb-4 text-sm">
                <div className="flex-1 text-center">
                  <p className="font-bold text-white">{driver.totalRides}</p>
                  <p className="text-xs text-slate-500">Rides</p>
                </div>
                <div className="flex-1 text-center">
                  <p className="font-bold text-yellow-400">{driver.averageRating?.toFixed(1) || '—'}</p>
                  <p className="text-xs text-slate-500">Rating</p>
                </div>
                <div className="flex-1 text-center">
                  <p className={`font-bold ${driver.isOnline ? 'text-brand-400' : 'text-slate-500'}`}>
                    {driver.isOnline ? 'Online' : 'Offline'}
                  </p>
                  <p className="text-xs text-slate-500">Status</p>
                </div>
              </div>

              {/* Verify button */}
              <div className="flex items-center justify-between">
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                  driver.isVerified
                    ? 'bg-brand-500/20 text-brand-400 border border-brand-500/30'
                    : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                }`}>
                  {driver.isVerified ? '✓ Verified' : '⏳ Pending'}
                </span>
                <button
                  onClick={() => handleVerify(driver.id, !driver.isVerified)}
                  disabled={actionLoading === driver.id}
                  className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all border ${
                    driver.isVerified
                      ? 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20'
                      : 'bg-brand-500/10 text-brand-400 border-brand-500/20 hover:bg-brand-500/20'
                  } disabled:opacity-50`}
                >
                  {actionLoading === driver.id ? '...' : driver.isVerified ? 'Revoke' : 'Verify'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
