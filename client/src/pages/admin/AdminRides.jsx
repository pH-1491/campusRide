import { useState, useEffect } from 'react';
import api from '../../services/api';
import StatusBadge from '../../components/common/StatusBadge';
import { Search, MapPin, Clock, Filter } from 'lucide-react';

const STATUS_FILTERS = ['ALL', 'REQUESTED', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];

export default function AdminRides() {
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const LIMIT = 20;

  const fetchRides = async () => {
    setLoading(true);
    try {
      const params = { page, limit: LIMIT };
      if (statusFilter !== 'ALL') params.status = statusFilter;
      const res = await api.get('/admin/rides', { params });
      setRides(res.data.rides);
      setTotal(res.data.total);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchRides(); }, [statusFilter, page]);

  const filtered = search
    ? rides.filter(r =>
        r.pickupLocation.toLowerCase().includes(search.toLowerCase()) ||
        r.dropLocation.toLowerCase().includes(search.toLowerCase()) ||
        r.passenger?.name.toLowerCase().includes(search.toLowerCase())
      )
    : rides;

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
  }) : '—';

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">All Rides</h1>
        <p className="text-slate-400 mt-1">System-wide ride activity · {total} total</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by location or passenger..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-field pl-9"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {STATUS_FILTERS.map(s => (
            <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }}
              className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${
                statusFilter === s
                  ? 'bg-brand-600/20 text-brand-400 border-brand-500/50'
                  : 'bg-panel text-slate-400 border-border hover:border-slate-500'
              }`}>
              {s === 'IN_PROGRESS' ? 'IN PROGRESS' : s}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {['Ride', 'Passenger', 'Driver', 'Route', 'Fare', 'Status', 'Date'].map(h => (
                    <th key={h} className="text-left text-xs text-slate-500 font-semibold uppercase tracking-wide p-4">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-slate-500">No rides found</td>
                  </tr>
                ) : filtered.map(ride => (
                  <tr key={ride.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-4">
                      <span className="font-mono text-xs text-slate-500">#{ride.id.slice(0, 8).toUpperCase()}</span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-brand-600/20 rounded-full flex items-center justify-center text-brand-400 text-xs font-bold">
                          {ride.passenger?.name?.[0]}
                        </div>
                        <span className="text-white text-xs font-medium">{ride.passenger?.name}</span>
                      </div>
                    </td>
                    <td className="p-4 text-slate-400 text-xs">
                      {ride.driver ? (
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-blue-600/20 rounded-full flex items-center justify-center text-blue-400 text-xs font-bold">
                            {ride.driver.user?.name?.[0]}
                          </div>
                          <span>{ride.driver.user?.name}</span>
                        </div>
                      ) : <span className="text-slate-600">—</span>}
                    </td>
                    <td className="p-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-xs">
                          <div className="w-1.5 h-1.5 bg-brand-400 rounded-full" />
                          <span className="text-slate-300 max-w-[100px] truncate">{ride.pickupLocation}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs">
                          <div className="w-1.5 h-1.5 bg-red-400 rounded-full" />
                          <span className="text-slate-400 max-w-[100px] truncate">{ride.dropLocation}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      {ride.fare
                        ? <span className="text-white font-semibold">₹{ride.fare}</span>
                        : <span className="text-slate-600">—</span>
                      }
                    </td>
                    <td className="p-4"><StatusBadge status={ride.status} /></td>
                    <td className="p-4 text-slate-500 text-xs whitespace-nowrap">{formatDate(ride.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-6">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="btn-secondary text-sm py-1.5 px-3 disabled:opacity-40">Previous</button>
          <span className="text-sm text-slate-400">{page} / {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            className="btn-secondary text-sm py-1.5 px-3 disabled:opacity-40">Next</button>
        </div>
      )}
    </div>
  );
}
