import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import StatusBadge from '../../components/common/StatusBadge';
import { Clock, MapPin, Car, ChevronRight, Filter } from 'lucide-react';

const STATUS_FILTERS = ['ALL', 'REQUESTED', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];

export default function MyRides() {
  const navigate = useNavigate();
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchRides = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 10 };
      if (filter !== 'ALL') params.status = filter;
      const res = await api.get('/rides/my-rides', { params });
      setRides(res.data.rides);
      setTotalPages(res.data.totalPages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRides(); }, [filter, page]);

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">My Rides</h1>
        <p className="text-slate-400 mt-1">Your booking history</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
        {STATUS_FILTERS.map(s => (
          <button
            key={s}
            onClick={() => { setFilter(s); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              filter === s
                ? 'bg-brand-600/20 text-brand-400 border border-brand-500/50'
                : 'bg-panel text-slate-400 border border-border hover:border-slate-500'
            }`}
          >
            {s === 'IN_PROGRESS' ? 'IN PROGRESS' : s}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
        </div>
      ) : rides.length === 0 ? (
        <div className="card text-center py-16">
          <Car className="w-12 h-12 text-slate-700 mx-auto mb-3" />
          <p className="text-slate-400 font-medium">No rides found</p>
          <p className="text-slate-600 text-sm mt-1">
            {filter !== 'ALL' ? 'Try a different filter' : 'Book your first ride!'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {rides.map(ride => (
            <div
              key={ride.id}
              onClick={() => navigate(`/passenger/ride/${ride.id}`)}
              className="card cursor-pointer hover:border-slate-500 transition-all group"
            >
              <div className="flex items-start justify-between mb-3">
                <StatusBadge status={ride.status} />
                <div className="flex items-center gap-1.5 text-slate-500 text-xs">
                  <Clock className="w-3 h-3" />
                  {formatDate(ride.requestedAt)}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 bg-brand-400 rounded-full flex-shrink-0" />
                  <span className="text-white font-medium">{ride.pickupLocation}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 bg-red-400 rounded-full flex-shrink-0" />
                  <span className="text-slate-300">{ride.dropLocation}</span>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {ride.driver && (
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <Car className="w-3.5 h-3.5" />
                      <span>{ride.driver.user?.name}</span>
                      {ride.rating && (
                        <span className="text-yellow-400">★ {ride.rating.score}</span>
                      )}
                    </div>
                  )}
                  {ride.fare && (
                    <span className="text-xs font-semibold text-white">₹{ride.fare}</span>
                  )}
                </div>
                <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-6">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="btn-secondary text-sm py-1.5 px-3 disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-sm text-slate-400">{page} / {totalPages}</span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="btn-secondary text-sm py-1.5 px-3 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
